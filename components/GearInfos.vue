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
import GearCategoryAvatar from './GearCategoryAvatar.vue';
import CategoryLabel from './CategoryLabel.vue';
import GearWeightTag from './GearWeightTag.vue';
import GearUsedCountInfo from './GearUsedCountInfo.vue';
import GearAgeInfo from './GearAgeInfo.vue';
import ArchivedGearTag from './ArchivedGearTag.vue';
import InlineText from './InlineText.vue';

type GearInfo =
    | 'category-avatar'
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

const { formatPrice } = useLangUtils();
const { isLargeScreen } = useDeviceMeta();
const userTripsStore = useUserTripsStore();
const { trips } = storeToRefs(userTripsStore);

function getInfoComponent(
    gear: Gear,
    info: GearInfo,
): { component: Component; props?: Record<string, any> } | null {
    switch (info) {
        case 'category-avatar':
            return {
                component: GearCategoryAvatar,
                props: {
                    category: gear.category,
                    size: 'small',
                },
            };
        case 'category':
            return {
                component: CategoryLabel,
                props: { category: gear.category },
            };
        case 'weight':
            return {
                component: GearWeightTag,
                props: {
                    weight: gear.weight,
                    size: isLargeScreen.value ? 'sm' : 'xs',
                },
            };
        case 'price':
            const formattedPrice =
                gear.currency && isNumber(gear.price)
                    ? formatPrice(gear.currency, gear.price)
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
            return gear.acquiredDate
                ? {
                      component: GearAgeInfo,
                      props: {
                          date: gear.acquiredDate,
                          class: isLargeScreen.value ? 'text-sm' : 'text-xs',
                      },
                  }
                : null;
        case 'usedCount':
            const usedCount = dataUtils.getGearUsedCount(gear, trips.value);
            return {
                component: GearUsedCountInfo,
                props: {
                    count: usedCount,
                    class: isLargeScreen.value ? 'text-sm' : 'text-xs',
                },
            };

        case 'archived':
            return gear.isArchived
                ? {
                      component: ArchivedGearTag,
                      props: {
                          gear,
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
        .map((info) => getInfoComponent(props.gear, info))
        .filter((infoComponent) => infoComponent !== null);
});
</script>
