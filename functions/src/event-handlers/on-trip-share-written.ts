import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { generateTripOgImageAndUpdateMeta } from '../callable-functions/generate-trip-og-image';
import { removeTripOgImage } from '../utils/remove-trip-og-image';

export const onTripShareWritten = onDocumentWritten(
    {
        document: 'tripShare/{tripId}',
        // Chromium: 2GiB leaves room for the browser and its files in /tmp
        // (in memory), and one event per instance avoids parallel browsers.
        memory: '2GiB',
        concurrency: 1,
        timeoutSeconds: 60,
    },
    async (event) => {
        const tripId = event.params.tripId;
        const newTripShare = event.data?.after.data();
        const oldTripShare = event.data?.before.data();

        // 1. trip is unpublished or deleted: its OG image must not stay readable
        if (!newTripShare) {
            await removeTripOgImage(tripId);
            return;
        }

        // 2. generate trip og image (only if relevant fields are updated)
        const tripOgImageRelevantFields = [
            'title',
            'packWeight',
            'dateMode',
            'startDate',
            'endDate',
            'locale',
            'owner.displayName',
            'owner.photoURL',
        ];
        const shouldGenerateNewTripOgImage = tripOgImageRelevantFields.some(
            (field) => {
                let newValue, oldValue;
                if (field.startsWith('owner.')) {
                    const key = field.split('.')[1];
                    newValue =
                        newTripShare.owner &&
                        typeof newTripShare.owner === 'object'
                            ? newTripShare.owner[key]
                            : undefined;
                    oldValue =
                        oldTripShare?.owner &&
                        typeof oldTripShare.owner === 'object'
                            ? oldTripShare.owner[key]
                            : undefined;
                } else {
                    newValue = newTripShare?.[field];
                    oldValue = oldTripShare?.[field];
                }
                return (
                    (newValue !== undefined && newValue !== oldValue) ||
                    (newValue === undefined && oldValue !== undefined)
                );
            },
        );

        if (shouldGenerateNewTripOgImage) {
            try {
                await generateTripOgImageAndUpdateMeta(tripId);
            } catch (err) {
                console.error(
                    `[onTripShareWritten] Failed to generate OG image for tripId=${tripId}:`,
                    err,
                );
            }
        }
    },
);
