<template>
    <div class="gear-name-with-brand flex flex-column min-w-0 gap-1">
        <!-- brand -->
        <div
            v-if="gear.brand"
            :class="[
                'text-color-light',
                'line-clamp-1', // text-ellipsis doesn't work in data table
                size === 'lg' ? 'text-xs lg:text-sm' : 'text-xs',
            ]"
        >
            {{ formatBrand(gear.brand) }}
        </div>
        <!-- name -->
        <div
            :class="[
                'gear-name-with-brand__name',
                'line-clamp-1',
                'text-sm lg:text-base',
            ]"
        >
            {{ gear.name }}
            <slot name="extra-info" />
        </div>
        <!-- description -->
        <div
            v-if="gear.description"
            :class="[
                'text-color-light line-clamp-2',
                size === 'lg' ? 'text-xs lg:text-sm' : 'text-xs',
            ]"
        >
            {{ gear.description }}
        </div>
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{
    gear: Gear;
    size?: 'md' | 'lg';
}>();
const { formatBrand } = useLangUtils();
</script>

<style lang="scss">
.gear-name-with-brand {
    // add a gap between name and extra-info
    &__name > :last-child {
        margin-left: 0.5rem;
    }
}
</style>
