// Firestore rules tests. Usage: npm run test:rules (starts the emulator)
import { readFileSync } from 'node:fs';
import { after, before, beforeEach, describe, test } from 'node:test';
import {
    assertFails,
    assertSucceeds,
    initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
    collection,
    deleteDoc,
    deleteField,
    doc,
    getDoc,
    getDocs,
    query,
    setDoc,
    setLogLevel,
    updateDoc,
    where,
} from 'firebase/firestore';

const ALICE = 'alice';
const BOB = 'bob';

// rejected writes are expected, do not log them
setLogLevel('silent');

let testEnv;

before(async () => {
    testEnv = await initializeTestEnvironment({
        projectId: 'demo-everygram',
        firestore: {
            rules: readFileSync(
                new URL('../firestore.rules', import.meta.url),
                'utf8',
            ),
        },
    });
});

beforeEach(() => testEnv.clearFirestore());

after(() => testEnv?.cleanup());

const dbOf = (uid) => testEnv.authenticatedContext(uid).firestore();

// writes a doc bypassing the rules
const seed = (path, data) =>
    testEnv.withSecurityRulesDisabled((context) =>
        setDoc(doc(context.firestore(), path), data),
    );

for (const name of ['gear', 'trip']) {
    describe(name, () => {
        const path = `${name}/doc1`;
        const ownDoc = { title: 'old', role: { [ALICE]: 'owner' } };

        describe('create', () => {
            const create = (db, data) => setDoc(doc(db, path), data);

            test('with the creator as the only owner succeeds', async () => {
                await assertSucceeds(create(dbOf(ALICE), ownDoc));
            });

            const invalidRoles = {
                'another owner': { [ALICE]: 'owner', [BOB]: 'owner' },
                'another participant': {
                    [ALICE]: 'owner',
                    [BOB]: 'participant',
                },
                'another user only': { [BOB]: 'owner' },
                'creator not as owner': { [ALICE]: 'participant' },
                'an empty map': {},
                'a non-map value': 'owner',
            };
            for (const [label, role] of Object.entries(invalidRoles)) {
                test(`with role of ${label} fails`, async () => {
                    await assertFails(create(dbOf(ALICE), { role }));
                });
            }

            test('without role fails', async () => {
                await assertFails(create(dbOf(ALICE), { title: 'x' }));
            });

            test('without signing in fails', async () => {
                const db = testEnv.unauthenticatedContext().firestore();
                await assertFails(create(db, ownDoc));
            });
        });

        describe('update', () => {
            beforeEach(() => seed(path, ownDoc));

            const update = (uid, data) => updateDoc(doc(dbOf(uid), path), data);

            test('other fields succeeds', async () => {
                await assertSucceeds(update(ALICE, { title: 'new' }));
            });

            test('other fields with the same role succeeds', async () => {
                await assertSucceeds(
                    update(ALICE, { title: 'new', role: ownDoc.role }),
                );
            });

            const roleChanges = {
                'adding a user': { [`role.${BOB}`]: 'owner' },
                'replacing the map': { role: { [BOB]: 'owner' } },
                'changing the value': { [`role.${ALICE}`]: 'participant' },
                'removing the field': { role: deleteField() },
            };
            for (const [label, data] of Object.entries(roleChanges)) {
                test(`role by ${label} fails`, async () => {
                    await assertFails(update(ALICE, data));
                });
            }

            test('by overwriting the doc with another role fails', async () => {
                await assertFails(
                    setDoc(doc(dbOf(ALICE), path), {
                        role: { [ALICE]: 'owner', [BOB]: 'owner' },
                    }),
                );
            });

            test('by a non-owner fails', async () => {
                await assertFails(update(BOB, { title: 'new' }));
            });
        });

        describe('read and delete', () => {
            beforeEach(() => seed(path, ownDoc));

            test('by the owner succeeds', async () => {
                const db = dbOf(ALICE);
                await assertSucceeds(getDoc(doc(db, path)));
                await assertSucceeds(
                    getDocs(
                        query(
                            collection(db, name),
                            where(`role.${ALICE}`, '==', 'owner'),
                        ),
                    ),
                );
                await assertSucceeds(deleteDoc(doc(db, path)));
            });

            test('by a non-owner fails', async () => {
                const db = dbOf(BOB);
                await assertFails(getDoc(doc(db, path)));
                await assertFails(
                    getDocs(
                        query(
                            collection(db, name),
                            where(`role.${ALICE}`, '==', 'owner'),
                        ),
                    ),
                );
                await assertFails(deleteDoc(doc(db, path)));
            });

            test('without signing in fails', async () => {
                const db = testEnv.unauthenticatedContext().firestore();
                await assertFails(getDoc(doc(db, path)));
                await assertFails(deleteDoc(doc(db, path)));
            });
        });
    });
}

describe('userMeta', () => {
    const path = `userMeta/${ALICE}`;
    const defaults = { userId: ALICE, locale: null, currency: null };
    const counts = {
        gearCount: 1,
        archivedGearCount: 1,
        tripCount: 1,
        tripShareCount: 1,
    };
    const merge = (db, data) => setDoc(doc(db, path), data, { merge: true });

    describe('create', () => {
        test('without counts succeeds', async () => {
            await assertSucceeds(merge(dbOf(ALICE), defaults));
        });

        for (const [field, value] of Object.entries(counts)) {
            test(`with ${field} fails`, async () => {
                await assertFails(
                    setDoc(doc(dbOf(ALICE), path), {
                        ...defaults,
                        [field]: value,
                    }),
                );
            });
        }

        test('by another user fails', async () => {
            await assertFails(setDoc(doc(dbOf(BOB), path), defaults));
        });
    });

    describe('update', () => {
        beforeEach(() => seed(path, { ...defaults, ...counts }));

        test('of locale and currency succeeds', async () => {
            await assertSucceeds(
                updateDoc(doc(dbOf(ALICE), path), {
                    locale: 'en',
                    currency: 'USD',
                }),
            );
        });

        test('merging the defaults into an existing doc succeeds', async () => {
            await assertSucceeds(merge(dbOf(ALICE), defaults));
        });

        for (const field of Object.keys(counts)) {
            test(`changing ${field} fails`, async () => {
                await assertFails(
                    updateDoc(doc(dbOf(ALICE), path), { [field]: 99 }),
                );
            });

            test(`removing ${field} fails`, async () => {
                await assertFails(
                    updateDoc(doc(dbOf(ALICE), path), {
                        [field]: deleteField(),
                    }),
                );
            });
        }

        test('overwriting the doc without the counts fails', async () => {
            await assertFails(setDoc(doc(dbOf(ALICE), path), defaults));
        });

        test('by another user fails', async () => {
            await assertFails(
                updateDoc(doc(dbOf(BOB), path), { locale: 'en' }),
            );
        });
    });

    describe('read and delete', () => {
        beforeEach(() => seed(path, defaults));

        test('reading by the user succeeds', async () => {
            await assertSucceeds(getDoc(doc(dbOf(ALICE), path)));
        });

        test('reading by another user fails', async () => {
            await assertFails(getDoc(doc(dbOf(BOB), path)));
        });

        test('deleting fails', async () => {
            await assertFails(deleteDoc(doc(dbOf(ALICE), path)));
        });
    });
});
