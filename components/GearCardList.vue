<template>
    <div class="gear-card-list">
        <div v-for="gear in sortedGears" :key="gear.id">
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

<style lang="scss">
@import '~/assets/theme/primeflex/core/_variables.scss';

.gear-card-list {
    display: grid;
    gap: 0.75rem;
    @media (min-width: $lg) {
        grid-template-columns: repeat(auto-fill, minmax(375px, 1fr));
        gap: 1rem;
    }
}
</style>
