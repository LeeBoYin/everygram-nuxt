<template>
    <div
        :class="[
            'trip-card border-round-md overflow-hidden bg-white flex flex-column w-full',
            'shadow-1 hover:shadow-3',
        ]"
    >
        <!-- card image -->
        <picture class="trip-card__image relative">
            <img
                :src="
                    trip.bannerImage
                        ? trip.bannerImage.url
                        : constants.SITE_DOMAIN +
                          constants.DEFAULT_TRIP_BANNER_IMAGE_PATH
                "
                alt="Trip Banner"
                :style="{
                    viewTransitionName: `trip-image-${trip.id}`,
                }"
            />
            <!-- public label -->
            <div
                v-if="props.isPublic"
                class="trip-card__public-label flex align-items-center gap-1 p-2 absolute top-0 right-0 text-white"
            >
                <i class="pi pi-globe"></i>
                <div>{{ $t('LABEL_PUBLIC') }}</div>
            </div>
        </picture>
        <div class="px-4 py-3">
            <!-- trip title -->
            <h3
                class="text-lg text-color mb-2 text-ellipsis"
                :style="{
                    viewTransitionName: `trip-title-${trip.id}`,
                }"
            >
                {{ trip.title }}
            </h3>
            <!-- trip date -->
            <div class="text-color-light mb-3 text-ellipsis">
                <template v-if="trip.startDate">
                    {{ trip.startDate }}
                    <template v-if="trip.dateMode === 'multi'">
                        ・{{ $t('INFO_DAYS', { num: days }, days) }}
                    </template>
                </template>
                <template v-else>
                    <div class="text-white">-</div>
                </template>
            </div>
            <div class="flex justify-content-between align-items-end gap-2">
                <!-- pack weight -->
                <PrimeTag
                    class="p-tag-primary-light flex-shrink-0"
                    :value="formatWeight(props.packWeight || 0)"
                />
                <!-- owner label -->
                <UserLabel
                    v-if="props.owner"
                    :user="props.owner"
                    avatar-size="xs"
                    class="text-xs"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{
    trip: Trip | TripShare;
    packWeight?: number;
    isPublic?: boolean;
    owner?: UserInfo;
}>();

const { formatWeight } = useLangUtils();

const days = computed(() => dataUtils.getTripDays(props.trip));
</script>

<style lang="scss">
@import '~/assets/theme/primeflex/core/_variables.scss';

.trip-card {
    transition-property: box-shadow;
    transition-duration: 0.1s;
    transition-timing-function: ease-in;

    &__image {
        &,
        & > img {
            aspect-ratio: 2 / 1;
        }
        background-size: cover;
        background-position: center;
        > img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
    }
    &__public-label {
        text-shadow: 0px 0px 3px rgba(0, 0, 0, 0.5);
    }
}
</style>
