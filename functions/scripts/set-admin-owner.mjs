// 把指定 email 的帳號設成後台的第一位 owner。
// 用法：npm --prefix functions run admin:set-owner -- <email>
import { readFileSync } from 'node:fs';
import { cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const email = process.argv[2]?.trim();
if (!email) {
    console.error('Usage: npm run admin:set-owner -- <email>');
    process.exit(1);
}

const serviceAccount = JSON.parse(
    readFileSync(
        new URL('../src/everygram-firebase-adminsdk.json', import.meta.url),
        'utf8',
    ),
);
initializeApp({ credential: cert(serviceAccount) });

try {
    const user = await getAuth().getUserByEmail(email);
    // keeps the other custom claims of the user
    await getAuth().setCustomUserClaims(user.uid, {
        ...user.customClaims,
        adminRole: 'owner',
    });
    await getFirestore()
        .collection('adminUsers')
        .doc(user.uid)
        .set({
            uid: user.uid,
            email: user.email ?? '',
            displayName: user.displayName ?? '',
            role: 'owner',
            addedBy: 'bootstrap',
            added: FieldValue.serverTimestamp(),
        });
    console.log(
        `${email} (${user.uid}) is now an owner of project ${serviceAccount.project_id}. Sign in again to apply it.`,
    );
} catch (error) {
    console.error(error.message);
    process.exit(1);
}
