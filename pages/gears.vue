<!-- a page to list all gear the user has -->
<template>
    <PageLoading v-if="isFetchingGears" />
    <div
        v-else-if="visibleGears.length"
        class="flex flex-column gap-2 lg:gap-3"
    >
        <!-- header -->
        <div class="grid align-items-center">
            <!-- left -->
            <div :class="sidebarClass">
                <GearNum
                    :num="displayGears.length"
                    :lang-key="
                        isFiltered ? 'INFO_GEAR_NUM_FILTERED' : undefined
                    "
                    class="px-4"
                />
            </div>
            <!-- right -->
            <div :class="mainClass">
                <div
                    :class="[
                        'flex flex-column gap-3',
                        'md:flex-row-reverse md:justify-content-between md:align-items-center',
                    ]"
                >
                    <div
                        class="flex justify-content-between align-items-center"
                    >
                        <GearNum
                            :num="displayGears.length"
                            :lang-key="
                                isFiltered
                                    ? 'INFO_GEAR_NUM_FILTERED'
                                    : undefined
                            "
                            class="md:hidden"
                        />
                        <div class="flex align-items-center gap-2">
                            <!-- view archive -->
                            <NuxtLink to="/archived-gears">
                                <PrimeButton
                                    severity="secondary"
                                    rounded
                                    :text="isLargeScreen"
                                    :outlined="!isLargeScreen"
                                    :label="
                                        isLargeScreen
                                            ? $t('ACTION_VIEW_ARCHIVES')
                                            : ''
                                    "
                                    icon="pi pi-box"
                                />
                            </NuxtLink>
                            <!-- import gears -->
                            <PrimeButton
                                severity="secondary"
                                rounded
                                outlined
                                :label="
                                    isLargeScreen
                                        ? $t('ACTION_IMPORT_GEARS')
                                        : ''
                                "
                                icon="pi pi-file-arrow-up"
                                @click="isOpenImportGearsDialog = true"
                            />
                            <!-- create gear -->
                            <PrimeButton
                                severity="secondary"
                                rounded
                                :label="
                                    isLargeScreen
                                        ? $t('ACTION_CREATE_GEAR')
                                        : $t('ACTION_CREATE')
                                "
                                icon="pi pi-plus"
                                @click="() => onCreateGear()"
                            />
                        </div>
                    </div>
                    <SearchTextInput
                        v-model="filterValue"
                        :placeholder="$t('ACTION_SEARCH_GEARS')"
                        class="flex-1 md:flex-none surface-200 border-none"
                    />
                </div>
            </div>
        </div>
        <!-- body -->
        <EmptyState
            v-if="isFiltered && !displayGears.length"
            :title="$t('INFO_NO_GEARS_FOUND')"
            image-src="/image/empty-gear.jpg"
        />
        <div v-else class="grid">
            <!-- sidebar -->
            <div :class="sidebarClass">
                <div
                    class="flex flex-column gap-1 align-items-start sticky z-1"
                    style="top: var(--app-header-height)"
                >
                    <PrimeButton
                        v-for="category in displayGearCatergories"
                        :key="category"
                        :label="`${gearCategoryToLabel(category)} (${gearsGroupByCategory[category]?.length || 0})`"
                        text
                        size="small"
                        :class="[
                            'py-2 text-color text-left w-full',
                            { 'opacity-50': !gearsGroupByCategory[category] },
                        ]"
                        @click="scrollToCategory(category)"
                    >
                        <template #icon>
                            <GearCategoryAvatar
                                :category="category"
                                size="medium"
                                class="mr-3 flex-none"
                            />
                        </template>
                    </PrimeButton>
                </div>
            </div>
            <!-- main -->
            <div :class="mainClass">
                <div class="flex flex-column gap-5">
                    <div
                        v-for="category in displayGearCatergories"
                        :id="`category-section-${category}`"
                        :key="category"
                        class="flex flex-column gap-3"
                        style="scroll-margin-top: var(--app-header-height)"
                    >
                        <CategoryHeader
                            :class="{
                                'opacity-50': !gearsGroupByCategory[category],
                            }"
                            :category="category"
                            class="py-2"
                            sticky
                            sticky-theme="app-background"
                        >
                            <template #actions>
                                <ActionButtonsGroup
                                    text
                                    type="icon"
                                    size="small"
                                    :actions="[
                                        {
                                            icon: 'pi pi-plus',
                                            label: $t('ACTION_CREATE_GEAR'),
                                            onClick: () =>
                                                onCreateGear({ category }),
                                        },
                                    ]"
                                />
                            </template>
                        </CategoryHeader>
                        <GearCardList
                            v-if="gearsGroupByCategory[category]"
                            :gears="gearsGroupByCategory[category]"
                        >
                            <template #gear-card="{ gear }">
                                <GearCardHorizontal
                                    :gear="gear"
                                    :action-items="[
                                        'edit',
                                        'archive',
                                        'delete',
                                    ]"
                                    @gear-edit="onEditGear"
                                    @gear-archive="onArchiveGear"
                                    @gear-delete="confirmDeleteGear"
                                >
                                    <template #info-left>
                                        <GearInfos
                                            :gear="gear"
                                            :infos="['weight']"
                                        />
                                    </template>
                                    <template #info-right>
                                        <GearInfos
                                            :gear="gear"
                                            :infos="[
                                                'usedCount',
                                                'price',
                                                'age',
                                            ]"
                                            class="text-color-lighter"
                                        />
                                    </template>
                                </GearCardHorizontal>
                            </template>
                        </GearCardList>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <EmptyState
        v-else
        :title="$t('INFO_NO_USER_GEARS')"
        :description="$t('INFO_NO_USER_GEARS_DESC')"
        image-src="/image/empty-gear.jpg"
    >
        <template #actions>
            <div
                class="flex flex-column lg:flex-row-reverse align-items-stretch lg:align-items-center gap-2"
            >
                <PrimeButton
                    severity="secondary"
                    rounded
                    :label="$t('ACTION_CREATE_GEAR')"
                    icon="pi pi-plus"
                    @click="() => onCreateGear()"
                />
                <PrimeButton
                    severity="secondary"
                    rounded
                    outlined
                    :label="$t('ACTION_IMPORT_GEARS')"
                    icon="pi pi-file-arrow-up"
                    @click="isOpenImportGearsDialog = true"
                />
            </div>
        </template>
    </EmptyState>
    <GearEditorDialog />
    <GearArchiveDialog />
    <ImportGearsDialog
        :is-open="isOpenImportGearsDialog"
        @close="isOpenImportGearsDialog = false"
    />
</template>

<script setup lang="ts">
definePageMeta({
    middleware: ['auth-guard'],
    layout: 'user-page',
});

const { gearCategoryToLabel } = useLangUtils();
const { isLargeScreen } = useDeviceMeta();
const i18n = useI18n();

// for GearEditor
const { onCreateGear, onEditGear } = useEditGear();
// for GearArchive
const { onArchiveGear } = useArchiveGear();
// for delete gear
const { confirmDeleteGear } = useDeleteGear();

// for display gears
const {
    visibleGears,
    isFetchingGears,
    filterValue,
    isFiltered,
    displayGears,
    gearsGroupByCategory,
    displayGearCatergories,
} = useDisplayGears();

// for ImportGearsDialog
const isOpenImportGearsDialog = ref<boolean>(false);

onMounted(() => {
    analyticsUtils.log(constants.ANALYTICS_EVENTS.VIEW_GEARS_PAGE);
});

// for scroll into view
const scrollToCategory = (category: string) => {
    const sectionElement = document.getElementById(
        `category-section-${category}`,
    );
    if (!sectionElement) {
        return;
    }
    sectionElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
    });
};

const sidebarClass = 'hidden md:block md:col-3 lg:col-2';
const mainClass = 'col-12 md:col-9 lg:col-10';

useHead({
    title: i18n.t('PAGE_GEARS'),
});
</script>
