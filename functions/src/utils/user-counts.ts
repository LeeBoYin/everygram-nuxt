import { getFirestore } from 'firebase-admin/firestore';
import type { DocumentSnapshot, Firestore } from 'firebase-admin/firestore';
import { getOwnerUid } from './get-owner-uid';

// the counts of `userMeta`, only written by functions
const COUNT_CONFIGS = {
    gear: {
        totalField: 'gearCount',
        flag: 'isArchived',
        flaggedField: 'archivedGearCount',
    },
    trip: {
        totalField: 'tripCount',
        flag: 'isPublished',
        flaggedField: 'tripShareCount',
    },
} as const;

type CountedCollection = keyof typeof COUNT_CONFIGS;

// counts the docs owned by the user with aggregation queries
const countUserDocs = async (
    db: Firestore,
    uid: string,
    collectionName: CountedCollection,
): Promise<Record<string, number>> => {
    const { totalField, flag, flaggedField } = COUNT_CONFIGS[collectionName];
    const ownedDocs = db
        .collection(collectionName)
        .where(`role.${uid}`, '==', 'owner');
    const [total, flagged] = await Promise.all([
        ownedDocs.count().get(),
        ownedDocs.where(flag, '==', true).count().get(),
    ]);
    return {
        [totalField]: total.data().count,
        [flaggedField]: flagged.data().count,
    };
};

// Counts again from the source instead of incrementing: triggers run at least
// once, and recounting twice gives the same result.
const recountUserDocs = async (
    uid: string,
    collectionName: CountedCollection,
) => {
    const db = getFirestore();
    const userMetaRef = db.collection('userMeta').doc(uid);
    await db.runTransaction(async (transaction) => {
        // Locks userMeta, so concurrent runs count and write one at a time, and
        // an older count never overwrites a newer one. The counts are read
        // outside the transaction on purpose, to not lock any gear or trip.
        await transaction.get(userMetaRef);
        const counts = await countUserDocs(db, uid, collectionName);
        transaction.set(
            userMetaRef,
            { userId: uid, ...counts },
            { merge: true },
        );
    });
};

// recounts only if the write can change a count
export const recountOnWrite = async (
    collectionName: CountedCollection,
    before: DocumentSnapshot,
    after: DocumentSnapshot,
) => {
    const { flag } = COUNT_CONFIGS[collectionName];
    const isCreatedOrDeleted = before.exists !== after.exists;
    const isFlagChanged =
        (before.data()?.[flag] === true) !== (after.data()?.[flag] === true);
    if (!isCreatedOrDeleted && !isFlagChanged) {
        return;
    }
    const doc = after.exists ? after : before;
    const ownerUid = getOwnerUid(doc.data()?.role, doc.ref.path);
    if (!ownerUid) {
        return;
    }
    await recountUserDocs(ownerUid, collectionName);
};
