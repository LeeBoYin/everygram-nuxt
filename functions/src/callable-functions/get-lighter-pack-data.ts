import * as functions from 'firebase-functions';
import fetch from 'node-fetch';
import { load as cheerioLoad } from 'cheerio';
import Papa from 'papaparse';

export const getLighterPackPackData = functions.https.onCall(
    { region: process.env.MY_FIREBASE_FUNCTION_REGION },
    async (request: functions.https.CallableRequest<any>, context) => {
        const listId = request.data?.listId;
        if (!listId || typeof listId !== 'string') {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'Missing or invalid listId',
            );
        }
        const csvUrl = `https://lighterpack.com/csv/${listId}`;
        const pageUrl = `https://lighterpack.com/r/${listId}`;
        try {
            // 1. fetch CSV in a promise
            const fetchCsvPromise = (async () => {
                const response = await fetch(csvUrl);
                if (!response.ok) {
                    throw new Error(
                        `Failed to fetch CSV: ${response.statusText}`,
                    );
                }
                const csvText = await response.text();
                // Parse CSV using PapaParse
                return Papa.parse(csvText, {
                    header: false,
                    skipEmptyLines: true,
                }).data as string[][];
            })();

            // 2. fetch images in a promise
            const fetchImagesPromise = (async () => {
                const response = await fetch(pageUrl);
                if (!response.ok) {
                    throw new Error(
                        `Failed to fetch page: ${response.statusText}`,
                    );
                }
                const html = await response.text();
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
            throw new functions.https.HttpsError(
                'internal',
                err.message || 'Failed to fetch pack data',
            );
        }
    },
);
