import { debounce as _debounce } from 'lodash-es';
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

    watch([filterValue, visibleGears], ([newFilterValue]) => {
        if (!newFilterValue) {
            // reset immediately when clear filter
            filteredGears.value = visibleGears.value;
            isFiltered.value = false;
            return;
        }
        debouncedUpdateFilteredGears();
    });

    // anniversary gears
    const UPCOMING_DAYS = 7;
    const dateNow = new Date();
    const todayDateOnly = new Date(
        dateNow.getFullYear(),
        dateNow.getMonth(),
        dateNow.getDate(),
    );
    const getNextGearAnniversaryDate = (acquiredDate: Date): Date => {
        const anniversaryDate = new Date(acquiredDate);
        anniversaryDate.setFullYear(todayDateOnly.getFullYear());
        const anniversaryDateOnly = new Date(
            anniversaryDate.getFullYear(),
            anniversaryDate.getMonth(),
            anniversaryDate.getDate(),
        );

        // If the anniversary date is in the past (date only), set it to next year
        if (anniversaryDateOnly <= todayDateOnly) {
            anniversaryDateOnly.setFullYear(todayDateOnly.getFullYear() + 1);
        }

        return anniversaryDateOnly;
    };

    const anniversaryGearList = computed<GearWithAnniversary[]>(() => {
        const results: GearWithAnniversary[] = [];

        visibleGears.value.forEach((gear) => {
            if (!gear.acquiredDate) {
                return; // Skip gears without an acquired date
            }

            // find gears that acquired date is the same as today, but acquired date's year is in the past
            const acquiredDate = new Date(gear.acquiredDate);
            const isAnniversary =
                acquiredDate.getDate() === todayDateOnly.getDate() &&
                acquiredDate.getMonth() === todayDateOnly.getMonth() &&
                acquiredDate.getFullYear() < todayDateOnly.getFullYear();
            if (isAnniversary) {
                const age =
                    todayDateOnly.getFullYear() - acquiredDate.getFullYear();
                const anniversaryDate = todayDateOnly;
                const daysUntilAnniversary = 0;
                results.push({
                    ...gear,
                    age,
                    daysUntilAnniversary,
                    anniversaryDate,
                });
            }
        });

        // sort results by age in descending order
        results.sort((a, b) => b.age - a.age);
        return results;
    });

    const upcomingAnniversaryGears = computed<GearWithAnniversary[]>(() => {
        const results: GearWithAnniversary[] = [];
        // Change from anniversaryGearList.value to visibleGears.value
        visibleGears.value.forEach((gear) => {
            if (!gear.acquiredDate) {
                return; // Skip gears without an acquired date
            }
            const acquiredDate = new Date(gear.acquiredDate);
            const anniversaryDateOnly =
                getNextGearAnniversaryDate(acquiredDate);

            // find gears that have an anniversary date in the coming days
            const maxUpcomingDay = new Date(todayDateOnly);
            maxUpcomingDay.setDate(todayDateOnly.getDate() + UPCOMING_DAYS);
            const isAnniversaryComing =
                anniversaryDateOnly > todayDateOnly &&
                anniversaryDateOnly <= maxUpcomingDay;
            if (isAnniversaryComing) {
                const start = todayDateOnly;
                const end = anniversaryDateOnly;
                const daysUntilAnniversary = Math.round(
                    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
                );
                const age =
                    anniversaryDateOnly.getFullYear() -
                    acquiredDate.getFullYear();
                results.push({
                    ...gear,
                    age,
                    daysUntilAnniversary,
                    anniversaryDate: anniversaryDateOnly,
                });
            }
        });

        // sort results by daysUntilAnniversary in ascending order
        results.sort((a, b) => a.daysUntilAnniversary - b.daysUntilAnniversary);
        return results;
    });

    return {
        visibleGears,
        isFetchingGears,
        filterValue,
        isFiltered,
        displayGears,
        gearsGroupByCategory,
        displayGearCatergories,
        anniversaryGearList,
        upcomingAnniversaryGears,
    };
}
