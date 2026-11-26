// App Check, auth and input checks of the public callables.
// Usage: npm run test:functions (starts the emulators)
// Nothing here reaches lighterpack.com.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { before, describe, test } from 'node:test';

const require = createRequire(
    new URL('../../functions/package.json', import.meta.url),
);
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// refuse to run against a real project
assert.ok(process.env.FIRESTORE_EMULATOR_HOST, 'Firestore emulator not set');

initializeApp({ projectId: 'demo-everygram' });
const db = getFirestore();

const encode = (value) =>
    Buffer.from(JSON.stringify(value)).toString('base64url');
// the Functions emulator decodes App Check tokens without verifying them
const appCheckToken = `${encode({ alg: 'none' })}.${encode({ sub: 'demo-app-id' })}.emulator`;

const call = async (name, data, { appCheck, idToken } = {}) => {
    const response = await fetch(
        `http://127.0.0.1:5001/demo-everygram/asia-northeast1/${name}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(appCheck && { 'X-Firebase-AppCheck': appCheckToken }),
                ...(idToken && { Authorization: `Bearer ${idToken}` }),
            },
            body: JSON.stringify({ data }),
        },
    );
    return response.json();
};

describe('public callables', { timeout: 120_000 }, () => {
    let idToken;
    before(async () => {
        const response = await fetch(
            'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-api-key',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ returnSecureToken: true }),
            },
        );
        idToken = (await response.json()).idToken;
        assert.ok(idToken);
    });

    test('incrementTripShareView requires App Check', async () => {
        await db.doc('tripShare/guard1').set({});
        const { error } = await call('incrementTripShareView', {
            tripId: 'guard1',
        });
        assert.equal(error?.status, 'UNAUTHENTICATED');
        assert.ok(!(await db.doc('tripMeta/guard1').get()).exists);
    });

    test('incrementTripShareView counts signed out visitors', async () => {
        const { result } = await call(
            'incrementTripShareView',
            { tripId: 'guard1' },
            { appCheck: true },
        );
        assert.deepEqual(result, { success: true });
        const meta = (await db.doc('tripMeta/guard1').get()).data();
        assert.equal(meta.viewCount, 1);
    });

    test('getLighterPackPackData requires App Check', async () => {
        const { error } = await call(
            'getLighterPackPackData',
            { listId: 'abc123' },
            { idToken },
        );
        assert.equal(error?.status, 'UNAUTHENTICATED');
    });

    test('getLighterPackPackData requires sign in', async () => {
        const { error } = await call(
            'getLighterPackPackData',
            { listId: 'abc123' },
            { appCheck: true },
        );
        assert.equal(error?.status, 'UNAUTHENTICATED');
        assert.equal(error.message, 'Login required');
    });

    test('getLighterPackPackData rejects invalid list IDs', async () => {
        const invalid = [
            undefined,
            '',
            123,
            ['abc123'],
            '../csv/abc123',
            'abc123?x=1',
            'abc123#x',
            'abc%2F123',
            'abc 123',
            'abc123\n',
            'a'.repeat(17),
        ];
        for (const listId of invalid) {
            const { error } = await call(
                'getLighterPackPackData',
                { listId },
                { appCheck: true, idToken },
            );
            assert.equal(
                error?.status,
                'INVALID_ARGUMENT',
                JSON.stringify(listId),
            );
        }
    });
});
