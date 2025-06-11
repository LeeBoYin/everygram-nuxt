export default function () {
    const userGearsStore = useUserGearsStore();
    const { formatBrand } = useLangUtils();
    const { visibleGears, isFetchingGears } = storeToRefs(userGearsStore);

    const displayGears = computed(() =>
        isFiltered.value ? filteredGears.value : visibleGears.value,
    );
    const gearsGroupByCategory = computed(() =>
        dataUtils.groupGearsByCategory(displayGears.value),
    );
    const nonEmptyGearCatergories = computed(() =>
        constants.GEAR_CATEGORY_KEYS.filter(
            (category) => gearsGroupByCategory.value[category],
        ),
    );
    const emptyGearCategories = computed(() =>
        isFiltered.value
            ? []
            : constants.GEAR_CATEGORY_KEYS.filter(
                  (category) => !gearsGroupByCategory.value[category],
              ),
    );
    const displayGearCatergories = computed(() =>
        isFiltered.value
            ? nonEmptyGearCatergories.value
            : [...nonEmptyGearCatergories.value, ...emptyGearCategories.value],
    );

    // filter
    const filterValue = ref<string>('');
    const filteredGears = ref<Gear[]>([]);
    const isFiltered = ref<boolean>(false);
    const debouncedUpdateFilteredGears = _debounce(() => {
        const searchText = filterValue.value.toLocaleLowerCase();
        if (!searchText) {
            filteredGears.value = visibleGears.value;
            isFiltered.value = false;
            return;
        }
        // filter by gear name or brand or description
        filteredGears.value = visibleGears.value.filter(
            (gear) =>
                gear.name.toLocaleLowerCase().includes(searchText) ||
                (gear.brand &&
                    formatBrand(gear.brand)
                        .toLocaleLowerCase()
                        .includes(searchText)) ||
                (gear.description &&
                    gear.description.toLocaleLowerCase().includes(searchText)),
        );
        isFiltered.value = true;
    }, 500);

    watch(filterValue, (newFilterValue) => {
        if (!newFilterValue) {
            // reset immediately when clear filter
            filteredGears.value = visibleGears.value;
            isFiltered.value = false;
        }
        debouncedUpdateFilteredGears();
    });

    return {
        visibleGears,
        isFetchingGears,
        filterValue,
        isFiltered,
        displayGears,
        gearsGroupByCategory,
        displayGearCatergories,
    };
}
