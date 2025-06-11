<template>
    <PageLoading v-if="isFetchingGears" />
    <div v-else-if="archivedGears.length" class="grid">
        <div class="col-12 lg:col-10 lg:col-offset-1">
            <div class="flex flex-column gap-2 lg:gap-3">
                <!-- header -->
                <div class="py-3">
                    <GearNum
                        :num="archivedGears.length"
                        :lang-key="'INFO_ARCHIVED_GEAR_NUM'"
                    />
                </div>
                <!-- archived gears list -->
                <div class="flex flex-column gap-4">
                    <div
                        v-for="(gears, year) in archivedGearsByYear"
                        :key="year"
                        class="flex flex-column gap-2"
                    >
                        <!-- year label -->
                        <h2 class="text-color mb-2 text-xl lg:text-2xl">
                            {{ year === 'others' ? $t('LABEL_NO_DATE') : year }}
                        </h2>
                        <!-- gear cards -->
                        <GearCardList :gears="gears">
                            <template #gear-card="{ gear }">
                                <GearCardHorizontal
                                    :gear="gear"
                                    :action-items="[
                                        'edit',
                                        'edit-archive',
                                        'unarchive',
                                        'delete',
                                    ]"
                                    @gear-edit="onEditGear"
                                    @gear-edit-archive="onEditArchivedGear"
                                    @gear-unarchive="onUnarchiveGear"
                                    @gear-delete="confirmDeleteGear"
                                >
                                    <template #info-left>
                                        <GearInfos
                                            :gear="gear"
                                            :infos="[
                                                'category-avatar',
                                                'weight',
                                            ]"
                                            class="text-color-light"
                                        />
                                    </template>
                                    <template #info-right>
                                        <GearInfos
                                            :gear="gear"
                                            :infos="[
                                                'usedCount',
                                                'price',
                                                'archived',
                                            ]"
                                            class="text-color-light"
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
        :title="$t('INFO_NO_ARCHIVED_GEARS')"
        :description="$t('INFO_NO_ARCHIVED_GEARS_DESC')"
        image-src="/image/empty-gear-fade.jpg"
    />
    <GearEditorDialog />
    <GearArchiveDialog />
</template>

<script lang="ts" setup>
definePageMeta({
    middleware: ['auth-guard'],
    layout: 'sub-page',
});

const userGearsStore = useUserGearsStore();
const { isFetchingGears, archivedGears } = storeToRefs(userGearsStore);
const { unarchiveGear } = useArchiveGear();
const { confirmDeleteGear } = useDeleteGear();
const i18n = useI18n();
const toast = useToast();

// for GearEditor
const { onEditGear } = useEditGear();
// for GearArchive
const { onEditArchivedGear } = useArchiveGear();

// group archived gears by year from archived timestamp, others if archived timestamp is not available
const archivedGearsByYear = computed(() => {
    const grouped: Record<string, Gear[]> = {};
    archivedGears.value.forEach((gear) => {
        const year = gear.archived
            ? gear.archived.toDate().getFullYear().toString()
            : 'others';
        if (!grouped[year]) {
            grouped[year] = [];
        }
        grouped[year].push(gear);
    });

    // sort each group by archived timestamp
    Object.keys(grouped).forEach((year) => {
        grouped[year].sort((a, b) => {
            return (
                (b.archived ? b.archived.toDate().getTime() : 0) -
                (a.archived ? a.archived.toDate().getTime() : 0)
            );
        });
    });

    return grouped;
});

const onUnarchiveGear = async (gear: Gear) => {
    await unarchiveGear(gear);
    toast.add({
        severity: 'secondary',
        summary: i18n.t('FEEDBACK_GEAR_UNARCHIVED', { gearName: gear.name }),
        life: constants.TOAST_TTL,
    });
};
</script>
