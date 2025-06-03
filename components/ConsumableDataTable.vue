<template>
    <PrimeDataTable
        :value="sortedConsumables"
        dataKey="id"
        class="p-datatable-hide-thead"
    >
        <!-- name -->
        <PrimeColumn field="name" :header="$t('LABEL_NAME')" />

        <!-- weight -->
        <PrimeColumn
            field="weight"
            :header="$t('LABEL_WEIGHT')"
            class="text-right white-space-nowrap"
        >
            <template #body="{ data }">
                {{ data.weight ? formatWeight(data.weight) : '-' }}
            </template>
        </PrimeColumn>

        <!-- actions -->
        <PrimeColumn
            v-if="editable"
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
    editable?: boolean;
}>();

const sortedConsumables = computed(() =>
    dataUtils.getWeightSortedItems<Consumable>(props.consumables || []),
);

const emit = defineEmits<{
    'consumable-edit': [consumable: Consumable];
    'consumable-delete': [consumable: Consumable];
}>();

const { formatWeight } = useLangUtils();
</script>
