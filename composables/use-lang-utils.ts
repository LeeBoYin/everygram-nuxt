export default function () {
    const i18n = useI18n();

    return {
        getCurrentLocale: () => {
            return i18n.locale.value;
        },
        localeToLabel: (locale: string) => {
            return i18n.t(`LABEL_LOCALE_${_snakeCase(locale).toUpperCase()}`);
        },
        setLocale: (locale: string) => {
            i18n.setLocale(locale);
            analyticsUtils.log(constants.ANALYTICS_EVENTS.CHANGE_LOCALE, {
                locale,
            });
        },
        formatWeight: (weight: number, unit?: 'g' | 'kg') => {
            const weightG = i18n.t('INFO_WEIGHT_GRAM', { weight }, weight);
            const weightKg = i18n.t(
                'INFO_WEIGHT_KILOGRAM',
                {
                    weight: _round(weight / 1000, 2),
                },
                weight,
            );
            if (unit === 'g') {
                return weightG;
            }
            if (unit === 'kg') {
                return weightKg;
            }
            return weight < 1000 ? weightG : weightKg;
        },
        formatBrand: (brand: GearBrand) => {
            if (brand?.key && constants.GEAR_BRANDS[brand.key]) {
                return constants.GEAR_BRANDS[brand.key].name;
            }
            return brand?.custom || '';
        },
        formatPrice: (currency: CurrencyCode, price: number) => {
            if (
                typeof price !== 'number' ||
                isNaN(price) ||
                price <= 0 ||
                typeof currency !== 'string' ||
                constants.CURRENCY_CODES.indexOf(currency) < 0
            ) {
                return '';
            }
            try {
                return new Intl.NumberFormat(i18n.locale.value, {
                    style: 'currency',
                    currency,
                }).format(price);
            } catch (e) {
                return '';
            }
        },
        formatDateString: (date: string, separator = '-') => {
            if (typeof date !== 'string' || !date) return '';
            if (typeof separator !== 'string') separator = '-';
            return date.split('-').join(separator);
        },
        formatAcquiredDate: (date: string) => {
            if (typeof date !== 'string' || !date) return '';
            const parsedDate = new Date(date);
            const now = new Date();

            // Check if the date is valid
            if (isNaN(parsedDate.getTime()) || parsedDate > now) {
                return '';
            }

            // Calculate the difference in years, months, and days
            let years = now.getFullYear() - parsedDate.getFullYear();
            let months = now.getMonth() - parsedDate.getMonth();
            let days = now.getDate() - parsedDate.getDate();

            if (days < 0) {
                months -= 1;
                // Get days in previous month
                const prevMonth = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    0,
                );
                days += prevMonth.getDate();
            }
            if (months < 0) {
                years -= 1;
                months += 12;
            }

            // years ago, last year, months ago, last month, days ago, yesterday, today
            if (years > 0) {
                return i18n.t('INFO_ACQUIRED_YEARS_AGO', { years }, years);
            }
            if (months > 0) {
                return i18n.t('INFO_ACQUIRED_MONTHS_AGO', { months }, months);
            }
            if (days > 1) {
                return i18n.t('INFO_ACQUIRED_DAYS_AGO', { days }, days);
            }
            if (days === 1) {
                return i18n.t('INFO_ACQUIRED_YESTERDAY_AGO');
            }
            return i18n.t('INFO_ACQUIRED_TODAY_AGO');
        },
        gearCategoryToLabel: (category: GearCategory) => {
            if (!constants.GEAR_CATEGORY_KEYS.includes(category)) {
                return i18n.t('GEAR_CATEGORY_OTHERS');
            }
            return i18n.t(`GEAR_CATEGORY_${category.toUpperCase()}`);
        },
        consumableCategoryToLabel: (category: ConsumableCategory) => {
            if (!constants.CONSUMABLE_CATEGORY_KEYS.includes(category)) {
                return i18n.t('CONSUMABLE_CATEGORY_OTHERS');
            }
            return i18n.t(`CONSUMABLE_CATEGORY_${category.toUpperCase()}`);
        },
    };
}
