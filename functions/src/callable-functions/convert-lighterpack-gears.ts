import Anthropic from '@anthropic-ai/sdk';
import { defineSecret } from 'firebase-functions/params';
import {
    CallableRequest,
    HttpsError,
    onCall,
} from 'firebase-functions/v2/https';
import { GEAR_BRAND_KEYS } from '../shared/gear-brands';
import { GEAR_CATEGORY_KEYS } from '../shared/gear-categories';

const ANTHROPIC_API_KEY = defineSecret('ANTHROPIC_API_KEY');

const MODEL = 'claude-haiku-5-5';
const MAX_ROWS = 200;
const MAX_NAME_LENGTH = 200;
const MAX_CATEGORY_LENGTH = 200;
const MAX_DESC_LENGTH = 500;

// [index, name, category, desc, worn]
type Row = [number, string, string, string, 'true' | ''];

type ConvertedGear = {
    index: number;
    brand?: string;
    category?: string;
};

const BRAND_KEY_SET = new Set<string>(GEAR_BRAND_KEYS);

const SYSTEM_PROMPT = `You are an expert in outdoor gear data processing.
Your task is to convert CSV data into a structured JSON object that strictly follows the provided schema.
Guess the possible brand and category of each gear item based on the CSV data.

CSV columns:
0. index: a unique identifier for each item (number)
1. item name: the name of the gear item (string)
2. category: the category of the gear item (user defined string)
3. desc: a brief description of the gear item (string)
4. worn: 'true' if the item is worn, otherwise empty

Instructions:
- Output a JSON object with a single property "gears", which is an array of gear objects.
- For each gear object, include only the following properties:
  - index: from column 0 (number, required)
  - brand: a brand key from the predefined list below (omit if no suitable brand is found)
  - category: the mapped predefined category (omit if not sure)
- The predefined brand list: [${GEAR_BRAND_KEYS.join(',')}]`;

const RESPONSE_SCHEMA = {
    type: 'object',
    properties: {
        gears: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    index: {
                        type: 'number',
                        description: 'A unique identifier for each gear item',
                    },
                    brand: {
                        type: 'string',
                        description:
                            'A brand key from the predefined list, omit if unknown.',
                    },
                    category: {
                        type: 'string',
                        enum: GEAR_CATEGORY_KEYS,
                        description: 'The category of the gear item.',
                    },
                },
                required: ['index'],
                additionalProperties: false,
            },
        },
    },
    required: ['gears'],
    additionalProperties: false,
};

const validateRows = (data: unknown): Row[] => {
    const rows = (data as { rows?: unknown } | null)?.rows;
    if (!Array.isArray(rows) || rows.length === 0 || rows.length > MAX_ROWS) {
        throw new HttpsError(
            'invalid-argument',
            `rows must be an array of 1 to ${MAX_ROWS} items`,
        );
    }
    return rows.map((row) => {
        if (
            !Array.isArray(row) ||
            row.length !== 5 ||
            typeof row[0] !== 'number' ||
            !Number.isFinite(row[0]) ||
            typeof row[1] !== 'string' ||
            typeof row[2] !== 'string' ||
            typeof row[3] !== 'string' ||
            (row[4] !== 'true' && row[4] !== '')
        ) {
            throw new HttpsError('invalid-argument', 'Invalid row format');
        }
        return [
            row[0],
            row[1].slice(0, MAX_NAME_LENGTH),
            row[2].slice(0, MAX_CATEGORY_LENGTH),
            row[3].slice(0, MAX_DESC_LENGTH),
            row[4],
        ] as Row;
    });
};

// CSV 欄位含逗號、換行、引號時加引號跳脫，避免 prompt 欄位錯位。
const toCsvCell = (value: string | number): string => {
    const str = String(value);
    return /[",\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};

export const convertLighterpackGears = onCall(
    {
        region: 'asia-northeast1',
        enforceAppCheck: true,
        timeoutSeconds: 120,
        secrets: [ANTHROPIC_API_KEY],
    },
    async (request: CallableRequest<unknown>) => {
        if (!request.auth) {
            throw new HttpsError('unauthenticated', 'Login required');
        }
        const rows = validateRows(request.data);
        const maxIndex = Math.max(...rows.map((row) => row[0]));
        const indexSet = new Set(rows.map((row) => row[0]));
        const csv = rows.map((row) => row.map(toCsvCell).join(',')).join('\n');

        const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY.value() });
        const startedAt = Date.now();
        let message: Anthropic.Message;
        try {
            message = await client.messages.create({
                model: MODEL,
                max_tokens: 16000,
                output_config: {
                    effort: 'low',
                    format: { type: 'json_schema', schema: RESPONSE_SCHEMA },
                },
                system: SYSTEM_PROMPT,
                messages: [
                    { role: 'user', content: `Here is the CSV data:\n${csv}` },
                ],
            });
        } catch (error) {
            console.error('Anthropic API error', error);
            if (error instanceof Anthropic.RateLimitError) {
                throw new HttpsError(
                    'resource-exhausted',
                    'AI service is busy, please try again later',
                );
            }
            if (error instanceof Anthropic.APIConnectionTimeoutError) {
                throw new HttpsError(
                    'deadline-exceeded',
                    'AI request timed out',
                );
            }
            if (error instanceof Anthropic.APIError) {
                throw new HttpsError(
                    'internal',
                    `AI service error (${error.status ?? 'connection'})`,
                );
            }
            throw new HttpsError('internal', 'Failed to convert gears');
        }

        console.log('convertLighterpackGears', {
            rows: rows.length,
            inputTokens: message.usage.input_tokens,
            outputTokens: message.usage.output_tokens,
            elapsedMs: Date.now() - startedAt,
        });

        if (message.stop_reason === 'refusal') {
            throw new HttpsError(
                'internal',
                'AI refused to process the request',
            );
        }
        if (message.stop_reason === 'max_tokens') {
            throw new HttpsError('internal', 'AI response was truncated');
        }

        const textBlock = message.content.find(
            (block): block is Anthropic.TextBlock => block.type === 'text',
        );
        let parsed: { gears?: unknown };
        try {
            parsed = JSON.parse(textBlock?.text ?? '');
        } catch {
            throw new HttpsError('internal', 'AI returned invalid JSON');
        }
        if (!Array.isArray(parsed.gears)) {
            throw new HttpsError('internal', 'AI returned unexpected format');
        }

        const gears: ConvertedGear[] = [];
        for (const item of parsed.gears) {
            if (
                typeof item?.index !== 'number' ||
                item.index > maxIndex ||
                !indexSet.has(item.index)
            ) {
                console.warn('Invalid index from AI', item);
                continue;
            }
            const gear: ConvertedGear = { index: item.index };
            if (
                typeof item.brand === 'string' &&
                BRAND_KEY_SET.has(item.brand)
            ) {
                gear.brand = item.brand;
            }
            if (
                typeof item.category === 'string' &&
                (GEAR_CATEGORY_KEYS as string[]).includes(item.category)
            ) {
                gear.category = item.category;
            }
            gears.push(gear);
        }
        return { gears };
    },
);
