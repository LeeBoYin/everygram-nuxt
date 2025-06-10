<template>
    <InlineText
        v-if="formattedString"
        :text="formattedString"
        v-tooltip.bottom="{
            value: formatDateString(date),
            class: 'text-xs',
        }"
    />
</template>

<script lang="ts" setup>
const props = defineProps<{
    date: string;
}>();

const { formatAcquiredDate, formatDateString } = useLangUtils();
const formattedString = computed(() => {
    return props.date ? formatAcquiredDate(props.date) : null;
});
</script>
