<template>
    <PrimeDataTable
        :value="sortedGears"
        dataKey="id"
        edit-mode="cell"
        @cell-edit-complete="(e) => emit('gear-cell-edit-complete', e)"
        class="p-datatable-hide-thead p-datatable-left-no-padding"
    >
        <!-- desktop -->
        <PrimeColumn field="photo" :header="$t('LABEL_PHOTO')" class="w-3rem">
            <template #body="{ data }">
                <GearPhoto
                    :gear="data"
                    clickToUpload
                    :size="isLargeScreen ? 'sm' : 'xs'"
                />
            </template>
        </PrimeColumn>
        <PrimeColumn
            field="name"
            :header="$t('LABEL_NAME')"
            :class="['hover:surface-50']"
        >
            <template #body="{ data }">
                <GearNameWithBrand :gear="data">
                    <template #extra-info>
                        <NotInGearsIcon v-if="data.isForOneTrip" />
                        <ArchivedGearTag
                            v-if="data.isArchived"
                            :gear="data"
                            size="xs"
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
            :class="['text-right white-space-nowrap w-8rem hover:surface-50']"
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
    </PrimeDataTable>
</template>

<script setup lang="ts">
const props = defineProps<{
    gears: Gear[];
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
}>();

const { formatWeight } = useLangUtils();
const { isLargeScreen } = useDeviceMeta();
</script>
