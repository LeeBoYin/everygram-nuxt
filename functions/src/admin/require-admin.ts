import { getFirestore } from 'firebase-admin/firestore';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';

// Rejects callers without the required admin role. The ID token stays valid
// for up to an hour after a role change, so `adminUsers` is checked too.
export const requireAdmin = async (
    request: CallableRequest<unknown>,
    requiredRole: AdminRole = 'admin',
) => {
    const isAllowed = (role: unknown) =>
        role === 'owner' || (requiredRole === 'admin' && role === 'admin');
    const deny = () =>
        new HttpsError(
            'permission-denied',
            requiredRole === 'owner'
                ? 'Owner role is required'
                : 'Admin role is required',
        );

    const caller = request.auth;
    if (!caller || !isAllowed(caller.token.adminRole)) {
        throw deny();
    }
    const adminUser = await getFirestore()
        .collection('adminUsers')
        .doc(caller.uid)
        .get();
    if (!isAllowed(adminUser.get('role'))) {
        throw deny();
    }
};
