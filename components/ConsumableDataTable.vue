<template>
    <PrimeDataTable
        :value="sortedConsumables"
        dataKey="id"
        :edit-mode="props.readonly ? undefined : 'cell'"
        @cell-edit-complete="(e) => emit('consumable-cell-edit-complete', e)"
        class="p-datatable-hide-thead"
    >
        <!-- desktop -->
        <PrimeColumn
            field="name"
            :header="$t('LABEL_NAME')"
            :class="['hide-in-mobile', { 'hover:surface-50': !props.readonly }]"
        >
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
                'text-right w-8rem white-space-nowrap hide-in-mobile',
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

        <!-- mobile -->
        <PrimeColumn
            field="name"
            :header="$t('LABEL_NAME')"
            class="lg:hidden"
        />
        <PrimeColumn
            field="weight"
            :header="$t('LABEL_WEIGHT')"
            class="text-right white-space-nowrap lg:hidden"
        >
            <template #body="{ data }">
                {{ data.weight ? formatWeight(data.weight) : '-' }}
            </template>
        </PrimeColumn>

        <PrimeColumn
            v-if="!props.readonly"
            :exportable="false"
            class="w-1rem px-0 lg:pl-2"
        >
            <template #body="{ data }">
                <MoreActionsMenuButton
                    text
                    size="small"
                    :items="[
                        {
                            icon: 'pi pi-pencil',
                            label: $t('ACTION_EDIT'),
                            command: () => {
                                emit('consumable-edit', data);
                            },
                        },
                        {
                            icon: 'pi pi-times',
                            label: $t('ACTION_DELETE'),
                            command: () => {
                                emit('consumable-delete', data);
                            },
                        },
                    ]"
                />
            </template>
        </PrimeColumn>
    </PrimeDataTable>
</template>

<script setup lang="ts">
const props = defineProps<{
    consumables?: Consumable[];
    readonly?: boolean;
}>();

const sortedConsumables = computed(() =>
    dataUtils.getWeightSortedItems<Consumable>(props.consumables || []),
);

const emit = defineEmits<{
    'consumable-edit': [consumable: Consumable];
    'consumable-delete': [consumable: Consumable];
    'consumable-cell-edit-complete': [
        {
            data: Consumable;
            newValue: any;
            field: string;
        },
    ];
}>();

const { formatWeight } = useLangUtils();
</script>
