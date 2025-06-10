<template>
    <div class="flex flex-row flex-wrap gap-1 justify-content-end">
        <PrimeButton
            v-for="(action, index) in props.actions"
            :key="index"
            :icon="action.icon"
            rounded
            :severity="severity"
            :outlined="outlined"
            :text="text"
            :raised="raised"
            :size="size === 'medium' ? undefined : size"
            :label="type === 'text' ? action.label : undefined"
            :aria-label="action.label"
            v-tooltip.top="
                type === 'icon' && {
                    value: action.label,
                }
            "
            @click="action.onClick"
        />
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{
    actions: {
        icon?: string;
        label: string;
        onClick: () => void;
    }[];
    type: 'icon' | 'text';
    text?: boolean;
    outlined?: boolean;
    raised?: boolean;
    severity?: string;
    size?: 'small' | 'medium' | 'large';
}>();
</script>
