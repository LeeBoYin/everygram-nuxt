import type { Timestamp } from '@firebase/firestore';

declare global {
    type Member = {
        userId: string;
        email: string;
        locale: string;
        displayName: string;
        photoUrl: string;
    };

    type CategoryData = { icon: string; color: string };

    type StorageFile = {
        url: string;
        fileName: string;
    };

    type ThumbnailSize = 'xs' | 'sm' | 'md';

    type StorageImage = StorageFile & {
        thumbnails?: Record<ThumbnailSize, StorageFile>;
    };

    type GearRole = 'owner' | 'co-owner';
    type GearCategory =
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
    type GearBrand = {
        key?: string;
        custom?: string;
    };
    type GearArchiveReason =
        | 'unused'
        | 'sold'
        | 'given'
        | 'trashed'
        | 'lost'
        | 'broken'
        | 'other';

    type GearAction =
        | 'edit'
        | 'edit-archive'
        | 'edit-qty'
        | 'add-to-gears'
        | 'archive'
        | 'unarchive'
        | 'delete'
        | 'remove';

    type Gear = {
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
    type EditingGear = Partial<Gear>;
    type GearWithQuantity = Gear & { quantity: number };
    type UserGears = Record<string, Gear>;

    type TripRole = 'owner' | 'participant';
    type TripGear = {
        id: string;
        quantity: number;
    };
    type TripGearType = 'gears' | 'wornGears';
    type TripDateMode = 'single' | 'multi';
    type Trip = {
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
    type EditingTrip = Partial<Trip>;

    type TripShare = Omit<Trip, 'gears' | 'wornGears'> & {
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

    type UserInfo = {
        displayName: string;
        photoURL: string;
    };

    type ConsumableCategory =
        | 'food'
        | 'drinks'
        | 'fuel'
        | 'cosmetics'
        | 'sanitary'
        | 'medical'
        | 'others';
    type Consumable = {
        id: string;
        name: string;
        weight: number; // grams
        category: ConsumableCategory;
    };
    type EditingConsumable = Partial<Consumable>;

    type WeightBarChartSubItem = {
        weight: number;
        label: string;
    };
    type WeightBarChartItem = {
        weight: number;
        label: string;
        color: string;
        addBorder?: boolean;
        subItems?: WeightBarChartSubItem[];
    };

    type BrandData = { name: string; originalName?: string };

    type EventParamKey =
        | 'consumable_category'
        | 'container_name'
        | 'date_mode'
        | 'gear_category'
        | 'import_gear_num'
        | 'locale'
        | 'page_name'
        | 'sign_in_method'
        | 'trip_id'
        | 'user_trip_num'
        | 'user_gear_num';
    // archived: user_num, trip_num

    type PhotoCompressorOptions = {
        maxWidth?: number;
        maxHeight?: number;
        width?: number;
        height?: number;
        resize?: 'none' | 'cover' | 'contain';
    };

    type ThumbnailOption = {
        width: number;
        height: number;
        name: ThumbnailSize;
    };

    type ProfileData = {
        displayName: string;
        photoURL: string;
    };

    type CurrencyCode =
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

    type Currency = {
        code: CurrencyCode;
        label: string;
        fraction: 0 | 2;
    };
}
