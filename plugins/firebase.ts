import { initializeApp, type FirebaseApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';
import { connectStorageEmulator, getStorage } from 'firebase/storage';

// must match `scripts/emulators.mjs` and the bucket used by the functions
const EMULATOR_CONFIG = {
    apiKey: 'demo-api-key',
    authDomain: 'demo-everygram.firebaseapp.com',
    projectId: 'demo-everygram',
    storageBucket: 'everygram.appspot.com',
    appId: 'demo-app-id',
};
// ports are set in `firebase.json`
const EMULATOR_HOST = '127.0.0.1';
let isEmulatorConnected = false;

const connectEmulators = (app: FirebaseApp) => {
    // the plugin runs again on every server side render
    if (isEmulatorConnected) {
        return;
    }
    connectAuthEmulator(getAuth(app), `http://${EMULATOR_HOST}:9099`);
    connectFirestoreEmulator(getFirestore(app), EMULATOR_HOST, 8080);
    connectFunctionsEmulator(
        getFunctions(app, 'asia-northeast1'),
        EMULATOR_HOST,
        5001,
    );
    connectStorageEmulator(getStorage(app), EMULATOR_HOST, 9199);
    isEmulatorConnected = true;
};
export default defineNuxtPlugin({
    name: 'firebase.client',
    async setup(nuxtApp) {
        // this is the equivalent of a normal functional plugin
        // initialize Firebase app
        const config = useRuntimeConfig();
        // never in a production build
        const useEmulator =
            import.meta.dev && String(config.public.USE_EMULATOR) === 'true';
        const firebaseConfig = {
            apiKey: config.public.FIREBASE_API_KEY as string,
            authDomain: config.public.FIREBASE_AUTH_DOMAIN as string,
            databaseURL: config.public.FIREBASE_DATABASE_URL as string,
            projectId: config.public.FIREBASE_PROJECT_ID as string,
            storageBucket: config.public.FIREBASE_STORAGE_BUCKET as string,
            messagingSenderId: config.public
                .FIREBASE_MESSAGING_SENDER_ID as string,
            appId: config.public.FIREBASE_APP_ID as string,
            measurementId: config.public.FIREBASE_MEASUREMENT_ID as string,
        };

        const app = initializeApp(
            useEmulator ? EMULATOR_CONFIG : firebaseConfig,
        );

        if (useEmulator) {
            connectEmulators(app);
        }

        // run only in client side, not on server side render
        if (process.client && !useEmulator) {
            // Initialize App Check
            initializeAppCheck(app, {
                provider: new ReCaptchaV3Provider(
                    config.public.RECAPTCHA_SITE_KEY as string,
                ),
                isTokenAutoRefreshEnabled: true, // Optional: enables auto-refresh of tokens
            });
        }
    },
    hooks: {
        // You can directly register Nuxt app runtime hooks here
        'app:beforeMount'() {},
        'vue:setup'() {},
        'app:created'() {},
    },
});
