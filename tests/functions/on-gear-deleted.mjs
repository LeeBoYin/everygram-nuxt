// onGearDeleted tests. Usage: npm run test:functions (starts the emulators)
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { before, describe, test } from 'node:test';
import { setTimeout as sleep } from 'node:timers/promises';

const require = createRequire(
    new URL('../../functions/package.json', import.meta.url),
);
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');

const PROJECT_ID = 'demo-everygram';
const TIMEOUT = 60_000;

// refuse to run against a real project
assert.ok(process.env.FIRESTORE_EMULATOR_HOST, 'Firestore emulator not set');

initializeApp({ projectId: PROJECT_ID });
const db = getFirestore();

const role = { alice: 'owner' };
const created = Timestamp.fromDate(new Date('2024-01-01T00:00:00Z'));
const item = (id, quantity) => ({ id, quantity });

const trips = {
    full: {
        title: 'full trip',
        description: 'keeps everything else',
        role,
        created,
        dateMode: 'single',
        startDate: '2024-02-01',
        endDate: '2024-02-01',
        gears: { target: item('target', 1), other: item('other', 2) },
        wornGears: { target: item('target', 1), worn: item('worn', 3) },
        consumables: { water: { id: 'water', name: 'water', weight: 500 } },
    },
    // old trips have no `wornGears` field
    legacy: {
        title: 'legacy trip',
        role,
        created,
        gears: { target: item('target', 1), other: item('other', 1) },
    },
    wornOnly: {
        title: 'worn only',
        role,
        created,
        wornGears: { target: item('target', 1) },
    },
    unrelated: {
        title: 'unrelated',
        role,
        created,
        gears: { other: item('other', 1) },
        wornGears: {},
    },
};

const readTrip = async (id) => (await db.doc(`trip/${id}`).get()).data();

describe('onGearDeleted', () => {
    before(
        async () => {
            await db.doc('gear/target').set({ name: 'target', role });
            await Promise.all(
                Object.entries(trips).map(([id, trip]) =>
                    db.doc(`trip/${id}`).set(trip),
                ),
            );
            await db.doc('gear/target').delete();

            // wait for the trigger to update every trip using the gear
            const deadline = Date.now() + TIMEOUT - 5_000;
            while (Date.now() < deadline) {
                const results = await Promise.all(
                    ['full', 'legacy', 'wornOnly'].map(readTrip),
                );
                if (results.every((trip) => trip.updated)) {
                    break;
                }
                await sleep(500);
            }
        },
        { timeout: TIMEOUT },
    );

    const assertUpdated = async (id, expected) => {
        const { updated, ...trip } = await readTrip(id);
        assert.ok(updated instanceof Timestamp, `${id} was not updated`);
        assert.deepEqual(trip, expected);
    };

    test('removes only the deleted gear from gears and wornGears', () =>
        assertUpdated('full', {
            ...trips.full,
            gears: { other: item('other', 2) },
            wornGears: { worn: item('worn', 3) },
        }));

    test('handles a trip without wornGears', () =>
        assertUpdated('legacy', {
            ...trips.legacy,
            gears: { other: item('other', 1) },
        }));

    test('handles a trip without gears', () =>
        assertUpdated('wornOnly', { ...trips.wornOnly, wornGears: {} }));

    test('leaves other trips untouched', async () => {
        assert.deepEqual(await readTrip('unrelated'), trips.unrelated);
    });
});
