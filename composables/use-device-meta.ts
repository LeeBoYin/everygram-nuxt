import { UAParser } from 'ua-parser-js';

// Singleton state
const isLargeScreen = ref<boolean>(false);
const isTouchDevice = ref<boolean>(false);
let serverInitialized = false;
let clientInitialized = false;

function initializeDeviceMeta() {
    if (process.server && !serverInitialized) {
        serverInitialized = true;
        const headers = useRequestHeaders();
        const ua = new UAParser(headers['user-agent']);
        const deviceInfo = ua.getResult();
        isLargeScreen.value = !(
            deviceInfo.device.type === 'mobile' ||
            deviceInfo.device.type === 'tablet'
        );
        isTouchDevice.value =
            deviceInfo.device.type === 'mobile' ||
            deviceInfo.device.type === 'tablet';
    }

    if (process.client && !clientInitialized) {
        clientInitialized = true;
        const screenSizeListener = () => {
            isLargeScreen.value =
                window.innerWidth >= constants.BREAK_POINTS.lg;
        };
        screenSizeListener();
        window.addEventListener('resize', screenSizeListener);
        isTouchDevice.value =
            'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }
}

export default function useDeviceMeta() {
    initializeDeviceMeta();

    return {
        isLargeScreen,
        isTouchDevice,
    };
}
