const CURRENCY_STORAGE_KEY = 'eg_selected_currency';

const saveSelectedCurrency = (currency: CurrencyCode) => {
    try {
        if (
            typeof window === 'undefined' ||
            typeof localStorage === 'undefined' ||
            !constants.CURRENCIES[currency]
        ) {
            return;
        }
        localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
    } catch (e) {
        console.error('Failed to save selected currency:', e);
    }
};

const getSelectedCurrencyCode = (): CurrencyCode | null => {
    try {
        if (
            typeof window === 'undefined' ||
            typeof localStorage === 'undefined'
        ) {
            return null;
        }
        const savedCurrency = localStorage.getItem(
            CURRENCY_STORAGE_KEY,
        ) as CurrencyCode;
        if (savedCurrency && constants.CURRENCIES[savedCurrency]) {
            return savedCurrency;
        }
        return null;
    } catch (e) {
        console.error('Failed to get selected currency:', e);
        return null;
    }
};

export default {
    saveSelectedCurrency,
    getSelectedCurrencyCode,
};
