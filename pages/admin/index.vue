<template>
    <h1 class="text-2xl mt-0">總覽</h1>
    <div class="bg-white border-1 border-200 border-round-md p-5">
        <p class="m-0 text-color-secondary">統計資料尚未開放。</p>
    </div>
</template>

<script setup lang="ts">
definePageMeta({
    layout: 'admin',
    middleware: ['admin-guard'],
});
useSeoMeta({ title: '總覽｜管理後台' });
</script>
