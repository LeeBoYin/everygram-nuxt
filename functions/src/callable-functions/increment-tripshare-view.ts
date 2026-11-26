import {
    CallableRequest,
    HttpsError,
    onCall,
} from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Callable function to increment viewCount of a trip
export const incrementTripShareView = onCall(
    // no auth check: views from signed out visitors count too
    { region: 'asia-northeast1', enforceAppCheck: true },
    async (request: CallableRequest<any>) => {
        const tripId = request.data?.tripId;
        if (!tripId || typeof tripId !== 'string') {
            throw new HttpsError(
                'invalid-argument',
                'tripId is required and must be a string',
            );
        }

        try {
            const db = getFirestore();
            await db.runTransaction(async (transaction) => {
                // only shared trips have views, otherwise any ID (or a deleted
                // trip) would leave an orphan tripMeta document
                const tripShare = await transaction.get(
                    db.collection('tripShare').doc(tripId),
                );
                if (!tripShare.exists) {
                    throw new HttpsError('not-found', 'Trip not found');
                }
                transaction.set(
                    db.collection('tripMeta').doc(tripId),
                    {
                        tripId,
                        viewCount: FieldValue.increment(1),
                    },
                    {
                        merge: true, // Use merge to avoid overwriting other fields
                    },
                );
            });

            return { success: true };
        } catch (error: any) {
            if (error instanceof HttpsError) throw error;
            throw new HttpsError(
                'internal',
                'Failed to update view count',
                error.message,
            );
        }
    },
);
