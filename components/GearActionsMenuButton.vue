<template>
    <MoreActionsMenuButton
        text
        size="small"
        :items="
            _filter([
                props.actions.includes('edit') && {
                    icon: 'pi pi-pencil',
                    label: $t('ACTION_EDIT'),
                    command: () => emit('gear-edit', props.gear),
                },
                props.actions.includes('edit-qty') &&
                    props.hasQuantity && {
                        icon: 'pi pi-sort',
                        label: $t('ACTION_EDIT_QUANTITY'),
                        command: () =>
                            emit(
                                'gear-edit-quantity',
                                props.gear as GearWithQuantity,
                            ),
                    },
                props.actions.includes('add-to-gears') &&
                    props.gear.isForOneTrip && {
                        icon: 'pi pi-plus',
                        label: $t('ACTION_ADD_TO_GEARS'),
                        command: () => emit('gear-add-to-gears', props.gear),
                    },
                props.actions.includes('edit-archive') && {
                    icon: 'pi pi-box',
                    label: $t('ACTION_EDIT_ARCHIVE_DATA'),
                    command: () => emit('gear-edit-archive', props.gear),
                },
                props.actions.includes('archive') && {
                    icon: 'pi pi-box',
                    label: $t('ACTION_ARCHIVE'),
                    command: () => emit('gear-archive', props.gear),
                },
                props.actions.includes('unarchive') && {
                    icon: 'pi pi-times',
                    label: $t('ACTION_UNARCHIVE'),
                    command: () => emit('gear-unarchive', props.gear),
                },
                props.actions.includes('remove') && {
                    icon: 'pi pi-times',
                    label: $t('ACTION_REMOVE_FROM_TRIP'),
                    command: () => emit('gear-remove', props.gear),
                },
                props.actions.includes('delete') && {
                    icon: 'pi pi-trash',
                    label: $t('ACTION_DELETE'),
                    command: () => emit('gear-delete', props.gear),
                },
            ]) as MenuItem[]
        "
    />
</template>

<script lang="ts" setup>
import { filter as _filter } from 'lodash-es';
import type { MenuItem } from 'primevue/menuitem';

const props = defineProps<{
    actions: GearAction[];
    gear: Gear & { quantity?: number };
    hasQuantity?: boolean;
}>();

const emit = defineEmits<{
    'gear-edit': [gear: Gear];
    'gear-edit-archive': [gear: Gear];
    'gear-edit-quantity': [gear: GearWithQuantity];
    'gear-add-to-gears': [gear: Gear];
    'gear-archive': [gear: Gear];
    'gear-unarchive': [gear: Gear];
    'gear-delete': [gear: Gear];
    'gear-remove': [gear: Gear];
}>();
</script>
