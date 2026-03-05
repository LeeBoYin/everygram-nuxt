<template>
    <PrimeButton
        type="button"
        severity="secondary"
        rounded
        outlined
        :label="type === 'text' ? $t('ACTION_IMPORT_EXPORT_GEARS') : ''"
        icon="pi pi-file-arrow-up"
        aria-haspopup="true"
        :aria-controls="isLargeScreen ? menuId : undefined"
        @click="(e) => (isLargeScreen ? toggle(e) : (isOpenBottomMenu = true))"
    />
    <PrimeMenu ref="menu" :id="menuId" :model="menuItems" :popup="true" />
    <BottomSheetMenu
        :menuItems="menuItems"
        :isOpen="isOpenBottomMenu"
        @close="isOpenBottomMenu = false"
    />
    <ImportGearsDialog
        :is-open="isOpenImportGearsDialog"
        @close="isOpenImportGearsDialog = false"
    />
    <ExportGearsDialog
        :is-open="isOpenExportGearsDialog"
        @close="isOpenExportGearsDialog = false"
    />
</template>

<script lang="ts" setup>
defineProps<{
    type: 'text' | 'icon';
}>();

const isOpenImportGearsDialog = ref<boolean>(false);
const isOpenExportGearsDialog = ref<boolean>(false);
const { isLargeScreen } = useDeviceMeta();
const i18n = useI18n();
const router = useRouter();

const menuItems = computed(() => {
    return [
        {
            label: i18n.t('ACTION_IMPORT_FROM_LIGHTERPACK'),
            command: () => {
                router.push('/import-gears-from-lighterpack');
            },
        },
        {
            label: i18n.t('ACTION_IMPORT_FROM_CSV_FILE'),
            command: () => {
                isOpenImportGearsDialog.value = true;
            },
        },
        {
            label: i18n.t('ACTION_EXPORT_TO_CSV_FILE'),
            command: () => {
                isOpenExportGearsDialog.value = true;
            },
        },
    ];
});

// desktop menu
const menuId = _uniqueId('overlay_menu_');
const menu = ref();
const toggle = (event: any) => {
    menu.value.toggle(event);
};

// mobile menu
const isOpenBottomMenu = ref(false);
</script>
