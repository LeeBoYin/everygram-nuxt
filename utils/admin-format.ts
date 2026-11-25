// formatting for the admin dashboard, which is in Traditional Chinese only

const NUMBER_FORMAT = new Intl.NumberFormat('zh-TW', {
    maximumFractionDigits: 2,
});

export const formatAdminNumber = (value: number) => NUMBER_FORMAT.format(value);

export const formatAdminRatio = (part: number, total: number) =>
    total ? `${((part / total) * 100).toFixed(1)}%` : '—';

// change compared with a previous value, '—' when there is nothing to compare
export const formatAdminChange = (current: number, previous?: number) => {
    if (!previous) {
        return '—';
    }
    const change = ((current - previous) / previous) * 100;
    return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
};

export const formatAdminDate = (
    value: string | Timestamp | null | undefined,
) => {
    if (!value) {
        return '—';
    }
    const date = typeof value === 'string' ? new Date(value) : value.toDate();
    return date.toLocaleDateString('zh-TW', {
        timeZone: 'Asia/Taipei',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
};

const LABELS = {
    provider: {
        'google.com': 'Google',
        password: 'email／密碼',
    },
    locale: { en: 'English', 'zh-tw': '繁體中文', ja: '日本語' },
    category: {
        accessories: '配件',
        packs: '包包',
        clothing: '衣著',
        cooking: '炊事系統',
        electronics: '電子產品',
        photography: '攝影器材',
        hydration: '飲水裝備',
        shelter: '遮蔽系統',
        sleeping: '睡眠系統',
        tools: '工具配備',
        others: '未分類',
    },
    archiveReason: {
        unused: '沒在用',
        sold: '已售出',
        given: '已贈送',
        trashed: '已丟棄',
        lost: '已遺失',
        broken: '已損壞',
        other: '其他',
    },
    source: { manual: '手動新增', csv: 'CSV 匯入', lp: 'LighterPack 匯入' },
    dateMode: { single: '單日', multi: '多日' },
    currency: {},
} satisfies Record<string, Record<string, string>>;

export type AdminLabelType = keyof typeof LABELS;

export const formatAdminLocale = (locale: Locale | null) =>
    locale ? (LABELS.locale[locale] ?? locale) : '未設定';

// unknown keys are shown as they are
export const toAdminChartItems = (items: CountItem[], type?: AdminLabelType) =>
    items.map(({ key, count }) => {
        const labels: Record<string, string> = type ? LABELS[type] : {};
        return {
            label: key === 'unset' ? '未設定' : (labels[key] ?? key),
            count,
        };
    });

export const formatAdminBrand = (key: string) =>
    key.startsWith('custom:')
        ? `${key.slice('custom:'.length)}（自訂）`
        : (constants.GEAR_BRANDS[key]?.name ?? key);
