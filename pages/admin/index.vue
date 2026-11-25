<template>
    <h1 class="text-2xl mt-0">總覽</h1>
    <AdminStatsState v-slot="{ stats, previous }">
        <AdminOverview :stats="stats" :previous="previous" />
    </AdminStatsState>
</template>

<script setup lang="ts">
definePageMeta({
    layout: 'admin',
    middleware: ['admin-guard'],
});
useSeoMeta({ title: '總覽｜管理後台' });
</script>
