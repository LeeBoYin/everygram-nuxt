<template>
    <div class="flex flex-column gap-5">
        <template v-if="isFetchingTrips || trips.length > 0">
            <SectionTitleBar>
                <div class="text-color-light">
                    {{
                        $t('INFO_TRIP_NUM', { num: trips.length }, trips.length)
                    }}
                </div>
                <PrimeButton
                    severity="secondary"
                    rounded
                    :label="
                        isLargeScreen
                            ? $t('ACTION_CREATE_TRIP')
                            : $t('ACTION_CREATE')
                    "
                    icon="pi pi-plus"
                    @click="onCreateTrip"
                />
            </SectionTitleBar>
            <TripList
                :trips="sortedTrips"
                :isFetching="isFetchingTrips"
                v-slot="{ trip }"
            >
                <NuxtLink :to="`/trip/${trip.id}`">
                    <TripCard
                        :key="trip.id"
                        :trip="trip"
                        :is-public="trip.isPublished"
                        :pack-weight="
                            dataUtils.getTripBaseWeight(trip, gearMap)
                        "
                    />
                </NuxtLink>
            </TripList>
        </template>
        <EmptyState
            v-else
            :title="$t('INFO_NO_USER_TRIPS')"
            :description="$t('INFO_NO_USER_TRIPS_DESC')"
            image-src="/image/empty-trip.jpg"
        >
            <template #actions>
                <PrimeButton
                    severity="secondary"
                    rounded
                    :label="$t('ACTION_CREATE_TRIP')"
                    icon="pi pi-plus"
                    @click="onCreateTrip"
                />
            </template>
        </EmptyState>
    </div>
    <TripInfoEditorDialog />
</template>

<script setup lang="ts">
definePageMeta({
    middleware: ['auth-guard'],
    layout: 'user-page',
});

const userGearsStore = useUserGearsStore();
const { gearMap } = storeToRefs(userGearsStore);
const userTripsStore = useUserTripsStore();
const { trips, isFetchingTrips } = storeToRefs(userTripsStore);
const { onCreateTrip } = useEditTrip();
const { isLargeScreen } = useDeviceMeta();
const i18n = useI18n();
const sortedTrips = computed(() =>
    trips.value.sort((a, b) => {
        // trip without start date (new trip) comes first
        if (!a.startDate && b.startDate) {
            return -1;
        }
        if (a.startDate && !b.startDate) {
            return 1;
        }
        if (a.startDate && b.startDate) {
            return (
                new Date(b.startDate).getTime() -
                new Date(a.startDate).getTime()
            );
        }
        // trip without created date (newly created) comes first
        if (!a.created && b.created) {
            return -1;
        }
        if (a.created && !b.created) {
            return 1;
        }
        if (a.created && b.created) {
            return b.created.seconds - a.created.seconds;
        }
        return 0;
    }),
);

onMounted(() => {
    analyticsUtils.log(constants.ANALYTICS_EVENTS.VIEW_TRIPS_PAGE);
});

useHead({
    title: i18n.t('PAGE_TRIPS'),
});
</script>
