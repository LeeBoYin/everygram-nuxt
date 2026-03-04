import * as admin from 'firebase-admin';
import { setGlobalOptions } from 'firebase-functions/v2';
import serviceAccount from './everygram-firebase-adminsdk.json';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

// Set the maximum instances to 10 for all functions
// To fix Error: Error generating the service identity for eventarc.googleapis.com.
setGlobalOptions({
    maxInstances: 10,
    region: process.env.MY_FIREBASE_FUNCTION_REGION,
    timeoutSeconds: 60,
});

// set credential for admin SDK
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    storageBucket: 'everygram.appspot.com',
});

// event handlers
export { onGearUpdated } from './event-handlers/on-gear-updated';
export { onGearDeleted } from './event-handlers/on-gear-deleted';
export { onTripUpdated } from './event-handlers/on-trip-updated';
export { onTripDeleted } from './event-handlers/on-trip-deleted';
export { onTripShareUpdated } from './event-handlers/on-trip-share-updated';

// callable functions
export { incrementTripShareView } from './callable-functions/increment-tripshare-view';
export { onUserProfileUpdated } from './callable-functions/on-user-profile-updated';
export { getLighterPackPackData } from './callable-functions/get-lighter-pack-data';

// cron jobs
export { findCustomBrands } from './cron-jobs/find-custom-brands';
