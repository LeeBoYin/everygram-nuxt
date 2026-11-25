import { ServiceAccount, cert, initializeApp } from 'firebase-admin/app';
import { setGlobalOptions } from 'firebase-functions/v2';
import serviceAccount from './everygram-firebase-adminsdk.json';

// Set the maximum instances to 10 for all functions
// To fix Error: Error generating the service identity for eventarc.googleapis.com.
setGlobalOptions({
    maxInstances: 10,
    region: 'asia-northeast1',
    timeoutSeconds: 60,
});

// set credential for admin SDK
initializeApp({
    credential: cert(serviceAccount as ServiceAccount),
    storageBucket: 'everygram.appspot.com',
});

// event handlers
export { onGearUpdated } from './event-handlers/on-gear-updated';
export { onGearDeleted } from './event-handlers/on-gear-deleted';
export { onTripUpdated } from './event-handlers/on-trip-updated';
export { onTripDeleted } from './event-handlers/on-trip-deleted';
export { onTripShareWritten } from './event-handlers/on-trip-share-written';

// callable functions
export { incrementTripShareView } from './callable-functions/increment-tripshare-view';
export { onUserProfileUpdated } from './callable-functions/on-user-profile-updated';
export { getLighterPackPackData } from './callable-functions/get-lighter-pack-data';
export { convertLighterpackGears } from './callable-functions/convert-lighterpack-gears';

// cron jobs
export { findCustomBrands } from './cron-jobs/find-custom-brands';
