// 列出 role 不是剛好一位 owner 的 gear / trip / tripShare。唯讀，不會修改資料。
// 用法：npm --prefix functions run check:roles
import { readFileSync } from 'node:fs';
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = JSON.parse(
    readFileSync(
        new URL('../src/everygram-firebase-adminsdk.json', import.meta.url),
        'utf8',
    ),
);
initializeApp({ credential: cert(serviceAccount) });

try {
    console.log(`Project: ${serviceAccount.project_id}`);
    for (const collectionName of ['gear', 'trip', 'tripShare']) {
        const snapshot = await getFirestore()
            .collection(collectionName)
            .select('role')
            .get();
        // same condition as src/utils/get-owner-uid.ts
        const invalidDocs = snapshot.docs.filter((doc) => {
            const values = Object.values(doc.get('role') ?? {});
            return values.length !== 1 || values[0] !== 'owner';
        });
        console.log(
            `\n${collectionName}: ${invalidDocs.length} invalid / ${snapshot.size} docs`,
        );
        invalidDocs.forEach((doc) =>
            console.log(
                `  ${doc.ref.path} ${JSON.stringify(doc.get('role') ?? null)}`,
            ),
        );
    }
} catch (error) {
    console.error(error.message);
    process.exit(1);
}
