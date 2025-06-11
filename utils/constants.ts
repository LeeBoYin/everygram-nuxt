import {
    GEAR_CATEGORIES,
    GEAR_CATEGORY_KEYS,
    WEARABLE_GEAR_CATEGORY_KEYS,
} from './constants/gear-categories';
import {
    CONSUMABLE_CATEGORIES,
    CONSUMABLE_CATEGORY_KEYS,
} from './constants/consumable-categories';
import { GEAR_BRANDS, GEAR_BRAND_KEYS } from './constants/gear-brands';
import { ANALYTICS_EVENTS } from './constants/analytics-events';

const ROLES = {
    OWNER: 'owner',
};

const COLORS = {
    BASE_WEIGHT: '#444444',
    WORN_WEIGHT: '#888888',
    CONSUMABLES_WEIGHT: '#ffffff',
    EMPTY_WEIGHT: '#cccccc',
};

const EMPTY_GEAR_DATA: Omit<Gear, 'id'> = {
    name: '',
    role: {},
    weight: 0,
    category: 'others',
};

const EMPTY_TRIP_DATA: Omit<Trip, 'id'> = {
    title: '',
    description: '',
    role: {},
    gears: {},
    wornGears: {},
    consumables: {},
};

const LOCALES = ['en', 'zh-tw'];

const LIMIT = {
    minWeight: 0,
    maxWeight: 100000,
    minNameLength: 1,
    maxNameLength: 100,
    maxTripDescriptionLength: 2000,
    importLimit: 200,
    // gear
    maxGearDescriptionLength: 200,
    maxGearArchiveNoteLength: 50,
    // square
    gearPhotoWidth: 1280,
    gearPhotoHeight: 1280,
    // 16:9
    tripBannerImageWidth: 1600,
    tripBannerImageHeight: 900,
    jpgQuality: 0.7,
    minQuantity: 1,
    maxQuantity: 100,
    maxFractionDigits: 1,
    avatarPhotoWidth: 512,
    avatarPhotoHeight: 512,
};

const STORAGE_PATH = {
    GEAR: 'gear',
    TRIP: 'trip',
    USER: 'user',
};

const TRIP_DATE_MODE: Record<string, TripDateMode> = {
    single: 'single',
    multi: 'multi',
};

const GEAR_ARCHIVE_REASONS: Record<string, GearArchiveReason> = {
    UNUSED: 'unused',
    SOLD: 'sold',
    GIVEN: 'given',
    TRASHED: 'trashed',
    LOST: 'lost',
    BROKEN: 'broken',
    OTHER: 'other',
};

const DEFAULT_TRIP_BANNER_IMAGE_PATH = '/image/illustration/illu-mountains.jpg';
const SITE_DOMAIN = 'https://everygram.app';

const BREAK_POINTS = {
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
};

const PUBLIC_TRIPS_PAGE_SIZE = 24;

const CURRENCIES: Record<CurrencyCode, Currency> = {
    TWD: { code: 'TWD', label: 'NT$', fraction: 0 },
    JPY: { code: 'JPY', label: '¥', fraction: 0 },
    USD: { code: 'USD', label: '$', fraction: 2 },
    CNY: { code: 'CNY', label: '¥', fraction: 2 },
    EUR: { code: 'EUR', label: '€', fraction: 2 },
    HKD: { code: 'HKD', label: 'HK$', fraction: 2 },
    KRW: { code: 'KRW', label: '₩', fraction: 0 },
    GBP: { code: 'GBP', label: '£', fraction: 2 },
    AUD: { code: 'AUD', label: 'A$', fraction: 2 },
    CAD: { code: 'CAD', label: 'C$', fraction: 2 },
    SGD: { code: 'SGD', label: 'S$', fraction: 2 },
};

const CURRENCY_CODES = Object.keys(CURRENCIES) as CurrencyCode[];

const DATE_FORMAT = 'yy-mm-dd';
const DATE_PLACEHOLDER = 'yyyy-mm-dd';

const TOAST_TTL = 3000; // 3 seconds

export default {
    ROLES,
    COLORS,
    GEAR_CATEGORIES,
    GEAR_CATEGORY_KEYS,
    CONSUMABLE_CATEGORIES,
    CONSUMABLE_CATEGORY_KEYS,
    GEAR_BRANDS,
    GEAR_BRAND_KEYS,
    EMPTY_GEAR_DATA,
    EMPTY_TRIP_DATA,
    WEARABLE_GEAR_CATEGORY_KEYS,
    LOCALES,
    LIMIT,
    TRIP_DATE_MODE,
    GEAR_ARCHIVE_REASONS,
    DEFAULT_TRIP_BANNER_IMAGE_PATH,
    SITE_DOMAIN,
    ANALYTICS_EVENTS,
    STORAGE_PATH,
    BREAK_POINTS,
    PUBLIC_TRIPS_PAGE_SIZE,
    CURRENCIES,
    CURRENCY_CODES,
    DATE_FORMAT,
    DATE_PLACEHOLDER,
    TOAST_TTL,
};
