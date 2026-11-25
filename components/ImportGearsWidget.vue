<template>
    <div class="flex flex-column gap-4">
        <Panel>
            <div class="flex flex-column gap-3">
                <h3>
                    {{ title }}
                </h3>
                <slot name="message" />
                <!-- actions -->
                <div class="flex gap-2 justify-content-between mt-3">
                    <PrimeButton
                        size="small"
                        rounded
                        :label="$t('ACTION_BACK')"
                        icon="pi pi-arrow-left"
                        text
                        @click="$emit('back')"
                    />
                    <PrimeButton
                        size="small"
                        rounded
                        :label="
                            $t(
                                'ACTION_IMPORT_NUM_GEARS',
                                { num: selectedCount },
                                selectedCount,
                            )
                        "
                        icon="pi pi-download"
                        :loading="isImporting"
                        :disabled="
                            isLoading || selectedCount === 0 || isImporting
                        "
                        @click="onImport"
                    />
                </div>
            </div>
        </Panel>
        <div class="flex justify-content-end gap-2">
            <PrimeButton
                size="small"
                rounded
                :label="$t('ACTION_SELECT_ALL')"
                icon="pi pi-check"
                outlined
                @click="selected.fill(true)"
            />
            <PrimeButton
                size="small"
                rounded
                :label="$t('ACTION_DESELECT_ALL')"
                icon="pi pi-times"
                outlined
                @click="selected.fill(false)"
            />
        </div>
        <GearCardList v-if="isLoading" :gears="fakeGears">
            <template #gear-card>
                <GearCardHorizontalSkeleton />
            </template>
        </GearCardList>
        <GearCardList
            v-else-if="importableGears.length > 0"
            :gears="importableGears"
        >
            <template #gear-card="{ gear, index }">
                <GearCardHorizontalSelectable
                    :gear="gear"
                    :selected="selected[index]"
                    @toggle="selected[index] = !selected[index]"
                >
                    <template #info-left>
                        <GearInfos
                            :gear="gear"
                            :infos="['category', 'weight']"
                        />
                    </template>
                    <template #info-right>
                        <GearInfos
                            :gear="gear"
                            :infos="['price']"
                            class="text-color-lighter"
                        />
                    </template>
                </GearCardHorizontalSelectable>
            </template>
        </GearCardList>
        <EmptyState
            v-else
            :title="$t('INFO_NO_GEARS_FROM_LIGHTERPACK')"
            :description="$t('INFO_NO_GEARS_FROM_LIGHTERPACK_DESC')"
            image-src="/image/empty-gear-fade.jpg"
        />
    </div>
</template>

<script lang="ts" setup>
import { useToast } from 'primevue/usetoast';
const props = defineProps<{
    title: string;
    isLoading: boolean;
    importableGears: Gear[];
}>();

const emit = defineEmits<{
    back: [];
    complete: [];
}>();

const i18n = useI18n();
const toast = useToast();
const userGearsStore = useUserGearsStore();
const { errorToast } = useErrorToast();

const fakeGears = Array.from({ length: 10 }, () =>
    dataUtils.convertedEditingGearToTempGear({}),
);
const isImporting = ref(false);
const selected = ref<boolean[]>([]);
const selectedCount = computed(() => selected.value.filter(Boolean).length);

// when importableGears changes, we reset the selected array
watch(
    () => props.isLoading,
    (newVal) => {
        if (!newVal) {
            selected.value = Array(props.importableGears.length).fill(true);
        }
    },
    { immediate: true },
);

const onImport = async () => {
    const selectedGears = props.importableGears.filter(
        (_, idx) => selected.value[idx],
    );
    if (selectedGears.length === 0) {
        return;
    }

    try {
        isImporting.value = true;
        await userGearsStore.createGears(selectedGears);
        toast.add({
            severity: 'secondary',
            summary: i18n.t(
                'FEEDBACK_GEARS_IMPORTED',
                {
                    num: selectedGears.length,
                },
                selectedGears.length,
            ),
            life: constants.TOAST_TTL,
        });
        emit('complete');
    } catch (error) {
        errorToast('Failed to import gears', error);
    } finally {
        isImporting.value = false;
    }
};
</script>
