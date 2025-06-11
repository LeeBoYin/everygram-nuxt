<template>
    <PrimeDataTable
        :value="sortedGears"
        dataKey="id"
        class="p-datatable-hide-thead p-datatable-left-no-padding"
    >
        <!-- photo -->
        <PrimeColumn field="photo" :header="$t('LABEL_PHOTO')" class="w-3rem">
            <template #body="{ data }">
                <GearPhoto
                    :gear="data"
                    :readonly="!editable"
                    :size="isLargeScreen ? 'sm' : 'xs'"
                />
            </template>
        </PrimeColumn>

        <!-- name, brand, description, extra info -->
        <PrimeColumn field="name" :header="$t('LABEL_NAME')">
            <template #body="{ data }">
                <GearNameWithBrand
                    :gear="data"
                    :size="isLargeScreen ? 'lg' : 'md'"
                >
                    <template v-if="editable" #extra-info>
                        <NotInGearsIcon v-if="data.isForOneTrip" />
                        <ArchivedGearTag
                            v-if="data.isArchived"
                            :gear="data"
                            size="xs"
                        />
                    </template>
                </GearNameWithBrand>
            </template>
        </PrimeColumn>

        <!-- weight & quantity -->
        <PrimeColumn class="text-right white-space-nowrap text-sm lg:text-base">
            <template #body="{ data }">
                <div class="flex flex-column gap-1 lg:gap-2">
                    <div>
                        {{ data.weight ? formatWeight(data.weight) : '-' }}
                    </div>
                    <div
                        v-if="hasQuantity && data.quantity > 1"
                        class="text-color-light"
                    >
                        x {{ data.quantity }}
                    </div>
                </div>
            </template>
        </PrimeColumn>

        <!-- actions -->
        <PrimeColumn
            v-if="editable && actions"
            :exportable="false"
            class="w-1rem px-0 lg:pl-2"
        >
            <template #body="{ data }">
                <GearActionsMenuButton
                    :actions="actions"
                    :gear="data"
                    :has-quantity="hasQuantity"
                    @gear-edit="(gear) => emit('gear-edit', gear)"
                    @gear-edit-quantity="
                        (gear) => emit('gear-edit-quantity', gear)
                    "
                    @gear-add-to-gears="
                        (gear) => emit('gear-add-to-gears', gear)
                    "
                    @gear-archive="(gear) => emit('gear-archive', gear)"
                    @gear-delete="(gear) => emit('gear-delete', gear)"
                    @gear-remove="(gear) => emit('gear-remove', gear)"
                />
            </template>
        </PrimeColumn>
    </PrimeDataTable>
</template>

<script setup lang="ts">
const props = defineProps<{
    gears?: (Gear & { quantity?: number })[];
    hasQuantity?: boolean;
    actions?: GearAction[];
    editable?: boolean;
}>();

const sortedGears = computed(() =>
    dataUtils.getWeightSortedItems<Gear>(props.gears || []),
);

const emit = defineEmits<{
    'gear-edit': [gear: Gear];
    'gear-edit-quantity': [gear: GearWithQuantity];
    'gear-add-to-gears': [gear: Gear];
    'gear-archive': [gear: Gear];
    'gear-delete': [gear: Gear];
    'gear-remove': [gear: Gear];
}>();

const { formatWeight } = useLangUtils();
const { isLargeScreen } = useDeviceMeta();
</script>
