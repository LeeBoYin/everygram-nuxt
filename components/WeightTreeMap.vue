<template>
    <div
        class="relative"
        :style="{ width: `${props.width}px`, height: `${props.height}px` }"
    >
        <div
            v-for="(item, index) in treeMapItems"
            :key="index"
            class="absolute"
            :style="{
                left: `${item.x0}px`,
                top: `${item.y0}px`,
                width: `${item.x1 - item.x0}px`,
                height: `${item.y1 - item.y0}px`,
            }"
        >
            <slot name="node" :item="item"></slot>
        </div>
    </div>
</template>

<script lang="ts" setup>
import squarify from 'squarify';

type TreeMapItem = {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    value: number;
    normalizedValue: number;
} & WeightTreeMapItem<any>;

const props = defineProps<{
    items: WeightTreeMapItem<any>[];
    width: number;
    height: number;
}>();
const treeMapItems = ref<TreeMapItem[]>([]);
const updateTreeMapItems = () => {
    const container = { x0: 0, y0: 0, x1: props.width, y1: props.height };
    treeMapItems.value = squarify(props.items, container);
};

onMounted(updateTreeMapItems);
// watch items, width, and height to update treeMapItems
watch(
    [() => props.items, () => props.width, () => props.height],
    updateTreeMapItems,
);
</script>

<style></style>
