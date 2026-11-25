import { getAuth, onAuthStateChanged, type User } from 'firebase/auth';

// UX only: the data is protected by Firestore rules and Cloud Functions.
// Pages for owners add `requiresOwner: true` to their page meta.
export default defineNuxtRouteMiddleware(async (to) => {
    const auth = getAuth();
    const user = await new Promise<User | null>((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(
            auth,
            (user) => {
                unsubscribe();
                resolve(user);
            },
            reject,
        );
    });

    if (!user) {
        return navigateTo('/');
    }

    let adminRole: unknown;
    try {
        // force refresh to get the latest custom claims
        adminRole = (await user.getIdTokenResult(true)).claims.adminRole;
    } catch (error) {
        console.error(error);
    }

    if (adminRole !== 'owner' && adminRole !== 'admin') {
        return navigateTo('/');
    }
    if (to.meta.requiresOwner && adminRole !== 'owner') {
        return navigateTo('/admin');
    }
});
