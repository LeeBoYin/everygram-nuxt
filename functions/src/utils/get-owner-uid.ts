import * as logger from 'firebase-functions/logger';

// Returns the owner of a gear / trip, only if `role` is exactly `{ uid: 'owner' }`.
// Docs written before the rules restricted `role` may list other users, so their
// owner cannot be trusted: returns null and the caller has to skip them.
export const getOwnerUid = (
    role: Record<string, string> | undefined,
    docPath: string,
): string | null => {
    const entries = Object.entries(role ?? {});
    if (entries.length === 1 && entries[0][1] === 'owner') {
        return entries[0][0];
    }
    logger.warn('Skipped doc with invalid role.', { docPath, role });
    return null;
};
