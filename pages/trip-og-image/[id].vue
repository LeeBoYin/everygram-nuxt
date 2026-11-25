<template>
    <div
        :class="['trip-og-image', 'overflow-hidden']"
        :style="{ width: '1200px', height: '630px' }"
    >
        <div
            :class="[
                'trip-og-image__trip-info',
                'p-5 gap-6',
                'flex flex-column h-full justify-content-center align-items-start',
            ]"
        >
            <!-- app logo -->
            <img
                src="/image/logo-horizontal.svg"
                alt="App Logo"
                height="72px"
            />
            <!-- trip title -->
            <h1 class="text-6xl">
                {{ tripShare.title }}
            </h1>
            <!-- owner -->
            <div class="flex gap-4 align-items-center min-w-0 text-5xl">
                <UserAvatar :user="tripShare.owner" avatar-size="xl" />
                <div class="text-ellipsis text-color">
                    {{ tripShare.owner.displayName }}
                </div>
            </div>
        </div>
        <div>
            <TripWeightInfo
                :gears="gearsInTrip"
                :wornGears="wornGearsInTrip"
                :consumables="consumablesInTrip"
                class="trip-og-image__weight-info"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { getApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

// ! the values below are non-reactive //
const app = getApp();
const db = getFirestore(app);
const route = useRoute();
const tripId = route.params.id as string;
const tripShareRef = doc(db, 'tripShare', tripId);
const tripShareSnap = await getDoc(tripShareRef);
const tripShare: TripShare | null = (tripShareSnap.data() as TripShare) || null;
const gearsInTrip: GearWithQuantity[] = _values(tripShare?.gears || []);
const wornGearsInTrip: GearWithQuantity[] = _values(tripShare?.wornGears || []);
const consumablesInTrip: Consumable[] = _values(tripShare?.consumables || []);

// set locale
const i18n = useI18n();
if (tripShare.locale && constants.LOCALES.includes(tripShare.locale)) {
    await i18n.loadLocaleMessages(tripShare.locale);
    await i18n.setLocale(tripShare.locale);
}

useSeoMeta({
    robots: 'noindex, nofollow',
});
</script>

<style lang="scss" scoped>
@import '~/assets/theme/_eg-colors.scss';
html,
body {
    margin: 0;
    padding: 0;
}
body {
    width: 1200px;
    height: 630px;
}
.trip-og-image {
    display: grid;
    grid-template-columns: 540px 660px;
    background: white;
    &__trip-info {
        width: 540px;
        background-color: $eg-c-brown-200;
    }
    &__weight-info {
        width: 400px;
        transform: scale(1.6);
        transform-origin: top left;
    }
}
</style>
