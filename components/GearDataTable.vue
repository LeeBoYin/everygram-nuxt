<template>
    <PrimeDataTable
        :value="sortedGears"
        dataKey="id"
        :edit-mode="props.readonly ? undefined : 'cell'"
        @cell-edit-complete="(e: any) => emit('gear-cell-edit-complete', e)"
        class="p-datatable-hide-thead p-datatable-left-no-padding"
    >
        <!-- desktop -->
        <PrimeColumn field="photo" :header="$t('LABEL_PHOTO')" class="w-3rem">
            <template #body="{ data }">
                <GearPhoto
                    class="w-3rem h-3rem lg:w-4rem lg:h-4rem"
                    :gear="data"
                    :readonly="props.readonly"
                />
            </template>
        </PrimeColumn>
        <PrimeColumn
            field="name"
            :header="$t('LABEL_NAME')"
            :class="['hide-in-mobile', { 'hover:surface-50': !props.readonly }]"
        >
            <template #body="{ data }">
                <GearNameWithBrand :gear="data">
                    <template #extra-info>
                        <NotInGearsIcon
                            v-if="!props.readonly && data.isForOneTrip"
                        />
                        <ArchivedGearTag
                            v-if="!props.readonly && data.isArchived"
                            :gear="data"
                        />
                    </template>
                </GearNameWithBrand>
            </template>
            <template #editor="{ data, field }">
                <PrimeInputText
                    v-model="data[field]"
                    :minlength="constants.LIMIT.minNameLength"
                    :maxlength="constants.LIMIT.maxNameLength"
                    class="w-full"
                />
            </template>
        </PrimeColumn>
        <PrimeColumn
            field="weight"
            :header="$t('LABEL_WEIGHT')"
            :class="[
                'text-right white-space-nowrap w-8rem hide-in-mobile',
                { 'hover:surface-50': !props.readonly },
            ]"
        >
            <template #body="{ data }">
                {{ data.weight ? formatWeight(data.weight) : '-' }}
            </template>
            <template #editor="{ data, field }">
                <PrimeInputGroup class="w-7rem">
                    <PrimeInputNumber
                        v-model="data[field]"
                        :maxFractionDigits="constants.LIMIT.maxFractionDigits"
                        :min="constants.LIMIT.minWeight"
                        :max="constants.LIMIT.maxWeight"
                        class="text-right"
                    />
                    <WeightUnitAddon />
                </PrimeInputGroup>
            </template>
        </PrimeColumn>
        <PrimeColumn
            v-if="hasQuantity"
            field="quantity"
            :header="$t('LABEL_QUANTITY')"
            :class="[
                'text-right w-4rem hide-in-mobile',
                { 'hover:surface-50': !props.readonly },
            ]"
        >
            <template #body="{ data }"> x {{ data.quantity }} </template>
            <template #editor="{ data, field }">
                <PrimeInputNumber
                    v-model="data[field]"
                    :min="constants.LIMIT.minQuantity"
                    :max="constants.LIMIT.maxQuantity"
                    class="w-3rem text-right"
                />
            </template>
        </PrimeColumn>

        <!-- mobile -->
        <PrimeColumn field="name" :header="$t('LABEL_NAME')" class="lg:hidden">
            <template #body="{ data }">
                <GearNameWithBrand :gear="data">
                    <template #extra-info>
                        <NotInGearsIcon
                            v-if="!props.readonly && data.isForOneTrip"
                        />
                        <ArchivedGearTag
                            v-if="!props.readonly && data.isArchived"
                            :gear="data"
                        />
                    </template>
                </GearNameWithBrand>
            </template>
        </PrimeColumn>
        <PrimeColumn class="text-right white-space-nowrap text-sm lg:hidden">
            <template #body="{ data }">
                {{ data.weight ? formatWeight(data.weight) : '-' }}
                <template v-if="hasQuantity && data.quantity > 1">
                    x {{ data.quantity }}
                </template>
            </template>
        </PrimeColumn>

        <!-- actions -->
        <PrimeColumn
            v-if="!props.readonly && actions"
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
    readonly?: boolean;
}>();

const sortedGears = computed(() =>
    dataUtils.getWeightSortedItems<Gear>(props.gears || []),
);

const emit = defineEmits<{
    'gear-cell-edit-complete': [
        {
            data: Gear;
            newValue: any;
            field: string;
        },
    ];
    'gear-edit': [gear: Gear];
    'gear-edit-quantity': [gear: GearWithQuantity];
    'gear-add-to-gears': [gear: Gear];
    'gear-archive': [gear: Gear];
    'gear-delete': [gear: Gear];
    'gear-remove': [gear: Gear];
}>();

const { formatWeight } = useLangUtils();
</script>
