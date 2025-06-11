<template>
    <div
        :class="[
            'gear-card-horizontal',
            'flex flex-column bg-white border-round-md shadow-1',
            'p-2 lg:p-3',
            'gap-2',
        ]"
    >
        <div class="flex align-items-start justify-content-between">
            <GearLabel :gear="gear" :size="isLargeScreen ? 'lg' : 'md'" />
            <GearActionsMenuButton
                :gear="gear"
                :actions="actionItems"
                @gear-edit="$emit('gear-edit', $event)"
                @gear-edit-archive="$emit('gear-edit-archive', $event)"
                @gear-edit-quantity="$emit('gear-edit-quantity', $event)"
                @gear-add-to-gears="$emit('gear-add-to-gears', $event)"
                @gear-archive="$emit('gear-archive', $event)"
                @gear-unarchive="$emit('gear-unarchive', $event)"
                @gear-delete="$emit('gear-delete', $event)"
                @gear-remove="$emit('gear-remove', $event)"
                class="gear-card-horizontal__actions"
            />
        </div>
        <div class="flex align-items-center justify-content-between gap-2">
            <slot name="info-left"></slot>
            <slot name="info-right"></slot>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    gear: Gear;
    actionItems: GearAction[];
}>();

defineEmits<{
    'gear-edit': [gear: Gear];
    'gear-edit-archive': [gear: Gear];
    'gear-edit-quantity': [gear: GearWithQuantity];
    'gear-add-to-gears': [gear: Gear];
    'gear-archive': [gear: Gear];
    'gear-unarchive': [gear: Gear];
    'gear-delete': [gear: Gear];
    'gear-remove': [gear: Gear];
}>();

const { isLargeScreen } = useDeviceMeta();
</script>

<style lang="scss">
@import '~/assets/theme/primeflex/core/_variables.scss';
.gear-card-horizontal {
    &__actions {
        position: relative;
        top: -0.25rem;
        right: -0.25rem;
        @media (min-width: $lg) {
            top: -0.5rem;
            right: -0.5rem;
        }
    }
}
</style>
