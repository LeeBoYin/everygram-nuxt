import type { User } from 'firebase/auth';

// admin role of the current user, from the custom claim in the ID token
export const useAdminRole = () => {
    const { user } = storeToRefs(useUserStore());
    const adminRole = ref<AdminRole | null>(null);

    watch(
        () => user.value,
        async (currentUser) => {
            adminRole.value = null;
            if (!currentUser) {
                return;
            }
            try {
                const { claims } = await (
                    currentUser as User
                ).getIdTokenResult();
                // the user may have changed while waiting for the token
                if (user.value === currentUser) {
                    adminRole.value =
                        (claims.adminRole as AdminRole | undefined) ?? null;
                }
            } catch (error) {
                console.error(error);
            }
        },
        { immediate: true },
    );

    return {
        adminRole,
        isAdmin: computed(() => adminRole.value !== null),
        isOwner: computed(() => adminRole.value === 'owner'),
    };
};
