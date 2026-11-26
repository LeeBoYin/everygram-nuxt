import {
    CallableRequest,
    HttpsError,
    onCall,
} from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';

// Callable function when user profile is updated
export const onUserProfileUpdated = onCall(
    { region: 'asia-northeast1' },
    async (request: CallableRequest<any>) => {
        // only the signed-in user's own trips can be updated. `userId` sent by
        // clients is ignored.
        const userId = request.auth?.uid;
        if (!userId) {
            throw new HttpsError('unauthenticated', 'Login required');
        }
        const { displayName, photoURL } = request.data || {};
        if (!displayName && !photoURL) {
            throw new HttpsError(
                'invalid-argument',
                'At least displayName or photoURL must be provided',
            );
        }
        if (
            (displayName && typeof displayName !== 'string') ||
            (photoURL && typeof photoURL !== 'string')
        ) {
            throw new HttpsError(
                'invalid-argument',
                'displayName and photoURL must be strings',
            );
        }

        // Update tripShare owner info
        const tripSharesSnapshot = await getFirestore()
            .collection('tripShare')
            .where(`role.${userId}`, '==', 'owner')
            .get();

        // Create a batch to update all matching tripShare documents
        if (!tripSharesSnapshot.empty) {
            const batch = getFirestore().batch();
            const updateData: any = {};
            if (displayName) updateData['owner.displayName'] = displayName;
            if (photoURL) updateData['owner.photoURL'] = photoURL;
            tripSharesSnapshot.forEach((doc) =>
                batch.update(doc.ref, updateData),
            );
            await batch.commit();
        }

        return { tripShareUpdated: tripSharesSnapshot.size };
    },
);
