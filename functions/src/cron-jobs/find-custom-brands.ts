import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';

// Scheduled function to collect custom brand statistics from gear collection
export const findCustomBrands = onSchedule(
    {
        schedule: '0 0 1 * *', // run at 00:00 on the 1st of each month
        timeZone: 'Asia/Taipei',
        region: 'asia-northeast1',
    },
    async (event) => {
        const db = getFirestore();
        // Use where clause to only get gears with brand.custom
        const gearSnapshot = await db
            .collection('gear')
            .where('brand.custom', '!=', null)
            .get();
        const brandCounts: Record<string, number> = {};

        gearSnapshot.forEach((doc) => {
            const gear = doc.data();
            const customBrand = gear?.brand?.custom;
            if (
                customBrand &&
                typeof customBrand === 'string' &&
                customBrand.trim()
            ) {
                // Normalize brand name: trim, lowercase, and collapse multiple spaces
                const brandName = customBrand
                    .trim()
                    .toLowerCase()
                    .replace(/\s+/g, ' ');
                brandCounts[brandName] = (brandCounts[brandName] || 0) + 1;
            }
        });

        // Convert brandCounts to sorted array of "brand: count" strings
        const brandsArray = Object.entries(brandCounts)
            .sort((a, b) => {
                // Sort by count descending, then name alphabetically
                if (b[1] !== a[1]) return b[1] - a[1];
                return a[0].localeCompare(b[0]);
            })
            .map(([brand, count]) => `${brand}: ${count}`);

        await db.collection('customBrands').add({
            created: FieldValue.serverTimestamp(),
            brands: brandsArray,
            gearCount: Object.values(brandCounts).reduce(
                (sum, count) => sum + count,
                0,
            ),
            brandCount: brandsArray.length,
        });
    },
);
