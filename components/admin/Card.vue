<template>
    <section class="bg-white border-1 border-200 border-round-md p-3">
        <h2 class="text-lg mt-0 mb-3">{{ title }}</h2>
        <slot />
    </section>
</template>

<script setup lang="ts">
defineProps<{ title: string }>();
</script>
