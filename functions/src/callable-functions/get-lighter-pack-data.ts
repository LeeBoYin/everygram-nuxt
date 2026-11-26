import {
    CallableRequest,
    HttpsError,
    onCall,
} from 'firebase-functions/v2/https';
import { load as cheerioLoad } from 'cheerio';
import Papa from 'papaparse';
import { fetchTextWithLimit } from '../utils/fetch-text-with-limit';

// share IDs are currently 6 chars of [0-9a-z], leave room for older or longer ones
const LIST_ID_PATTERN = /^[A-Za-z0-9]{1,16}$/;
const FETCH_LIMITS = {
    timeoutMs: 15_000,
    maxBytes: 5 * 1024 * 1024,
};

export const getLighterPackPackData = onCall(
    { region: 'asia-northeast1', enforceAppCheck: true },
    async (request: CallableRequest<any>) => {
        if (!request.auth) {
            throw new HttpsError('unauthenticated', 'Login required');
        }
        const listId = request.data?.listId;
        if (typeof listId !== 'string' || !LIST_ID_PATTERN.test(listId)) {
            throw new HttpsError(
                'invalid-argument',
                'Missing or invalid listId',
            );
        }
        const csvUrl = `https://lighterpack.com/csv/${listId}`;
        const pageUrl = `https://lighterpack.com/r/${listId}`;
        try {
            // 1. fetch CSV in a promise
            const fetchCsvPromise = (async () => {
                const csvText = await fetchTextWithLimit(csvUrl, FETCH_LIMITS);
                // Parse CSV using PapaParse
                return Papa.parse(csvText, {
                    header: false,
                    skipEmptyLines: true,
                }).data as string[][];
            })();

            // 2. fetch images in a promise
            const fetchImagesPromise = (async () => {
                const html = await fetchTextWithLimit(pageUrl, FETCH_LIMITS);
                const $ = cheerioLoad(html);
                const images: Array<{ imgUrlSm: string; imgUrlLg: string }> =
                    [];
                $('.lpItem').each((_, el) => {
                    const imgElem = $(el).find('.lpItemImage');
                    let imgUrlSm: string = '';
                    let imgUrlLg: string = '';
                    if (imgElem.length > 0) {
                        imgUrlSm = imgElem.attr('src') || '';
                        imgUrlLg = imgElem.attr('href') || '';
                    }
                    images.push({ imgUrlSm, imgUrlLg });
                });
                return images;
            })();

            // Run both in parallel
            const [csvRows, images] = await Promise.all([
                fetchCsvPromise,
                fetchImagesPromise,
            ]);

            // Combine CSV rows with images
            const dataRows = csvRows.slice(1); //skip header row
            const result: any[][] = dataRows.map((row, i) => {
                const img = images[i] || { imgUrlSm: '', imgUrlLg: '' };
                return [...row, img.imgUrlSm, img.imgUrlLg];
            });

            return { lighterpackGears: result };
        } catch (err: any) {
            throw new HttpsError(
                'internal',
                err.message || 'Failed to fetch pack data',
            );
        }
    },
);
