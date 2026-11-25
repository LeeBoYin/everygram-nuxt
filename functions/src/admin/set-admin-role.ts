import { getAuth, UserRecord } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import {
    CallableRequest,
    HttpsError,
    onCall,
} from 'firebase-functions/v2/https';

type SetAdminRoleData = {
    email?: unknown;
    role?: unknown;
};

const findUserByEmail = async (email: string): Promise<UserRecord> => {
    try {
        return await getAuth().getUserByEmail(email);
    } catch (error: any) {
        if (error?.code === 'auth/user-not-found') {
            throw new HttpsError('not-found', 'User not found');
        }
        if (error?.code === 'auth/invalid-email') {
            throw new HttpsError('invalid-argument', 'email is invalid');
        }
        throw error;
    }
};

// keeps the other custom claims of the user
const setAdminClaim = async (uid: string, role: AdminRole | null) => {
    const { customClaims } = await getAuth().getUser(uid);
    const claims: Record<string, unknown> = { ...customClaims };
    if (role) {
        claims.adminRole = role;
    } else {
        delete claims.adminRole;
    }
    await getAuth().setCustomUserClaims(uid, claims);
};

// Callable function for owners to grant, change or remove an admin role.
// The target user has to sign in again for the new role to take effect.
export const setAdminRole = onCall(
    { region: 'asia-northeast1' },
    async (request: CallableRequest<SetAdminRoleData>) => {
        const caller = request.auth;
        if (caller?.token.adminRole !== 'owner') {
            throw new HttpsError('permission-denied', 'Owner role is required');
        }

        const { email, role } = request.data ?? {};
        if (!email || typeof email !== 'string') {
            throw new HttpsError(
                'invalid-argument',
                'email is required and must be a string',
            );
        }
        if (role !== 'owner' && role !== 'admin' && role !== null) {
            throw new HttpsError(
                'invalid-argument',
                "role must be 'owner', 'admin' or null",
            );
        }

        const target = await findUserByEmail(email.trim());
        if (target.uid === caller.uid) {
            throw new HttpsError(
                'failed-precondition',
                'You cannot change your own role',
            );
        }

        // `adminUsers` is written first, in a transaction, so that concurrent
        // calls cannot remove each other and leave no owner.
        const db = getFirestore();
        const adminUsers = db.collection('adminUsers');
        const targetRef = adminUsers.doc(target.uid);
        const previous = await db.runTransaction(async (transaction) => {
            const owners = await transaction.get(
                adminUsers.where('role', '==', 'owner'),
            );
            const ownerIds = owners.docs.map((doc) => doc.id);
            if (
                role !== 'owner' &&
                ownerIds.includes(target.uid) &&
                ownerIds.length === 1
            ) {
                throw new HttpsError(
                    'failed-precondition',
                    'Cannot remove the last owner',
                );
            }
            // the ID token stays valid for up to an hour after a role change,
            // so a removed owner must also be rejected here
            if (!ownerIds.includes(caller.uid)) {
                throw new HttpsError(
                    'permission-denied',
                    'Owner role is required',
                );
            }

            const snapshot = await transaction.get(targetRef);
            if (role) {
                transaction.set(targetRef, {
                    uid: target.uid,
                    email: target.email ?? '',
                    displayName: target.displayName ?? '',
                    role,
                    addedBy: snapshot.get('addedBy') ?? caller.uid,
                    added:
                        snapshot.get('added') ?? FieldValue.serverTimestamp(),
                });
            } else {
                transaction.delete(targetRef);
            }
            return snapshot.data();
        });

        try {
            await setAdminClaim(target.uid, role);
        } catch (error) {
            // keep the list in sync with the claims
            await (previous ? targetRef.set(previous) : targetRef.delete());
            throw error;
        }

        return { uid: target.uid, role };
    },
);
