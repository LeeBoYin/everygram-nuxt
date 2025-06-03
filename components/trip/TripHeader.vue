<template>
    <div class="trip-header">
        <div class="trip-header__banner relative">
            <!-- banner image -->
            <picture class="trip-header__banner-image">
                <source
                    :media="`(min-width: ${constants.BREAK_POINTS.lg}px)`"
                    :srcset="desktopBannerImage"
                />
                <img
                    :src="mobileBannerImage"
                    alt="Trip Banner Image"
                    class="lg:border-round-md"
                    :style="{
                        viewTransitionName: `trip-image-${trip.id}`,
                    }"
                />
            </picture>
            <!-- banner actions -->
            <div class="absolute bottom-0 right-0 p-3">
                <slot name="banner-actions" />
            </div>
        </div>
        <div class="grid row-gap-3 lg:row-gap-5 py-4">
            <div class="col-12 lg:col-8">
                <!-- title -->
                <h1
                    class="text-2xl lg:text-3xl"
                    :style="{
                        viewTransitionName: `trip-title-${trip.id}`,
                    }"
                >
                    {{ trip.title }}
                </h1>
                <div class="mt-2">
                    <!-- trip date -->
                    <div v-if="formattedDate" class="trip-date mr-3">
                        <!-- calendar icon -->
                        <i class="pi pi-calendar mr-1 text-600" />
                        <!-- dates -->
                        {{ formattedDate }}
                        <!-- days for multi-day trips -->
                        <template v-if="trip.dateMode === 'multi'">
                            ・{{ $t('INFO_DAYS', { num: days }, days) }}
                        </template>
                    </div>
                    <!-- trip description -->
                    <span
                        v-if="trip.description"
                        class="text-color line-height-3 whitespace-pre-wrap"
                        >{{ trip.description }}</span
                    >
                </div>
            </div>
            <div
                class="col-12 lg:col-4 flex align-items-start lg:justify-content-end hide-when-empty"
            >
                <slot name="actions" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{
    trip: Trip | TripShare;
}>();
const formattedDate = computed(() => dataUtils.formatTripDate(props.trip));
const days = computed(() => dataUtils.getTripDays(props.trip));
const mobileBannerImage = computed(() =>
    dataUtils.getTripBannerImageUrl(props.trip, 'sm'),
);
const desktopBannerImage = computed(() =>
    dataUtils.getTripBannerImageUrl(props.trip),
);
</script>

<style lang="scss">
@import '~/assets/theme/primeflex/core/_variables.scss';
@import '~/assets/theme/_eg-colors.scss';

.trip-header {
    &__banner {
        margin: calc(-1 * var(--page-container-padding));
        margin-bottom: 0;
        @media (min-width: $lg) {
            margin: 0;
        }
    }
    &__banner-image {
        &,
        & > img {
            aspect-ratio: 2 / 1;
            @media (min-width: $lg) {
                aspect-ratio: 3 / 1;
            }
        }
        > img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: center;
        }
    }
}

.trip-date {
    display: inline-block;
    font-size: 14px;
    color: $eg-c-text;
    background-color: $eg-c-gray-200;
    padding: 2px 4px;
    border-radius: 2px;
}
</style>
