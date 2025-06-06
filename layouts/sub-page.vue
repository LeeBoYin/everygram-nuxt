<template>
    <AppHeader class="sticky">
        <template #left>
            <NuxtLink
                :to="hasLastVisited ? undefined : backButton.parent"
                @click="hasLastVisited && $router.back()"
            >
                <PrimeButton
                    icon="pi pi-arrow-left"
                    :label="backButton.label"
                    text
                    rounded
                    size="small"
                />
            </NuxtLink>
        </template>
        <template #navigation>
            <div id="app-header-navigation-slot"></div>
        </template>
        <template #actions>
            <UserMenu />
        </template>
        <template #mobile-actions>
            <div id="app-header-mobile-actions-slot"></div>
        </template>
    </AppHeader>
    <div class="page-container">
        <slot />
    </div>
    <AppFooter />
    <!-- dialogs available in all sub pages -->
    <UserSettingsDialog />
</template>

<script setup lang="ts">
const route = useRoute();
const navigation = useNavigationStore();
const hasLastVisited = computed(() => !!navigation.previousRoute);

const i18n = useI18n();
const backButton = computed<{ label: string; parent: string }>(() => {
    switch (route.name) {
        case 'trip-id':
            return {
                label: i18n.t('ACTION_BACK_TO_TRIPS'),
                parent: '/trips',
            };
        case 'archived-gears':
            return {
                label: i18n.t('ACTION_BACK_TO_GEARS'),
                parent: '/gears',
            };
        case 'gears-editor':
            return {
                label: i18n.t('ACTION_BACK_TO_GEARS'),
                parent: '/gears',
            };
        default:
            return {
                label: i18n.t('ACTION_BACK'),
                parent: navigation.previousRoute?.path || '/',
            };
    }
});
</script>
