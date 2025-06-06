export default defineNuxtPlugin(() => {
    const router = useRouter();
    const navigation = useNavigationStore();

    let lastRoute = null;
    router.beforeEach((to, from, next) => {
        if (from.name) {
            navigation.setPreviousRoute(from);
        }
        next();
    });
});
