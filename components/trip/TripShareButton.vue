<template>
    <div>
        <div v-if="isLargeScreen">
            <PrimeButton
                type="button"
                rounded
                :text="text"
                :outlined="outlined"
                :raised="raised"
                :severity="severity"
                :size="size"
                :label="$t('ACTION_SHARE')"
                @click="toggle"
            >
                <template #icon>
                    <span class="material-symbols-outlined mr-2"
                        >ios_share</span
                    >
                </template>
            </PrimeButton>
            <PrimeOverlayPanel
                ref="overlayPanel"
                class="border-round-lg p-2 w-30rem"
            >
                <TripShareContent :trip="trip" />
            </PrimeOverlayPanel>
        </div>
        <div v-else>
            <PrimeButton
                type="button"
                rounded
                :text="text"
                :outlined="outlined"
                :raised="raised"
                :severity="severity"
                :size="size"
                aria-haspopup="true"
                @click="isOpenBottomMenu = true"
            >
                <template #icon>
                    <span class="material-symbols-outlined">ios_share</span>
                </template></PrimeButton
            >
            <BottomSheet
                :isOpen="isOpenBottomMenu"
                @close="isOpenBottomMenu = false"
            >
                <TripShareContent :trip="trip" />
            </BottomSheet>
        </div>
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{
    trip: Trip;
    text?: boolean;
    outlined?: boolean;
    raised?: boolean;
    severity?: string;
    size?: 'small' | 'large';
}>();

const { isLargeScreen } = useDeviceMeta();

// desktop overlay panel
const overlayPanel = ref();
const toggle = (event: MouseEvent) => {
    overlayPanel.value.toggle(event);
};

// mobile menu
const isOpenBottomMenu = ref(false);
</script>
