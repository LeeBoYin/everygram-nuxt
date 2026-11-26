// frontend 與 functions 共用的全域型別（functions/tsconfig.json 有 include 這個檔案）。
// 不要 import 只有其中一邊安裝的套件。
export {};

declare global {
    // 只宣告用得到的欄位，讓 client SDK 與 admin SDK 的 Timestamp 都相容
    type Timestamp = {
        readonly seconds: number;
        readonly nanoseconds: number;
        toDate(): Date;
        toMillis(): number;
    };

    type UserMeta = {
        userId: string;
        locale: Locale | null;
        currency: CurrencyCode | null;
        // counts are written by functions, missing until the first one
        gearCount?: number;
        archivedGearCount?: number;
        tripCount?: number;
        tripShareCount?: number;
        lastUpdated: Timestamp;
    };

    // custom claim: request.auth.token.adminRole
    type AdminRole = 'owner' | 'admin';

    // adminUsers/{uid}：claims 的鏡像，只由 admin SDK 寫入
    type AdminUser = {
        uid: string;
        email: string;
        displayName: string;
        role: AdminRole;
        addedBy: string; // uid，第一位 owner 由 script 建立時填 'bootstrap'
        added: Timestamp;
    };

    type CountItem = { key: string; count: number };

    // adminStats/latest 與 adminSnapshots/{YYYY-MM}，只由 admin SDK 寫入
    type AdminStats = {
        computedAt: Timestamp;
        period?: string; // 'YYYY-MM'，只有 snapshot 才有
        users: {
            total: number;
            newThisMonth: number; // creationTime 落在 period 或當月
            dau: number; // lastRefreshTime 在 1 天內
            wau: number; // 7 天內
            mau: number; // 30 天內
            dormant90d: number; // 超過 90 天沒活躍
            withGear: number; // gearCount >= 1
            withTrip: number; // tripCount >= 1
            withPublicTrip: number; // tripShareCount >= 1
            byProvider: CountItem[]; // google.com / password / ...
            byLocale: CountItem[]; // en / zh-tw / ja / null→'unset'
            byCurrency: CountItem[];
        };
        gears: {
            total: number;
            active: number;
            archived: number;
            newThisMonth: number;
            perUserAvg: number; // 只算 userMeta 存在的使用者，含 0
            perUserMedian: number;
            perUserBuckets: CountItem[]; // '0' | '1-10' | '11-50' | '51-100' | '100+'
            byCategory: CountItem[];
            topBrands: CountItem[]; // Top 30，內建品牌用 key、自訂品牌用 'custom:' + 正規化名稱
            topCustomBrands: CountItem[]; // Top 50，候選加入內建品牌清單
            byArchiveReason: CountItem[];
            withPhoto: number;
            withPrice: number;
            bySource: CountItem[]; // csv / lp / manual
        };
        trips: {
            total: number;
            private: number;
            public: number;
            newThisMonth: number;
            perUserAvg: number;
            avgGearsPerTrip: number; // gears + wornGears 的種類數
            emptyTrips: number; // 0 件裝備
            byDateMode: CountItem[];
            withBanner: number;
            publicAvgBaseWeight: number; // 來自 tripShare.baseWeight（g）
        };
        publicTrips: {
            totalViews: number;
            topViewed: TopTrip[]; // Top 20，依累計 viewCount
            viewCounts: Record<string, number>; // tripId → viewCount，用來算月增量
            topCreators: TopCreator[]; // Top 10，依公開行程數
        };
    };

    type TopTrip = {
        tripId: string;
        title: string;
        ownerName: string;
        ownerEmail: string;
        viewCount: number;
        published?: Timestamp;
    };

    type TopCreator = {
        uid: string;
        displayName: string;
        email: string;
        count: number;
    };

    // adminSnapshots/backfill：一次性回補，只存每月新增量
    type AdminBackfill = {
        computedAt: Timestamp;
        months: Record<
            string, // 'YYYY-MM'
            { newUsers: number; newGears: number; newTrips: number }
        >;
    };

    // callable getAdminUsers 的回傳列（不存進 Firestore）
    type AdminUserRow = {
        uid: string;
        email: string;
        displayName: string;
        provider: string;
        created: string | null; // ISO string
        lastActive: string | null; // ISO string
        gearCount: number;
        tripCount: number;
        tripShareCount: number;
        locale: Locale | null;
    };

    type Locale = 'en' | 'zh-tw' | 'ja';

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
        'unused' | 'sold' | 'given' | 'trashed' | 'lost' | 'broken' | 'other';

    type GearAction =
        | 'edit'
        | 'edit-archive'
        | 'edit-qty'
        | 'add-to-gears'
        | 'archive'
        | 'unarchive'
        | 'delete'
        | 'remove';

    type GearSource = 'csv' | 'lp';

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
        privateNote?: string; // for owner only, not shared in trip share
        price?: number;
        currency?: CurrencyCode;
        acquiredDate?: string; // ISO string or Date
        imgUrl?: {
            sm: string;
            lg: string;
        };
        source?: GearSource;
    };
    type EditingGear = Partial<Gear>;
    type GearWithQuantity = Gear & { quantity: number };
    type UserGears = Record<string, Gear>;
    type GearWithAnniversary = Gear & {
        age: number;
        daysUntilAnniversary: number;
        anniversaryDate: Date;
    };

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
        locale?: Locale;
        tripShareCreated?: Timestamp;
    };

    type TripMeta = {
        tripId: string;
        viewCount: number;
        ogImageUrl?: string;
    };

    type UserInfo = {
        displayName: string;
        photoURL: string;
    };

    type UserAvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

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
        quantity?: number;
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
        | 'SGD'
        | 'NZD'
        | 'SEK'
        | 'CHF'
        | 'THB'
        | 'IDR'
        | 'MYR'
        | 'PHP'
        | 'VND';

    type Currency = {
        code: CurrencyCode;
        label: string;
        fraction: 0 | 2;
    };
}
