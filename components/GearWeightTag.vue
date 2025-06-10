<template>
    <PrimeTag :class="['gear-weight-tag cursor-default', `text-${size}`]">
        {{ formattedWeight }}
    </PrimeTag>
</template>

<script setup lang="ts">
const props = defineProps<{
    weight: number;
    size?: 'xs' | 'sm' | 'base';
}>();
const { formatWeight } = useLangUtils();
const formattedWeight = formatWeight(props.weight);
</script>

<style lang="scss">
.gear-weight-tag {
    font-weight: normal;
    background-color: var(--surface-100);
    color: var(--text-color);
}
</style>
