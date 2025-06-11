<template>
    <div
        class="gear-infos flex align-items-center justify-content-between gap-2"
    >
        <template v-for="(infoComponent, index) in infoComponents" :key="index">
            <VerticalSeparatorLine v-if="index > 0" />
            <component
                :is="infoComponent['component']"
                v-bind="infoComponent['props']"
            />
        </template>
    </div>
</template>

<script lang="ts" setup>
import type { Component } from 'vue';
import CategoryLabel from './CategoryLabel.vue';
import GearWeightTag from './GearWeightTag.vue';
import GearUsedCountInfo from './GearUsedCountInfo.vue';
import GearAgeInfo from './GearAgeInfo.vue';
import ArchivedGearTag from './ArchivedGearTag.vue';
import InlineText from './InlineText.vue';

type GearInfo =
    | 'category'
    | 'weight'
    | 'price'
    | 'age'
    | 'usedCount'
    | 'archived';

const props = defineProps<{
    gear: Gear;
    infos: GearInfo[];
}>();

const { formatPrice, formatDateString, formatAcquiredDate } = useLangUtils();
const { isLargeScreen } = useDeviceMeta();
const userTripsStore = useUserTripsStore();
const { trips } = storeToRefs(userTripsStore);

function getInfoComponent(
    info: GearInfo,
): { component: Component; props?: Record<string, any> } | null {
    switch (info) {
        case 'category':
            return {
                component: CategoryLabel,
                props: { category: props.gear.category },
            };
        case 'weight':
            return {
                component: GearWeightTag,
                props: {
                    weight: props.gear.weight,
                    size: isLargeScreen.value ? 'sm' : 'xs',
                },
            };
        case 'price':
            const formattedPrice =
                props.gear.currency && isNumber(props.gear.price)
                    ? formatPrice(props.gear.currency, props.gear.price)
                    : null;
            return formattedPrice
                ? {
                      component: InlineText,
                      props: {
                          text: formattedPrice,
                          class: isLargeScreen.value ? 'text-sm' : 'text-xs',
                      },
                  }
                : null;
        case 'age':
            return props.gear.acquiredDate
                ? {
                      component: GearAgeInfo,
                      props: {
                          date: props.gear.acquiredDate,
                          class: isLargeScreen.value ? 'text-sm' : 'text-xs',
                      },
                  }
                : null;
        case 'usedCount':
            const usedCount = dataUtils.getGearUsedCount(
                props.gear,
                trips.value,
            );
            return {
                component: GearUsedCountInfo,
                props: {
                    count: usedCount,
                    class: isLargeScreen.value ? 'text-sm' : 'text-xs',
                },
            };

        case 'archived':
            return props.gear.isArchived
                ? {
                      component: ArchivedGearTag,
                      props: {
                          gear: props.gear,
                          size: isLargeScreen.value ? 'sm' : 'xs',
                      },
                  }
                : null;

        default:
            return null;
    }
}

const infoComponents = computed(() => {
    return props.infos
        .map((info) => getInfoComponent(info))
        .filter((infoComponent) => infoComponent !== null);
});
</script>
