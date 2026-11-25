import {
    filter as _filter,
    groupBy as _groupBy,
    map as _map,
    sum as _sum,
    sumBy as _sumBy,
    uniqueId as _uniqueId,
    isNaN,
} from 'lodash-es';
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

const getConsumableWeight = (consumable: Consumable): number =>
    +consumable.weight * (consumable?.quantity || 1) || 0;

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

const getTripConsumablesWeight = (trip: Trip): number =>
    _sumBy(_map(trip.consumables || [], getConsumableWeight));

const getTripPackWeight = (trip: Trip, gearMap: Record<string, Gear>): number =>
    getTripGearsWeight(trip, gearMap) + getTripConsumablesWeight(trip);

const getTripWeightTotal = (
    trip: Trip,
    gearMap: Record<string, Gear>,
): number =>
    getTripGearsWeight(trip, gearMap) +
    getTripWornGearsWeight(trip, gearMap) +
    getTripConsumablesWeight(trip);

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
    if (gear.photo) {
        return (size && gear.photo.thumbnails?.[size].url) || gear.photo.url;
    }
    if (gear.imgUrl) {
        // sm if thumbnail size is specified, otherwise lg
        return size ? gear.imgUrl.sm : gear.imgUrl.lg;
    }
    return '';
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
    [...items]?.sort(
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
 * Empty fields will be set to undefined, and then deleted by the database update function.
 *
 * !! We don't do validation here, as the form validation should handle it !!
 */
const formatFormStateToEditingGear = (formState: any): EditingGear => {
    const gearData: EditingGear = {};

    // name (required)
    if ('name' in formState) {
        gearData.name =
            typeof formState?.name === 'string' ? formState.name : '';
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
            typeof formState?.description === 'string' &&
            formState.description.length > 0
                ? formState.description
                : undefined;
    }

    // privateNote (optional)
    if ('privateNote' in formState) {
        gearData.privateNote =
            typeof formState?.privateNote === 'string' &&
            formState.privateNote.length > 0
                ? formState.privateNote
                : undefined;
    }

    // currency and price (optional)
    if ('price' in formState && 'currency' in formState) {
        const parsedPrice =
            typeof formState?.price === 'number'
                ? formState.price
                : typeof formState?.price === 'string'
                  ? parseFloat(formState.price)
                  : NaN;

        if (
            !isNaN(parsedPrice) &&
            parsedPrice >= 0 &&
            typeof formState?.currency === 'string' &&
            constants.CURRENCY_CODES.includes(formState.currency)
        ) {
            gearData.price = parsedPrice;
            gearData.currency = formState.currency;
        } else {
            gearData.price = undefined;
            gearData.currency = undefined;
        }
    }

    // acquiredDate (optional)
    if ('acquiredDate' in formState) {
        if (
            // date
            formState?.acquiredDate instanceof Date &&
            !isNaN(formState.acquiredDate.getTime())
        ) {
            gearData.acquiredDate = formatDateToString(formState.acquiredDate);
        } else if (
            // string
            typeof formState?.acquiredDate === 'string' &&
            validateDateString(formState.acquiredDate)
        ) {
            gearData.acquiredDate = formState.acquiredDate;
        } else {
            gearData.acquiredDate = undefined;
        }
    }

    // imgUrl (optional)
    if ('imgUrlSm' in formState && 'imgUrlLg' in formState) {
        if (
            typeof formState.imgUrlSm === 'string' &&
            typeof formState.imgUrlLg === 'string'
        ) {
            gearData.imgUrl = {
                sm: formState.imgUrlSm,
                lg: formState.imgUrlLg,
            };
        } else {
            gearData.imgUrl = undefined;
        }
    }

    return gearData;
};

const convertedEditingGearToTempGear = (editingGear: EditingGear): Gear => {
    return {
        ...editingGear,
        id: _uniqueId(),
        role: {},
        name: editingGear.name || '',
        weight: editingGear.weight || 0,
        category: editingGear.category || ('others' as GearCategory),
    };
};

export default {
    groupGearsByCategory,
    groupConsumablesByCategory,
    getConsumableWeight,
    getTripGearsWeight,
    getTripWornGearsWeight,
    getTripConsumablesWeight,
    getTripPackWeight,
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
    convertedEditingGearToTempGear,
};
