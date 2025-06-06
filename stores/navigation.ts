import { defineStore } from 'pinia';

export const useNavigationStore = defineStore('navigation', {
    state: () => ({
        previousRoute: null as null | { path: string },
    }),
    actions: {
        setPreviousRoute(route: any) {
            this.previousRoute = route;
        },
    },
});
