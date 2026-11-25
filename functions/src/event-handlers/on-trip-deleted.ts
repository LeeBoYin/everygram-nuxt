import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { onDocumentDeleted } from 'firebase-functions/v2/firestore';
import { unpublishTrip } from '../utils/trip-publish-unpublish';

export const onTripDeleted = onDocumentDeleted(
    'trip/{tripId}',
    async (event) => {
        const tripId = event.params.tripId;

        // 1. delete the storage path trip/{tripId}
        const deleteStoragePromise = (async () => {
            const filePath = `trip/${tripId}`;
            await getStorage().bucket().deleteFiles({
                prefix: filePath,
            });
        })();

        // 2. unpublish trip share when trip is deleted
        const unpublishTripPromise = unpublishTrip(tripId);

        // 3. delete trip meta (view count, OG image url)
        const deleteTripMetaPromise = getFirestore()
            .collection('tripMeta')
            .doc(tripId)
            .delete();

        return Promise.all([
            deleteStoragePromise,
            unpublishTripPromise,
            deleteTripMetaPromise,
        ]);
    },
);
