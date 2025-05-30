<template>
    <PageLoading v-if="isFetchingGears" />
    <div v-else-if="visibleGears.length" class="grid">
        <div class="col-12 lg:col-10 lg:col-offset-1">
            <div class="flex flex-column gap-2 lg:gap-3">
                <h1>⚠️ Working in Progress ⚠️</h1>
                <SectionPanel
                    v-for="category in displayGearCatergories"
                    :id="`category-section-${category}`"
                    :key="category"
                    :class="{
                        'opacity-50': !gearsGroupByCategory[category],
                    }"
                    style="scroll-margin-top: var(--app-header-height)"
                >
                    <template #header>
                        <CategoryHeader
                            :category="category"
                            class="p-3 border-round-md"
                            sticky
                            sticky-theme="surface-glass"
                        />
                    </template>
                    <template v-if="gearsGroupByCategory[category]" #default>
                        <GearEditDataTable
                            :gears="visibleGears"
                            @gear-cell-edit-complete="onCellEditComplete"
                        />
                    </template>
                </SectionPanel>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
definePageMeta({
    middleware: ['auth-guard'],
    layout: 'sub-page',
});

// for display gears
const {
    visibleGears,
    isFetchingGears,
    gearsGroupByCategory,
    displayGearCatergories,
} = useDisplayGears();

const userGearsStore = useUserGearsStore();
const onCellEditComplete = async (e: {
    data: Gear;
    newValue: any;
    field: string;
}) => {
    const { data, newValue, field } = e;
    switch (field) {
        case 'name':
            await userGearsStore.updateGear({
                id: data.id,
                gearData: {
                    name: newValue,
                },
            });
            break;
        case 'weight':
            await userGearsStore.updateGear({
                id: data.id,
                gearData: {
                    weight: newValue,
                },
            });
            break;
        // TODO: handle other fields
    }
};
</script>
