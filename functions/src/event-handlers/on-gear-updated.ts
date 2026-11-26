import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import _ from 'lodash';
import { publishTrip } from '../utils/trip-publish-unpublish';
import {
    generateThumbnails,
    GEAR_THUMBNAIL_SIZES,
} from '../utils/generate-thumbnails';
import { getOwnerUid } from '../utils/get-owner-uid';
import { TRIP_SHARE_GEAR_FIELDS } from '../utils/trip-share-gear';
import { waitAll } from '../utils/wait-all';

export const onGearUpdated = onDocumentUpdated(
    'gear/{gearId}',
    async (event) => {
        const gearId = event.params.gearId;
        const newGear = event.data?.after.data();
        const oldGear = event.data?.before.data();

        // publishes every trip share using this gear again (to calculate weights
        // again). Queries on call, so trips unpublished meanwhile are skipped.
        const republishTripShares = async () => {
            // get trip shares that have the gear or worn gear
            const [tripSharesWithGearSnapshot, tripSharesWithWornGearSnapshot] =
                await Promise.all([
                    // get trip shares that have the gear
                    getFirestore()
                        .collection('tripShare')
                        .where(`gears.${gearId}`, '!=', false)
                        .get(),
                    // get trip shares that have the worn gear
                    getFirestore()
                        .collection('tripShare')
                        .where(`wornGears.${gearId}`, '!=', false)
                        .get(),
                ]);

            // merge trip shares with gear and worn gear
            const tripShareDocs = _.uniqBy(
                [
                    ...tripSharesWithGearSnapshot.docs,
                    ...tripSharesWithWornGearSnapshot.docs,
                ],
                'id',
            );

            // publish trip share again
            await waitAll(tripShareDocs.map((doc) => publishTrip(doc.id)));
        };

        const newPhotoFileName = newGear?.photo?.fileName;
        const oldPhotoFileName = oldGear?.photo?.fileName;
        const isPhotoFileChanged = newPhotoFileName !== oldPhotoFileName;
        // a new photo file: thumbnails are going to be generated (step 2.2)
        const hasNewPhotoFile = isPhotoFileChanged && !!newPhotoFileName;

        // 1. publish trip shares again, only if a field copied into them changed.
        // With a new photo file this is left to step 2.2, to publish only once.
        const publishTripShareAgainPromise = (async () => {
            const isTripShareGearChanged = !_.isEqual(
                _.pick(oldGear, TRIP_SHARE_GEAR_FIELDS),
                _.pick(newGear, TRIP_SHARE_GEAR_FIELDS),
            );
            if (isTripShareGearChanged && !hasNewPhotoFile) {
                await republishTripShares();
            }
        })();

        // 2. when gear photo is updated
        const updatePhotoPromise = (async () => {
            const subPromises: Promise<unknown>[] = [];

            if (!isPhotoFileChanged) {
                return;
            }

            // 2.1. delete the old photo and thumbnails
            if (oldPhotoFileName) {
                const oldPhotoPath = `gear/${gearId}/${oldPhotoFileName}`;
                subPromises.push(
                    getStorage().bucket().deleteFiles({
                        prefix: oldPhotoPath,
                    }),
                );
            }

            // 2.2. generate new thumbnails and save to gear.
            // Timing: this run does not publish. Writing the thumbnails back
            // triggers this function again, and that run publishes the new photo
            // together with its thumbnails (step 1). If nothing is written back
            // (skipped, failed or thrown), publish here instead, so trip shares
            // don't keep the old data. A timeout or crash of the instance skips
            // this fallback: they stay stale until the next publish.
            if (newPhotoFileName) {
                const saveThumbnails = async (): Promise<boolean> => {
                    // the owner decides which userGears doc is written
                    const ownerUid = getOwnerUid(
                        newGear?.role,
                        `gear/${gearId}`,
                    );
                    if (!ownerUid) {
                        return false;
                    }

                    // 2.2.1. generate thumbnails
                    const generatedThumbnails = await generateThumbnails({
                        imagePath: `gear/${gearId}/${newPhotoFileName}`,
                        targetPath: `gear/${gearId}/${newPhotoFileName}`,
                        sizes: GEAR_THUMBNAIL_SIZES,
                    });
                    if (!generatedThumbnails) {
                        return false;
                    }

                    // 2.2.2. use transaction to update gear with thumbnails and userGears with thumbnails
                    return getFirestore().runTransaction(
                        async (transaction) => {
                            // Get references to the documents
                            const gearDocRef = getFirestore()
                                .collection('gear')
                                .doc(gearId);
                            const userGearsDocRef = getFirestore()
                                .collection('userGears')
                                .doc(ownerUid);
                            // Read the documents
                            const [gearDoc, userGearsDoc] = await Promise.all([
                                transaction.get(gearDocRef),
                                transaction.get(userGearsDocRef),
                            ]);
                            if (!gearDoc.exists || !userGearsDoc.exists) {
                                return false;
                            }
                            // Perform the updates
                            transaction.update(gearDocRef, {
                                'photo.thumbnails': generatedThumbnails,
                            });
                            transaction.update(userGearsDocRef, {
                                [`gears.${gearId}.photo.thumbnails`]:
                                    generatedThumbnails,
                            });
                            return true;
                        },
                    );
                };

                subPromises.push(
                    (async () => {
                        let isSaved = false;
                        try {
                            isSaved = await saveThumbnails();
                        } finally {
                            if (!isSaved) {
                                await republishTripShares();
                            }
                        }
                    })(),
                );
            }
            await waitAll(subPromises);
        })();

        await waitAll([publishTripShareAgainPromise, updatePhotoPromise]);
    },
);
