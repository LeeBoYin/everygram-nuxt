<template>
    <PrimeTag
        :class="['archived-gear-tag', size && `text-${size}`]"
        v-tooltip.bottom="
            gear.archiveNote
                ? {
                      value: gear.archiveNote,
                      class: 'text-xs',
                  }
                : null
        "
    >
        {{
            !gear.archiveReason ||
            gear.archiveReason === constants.GEAR_ARCHIVE_REASONS.OTHER
                ? $t('INFO_GEAR_ARCHIVED')
                : $t(
                      `LABEL_ARCHIVE_REASON_${gear.archiveReason?.toUpperCase()}`,
                  )
        }}
    </PrimeTag>
</template>

<script setup lang="ts">
const props = defineProps<{
    gear: Gear;
    size?: 'xs' | 'sm' | 'base';
}>();
</script>

<style lang="scss">
.archived-gear-tag {
    font-weight: normal;
    background-color: var(--surface-200);
    color: var(--text-color-light);
}
</style>
