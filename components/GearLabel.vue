<template>
    <div
        :class="[
            'flex align-items-center min-w-0',
            size === 'lg' ? 'gap-3' : 'gap-2',
        ]"
    >
        <GearPhoto
            class="flex-shrink-0"
            :gear="gear"
            readonly
            :size="size === 'lg' ? 'md' : 'sm'"
        />
        <GearNameWithBrand :gear="gear" :size="size" />
    </div>
</template>

<script setup lang="ts">
defineProps<{
    gear: Gear;
    size?: 'md' | 'lg';
}>();
</script>
