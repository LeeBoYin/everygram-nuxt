<template>
    <div
        class="gear-used-count-info inline-flex align-items-center gap-1"
        v-tooltip.bottom="{
            value: $t('INFO_GEAR_USED_COUNT', { count }, count),
            class: 'text-xs',
        }"
    >
        <span class="gear-used-count-info__icon material-symbols-outlined"
            >landscape</span
        >
        <span>{{ count }}</span>
    </div>
</template>

<script lang="ts" setup>
defineProps<{
    count: number;
}>();
</script>

<style lang="scss">
.gear-used-count-info {
    &__icon {
        font-size: 1.5em;
    }
}
</style>
