import {
    CallableRequest,
    HttpsError,
    onCall,
} from 'firebase-functions/v2/https';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Callable function when user profile is updated
export const onUserProfileUpdated = onCall(
    { region: 'asia-northeast1' },
    async (request: CallableRequest<any>) => {
        // only the signed-in user's own trips can be updated
        const userId = request.auth?.uid;
        if (!userId) {
            throw new HttpsError('unauthenticated', 'Login required');
        }
        // the profile is read from Auth, values sent by clients are ignored
        const user = await getAuth().getUser(userId);

        // Update tripShare owner info
        const tripSharesSnapshot = await getFirestore()
            .collection('tripShare')
            .where(`role.${userId}`, '==', 'owner')
            .get();

        // Create a batch to update all matching tripShare documents
        if (!tripSharesSnapshot.empty) {
            const batch = getFirestore().batch();
            const updateData = {
                'owner.displayName': user.displayName || '',
                'owner.photoURL': user.photoURL || '',
            };
            tripSharesSnapshot.forEach((doc) =>
                batch.update(doc.ref, updateData),
            );
            await batch.commit();
        }

        return { tripShareUpdated: tripSharesSnapshot.size };
    },
);
