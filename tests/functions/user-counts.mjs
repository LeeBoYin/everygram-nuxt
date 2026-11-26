// userMeta count tests. Usage: npm run test:functions (starts the emulators)
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { describe, test } from 'node:test';
import { setTimeout as sleep } from 'node:timers/promises';

const require = createRequire(
    new URL('../../functions/package.json', import.meta.url),
);
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// refuse to run against a real project
assert.ok(process.env.FIRESTORE_EMULATOR_HOST, 'Firestore emulator not set');

initializeApp({ projectId: 'demo-everygram' });
const db = getFirestore();

const roleOf = (uid) => ({ [uid]: 'owner' });
const readMeta = async (uid) => (await db.doc(`userMeta/${uid}`).get()).data();

const assertCounts = async (uid, expected) => {
    let meta;
    for (let i = 0; i < 120; i++) {
        meta = await readMeta(uid);
        if (Object.entries(expected).every(([k, v]) => meta?.[k] === v)) {
            return;
        }
        await sleep(500);
    }
    assert.fail(
        `expected ${JSON.stringify(expected)}, got ${JSON.stringify(meta)}`,
    );
};

describe('userMeta counts', { timeout: 300_000 }, () => {
    test('counts gears on create, keeping other fields', async () => {
        await db.doc('userMeta/dave').set({ locale: 'en' });
        await db.doc('gear/d1').set({ role: roleOf('dave') });
        await db.doc('gear/d2').set({ role: roleOf('dave'), isArchived: true });
        await db
            .doc('gear/d3')
            .set({ role: roleOf('dave'), isForOneTrip: true });
        await assertCounts('dave', {
            userId: 'dave',
            gearCount: 3,
            archivedGearCount: 1,
            locale: 'en',
        });
    });

    test('ignores writes that cannot change a count', async () => {
        await sleep(3000);
        const before = (await db.doc('userMeta/dave').get()).updateTime;
        await db.doc('gear/d1').update({ name: 'renamed', isArchived: false });
        await sleep(5000);
        const after = (await db.doc('userMeta/dave').get()).updateTime;
        assert.ok(after.isEqual(before), 'userMeta was written');
    });

    test('counts gears on archive, unarchive and delete', async () => {
        await db.doc('gear/d1').update({ isArchived: true });
        await assertCounts('dave', { gearCount: 3, archivedGearCount: 2 });
        await db.doc('gear/d2').update({ isArchived: false });
        await assertCounts('dave', { gearCount: 3, archivedGearCount: 1 });
        await db.doc('gear/d1').delete();
        await assertCounts('dave', { gearCount: 2, archivedGearCount: 0 });
    });

    test('counts trips on create, publish, unpublish and delete', async () => {
        const trip = { role: roleOf('dave'), gears: {}, wornGears: {} };
        await db.doc('trip/dt1').set(trip);
        await db.doc('trip/dt2').set(trip);
        await assertCounts('dave', { tripCount: 2, tripShareCount: 0 });
        await db.doc('trip/dt1').update({ isPublished: true });
        await assertCounts('dave', { tripCount: 2, tripShareCount: 1 });
        await db.doc('trip/dt1').update({ isPublished: false });
        await assertCounts('dave', { tripCount: 2, tripShareCount: 0 });
        await db.doc('trip/dt2').delete();
        await assertCounts('dave', { tripCount: 1, gearCount: 2 });
    });

    test('skips docs with an invalid role', async () => {
        await db
            .doc('gear/e1')
            .set({ role: { erin: 'owner', frank: 'owner' } });
        await sleep(5000);
        assert.equal(await readMeta('erin'), undefined);
        assert.equal(await readMeta('frank'), undefined);
    });

    test('is correct after importing 200 gears at once', async () => {
        const batch = db.batch();
        for (let i = 0; i < 200; i++) {
            batch.set(db.doc(`gear/bulk${i}`), {
                role: roleOf('gina'),
                isArchived: i < 50,
            });
        }
        await batch.commit();
        await assertCounts('gina', { gearCount: 200, archivedGearCount: 50 });
    });
});
