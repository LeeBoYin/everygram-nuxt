<template>
    <span>
        {{ text }}
    </span>
</template>

<script lang="ts" setup>
defineProps<{
    text: string;
}>();
</script>
