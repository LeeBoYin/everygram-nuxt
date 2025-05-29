import type { Timestamp } from '@firebase/firestore';

export type Member = {
    userId: string;
    email: string;
    locale: string;
    displayName: string;
    photoUrl: string;
};

export type CategoryData = { icon: string; color: string };

export type StorageFile = {
    url: string;
    fileName: string;
};

export type ThumbnailSize = 'xs' | 'sm' | 'md';

export type StorageImage = StorageFile & {
    thumbnails?: Record<ThumbnailSize, StorageFile>;
};

export type GearRole = 'owner' | 'co-owner';
export type GearCategory =
    | 'accessories'
    | 'packs'
    | 'clothing'
    | 'cooking'
    | 'electronics'
    | 'photography'
    | 'hydration'
    | 'shelter'
    | 'sleeping'
    | 'tools'
    | 'others';
export type GearBrand = {
    key?: string;
    custom?: string;
};
export type GearArchiveReason =
    | 'unused'
    | 'sold'
    | 'given'
    | 'trashed'
    | 'lost'
    | 'broken'
    | 'other';

export type Gear = {
    id: string;
    name: string;
    role: Record<string, GearRole>;
    weight: number; // grams
    brand?: GearBrand;
    category: GearCategory;
    isForOneTrip?: boolean;
    isArchived?: boolean;
    archiveReason?: GearArchiveReason;
    archiveNote?: string;
    created?: Timestamp;
    updated?: Timestamp;
    archived?: Timestamp;
    photo?: StorageImage;
    description?: string;
    price?: number;
    currency?: CurrencyCode;
    acquiredDate?: string; // ISO string or Date
};
export type EditingGear = Partial<Gear>;
export type GearWithQuantity = Gear & { quantity: number };
export type UserGears = Record<string, Gear>;

export type TripRole = 'owner' | 'participant';
export type TripGear = {
    id: string;
    quantity: number;
};
export type TripGearType = 'gears' | 'wornGears';
export type TripDateMode = 'single' | 'multi';
export type Trip = {
    id: string;
    title: string;
    description: string;
    dateMode?: TripDateMode;
    startDate?: string;
    endDate?: string;
    created?: Timestamp;
    updated?: Timestamp;
    published?: Timestamp;
    role: Record<string, TripRole>;
    gears: Record<string, TripGear>;
    wornGears: Record<string, TripGear>;
    consumables: Record<string, Consumable>;
    isPublished?: boolean;
    bannerImage?: StorageImage;
};
export type EditingTrip = Partial<Trip>;

export type TripShare = Omit<Trip, 'gears' | 'wornGears'> & {
    gears: Record<string, GearWithQuantity>;
    wornGears: Record<string, GearWithQuantity>;
    owner: UserInfo;
    baseWeight: number;
    consumablesWeight: number;
    packWeight: number;
    wornWeight: number;
    tripShareCreated?: Timestamp;
    viewCount?: number;
};

export type UserInfo = {
    displayName: string;
    photoURL: string;
};

export type ConsumableCategory =
    | 'food'
    | 'drinks'
    | 'fuel'
    | 'cosmetics'
    | 'sanitary'
    | 'medical'
    | 'others';
export type Consumable = {
    id: string;
    name: string;
    weight: number; // grams
    category: ConsumableCategory;
};
export type EditingConsumable = Partial<Consumable>;

export type WeightBarChartItem = {
    weight: number;
    label: string;
    color: string;
};

export type BrandData = { name: string; originalName?: string };

export type ThumbnailOption = {
    width: number;
    height: number;
    name: ThumbnailSize;
};

export type ProfileData = {
    displayName: string;
    photoURL: string;
};

export type CurrencyCode =
    | 'TWD'
    | 'JPY'
    | 'USD'
    | 'CNY'
    | 'EUR'
    | 'HKD'
    | 'KRW'
    | 'GBP'
    | 'AUD'
    | 'CAD'
    | 'SGD';

export type Currency = {
    code: CurrencyCode;
    label: string;
    fraction: 0 | 2;
};
