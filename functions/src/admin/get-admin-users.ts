import { onCall } from 'firebase-functions/v2/https';
import { listAllUsers, readCollection, toDate } from './admin-data';
import { requireAdmin } from './require-admin';

// Callable function for admins to list all users. The result is computed on
// each call and never saved, so there is no extra copy of the personal data.
export const getAdminUsers = onCall(
    { region: 'asia-northeast1', memory: '512MiB' },
    async (request): Promise<{ users: AdminUserRow[] }> => {
        await requireAdmin(request);

        const [authUsers, userMetas] = await Promise.all([
            listAllUsers(),
            readCollection<UserMeta>('userMeta', [
                'locale',
                'gearCount',
                'tripCount',
                'tripShareCount',
            ]),
        ]);
        const metaMap = new Map(userMetas.map(({ id, data }) => [id, data]));

        const users = authUsers.map((user): AdminUserRow => {
            const meta = metaMap.get(user.uid);
            const lastActive =
                toDate(user.metadata.lastRefreshTime) ??
                toDate(user.metadata.lastSignInTime);
            return {
                uid: user.uid,
                email: user.email ?? '',
                displayName: user.displayName ?? '',
                provider: (user.providerData ?? [])
                    .map((item) => item.providerId)
                    .join(', '),
                created:
                    toDate(user.metadata.creationTime)?.toISOString() ?? null,
                lastActive: lastActive?.toISOString() ?? null,
                gearCount: meta?.gearCount ?? 0,
                tripCount: meta?.tripCount ?? 0,
                tripShareCount: meta?.tripShareCount ?? 0,
                locale: meta?.locale ?? null,
            };
        });
        return { users };
    },
);
