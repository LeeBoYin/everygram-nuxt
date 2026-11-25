<template>
    <slot v-if="latest" :stats="latest" :previous="previous" />
    <div
        v-else
        class="bg-white border-1 border-200 border-round-md p-5 text-color-secondary"
    >
        {{ isLoading ? '讀取中…' : '還沒有統計資料，請按「重新計算」。' }}
    </div>
</template>

<script setup lang="ts">
// renders its slot once the latest stats are available
const { latest, previous, isLoading } = useAdminStats();
</script>
