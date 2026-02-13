export const useTripWeightData = ({
    gearsRef,
    wornGearsRef,
    consumablesRef,
}: {
    gearsRef: Ref<GearWithQuantity[]>;
    wornGearsRef: Ref<GearWithQuantity[]>;
    consumablesRef: Ref<Consumable[]>;
}) => {
    // consumables
    const consumablesByCategory = computed(() =>
        dataUtils.groupConsumablesByCategory(consumablesRef.value),
    );
    const consumableWeightByCategory = computed(() =>
        _mapValues(consumablesByCategory.value, (consumables) =>
            _sumBy(consumables, dataUtils.getConsumableWeight),
        ),
    );
    const consumablesWeight = computed(() =>
        _sumBy(consumablesRef.value, dataUtils.getConsumableWeight),
    );

    // gears
    const gearsByCategory = computed(() =>
        dataUtils.groupGearsByCategory(gearsRef.value),
    );
    const gearWeightByCategory = computed(() =>
        _mapValues(gearsByCategory.value, (gears) =>
            _sumBy(gears, (gear) => (+gear.weight || 0) * gear.quantity),
        ),
    );
    const gearsWeight = computed(() =>
        _sumBy(gearsRef.value, (gear) => (+gear.weight || 0) * gear.quantity),
    );

    // backpack weight
    const backpackWeight = computed(
        () => gearsWeight.value + consumablesWeight.value,
    );

    // worn gears
    const wornGearsWeight = computed(() =>
        _sumBy(
            wornGearsRef.value,
            (gear) => (+gear.weight || 0) * gear.quantity,
        ),
    );

    return {
        gearsByCategory,
        gearWeightByCategory,
        gearsWeight,
        consumablesByCategory,
        consumableWeightByCategory,
        consumablesWeight,
        backpackWeight,
        wornGearsWeight,
    };
};
