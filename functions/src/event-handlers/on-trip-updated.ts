import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import _ from 'lodash';
import { publishTrip, unpublishTrip } from '../utils/trip-publish-unpublish';
import {
    generateThumbnails,
    TRIP_THUMBNAIL_SIZES,
} from '../utils/generate-thumbnails';
import { waitAll } from '../utils/wait-all';

export const onTripUpdated = onDocumentUpdated(
    'trip/{tripId}',
    async (event) => {
        const tripId = event.params.tripId;
        const newTrip = event.data?.after.data();
        const oldTrip = event.data?.before.data();

        const newBannerImageFileName = newTrip?.bannerImage?.fileName;
        const oldBannerImageFileName = oldTrip?.bannerImage?.fileName;
        const isBannerImageFileChanged =
            newBannerImageFileName !== oldBannerImageFileName;
        // a new banner file: thumbnails are going to be generated (step 2.2)
        const hasNewBannerImageFile =
            isBannerImageFileChanged && !!newBannerImageFileName;

        // 1. update trip share when trip is updated
        const updateTripSharePromise = (async () => {
            if (!newTrip?.isPublished) {
                // unpublish trip share if trip is unpublished
                if (oldTrip?.isPublished) {
                    await unpublishTrip(tripId);
                }
                return;
            }
            if (oldTrip?.isPublished) {
                // stays published: re-publish only if something other than
                // `updated` changed. With a new banner file this is left to step
                // 2.2, to publish only once.
                const isTripChanged = !_.isEqual(
                    _.omit(oldTrip, 'updated'),
                    _.omit(newTrip, 'updated'),
                );
                if (!isTripChanged || hasNewBannerImageFile) {
                    return;
                }
            }
            // publish or re-publish trip share
            await publishTrip(tripId);
        })();

        // 2. when trip banner image is updated
        const updateBannerImagePromise = (async () => {
            const subPromises: Promise<unknown>[] = [];

            if (!isBannerImageFileChanged) {
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

            // 2.2. generate new thumbnails and save to trip.
            // Timing: if the trip stays published, this run does not publish.
            // Writing the thumbnails back triggers this function again, and that
            // run publishes the new banner together with its thumbnails (step 1).
            // If nothing is written back (failed or thrown), publish here
            // instead, so the trip share doesn't keep the old data. A timeout or
            // crash of the instance skips this fallback: it stays stale until
            // the next publish.
            if (newBannerImageFileName) {
                const saveThumbnails = async (): Promise<boolean> => {
                    // 2.2.1. generate thumbnails
                    const generatedThumbnails = await generateThumbnails({
                        imagePath: `trip/${tripId}/${newBannerImageFileName}`,
                        targetPath: `trip/${tripId}/${newBannerImageFileName}`,
                        sizes: TRIP_THUMBNAIL_SIZES,
                    });
                    if (!generatedThumbnails) {
                        return false;
                    }

                    // 2.2.2. update trip with thumbnails
                    await getFirestore().collection('trip').doc(tripId).update({
                        'bannerImage.thumbnails': generatedThumbnails,
                    });
                    return true;
                };

                // only a publish that step 1 left to this step needs a fallback
                const publishSkippedTripShare = async () => {
                    if (!oldTrip?.isPublished || !newTrip?.isPublished) {
                        return;
                    }
                    // the trip may have been unpublished or deleted meanwhile
                    const tripDoc = await getFirestore()
                        .collection('trip')
                        .doc(tripId)
                        .get();
                    if (tripDoc.data()?.isPublished) {
                        await publishTrip(tripId);
                    }
                };

                subPromises.push(
                    (async () => {
                        let isSaved = false;
                        try {
                            isSaved = await saveThumbnails();
                        } finally {
                            if (!isSaved) {
                                await publishSkippedTripShare();
                            }
                        }
                    })(),
                );
            }
            await waitAll(subPromises);
        })();

        await waitAll([updateTripSharePromise, updateBannerImagePromise]);
    },
);
