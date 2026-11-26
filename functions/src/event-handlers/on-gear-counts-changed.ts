import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { recountOnWrite } from '../utils/user-counts';

// keeps the gear counts of `userMeta` up to date
export const onGearCountsChanged = onDocumentWritten(
    'gear/{gearId}',
    async (event) => {
        if (!event.data) {
            return;
        }
        await recountOnWrite('gear', event.data.before, event.data.after);
    },
);
