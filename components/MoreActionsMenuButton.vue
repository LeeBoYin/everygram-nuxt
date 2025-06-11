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
                :icon="`pi ${icon || 'pi-ellipsis-v'}`"
                aria-haspopup="true"
                :aria-controls="menuId"
                @click="toggle"
            />
            <PrimeMenu
                ref="menu"
                :id="menuId"
                :model="props.items"
                :popup="true"
            />
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
                :icon="`pi ${icon || 'pi-ellipsis-v'}`"
                aria-haspopup="true"
                @click="isOpenBottomMenu = true"
            />
            <BottomSheetMenu
                :menuItems="items"
                :isOpen="isOpenBottomMenu"
                @close="isOpenBottomMenu = false"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import type { MenuItem } from 'primevue/menuitem';

const props = defineProps<{
    items: MenuItem[];
    icon?: string;
    text?: boolean;
    outlined?: boolean;
    raised?: boolean;
    severity?: string;
    size?: 'small' | 'large';
}>();

const { isLargeScreen } = useDeviceMeta();

// desktop menu
const menuId = _uniqueId('overlay_menu_');
const menu = ref();
const toggle = (event: any) => {
    menu.value.toggle(event);
};

// mobile menu
const isOpenBottomMenu = ref(false);
</script>
