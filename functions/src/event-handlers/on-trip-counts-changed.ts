import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { recountOnWrite } from '../utils/user-counts';

// keeps the trip counts of `userMeta` up to date
export const onTripCountsChanged = onDocumentWritten(
    'trip/{tripId}',
    async (event) => {
        if (!event.data) {
            return;
        }
        await recountOnWrite('trip', event.data.before, event.data.after);
    },
);
