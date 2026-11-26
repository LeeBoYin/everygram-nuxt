// republishing tests. Usage: npm run test:functions (starts the emulators)
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { after, before, describe, test } from 'node:test';
import { setTimeout as sleep } from 'node:timers/promises';
const require = createRequire(
    new URL('../../functions/package.json', import.meta.url),
);
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const { getStorage } = require('firebase-admin/storage');
const sharp = require('sharp');
// refuse to run against a real project
assert.ok(
    process.env.FIRESTORE_EMULATOR_HOST &&
        process.env.FIREBASE_AUTH_EMULATOR_HOST &&
        process.env.FIREBASE_STORAGE_EMULATOR_HOST,
    'Emulators not set',
);
initializeApp({
    projectId: 'demo-everygram',
    storageBucket: 'everygram.appspot.com',
});
const db = getFirestore();
const role = { carol: 'owner' };
const SETTLE = 8000;
let publishes = [];
let stop;
const gear = { name: 'tent', weight: 100, role };
const trip = {
    title: 't',
    role,
    isPublished: false,
    gears: { pg1: { id: 'pg1', quantity: 2 } },
    wornGears: {},
    consumables: {},
};
const share = async () => (await db.doc('tripShare/pt1').get()).data();
const waitFor = async (check) => {
    for (let i = 0; i < 80; i++) {
        if (check(await share())) return;
        await sleep(500);
    }
    assert.fail('timeout');
};
// number of tripShare writes caused by `write`, after triggers settle
const countPublishes = async (write, ready) => {
    await sleep(500);
    publishes = [];
    await write();
    if (ready) await waitFor(ready);
    await sleep(SETTLE);
    return publishes.length;
};
const updateGear = (fields) => {
    const batch = db.batch();
    batch.update(db.doc('gear/pg1'), fields);
    batch.update(
        db.doc('userGears/carol'),
        Object.fromEntries(
            Object.entries(fields).map(([k, v]) => [`gears.pg1.${k}`, v]),
        ),
    );
    return batch.commit();
};
const updateTrip = (fields) =>
    db
        .doc('trip/pt1')
        .update({ ...fields, updated: FieldValue.serverTimestamp() });
const upload = async (path) => {
    const buffer = await sharp({
        create: { width: 800, height: 800, channels: 3, background: '#888' },
    })
        .jpeg()
        .toBuffer();
    await getStorage()
        .bucket()
        .file(path)
        .save(buffer, { contentType: 'image/jpeg' });
};
describe('republish', { timeout: 600000 }, () => {
    before(async () => {
        await getAuth().createUser({ uid: 'carol', displayName: 'Carol' });
        await db.doc('gear/pg1').set(gear);
        await db
            .doc('userGears/carol')
            .set({ gears: { pg1: { ...gear, id: 'pg1' } } });
        await db.doc('trip/pt1').set(trip);
        stop = db
            .doc('tripShare/pt1')
            .onSnapshot((s) => publishes.push(s.data() ?? null));
    });
    after(() => stop());
    test('publishing a trip', async () =>
        assert.equal(
            await countPublishes(
                () => updateTrip({ isPublished: true }),
                (s) => s,
            ),
            1,
        ));
    test('trip: only `updated`', async () =>
        assert.equal(await countPublishes(() => updateTrip({})), 0));
    test('trip: title', async () =>
        assert.equal(
            await countPublishes(
                () => updateTrip({ title: 'new' }),
                (s) => s.title === 'new',
            ),
            1,
        ));
    test('gear: field not shared', async () =>
        assert.equal(await countPublishes(() => updateGear({ price: 5 })), 0));
    test('gear: weight', async () => {
        assert.equal(
            await countPublishes(
                () => updateGear({ weight: 300 }),
                (s) => s.baseWeight === 600,
            ),
            1,
        );
    });
    test('gear: new photo publishes once, with thumbnails', async () => {
        await upload('gear/pg1/a.jpg');
        assert.equal(
            await countPublishes(
                () => updateGear({ photo: { fileName: 'a.jpg', url: 'u' } }),
                (s) => s.gears.pg1.photo?.thumbnails,
            ),
            1,
        );
    });
    test('gear: thumbnail failure still publishes once', async () => {
        assert.equal(
            await countPublishes(
                () =>
                    updateGear({
                        photo: { fileName: 'missing.jpg', url: 'u' },
                    }),
                (s) => s.gears.pg1.photo?.fileName === 'missing.jpg',
            ),
            1,
        );
    });
    test('gear: photo removed', async () => {
        assert.equal(
            await countPublishes(
                () => updateGear({ photo: FieldValue.delete() }),
                (s) => !s.gears.pg1.photo,
            ),
            1,
        );
    });
    test('trip: new banner publishes once, with thumbnails', async () => {
        await upload('trip/pt1/b.jpg');
        assert.equal(
            await countPublishes(
                () =>
                    updateTrip({
                        bannerImage: { fileName: 'b.jpg', url: 'u' },
                    }),
                (s) => s.bannerImage?.thumbnails,
            ),
            1,
        );
    });
    test('trip: banner failure still publishes once', async () => {
        assert.equal(
            await countPublishes(
                () =>
                    updateTrip({
                        bannerImage: { fileName: 'missing.jpg', url: 'u' },
                    }),
                (s) => s.bannerImage?.fileName === 'missing.jpg',
            ),
            1,
        );
    });
    test('trip: banner removed', async () =>
        assert.equal(
            await countPublishes(
                () => updateTrip({ bannerImage: FieldValue.delete() }),
                (s) => !s.bannerImage,
            ),
            1,
        ));
    test('unpublishing a trip', async () => {
        assert.equal(
            await countPublishes(
                () => updateTrip({ isPublished: false }),
                (s) => !s,
            ),
            1,
        );
        assert.equal(await share(), undefined);
    });
});
