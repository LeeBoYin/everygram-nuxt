<!-- A page to show data of a trip -->
<template>
    <SubPageAppHeader v-if="trip">
        <template #mobile-actions>
            <div class="flex gap-2">
                <TripShareButton text rounded size="small" :trip="trip" />
                <MoreActionsMenuButton
                    text
                    size="small"
                    :items="moreActionsMenuItems"
                />
            </div>
        </template>
    </SubPageAppHeader>
    <TripPageLayout v-if="trip">
        <template #header>
            <TripHeader :trip="trip">
                <template #banner-actions>
                    <ImageUploadButton
                        :path="`${constants.STORAGE_PATH.TRIP}/${trip.id}`"
                        :label="
                            trip.bannerImage
                                ? $t('ACTION_CHANGE_PHOTO')
                                : $t('ACTION_UPLOAD_PHOTO')
                        "
                        severity="contrast"
                        @upload-complete="onUploadBannerImage"
                    />
                </template>
                <template #actions>
                    <div
                        v-if="trip.isPublished || isLargeScreen"
                        class="flex gap-3"
                    >
                        <div
                            v-if="trip.isPublished"
                            class="flex align-items-center gap-1 text-color-light"
                        >
                            <i class="material-symbols-outlined">language</i>
                            <div>
                                {{ $t('INFO_TRIP_HAS_BEEN_PUBLISHED') }}
                            </div>
                        </div>
                        <div v-if="isLargeScreen" class="flex gap-2">
                            <TripShareButton
                                :trip="trip"
                                severity="contrast"
                                raised
                            />
                            <MoreActionsMenuButton
                                severity="contrast"
                                raised
                                :items="moreActionsMenuItems"
                            />
                        </div>
                    </div>
                </template>
            </TripHeader>
        </template>
        <template #side>
            <TripWeightInfo
                :gears="gearsInTrip"
                :wornGears="wornGearsInTrip"
                :consumables="consumablesInTrip"
            />
        </template>
        <template #main>
            <!-- base gears -->
            <TripGearSection :title="$t('LABEL_BASE')" :gears="gearsInTrip">
                <template #header-actions>
                    <ActionButtonsGroup
                        v-if="isLargeScreen"
                        severity="secondary"
                        text
                        type="text"
                        :actions="[
                            {
                                icon: 'pi pi-plus',
                                label: $t('ACTION_ADD_FROM_GEARS'),
                                onClick: () => {
                                    selectingGearType = 'gears';
                                    isSelectingGears = true;
                                },
                            },
                            {
                                icon: 'pi pi-plus',
                                label: $t('ACTION_CREATE'),
                                onClick: () => {
                                    creatingGearType = 'gears';
                                    onCreateGear();
                                },
                            },
                        ]"
                    />
                    <MoreActionsMenuButton
                        v-else
                        severity="secondary"
                        text
                        icon="pi-plus"
                        :items="[
                            {
                                icon: 'pi pi-plus',
                                label: $t('ACTION_ADD_FROM_GEARS'),
                                command: () => {
                                    selectingGearType = 'gears';
                                    isSelectingGears = true;
                                },
                            },
                            {
                                icon: 'pi pi-plus',
                                label: $t('ACTION_CREATE_GEAR'),
                                command: () => {
                                    creatingGearType = 'gears';
                                    onCreateGear();
                                },
                            },
                        ]"
                        size="small"
                    />
                </template>
                <template #category-body="{ gears }">
                    <GearDataTable
                        :gears="gears"
                        :hasQuantity="true"
                        :actions="[
                            'edit',
                            'edit-qty',
                            'add-to-gears',
                            'remove',
                        ]"
                        @gear-edit="onEditGear"
                        @gear-edit-quantity="
                            (gear: GearWithQuantity) => {
                                editingQuantityGearType = 'gears';
                                onEditQuantity(gear);
                            }
                        "
                        @gear-add-to-gears="
                            (gear: Gear) => onAddGearToGears(gear)
                        "
                        @gear-remove="
                            (gear: Gear) => onRemoveGear(gear, 'gears')
                        "
                        class="lg:ml-6"
                        editable
                    />
                </template>
                <template #empty-state>
                    <HintInfo :description="$t('INFO_NO_BASE_GEAR_HINT')" />
                </template>
            </TripGearSection>

            <!-- comsumables -->
            <TripConsumableSection
                :title="$t('LABEL_CONSUMABLES')"
                :consumables="consumablesInTrip"
            >
                <template #header-actions>
                    <ActionButtonsGroup
                        severity="secondary"
                        text
                        :type="isLargeScreen ? 'text' : 'icon'"
                        :actions="[
                            {
                                icon: 'pi pi-plus',
                                label: $t('ACTION_CREATE'),
                                onClick: () => onCreateConsumable(),
                            },
                        ]"
                        :size="isLargeScreen ? 'medium' : 'small'"
                    />
                </template>
                <template #category-body="{ consumables }">
                    <ConsumableDataTable
                        :consumables="consumables"
                        @consumable-edit="onEditConsumable"
                        @consumable-delete="onDeleteConsumable"
                        class="lg:ml-6"
                        editable
                    />
                </template>
                <template #empty-state>
                    <HintInfo :description="$t('INFO_NO_CONSUMABLES_HINT')" />
                </template>
            </TripConsumableSection>

            <!-- worn gears -->
            <TripGearSection
                :title="$t('LABEL_WORN_GEARS')"
                :gears="wornGearsInTrip"
            >
                <template #header-actions>
                    <ActionButtonsGroup
                        v-if="isLargeScreen"
                        severity="secondary"
                        text
                        type="text"
                        :actions="[
                            {
                                icon: 'pi pi-plus',
                                label: $t('ACTION_ADD_FROM_GEARS'),
                                onClick: () => {
                                    selectingGearType = 'wornGears';
                                    isSelectingGears = true;
                                },
                            },
                            {
                                icon: 'pi pi-plus',
                                label: $t('ACTION_CREATE'),
                                onClick: () => {
                                    creatingGearType = 'wornGears';
                                    onCreateGear({
                                        categories:
                                            constants.WEARABLE_GEAR_CATEGORY_KEYS,
                                    });
                                },
                            },
                        ]"
                    />
                    <MoreActionsMenuButton
                        v-else
                        severity="secondary"
                        text
                        icon="pi-plus"
                        :items="[
                            {
                                icon: 'pi pi-plus',
                                label: $t('ACTION_ADD_FROM_GEARS'),
                                command: () => {
                                    selectingGearType = 'wornGears';
                                    isSelectingGears = true;
                                },
                            },
                            {
                                icon: 'pi pi-plus',
                                label: $t('ACTION_CREATE_GEAR'),
                                command: () => {
                                    creatingGearType = 'wornGears';
                                    onCreateGear({
                                        categories:
                                            constants.WEARABLE_GEAR_CATEGORY_KEYS,
                                    });
                                },
                            },
                        ]"
                        size="small"
                    />
                </template>
                <template #category-body="{ gears }">
                    <GearDataTable
                        :gears="gears"
                        :hasQuantity="true"
                        :actions="[
                            'edit',
                            'edit-qty',
                            'add-to-gears',
                            'remove',
                        ]"
                        @gear-edit="onEditGear"
                        @gear-edit-quantity="
                            (gear: GearWithQuantity) => {
                                editingQuantityGearType = 'wornGears';
                                onEditQuantity(gear);
                            }
                        "
                        @gear-remove="
                            (gear: Gear) => onRemoveGear(gear, 'wornGears')
                        "
                        class="lg:ml-6"
                        editable
                    />
                </template>
                <template #empty-state>
                    <HintInfo :description="$t('INFO_NO_WORN_GEAR_HINT')" />
                </template>
            </TripGearSection>
        </template>
    </TripPageLayout>
    <PageLoading v-else-if="isFetchingTrips" />
    <EmptyState
        :title="$t('INFO_TRIP_NOT_FOUND')"
        :description="$t('INFO_TRIP_NOT_FOUND_DESC')"
        image-src="/image/illustration/illu-camping.svg"
        v-else
    >
        <template #actions>
            <PrimeButton
                :label="$t('ACTION_BACK_TO_TRIPS')"
                rounded
                @click="$router.push('/trips')"
            />
        </template>
    </EmptyState>
    <GearsSelectorDialog
        :is-open="isSelectingGears"
        :selected-gear-ids="[...selectedGearIds, ...selectedWornGearIds]"
        :categories="
            selectingGearType === 'wornGears'
                ? constants.WEARABLE_GEAR_CATEGORY_KEYS
                : undefined
        "
        :no-gear-hint="
            selectingGearType === 'wornGears'
                ? $t('INFO_NO_USER_WEARABLE_GEARS')
                : $t('INFO_NO_USER_GEARS')
        "
        :no-selectable-hint="
            selectingGearType === 'wornGears'
                ? $t('INFO_ALL_WEARABLE_GEARS_HAVE_BEEN_ADDED_TO_TRIP')
                : $t('INFO_ALL_GEARS_HAVE_BEEN_ADDED_TO_TRIP')
        "
        @complete="onCompletSelectGears"
        @cancel="isSelectingGears = false"
    />
    <GearEditorDialog
        :is-in-trip-page="true"
        @complete-create="onCompleteCreateGearInTrip"
    />
    <GearQuantityEditorDialog @complete-edit="onCompleteEditQuantity" />
    <TripInfoEditorDialog />
    <ConsumableEditorDialog :tripId="tripId" />
</template>

<script setup lang="ts">
definePageMeta({
    middleware: ['auth-guard'],
    layout: 'sub-page',
});
const userTripsStore = useUserTripsStore();
const { trips, isFetchingTrips } = storeToRefs(userTripsStore);
const userGearsStore = useUserGearsStore();
const { gearMap } = storeToRefs(userGearsStore);
const i18n = useI18n();
const toast = useToast();

const route = useRoute();
const tripId = route.params.id as string;
const trip = computed(() =>
    trips.value.find((trip: Trip) => trip.id === tripId),
);

//  gears
const gearsInTrip = computed<GearWithQuantity[]>(() =>
    trip.value
        ? _map(dataUtils.getGearsInTrip(trip.value, gearMap.value), (gear) => ({
              ...gear,
              quantity: trip.value?.gears[gear.id]?.quantity || 0,
          }))
        : [],
);

// worn gears
const wornGearsInTrip = computed<GearWithQuantity[]>(() =>
    trip.value
        ? _map(
              dataUtils.getWornGearsInTrip(trip.value, gearMap.value),
              (gear) => ({
                  ...gear,
                  quantity: trip.value?.wornGears[gear.id]?.quantity || 0,
              }),
          )
        : [],
);

// consumables
const consumablesInTrip = computed<Consumable[]>(() =>
    trip.value ? _values(trip.value.consumables) : [],
);

// for gear selector
const isSelectingGears = ref<boolean>(false);
const selectingGearType = ref<TripGearType>('gears');
const selectedGearIds = computed(() =>
    trip.value ? Object.keys(trip.value.gears) : [],
);
const selectedWornGearIds = computed(() =>
    trip.value ? Object.keys(trip.value.wornGears) : [],
);
const onCompletSelectGears = (selectedGears: TripGear[]) => {
    userTripsStore.setGearsToTrip(
        tripId,
        selectedGears,
        selectingGearType.value,
    );
    isSelectingGears.value = false;
};

// for GearEditor
const { onCreateGear, onEditGear, isEditingGear } = useEditGear();
const creatingGearType = ref<TripGearType>('gears');
const onCompleteCreateGearInTrip = (gear: Gear) => {
    userTripsStore.setGearsToTrip(
        tripId,
        [{ id: gear.id, quantity: 1 }],
        creatingGearType.value,
    );
};

// for GearQuantityEditor
const { onEditQuantity, editingGearWithQuantity } = useEditQuantity();
const editingQuantityGearType = ref<TripGearType>('gears');
const onCompleteEditQuantity = (quantity: number) => {
    if (!editingGearWithQuantity.value) {
        return;
    }
    userTripsStore.setGearsToTrip(
        tripId,
        [
            {
                id: editingGearWithQuantity.value.id,
                quantity,
            },
        ],
        editingQuantityGearType.value,
    );
};

const onAddGearToGears = async (gear: Gear) => {
    if (!gear.isForOneTrip) {
        return;
    }
    await userGearsStore.updateGear({
        id: gear.id,
        gearData: {
            isForOneTrip: false,
        },
    });
    toast.add({
        severity: 'secondary',
        summary: i18n.t('INFO_GEAR_ADDED_TO_GEARS', {
            gearName: gear.name,
        }),
        life: constants.TOAST_TTL,
    });
};

const onRemoveGear = async (gear: Gear, type: TripGearType) => {
    if (gear.isForOneTrip) {
        confirmDeleteDialog({
            message: i18n.t('MESSAGE_CONFIRM_DELETE_GEAR_FROM_TRIP', {
                gearName: gear.name,
            }),
            header: i18n.t('ACTION_REMOVE_FROM_TRIP'),
            toastSummary: i18n.t('FEEDBACK_GEAR_DELETED_FROM_TRIP'),
            onAccept: async () => {
                try {
                    await userTripsStore.removeGearsFromTrip(
                        tripId,
                        [gear.id],
                        type,
                    );
                    await userGearsStore.deleteGear(gear.id);
                } catch (error) {
                    console.error(error);
                }
            },
        });
    } else {
        await userTripsStore.removeGearsFromTrip(tripId, [gear.id], type);
    }
};

// for TripInfoEditor
const { onEditTrip } = useEditTrip();

// consumables
const { onCreateConsumable, onEditConsumable } = useEditConsumable();

const { confirmDeleteDialog } = useUiUitls();
const onDeleteConsumable = (consumable: Consumable) => {
    confirmDeleteDialog({
        message: i18n.t('MESSAGE_CONFIRM_DELETE_CONSUMABLE', {
            consumableName: consumable.name,
        }),
        header: i18n.t('ACTION_DELETE_CONSUMABLE'),
        toastSummary: i18n.t('FEEDBACK_CONSUMABLE_DELETED'),
        onAccept: async () => {
            await userTripsStore.deleteConsumableFromTrip({
                tripId,
                consumableId: consumable.id,
            });
        },
    });
};

const { confirmDeleteTrip } = useDeleteTrip();

const moreActionsMenuItems = [
    {
        icon: 'pi pi-pencil',
        label: i18n.t('ACTION_EDIT_TRIP'),
        command: () => trip.value && onEditTrip(trip.value),
    },
    {
        icon: 'pi pi-trash',
        label: i18n.t('ACTION_DELETE_TRIP'),
        severity: 'danger',
        command: () => trip.value && confirmDeleteTrip(trip.value),
    },
];

const onUploadBannerImage = ({
    downloadUrl,
    fileName,
}: {
    downloadUrl: string;
    fileName: string;
}) => {
    if (trip.value) {
        userTripsStore.updateTrip({
            id: trip.value.id,
            tripData: {
                bannerImage: {
                    url: downloadUrl,
                    fileName,
                },
            },
        });
        analyticsUtils.log(
            constants.ANALYTICS_EVENTS.UPLOAD_TRIP_BANNER_IMAGE,
            {
                trip_id: trip.value.id,
            },
        );
    }
};

useHead({
    title: () => {
        if (isFetchingTrips.value) return null;
        return trip.value
            ? i18n.t('META_TRIP_TITLE', { title: trip.value.title })
            : i18n.t('META_TRIP_NOT_FOUND_TITLE');
    },
});

const { isLargeScreen } = useDeviceMeta();
</script>
