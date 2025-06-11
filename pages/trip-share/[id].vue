<template>
    <TripPageLayout v-if="tripShare">
        <template #header>
            <TripHeader :trip="tripShare">
                <template #actions>
                    <div class="flex align-items-center gap-2">
                        <div class="flex align-items-center gap-1">
                            <UserLabel
                                :user="{
                                    ...tripShare.owner,
                                    ...(isOwnerViewing
                                        ? {
                                              displayName: $t('LABEL_YOU'),
                                          }
                                        : {}),
                                }"
                            />
                            <div class="text-color-lighter">
                                {{ $t('INFO_CREATED_THIS_TRIP') }}
                            </div>
                        </div>
                        <template v-if="isOwnerViewing">
                            <VerticalSeparatorLine class="text-color-lighter" />
                            <NuxtLink
                                :to="`/trip/${tripId}`"
                                class="text-primary"
                                target="_blank"
                            >
                                {{ $t('ACTION_EDIT') }}
                                <i class="pi pi-external-link text-xs"></i>
                            </NuxtLink>
                        </template>
                    </div>
                </template>
            </TripHeader>
        </template>
        <template #side>
            <TripWeightInfo
                :gears="gearsInTrip"
                :wornGears="wornGearsInTrip"
                :consumables="consumablesInTrip"
            />
            <NuxtLink
                to="/"
                class="block w-full mt-3"
                @click="
                    () =>
                        analyticsUtils.log(
                            constants.ANALYTICS_EVENTS.CLICK_CTA_BUTTON,
                            { trip_id: tripShare?.id, page_name: 'trip-share' },
                        )
                "
            >
                <PrimeButton
                    :label="$t('ACTION_CREATE_YOUR_GEAR_LIST')"
                    icon="pi pi-arrow-right"
                    icon-pos="right"
                    class="w-full"
                    rounded
                />
            </NuxtLink>
        </template>
        <template #main>
            <!-- base gears -->
            <TripGearSection :title="$t('LABEL_BASE')" :gears="gearsInTrip">
                <template #header-actions>
                    <div class="text-lg font-bold">
                        {{ formatWeight(gearsWeight) }}
                    </div>
                </template>
                <template #category-body="{ gears }">
                    <GearDataTable
                        :gears="gears"
                        :hasQuantity="true"
                        class="lg:ml-6"
                    />
                </template>
            </TripGearSection>

            <!-- comsumables -->
            <TripConsumableSection
                :title="$t('LABEL_CONSUMABLES')"
                :consumables="consumablesInTrip"
            >
                <template #header-actions>
                    <div class="text-lg font-bold">
                        {{ formatWeight(consumablesWeight) }}
                    </div>
                </template>
                <template #category-body="{ consumables }">
                    <ConsumableDataTable
                        :consumables="consumables"
                        class="lg:ml-6"
                    />
                </template>
            </TripConsumableSection>

            <!-- worn gears -->
            <TripGearSection
                :title="$t('LABEL_WORN_GEARS')"
                :gears="wornGearsInTrip"
            >
                <template #header-actions>
                    <div class="text-lg font-bold">
                        {{ formatWeight(wornGearsWeight) }}
                    </div>
                </template>
                <template #category-body="{ gears }">
                    <GearDataTable
                        :gears="gears"
                        :hasQuantity="true"
                        class="lg:ml-6"
                    />
                </template>
            </TripGearSection>
        </template>
    </TripPageLayout>
    <EmptyState
        v-else
        :title="$t('INFO_TRIP_NOT_FOUND')"
        :description="$t('INFO_TRIP_NOT_FOUND_DESC')"
        image-src="/image/illustration/illu-camping.svg"
    >
        <template #actions>
            <!-- back to home -->
            <NuxtLink to="/">
                <PrimeButton rounded :label="$t('ACTION_BACK_TO_HOME')" />
            </NuxtLink>
        </template>
    </EmptyState>
</template>

<script setup lang="ts">
import { getApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

definePageMeta({
    layout: 'public-page',
});

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
const gearsWeight = _sumBy(
    gearsInTrip,
    (gear) => (+gear.weight || 0) * gear.quantity,
);
const consumablesWeight = _sumBy(
    consumablesInTrip,
    (consumable) => +consumable.weight || 0,
);
const wornGearsWeight = _sumBy(
    wornGearsInTrip,
    (gear) => (+gear.weight || 0) * gear.quantity,
);

// SEO and meta
const i18n = useI18n();
const { formatWeight } = useLangUtils();
const metaTitle = tripShare
    ? i18n.t('META_TRIP_SHARE_TITLE', {
          title: tripShare.title,
      })
    : i18n.t('META_TRIP_SHARE_NOT_FOUND_TITLE');
const metaOgTitle = tripShare
    ? i18n.t('META_TRIP_SHARE_OG_TITLE', {
          title: tripShare.title,
          owner: tripShare.owner.displayName,
      })
    : i18n.t('META_TRIP_SHARE_NOT_FOUND_OG_TITLE');
const metaDescription = tripShare
    ? i18n.t('META_TRIP_SHARE_DESCRIPTION', {
          title: tripShare.title,
          owner: tripShare.owner.displayName,
          packWeight: formatWeight(gearsWeight + consumablesWeight),
          baseWeight: formatWeight(gearsWeight),
          consumablesWeight: formatWeight(consumablesWeight),
          date: dataUtils.formatTripDate(tripShare),
      })
    : i18n.t('META_TRIP_SHARE_NOT_FOUND_DESCRIPTION');
const defaultBannerImageUrl =
    constants.SITE_DOMAIN + constants.DEFAULT_TRIP_BANNER_IMAGE_PATH;

useHead({
    link: [
        // add canonical link to avoid query params
        {
            rel: 'canonical',
            href: constants.SITE_DOMAIN + route.path,
        },
    ],
});
useSeoMeta({
    title: metaTitle,
    ogTitle: metaOgTitle,
    description: metaDescription,
    ogDescription: metaDescription,
    ogImage: tripShare?.bannerImage
        ? tripShare.bannerImage.thumbnails?.md.url || tripShare.bannerImage.url
        : defaultBannerImageUrl,
    robots: tripShare ? 'index, follow' : 'noindex, nofollow',
});

onMounted(() => {
    analyticsUtils.log(constants.ANALYTICS_EVENTS.VIEW_TRIP_SHARE_PAGE, {
        trip_id: tripId,
    });
    incrementTripShareViewIfFirstVisit(tripId);
});

function incrementTripShareViewIfFirstVisit(tripId: string) {
    const STORAGE_KEY = 'eg_tripshare_viewed_ids';
    let viewedIds: Set<string>;

    // try to get viewed trip IDs from localStorage
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        viewedIds = raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
        viewedIds = new Set();
    }

    if (viewedIds.has(tripId)) {
        // already viewed
        return;
    }

    // increment view count only if this is the first visit
    try {
        // Specify the region to match the deployed function
        const functions = getFunctions(app, 'asia-northeast1');
        const incrementView = httpsCallable(
            functions,
            'incrementTripShareView',
        );
        incrementView({ tripId }).then(() => {
            viewedIds.add(tripId);
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(Array.from(viewedIds)),
            );
        });
    } catch {
        // ignore error, do not break page
    }
}

// for showing trip owner actions
const userStore = useUserStore();
const { user } = storeToRefs(userStore);
const userTripsStore = useUserTripsStore();
const { tripMap } = storeToRefs(userTripsStore);
const isOwnerViewing = computed(() => {
    return user.value && tripMap.value && tripMap.value[tripId]
        ? tripMap.value[tripId].role[user.value.uid] === constants.ROLES.OWNER
        : false;
});
</script>
