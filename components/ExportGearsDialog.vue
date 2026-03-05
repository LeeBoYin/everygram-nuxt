<template>
    <PrimeDialog
        ref="exportGearsDialog"
        :header="$t('Export Gears to CSV File')"
        :visible="isOpen"
        modal
        @update:visible="emit('close')"
        :pt="{
            content: {
                class: {
                    'p-2': true,
                },
            },
        }"
    >
        <div class="flex flex-column gap-3">
            <h3>
                {{ $t('Export Gears Preview', { num: gears.length }) }}
            </h3>

            <GearSelectDataTable
                v-if="gears.length"
                :selectableGears="gears"
                :selectedIndices="selectedIndices"
                dataKey="name"
                :additionalFields="[
                    'description',
                    'currency',
                    'price',
                    'acquiredDate',
                ]"
                @update="(indices) => (selectedIndices = indices)"
            />
        </div>

        <template #footer>
            <div class="flex w-full justify-content-between">
                <PrimeButton
                    :label="$t('ACTION_CANCEL')"
                    outlined
                    rounded
                    @click="emit('close')"
                />

                <PrimeButton
                    :label="
                        $t(
                            'ACTION_EXPORT_NUM_GEARS',
                            { num: selectedIndices.length },
                            selectedIndices.length,
                        )
                    "
                    icon="pi pi-download"
                    rounded
                    :disabled="!selectedIndices.length"
                    @click="onExport"
                />
            </div>
        </template>
    </PrimeDialog>
</template>

<script setup lang="ts">
const props = defineProps<{
    isOpen: boolean;
}>();
const emit = defineEmits<{
    close: [];
}>();
const userGearsStore = useUserGearsStore();
const gears = computed(() => userGearsStore.gears || []);
const selectedIndices = ref<number[]>([]);

watch(
    () => props.isOpen,
    (isOpen) => {
        if (isOpen) {
            selectedIndices.value = _range(0, gears.value.length);
        }
    },
);

function generateCsvContent(rows: string[][]) {
    return rows.map((r) => r.join(',')).join('\n');
}

function onExport() {
    const selectedGears = selectedIndices.value.map((i) => gears.value[i]);

    const header = [
        'name',
        'weight',
        'category',
        'description',
        'currency',
        'price',
        'acquiredDate',
    ];

    const rows = selectedGears.map((g) => [
        String(g.name ?? ''),
        String(g.weight ?? ''),
        String(g.category ?? ''),
        String(g.description ?? ''),
        String(g.currency ?? ''),
        String(g.price ?? ''),
        String(g.acquiredDate ?? ''),
    ]);

    const csv = generateCsvContent([header, ...rows]);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'gears_export.csv';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}
</script>
