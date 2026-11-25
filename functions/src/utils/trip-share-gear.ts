import _ from 'lodash';

// tripShare is publicly readable: only these gear fields are copied into it.
// Add a field here only if it is meant to be seen by anyone.
export const TRIP_SHARE_GEAR_FIELDS = [
    'id',
    'name',
    'brand',
    'category',
    'weight',
    'description',
    'photo',
    'imgUrl',
    'quantity',
] as const;

export const toTripShareGear = (
    gear: Gear,
    quantity: number,
): GearWithQuantity =>
    _.pick({ ...gear, quantity }, TRIP_SHARE_GEAR_FIELDS) as GearWithQuantity;
