<template>
    <div class="grid">
        <div v-for="gear in sortedGears" :key="gear.id" class="col-12 md:col-6">
            <slot name="gear-card" :gear="gear"></slot>
        </div>
    </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
    gears: Gear[];
}>();

const sortedGears = computed(() =>
    dataUtils.getWeightSortedItems<Gear>(props.gears),
);
</script>
