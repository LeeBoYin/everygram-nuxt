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
import InlineText from './InlineText.vue';

type GearInfo =
    | 'category'
    | 'weight'
    | 'price'
    | 'acquiredDate'
    | 'age'
    | 'usedCount';

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
                    size: isLargeScreen.value ? 'base' : 'xs',
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
                          class: isLargeScreen.value ? 'text-base' : 'text-xs',
                      },
                  }
                : null;
        case 'acquiredDate':
            const formattedDate = props.gear.acquiredDate
                ? formatDateString(props.gear.acquiredDate)
                : null;
            return formattedDate
                ? {
                      component: InlineText,
                      props: {
                          text: formattedDate,
                          class: isLargeScreen.value ? 'text-base' : 'text-xs',
                      },
                  }
                : null;
        case 'age':
            const formattedAge = props.gear.acquiredDate
                ? formatAcquiredDate(props.gear.acquiredDate)
                : null;
            return formattedAge
                ? {
                      component: InlineText,
                      props: {
                          text: formattedAge,
                          class: isLargeScreen.value ? 'text-base' : 'text-xs',
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
                    class: isLargeScreen.value ? 'text-base' : 'text-xs',
                },
            };

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
