import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const FIRESTORE_NOT_FOUND = 5;

/**
 * Deletes the OG image files of a trip and clears tripMeta.ogImageUrl.
 * Other tripMeta fields (viewCount) are kept.
 */
export const removeTripOgImage = async (tripId: string) => {
    await getStorage()
        .bucket()
        .deleteFiles({ prefix: `trip/${tripId}/og-image/` });

    try {
        // update(), not set(): never re-create the tripMeta of a deleted trip
        await getFirestore()
            .collection('tripMeta')
            .doc(tripId)
            .update({ ogImageUrl: FieldValue.delete() });
    } catch (error: any) {
        if (error?.code !== FIRESTORE_NOT_FOUND) throw error;
    }
};
