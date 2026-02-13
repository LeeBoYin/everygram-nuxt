<template>
    <div
        ref="container"
        class="border-round-lg overflow-hidden"
        :style="{ aspectRatio: props.ratio }"
    >
        <WeightTreeMap
            v-if="isMounted"
            :items="backpackWeightItems"
            :width="width"
            :height="height"
            :class="['trip-weight-tree-map', 'bg-white']"
        >
            <template #node="{ item }">
                <div
                    :class="[
                        'absolute top-0 left-0 w-full h-full',
                        'border-1 border-solid border-white overflow-hidden',
                    ]"
                >
                    <!-- img -->
                    <img
                        v-if="item.data && getGearPhotoUrl(item.data, 'sm')"
                        :src="getGearPhotoUrl(item.data, 'sm')"
                        :alt="item.data.name"
                        :class="[
                            'trip-weight-tree-map__gear-photo',
                            'cursor-pointer',
                        ]"
                        role="button"
                        @click="openGearCardDialog(item.data)"
                    />
                    <!-- category avatar -->
                    <div
                        v-else
                        class="flex absolute top-0 left-0 w-full h-full justify-content-center align-items-center"
                    >
                        <GearCategoryAvatar
                            :category="item.data.category"
                            size="small"
                            :style="{ backgroundColor: item.color }"
                        />
                    </div>
                    <!-- label -->
                    <!-- <div
                      :class="[
                          'text-xs absolute bottom-0 right-0 w-full bg-white p-1',
                          'flex justify-content-between align-items-center gap-1',
                          'overflow-hidden',
                      ]"
                  >
                      <div class="text-ellipsis">{{ item.label }}</div>
                      <div class="white-space-nowrap">
                          {{ formatWeight(item.weight) }}
                      </div>
                  </div> -->
                </div>
            </template>
        </WeightTreeMap>
    </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
    gears: GearWithQuantity[];
    wornGears: GearWithQuantity[];
    consumables: Consumable[];
    ratio: number;
}>();
const { gears, wornGears, consumables } = toRefs(props);
const container = ref<HTMLElement | null>(null);
const width = ref(0);
const height = ref(0);
const isMounted = ref(false);
const updateDimensions = () => {
    if (!container.value) return;
    width.value = container.value.offsetWidth;
    height.value = width.value / props.ratio;
};
onMounted(() => {
    if (!container.value) return;
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    isMounted.value = true;
});
onBeforeUnmount(() => {
    window.removeEventListener('resize', updateDimensions);
});

const { gearsByCategory, gearWeightByCategory } = useTripWeightData({
    gearsRef: gears,
    wornGearsRef: wornGears,
    consumablesRef: consumables,
});
const i18n = useI18n();
const { formatWeight } = useLangUtils();
const { openGearCardDialog } = useGearCardDialog();
const { getGearPhotoUrl } = dataUtils;
const { gearCategoryToLabel, consumableCategoryToLabel } = useLangUtils();

// const consumablesWeightItems = computed<WeightTreeMapItem[]>(() =>
//     _orderBy(
//         Object.entries(consumableWeightByCategory.value).map(
//             ([category, weight]) => ({
//                 label: consumableCategoryToLabel(
//                     category as ConsumableCategory,
//                 ),
//                 weight,
//                 value: weight,
//                 color: constants.COLORS.CONSUMABLES_WEIGHT,
//                 children: _orderBy(
//                     consumablesByCategory.value[
//                         category as ConsumableCategory
//                     ]?.map((consumable) => ({
//                         label: consumable.name,
//                         weight: consumable.weight,
//                         value: consumable.weight,
//                         color: constants.COLORS.CONSUMABLES_WEIGHT,
//                     })),
//                     'value',
//                     'desc',
//                 ),
//             }),
//         ),
//         'value',
//         'desc',
//     ),
// );
const backpackWeightItems = computed<WeightTreeMapItem<Gear>[]>(() =>
    _slice(
        _orderBy(
            [
                ...Object.entries(gearWeightByCategory.value).map(
                    ([category, weight]) => ({
                        label: gearCategoryToLabel(category as GearCategory),
                        weight,
                        value: weight,
                        color: constants.GEAR_CATEGORIES[
                            category as GearCategory
                        ].color,
                        children:
                            _orderBy(
                                gearsByCategory.value[category as GearCategory]
                                    ?.filter((gear) =>
                                        dataUtils.getGearPhotoUrl(gear),
                                    )
                                    .map((gear) => ({
                                        label: gear.name,
                                        weight: gear.weight,
                                        value: gear.weight,
                                        data: gear,
                                        color: constants.GEAR_CATEGORIES[
                                            category as GearCategory
                                        ].color,
                                    })),
                                'value',
                                'desc',
                            ) || [],
                    }),
                ),
                // ...consumablesWeightItems.value,
            ],
            'value',
            'desc',
        ),
        0,
        10,
    ),
);
</script>

<style lang="scss">
.trip-weight-tree-map {
    &__gear-photo {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.1s ease-out;
        &:hover {
            transform: scale(1.1);
        }
    }
}
</style>
