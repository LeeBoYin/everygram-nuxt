import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import os from 'os';
import path from 'path';
import { removeTripOgImage } from '../utils/remove-trip-og-image';
import { uploadWithDownloadUrl } from '../utils/upload-with-download-url';

const OG_IMAGE_WIDTH = 1200;
const OG_IMAGE_HEIGHT = 630;
const VIEWPORT = { width: 1920, height: 1080 };
// The Cloud Functions base image has no CJK fonts. This family is already in the
// app's font stack, so loading it as a web font is enough.
const CJK_FONT_CSS_URL =
    'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;700&display=swap';

// puppeteer-core and @sparticuz/chromium are ESM only, and are imported lazily
// so that other functions do not load them on cold start.
const launchBrowser = async () => {
    const { default: puppeteer } = await import('puppeteer-core');

    // Emulator: the bundled Chromium is Linux x64 only, so use the local Chrome.
    if (process.env.FUNCTIONS_EMULATOR === 'true') {
        const executablePath = process.env.CHROME_EXECUTABLE_PATH;
        return puppeteer.launch({
            ...(executablePath ? { executablePath } : { channel: 'chrome' }),
            defaultViewport: VIEWPORT,
            headless: true,
        });
    }

    const {
        default: chromium,
        inflate,
        setupLambdaEnvironment,
    } = await import('@sparticuz/chromium');
    const executablePath = await chromium.executablePath();
    // The package only unpacks its shared libraries (libnss3, libnspr4, ...)
    // on AWS Lambda. The Cloud Functions base image does not have them either.
    const binPath = path.join(
        path.dirname(require.resolve('@sparticuz/chromium')),
        '../bin',
    );
    await inflate(path.join(binPath, 'al2023.tar.br'));
    setupLambdaEnvironment(path.join(os.tmpdir(), 'al2023', 'lib'));

    return puppeteer.launch({
        args: await puppeteer.defaultArgs({
            args: chromium.args,
            headless: 'shell',
        }),
        defaultViewport: VIEWPORT,
        executablePath,
        headless: 'shell',
    });
};

/**
 * Generates a trip OG image, uploads it to storage, and updates tripMeta.ogImageUrl.
 * @param tripId Trip ID
 * @returns ogImageUrl
 */
export const generateTripOgImageAndUpdateMeta = async (
    tripId: string,
): Promise<string | undefined> => {
    if (!tripId || typeof tripId !== 'string') {
        throw new Error('tripId is required and must be a string');
    }

    // 1. Launch Puppeteer
    const browser = await launchBrowser();
    const tempFilePath = `/tmp/og-image-${tripId}.jpeg`;
    try {
        const page = await browser.newPage();
        const response = await page.goto(
            `https://everygram.app/trip-og-image/${tripId}`,
            {
                waitUntil: 'domcontentloaded',
                timeout: 60000, // Increased timeout to 60 seconds
            },
        );
        // never turn an error page into the OG image
        if (!response?.ok()) {
            throw new Error(
                `OG image page responded with status ${response?.status()}`,
            );
        }
        try {
            await page.addStyleTag({ url: CJK_FONT_CSS_URL });
        } catch (err) {
            console.warn('Failed to load CJK web font', err);
        }
        // Add delay to ensure all assets are loaded/rendered
        await new Promise((resolve) => setTimeout(resolve, 5000));

        // 2. Save screenshot to temp file
        await page.screenshot({
            path: tempFilePath as `${string}.jpeg`,
            type: 'jpeg',
            quality: 80,
            clip: {
                x: 0,
                y: 0,
                width: OG_IMAGE_WIDTH,
                height: OG_IMAGE_HEIGHT,
            },
        });
    } finally {
        await browser.close();
    }

    // 3. Upload to Firebase Storage and get download URL
    const bucket = getStorage().bucket();
    const ogImagePath = `trip/${tripId}/og-image`;
    const file = bucket.file(`${ogImagePath}/og-image.jpeg`);
    const url = await uploadWithDownloadUrl({
        localPath: tempFilePath,
        file,
        contentType: 'image/jpeg',
    });

    // 4. Update tripMeta.ogImageUrl. The trip can be unpublished while the image
    // is being generated, so check tripShare and write in one transaction.
    const db = getFirestore();
    const isStillShared = await db.runTransaction(async (transaction) => {
        const tripShare = await transaction.get(
            db.collection('tripShare').doc(tripId),
        );
        if (!tripShare.exists) return false;
        transaction.set(
            db.collection('tripMeta').doc(tripId),
            { tripId, ogImageUrl: url },
            { merge: true },
        );
        return true;
    });
    if (!isStillShared) {
        await removeTripOgImage(tripId);
        return;
    }

    return url;
};
