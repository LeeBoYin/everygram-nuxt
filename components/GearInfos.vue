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

const { formatWeight, formatPrice, formatDateString, formatAge } =
    useLangUtils();

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
            const formattedWeight = formatWeight(props.gear.weight);
            return formattedWeight
                ? {
                      component: InlineText,
                      props: { text: formattedWeight },
                  }
                : null;
        case 'price':
            const formattedPrice =
                props.gear.currency && isNumber(props.gear.price)
                    ? formatPrice(props.gear.currency, props.gear.price)
                    : null;
            return formattedPrice
                ? {
                      component: InlineText,
                      props: { text: formattedPrice },
                  }
                : null;
        case 'acquiredDate':
            const formattedDate = props.gear.acquiredDate
                ? formatDateString(props.gear.acquiredDate)
                : null;
            return formattedDate
                ? {
                      component: InlineText,
                      props: { text: formattedDate },
                  }
                : null;
        case 'age':
            const formattedAge = props.gear.acquiredDate
                ? formatAge(props.gear.acquiredDate)
                : null;
            return formattedAge
                ? {
                      component: InlineText,
                      props: { text: formattedAge },
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
