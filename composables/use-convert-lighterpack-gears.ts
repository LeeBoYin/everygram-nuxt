import { getApp } from 'firebase/app';

const LIGHTERPACK_CSV_COLUMNS_MAP: Record<string, number> = {
    ITEM_NAME: 0,
    CATEGORY: 1,
    DESC: 2,
    QTY: 3,
    WEIGHT: 4,
    UNIT: 5,
    URL: 6,
    PRICE: 7,
    WORN: 8,
    CONSUMABLE: 9,
    IMAGE_URL_SMALL: 10,
    IMAGE_URL_LARGE: 11,
};

const convertWeightToGrams = (
    weight: number | string,
    unit: string,
): number => {
    if (typeof weight === 'string') {
        weight = parseFloat(weight);
    }
    if (isNaN(weight)) return 0;

    switch (unit) {
        case 'gram':
            return _round(weight, constants.LIMIT.maxFractionDigits);
        case 'kilogram':
            return _round(weight * 1000);
        case 'ounce':
            return _round(weight * 28.3495);
        case 'pound':
            return _round(weight * 453.592);
        default:
            return 0;
    }
};

export const useConvertLighterpackGears = () => {
    const firebaseApp = getApp();

    /**
     * Convert a Lighterpack gears array to an array of gear items.
     * This function reads the lighterpackGears array, filters out consumable items, and formats the data
     * into a structure that can be used to create gear items.
     * Steps include:
     * 1. Iterate through each row and extract relevant columns.
     * 2. Call the convertLighterpackGears cloud function (Claude) to convert the CSV data to gear items.
     * 3. Merge the result data with the formatted gear items.
     * 4. Format the result data to editing gear items.
     */
    const convertLighterpackGears = async (
        lighterpackGears: string[][],
        options: {
            currency: CurrencyCode;
        },
    ) => {
        // 1. filter out gear without item name or with consumable flag, and remove duplicates (same name and weight), and limit to importLimit
        const filteredLighterpackGearRows: string[][] = [];
        const seen = new Set<string>();
        let count = 0;
        lighterpackGears.forEach((row) => {
            if (count >= constants.LIMIT.importLimit) {
                return;
            }
            // filter out gear without item name
            if (!row[LIGHTERPACK_CSV_COLUMNS_MAP.ITEM_NAME]) {
                return;
            }
            // filter out consumable items
            if (row[LIGHTERPACK_CSV_COLUMNS_MAP.CONSUMABLE]) {
                return;
            }
            // filter out duplicates (same name and weight)
            const name = row[LIGHTERPACK_CSV_COLUMNS_MAP.ITEM_NAME];
            const weight = row[LIGHTERPACK_CSV_COLUMNS_MAP.WEIGHT];
            const key = `${name}__${weight}`;
            if (seen.has(key)) {
                return;
            }
            seen.add(key);
            filteredLighterpackGearRows.push(row);
            count++;
        });

        // 2. iterate through each row and extract relevant columns
        const gearRowsForAI: (string | number)[][] = [];
        const gearsData: any[] = [];
        filteredLighterpackGearRows.forEach((row, index) => {
            // each formatted row should contain: index, item name, category, desc, worn
            const rowForAI = [];
            rowForAI.push(index);
            rowForAI.push(row[LIGHTERPACK_CSV_COLUMNS_MAP.ITEM_NAME]);
            rowForAI.push(row[LIGHTERPACK_CSV_COLUMNS_MAP.CATEGORY]);
            rowForAI.push(row[LIGHTERPACK_CSV_COLUMNS_MAP.DESC]);
            rowForAI.push(row[LIGHTERPACK_CSV_COLUMNS_MAP.WORN] ? 'true' : '');
            gearRowsForAI.push(rowForAI);

            // format name, description, weight, price, image urls locally
            const partialData: any = {};
            const itemName = row[LIGHTERPACK_CSV_COLUMNS_MAP.ITEM_NAME];
            partialData.name = itemName
                .trim()
                .slice(0, constants.LIMIT.maxNameLength);
            const desc = row[LIGHTERPACK_CSV_COLUMNS_MAP.DESC];
            if (desc) {
                partialData.description = desc
                    .trim()
                    .slice(0, constants.LIMIT.maxGearDescriptionLength);
            }
            const weight = row[LIGHTERPACK_CSV_COLUMNS_MAP.WEIGHT];
            const weightUnit = row[LIGHTERPACK_CSV_COLUMNS_MAP.UNIT];
            partialData.weight = _clamp(
                convertWeightToGrams(weight, weightUnit),
                constants.LIMIT.minWeight,
                constants.LIMIT.maxWeight,
            );
            const price = row[LIGHTERPACK_CSV_COLUMNS_MAP.PRICE];
            if (+price > 0 && options.currency) {
                // only set price and currency if price is greater than 0
                partialData.price = price;
                partialData.currency = options.currency;
            }
            const imgUrlSm = row[LIGHTERPACK_CSV_COLUMNS_MAP.IMAGE_URL_SMALL];
            const imgUrlLg = row[LIGHTERPACK_CSV_COLUMNS_MAP.IMAGE_URL_LARGE];
            if (imgUrlSm && imgUrlLg) {
                partialData.imgUrlSm = imgUrlSm;
                partialData.imgUrlLg = imgUrlLg;
            }

            gearsData.push(partialData);
        });

        // 3. call the cloud function to map brand and category
        try {
            const { getFunctions, httpsCallable } = await import(
                'firebase/functions'
            );
            const functions = getFunctions(firebaseApp, 'asia-northeast1');
            const callable = httpsCallable<
                { rows: (string | number)[][] },
                {
                    gears: {
                        index: number;
                        brand?: string;
                        category?: string;
                    }[];
                }
            >(functions, 'convertLighterpackGears');
            const result = await callable({ rows: gearRowsForAI });
            const resultGearItems = result.data.gears;

            // 4. merge the result data with the formatted gear items
            resultGearItems.forEach((item) => {
                if (
                    item.index === undefined ||
                    item.index < 0 ||
                    item.index >= gearsData.length ||
                    gearsData[item.index] === undefined
                ) {
                    console.warn(`Invalid index ${item.index} for item:`, item);
                    return;
                }
                // brand is validated on the server, check again for safety
                if (item.brand && constants.GEAR_BRANDS[item.brand]) {
                    gearsData[item.index].brand = item.brand;
                }
                gearsData[item.index].category = item.category;
            });
        } catch (error: any) {
            throw new Error(`AI conversion error: ${error.message}`);
        }

        // 5. format the result data to editing gear items
        const resultGears = gearsData.map((item) =>
            dataUtils.formatFormStateToEditingGear(item),
        );
        return resultGears;
    };

    return {
        convertLighterpackGears,
    };
};
