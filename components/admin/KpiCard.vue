<template>
    <div class="bg-white border-1 border-200 border-round-md p-3">
        <div class="text-sm text-color-secondary">{{ label }}</div>
        <div class="text-3xl font-bold mt-2">{{ value }}</div>
        <div v-if="detail" class="text-sm mt-2">{{ detail }}</div>
        <div v-if="change" class="text-sm text-color-secondary mt-2">
            比上月 {{ change }}
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    label: string;
    value: string;
    detail?: string;
    change?: string;
}>();
</script>
