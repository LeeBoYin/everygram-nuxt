import {
    CallableRequest,
    HttpsError,
    onCall,
} from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Callable function to increment viewCount of a trip
export const incrementTripShareView = onCall(
    { region: 'asia-northeast1' },
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
            await db
                .collection('tripMeta')
                .doc(tripId)
                .set(
                    {
                        tripId,
                        viewCount: FieldValue.increment(1),
                    },
                    {
                        merge: true, // Use merge to avoid overwriting other fields
                    },
                );

            return { success: true };
        } catch (error: any) {
            throw new HttpsError(
                'not-found',
                'Trip not found or update failed',
                error.message,
            );
        }
    },
);
