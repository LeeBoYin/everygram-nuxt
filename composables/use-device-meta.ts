const isLargeScreen = ref<boolean>(false);
const isTouchDevice = ref<boolean>(false);

// only run on client side
if (process.client) {
    function screenSizeListener() {
        isLargeScreen.value = window.innerWidth >= constants.BREAK_POINTS.lg;
    }
    screenSizeListener();
    window.addEventListener('resize', screenSizeListener);
    isTouchDevice.value =
        'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

export default function useDeviceMeta() {
    return {
        isLargeScreen,
        isTouchDevice,
    };
}
