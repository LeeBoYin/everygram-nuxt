<template>
    <PrimeDataTable
        :filters="filters"
        :globalFilterFields="['name', 'formattedBrand']"
        :selection="selectedGears"
        @update:selection="
            (newSelectedGears: T[]) => $emit('update', newSelectedGears)
        "
        selectionMode="multiple"
        :value="formattedGears"
        size="large"
        :dataKey="dataKey"
        class="select-none"
    >
        <PrimeColumn selectionMode="multiple" class="w-2rem" />
        <!-- hide photo on mobile due to limited space -->
        <PrimeColumn
            v-if="showPhoto && isLargeScreen"
            field="photo"
            :header="$t('LABEL_PHOTO')"
            class="w-3rem"
        >
            <template #body="{ data }">
                <GearPhoto
                    class="w-3rem h-3rem lg:w-4rem lg:h-4rem"
                    :gear="data"
                    readonly
                />
            </template>
        </PrimeColumn>
        <!-- name -->
        <PrimeColumn field="name" :header="$t('LABEL_NAME')">
            <template #body="{ data }">
                <GearNameWithBrand :gear="data" />
            </template>
        </PrimeColumn>
        <!-- weight -->
        <PrimeColumn
            field="formattedWeight"
            :header="$t('LABEL_WEIGHT')"
            class="text-right w-5rem"
        />
        <!-- desktop category -->
        <PrimeColumn
            v-if="isLargeScreen"
            field="category"
            :header="$t('LABEL_CATEGORY')"
            class="w-10rem"
        >
            <template #body="{ data }">
                <CategoryLabel :category="data.category" />
            </template>
        </PrimeColumn>
        <!-- mobile category -->
        <PrimeColumn v-else field="category" class="w-2rem">
            <template #body="{ data }">
                <GearCategoryAvatar :category="data.category" size="small" />
            </template>
        </PrimeColumn>
        <!-- addtional field: description -->
        <PrimeColumn
            v-if="addtionalFields?.includes('description')"
            field="description"
            :header="$t('LABEL_DESCRIPTION')"
        >
            <template #body="{ data }">
                <div class="w-10rem text-ellipsis">{{ data.description }}</div>
            </template>
        </PrimeColumn>
        <!-- addtional field: currency -->
        <PrimeColumn
            v-if="addtionalFields?.includes('currency')"
            field="currency"
            :header="$t('LABEL_CURRENCY')"
            class="white-space-nowrap"
        />
        <!-- addtional field: price -->
        <PrimeColumn
            v-if="addtionalFields?.includes('price')"
            field="price"
            :header="$t('LABEL_PRICE')"
            class="text-right white-space-nowrap"
        />
        <!-- addtional field: acquired date -->
        <PrimeColumn
            v-if="addtionalFields?.includes('acquiredDate')"
            field="acquiredDate"
            :header="$t('LABEL_ACQUIRED_DATE')"
            class="white-space-nowrap"
        />
    </PrimeDataTable>
</template>

<script
    setup
    lang="ts"
    generic="
        T extends {
            name: string;
            weight: number;
            category: GearCategory;
            brand?: GearBrand;
        }
    "
>
const props = defineProps<{
    selectableGears: T[];
    selectedGears: T[];
    dataKey: string;
    showPhoto?: boolean;
    filters?: Record<string, any>;
    addtionalFields?: (keyof Gear)[];
}>();
const emit = defineEmits<{
    update: [selectedGears: T[]];
}>();
const formattedGears = computed(() => {
    return props.selectableGears.map((gear) => ({
        ...gear,
        formattedBrand: gear.brand ? formatBrand(gear.brand) : '',
        formattedWeight: gear.weight ? formatWeight(gear.weight) : '-',
    }));
});
const { formatWeight, formatBrand } = useLangUtils();
const { isLargeScreen } = useDeviceMeta();
</script>
