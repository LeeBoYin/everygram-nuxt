const groupGearsByCategory = <T extends Gear>(
    gears: T[],
): Partial<Record<GearCategory, T[]>> =>
    _groupBy(gears, (gear) =>
        constants.GEAR_CATEGORY_KEYS.includes(gear.category)
            ? gear.category
            : 'others',
    );

const groupConsumablesByCategory = <T extends Consumable>(
    consumables: T[],
): Partial<Record<ConsumableCategory, T[]>> =>
    _groupBy(consumables, (consumable) =>
        constants.CONSUMABLE_CATEGORY_KEYS.includes(consumable.category)
            ? consumable.category
            : 'others',
    );

const getTripGearsWeight = (
    trip: Trip,
    gearMap: Record<string, Gear>,
): number =>
    _sum(
        _map(trip.gears, (tripGear, gearId) =>
            gearMap[gearId]
                ? (gearMap[gearId].weight || 0) * tripGear.quantity
                : 0,
        ),
    );

const getTripWornGearsWeight = (
    trip: Trip,
    gearMap: Record<string, Gear>,
): number =>
    _sum(
        _map(trip.wornGears, (wornGear, gearId) =>
            gearMap[gearId]
                ? (gearMap[gearId].weight || 0) * wornGear.quantity
                : 0,
        ),
    );

const getTripConsumablessWeight = (trip: Trip): number =>
    _sum(_map(trip.consumables || [], (consumable) => +consumable.weight || 0));

const getTripBaseWeight = (trip: Trip, gearMap: Record<string, Gear>): number =>
    getTripGearsWeight(trip, gearMap) + getTripConsumablessWeight(trip);

const getTripWeightTotal = (
    trip: Trip,
    gearMap: Record<string, Gear>,
): number =>
    getTripGearsWeight(trip, gearMap) +
    getTripWornGearsWeight(trip, gearMap) +
    getTripConsumablessWeight(trip);

const getGearsInTrip = (trip: Trip, gearMap: Record<string, Gear>) => {
    return _filter(_map(trip.gears, (gear) => gearMap[gear.id]));
};

const getWornGearsInTrip = (trip: Trip, gearMap: Record<string, Gear>) => {
    return _filter(_map(trip.wornGears, (gear) => gearMap[gear.id]));
};

const formatDateToString = (date: Date): string => {
    const d = new Date(date);
    const year = d.getFullYear();
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
};

const formatDateString = (date: string, separator: string): string => {
    return date.split('-').join(separator);
};

const validateDateString = (date: string): boolean => {
    if (!date) return false;

    // regex
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return false;

    // check if date is valid
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) return false;

    return true;
};

const getDaysBetweenDates = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

const formatTripDate = (trip: Trip | TripShare): string => {
    if (trip.dateMode === 'multi' && trip.startDate && trip.endDate) {
        return `${formatDateString(trip.startDate, '/')} ~ ${formatDateString(trip.endDate, '/')}`;
    } else if (trip.dateMode === 'single' && trip.startDate) {
        return formatDateString(trip.startDate, '/');
    }
    return '';
};

const getTripBannerImageUrl = (
    trip: Trip | TripShare,
    size?: ThumbnailSize,
): string => {
    return trip.bannerImage
        ? (size && trip.bannerImage.thumbnails?.[size].url) ||
              trip.bannerImage.url
        : constants.DEFAULT_TRIP_BANNER_IMAGE_PATH;
};

const getGearPhotoUrl = (gear: Gear, size?: ThumbnailSize): string => {
    return gear.photo
        ? (size && gear.photo.thumbnails?.[size].url) || gear.photo.url
        : '';
};

const getTripDays = (trip: Trip | TripShare): number => {
    if (trip.dateMode === 'multi' && trip.startDate && trip.endDate) {
        return getDaysBetweenDates(trip.startDate, trip.endDate);
    }
    if (trip.dateMode === 'single' && trip.startDate) {
        return 1;
    }
    return 0;
};

const getWeightSortedItems = <
    T extends { id: string; name: string; weight: number },
>(
    items: T[],
): T[] =>
    items?.sort(
        (a, b) =>
            b.weight - a.weight ||
            (b.name < a.name ? 1 : -1) ||
            (b.id < a.id ? 1 : -1),
    ) ?? [];

const getGearUsedCount = (gear: Gear, trips: Trip[]): number => {
    return trips.reduce((count, trip) => {
        // count once if gear is either in gears or wornGears
        if (trip.gears && trip.gears[gear.id]) {
            count += 1;
        } else if (trip.wornGears && trip.wornGears[gear.id]) {
            count += 1;
        }
        return count;
    }, 0);
};

/**
 * Format form state to EditingGear object
 * This function is used to convert the form state from the gear editing form
 * to the EditingGear object that can be used to update the gear in the database.
 * It handles the conversion of various fields.
 *
 * Only the fields that are present in the form state will be included in the result.
 * If a field is not present in the form state, it will not be included in the result, hence
 * it is safe to use this function to update the gear without worrying about missing fields.
 *
 * Invlaid fields will be set to undefined, and then deleted by the database update function.
 */
const formatFormStateToEditingGear = (formState: any): EditingGear => {
    const gearData: EditingGear = {};

    // name (required)
    if ('name' in formState) {
        gearData.name =
            typeof formState?.name === 'string'
                ? _trim(formState.name) || ''
                : '';
    }

    // weight (required)
    if ('weight' in formState) {
        gearData.weight =
            typeof formState?.weight === 'number' ||
            typeof formState?.weight === 'string'
                ? +formState.weight
                : 0;
    }

    // category (required)
    if ('category' in formState) {
        gearData.category =
            typeof formState?.category === 'string' &&
            constants.GEAR_CATEGORY_KEYS.includes(formState.category)
                ? formState.category
                : 'others';
    }

    // brand (optional)
    if ('brand' in formState) {
        if (
            typeof formState.brand === 'string' &&
            constants.GEAR_BRANDS[formState.brand]
        ) {
            gearData.brand = { key: formState.brand };
        } else if (typeof formState.brand === 'string') {
            gearData.brand = { custom: formState.brand };
        } else {
            gearData.brand = undefined;
        }
    }

    // description (optional)
    if ('description' in formState) {
        gearData.description =
            typeof formState?.description === 'string'
                ? _trim(formState.description) || undefined
                : undefined;
    }

    // currency and price (optional)
    if ('price' in formState && 'currency' in formState) {
        if (
            isNumber(formState?.price) &&
            typeof formState?.currency === 'string' &&
            constants.CURRENCY_CODES.includes(formState.currency)
        ) {
            gearData.price = formState.price;
            gearData.currency = formState.currency;
        } else {
            gearData.price = undefined;
            gearData.currency = undefined;
        }
    }

    // acquiredDate (optional)
    if ('acquiredDate' in formState) {
        if (
            formState?.acquiredDate instanceof Date &&
            !isNaN(formState.acquiredDate.getTime())
        ) {
            gearData.acquiredDate = formatDateToString(formState.acquiredDate);
        } else {
            gearData.acquiredDate = undefined;
        }
    }

    return gearData;
};

export default {
    groupGearsByCategory,
    groupConsumablesByCategory,
    getTripGearsWeight,
    getTripWornGearsWeight,
    getTripConsumablessWeight,
    getTripBaseWeight,
    getTripWeightTotal,
    getGearsInTrip,
    getWornGearsInTrip,
    formatDateToString,
    formatDateString,
    validateDateString,
    getDaysBetweenDates,
    formatTripDate,
    getTripBannerImageUrl,
    getGearPhotoUrl,
    getTripDays,
    getWeightSortedItems,
    getGearUsedCount,
    formatFormStateToEditingGear,
};
