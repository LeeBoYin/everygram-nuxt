import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { publishTrip, unpublishTrip } from '../utils/trip-publish-unpublish';
import {
    generateThumbnails,
    TRIP_THUMBNAIL_SIZES,
} from '../utils/generate-thumbnails';

export const onTripUpdated = onDocumentUpdated(
    'trip/{tripId}',
    async (event) => {
        const tripId = event.params.tripId;
        const newTrip = event.data?.after.data();
        const oldTrip = event.data?.before.data();

        // 1. update trip share when trip is updated
        const updateTripSharePromise = (async () => {
            if (newTrip?.isPublished) {
                // publish or re-publish trip share if trip is published
                await publishTrip(tripId);
                return;
            }
            if (oldTrip?.isPublished && !newTrip?.isPublished) {
                // unpublish trip share if trip is unpublished
                await unpublishTrip(tripId);
                return;
            }
        })();

        // 2. when trip banner image is updated
        const updateBannerImagePromise = (async () => {
            const subPromises = [];
            const newBannerImageFileName = newTrip?.bannerImage?.fileName;
            const oldBannerImageFileName = oldTrip?.bannerImage?.fileName;

            if (newBannerImageFileName === oldBannerImageFileName) {
                return;
            }

            // 2.1. delete the old banner image and thumbnails
            if (oldBannerImageFileName) {
                const oldBannerImagePath = `trip/${tripId}/${oldBannerImageFileName}`;
                subPromises.push(
                    getStorage().bucket().deleteFiles({
                        prefix: oldBannerImagePath,
                    }),
                );
            }

            // 2.2. generate new thumbnails and save to trip
            if (newBannerImageFileName) {
                subPromises.push(
                    (async () => {
                        // 2.2.1. generate thumbnails
                        const generatedThumbnails = await generateThumbnails({
                            imagePath: `trip/${tripId}/${newBannerImageFileName}`,
                            targetPath: `trip/${tripId}/${newBannerImageFileName}`,
                            sizes: TRIP_THUMBNAIL_SIZES,
                        });
                        if (!generatedThumbnails) {
                            return;
                        }

                        // 2.2.2. update trip with thumbnails
                        await getFirestore()
                            .collection('trip')
                            .doc(tripId)
                            .update({
                                'bannerImage.thumbnails': generatedThumbnails,
                            });
                    })(),
                );
            }

            await Promise.all(subPromises);
        })();

        return Promise.all([updateTripSharePromise, updateBannerImagePromise]);
    },
);
