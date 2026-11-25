<template>
    <PrimeDialog
        :visible="isOpen"
        :header="
            editingGear ? $t('ACTION_EDIT_GEAR') : $t('ACTION_CREATE_GEAR')
        "
        modal
        class="w-full mx-2 max-w-30rem"
        @update:visible="
            (value: boolean) => {
                if (!value) {
                    $emit('cancel');
                    onCancelEditGear();
                }
            }
        "
    >
        <template v-if="isOpen" #default>
            <div class="grid">
                <!-- primary data: left column -->
                <div class="col-12 lg:col-6">
                    <!-- name -->
                    <FormField
                        :label="$t('LABEL_NAME')"
                        :errors="vuelidate.name.$errors"
                        required
                    >
                        <PrimeInputText
                            v-model="formState.name"
                            class="w-full"
                            :minlength="constants.LIMIT.minNameLength"
                            :maxlength="constants.LIMIT.maxNameLength"
                            :autofocus="!editingGear"
                            :invalid="vuelidate.name.$error"
                            @keypress.enter="onSubmit"
                        />
                    </FormField>
                    <!-- weight -->
                    <FormField
                        :label="$t('LABEL_WEIGHT')"
                        :errors="vuelidate.weight.$errors"
                    >
                        <PrimeInputGroup>
                            <PrimeInputNumber
                                v-model="formState.weight"
                                class="w-full text-right"
                                :maxFractionDigits="
                                    constants.LIMIT.maxFractionDigits
                                "
                                :min="constants.LIMIT.minWeight"
                                :max="constants.LIMIT.maxWeight"
                                :invalid="vuelidate.weight.$error"
                                @keypress.enter="onSubmit"
                            />
                            <WeightUnitAddon />
                        </PrimeInputGroup>
                    </FormField>
                    <!-- brand -->
                    <FormField :label="$t('LABEL_BRAND')">
                        <GearBrandDropdown
                            v-model="formState.brand"
                            class="w-full"
                        />
                    </FormField>
                    <!-- category -->
                    <FormField :label="$t('LABEL_CATEGORY')">
                        <PrimeDropdown
                            v-model="formState.category"
                            :options="categoryOptions"
                            optionLabel="label"
                            optionValue="value"
                            :placeholder="$t('ACTION_SELECT_A_CATEGORY')"
                            class="w-full"
                        >
                            <template #value="slotProps">
                                <CategoryLabel
                                    v-if="slotProps.value"
                                    :category="slotProps.value"
                                />
                                <span v-else>
                                    {{ slotProps.placeholder }}
                                </span>
                            </template>
                            <template #option="slotProps">
                                <CategoryLabel
                                    :category="slotProps.option.value"
                                />
                            </template>
                        </PrimeDropdown>
                    </FormField>
                    <!-- photo upload -->
                    <FormField :label="$t('LABEL_PHOTO')">
                        <ImageUploadBox
                            :width="120"
                            :aspectRatio="1"
                            :imageUrl="gearPhotoUrl"
                            :isLoading="isSaving"
                            :compressorOptions="{
                                width: constants.LIMIT.gearPhotoWidth,
                                height: constants.LIMIT.gearPhotoHeight,
                                resize: 'cover',
                            }"
                            @file-compressed="
                                (file) => (compressedPhotoFile = file)
                            "
                            @file-removed="() => (compressedPhotoFile = null)"
                        />
                    </FormField>
                </div>
                <div class="col-12 lg:hidden">
                    <HorizontalLine />
                </div>
                <!-- secondary data: right column -->
                <div class="col-12 lg:col-6">
                    <!-- price -->
                    <FormField :label="$t('LABEL_PRICE')">
                        <PrimeInputGroup>
                            <PrimeDropdown
                                v-model="formState.currency"
                                :options="currencyOptions"
                                optionLabel="code"
                                optionValue="code"
                                class="w-auto"
                                :pt="{
                                    input: {
                                        class: 'w-4rem',
                                    },
                                    trigger: {
                                        class: 'hidden',
                                    },
                                }"
                                :tabindex="-1"
                            />
                            <PrimeInputNumber
                                v-model="formState.price"
                                :min="0"
                                :maxFractionDigits="
                                    constants.CURRENCIES[formState.currency]
                                        .fraction
                                "
                                :invalid="vuelidate.price?.$error"
                                class="w-full text-right"
                                @keypress.enter="onSubmit"
                            />
                        </PrimeInputGroup>
                    </FormField>
                    <!-- date -->
                    <FormField :label="$t('LABEL_ACQUIRED_DATE')">
                        <PrimeCalendar
                            v-model="formState.acquiredDate"
                            class="w-full"
                            :dateFormat="constants.DATE_FORMAT"
                            :placeholder="constants.DATE_PLACEHOLDER"
                            @keypress.enter="onSubmit"
                        />
                    </FormField>
                    <!-- description -->
                    <FormField :label="$t('LABEL_DESCRIPTION')">
                        <PrimeTextarea
                            v-model="formState.description"
                            :maxlength="
                                constants.LIMIT.maxGearDescriptionLength
                            "
                            rows="1"
                            class="w-full"
                            autoResize
                        />
                    </FormField>
                    <!-- private note -->
                    <FormField :label="$t('LABEL_PRIVATE_NOTE')">
                        <PrimeTextarea
                            v-model="formState.privateNote"
                            :maxlength="
                                constants.LIMIT.maxGearDescriptionLength
                            "
                            rows="1"
                            class="w-full"
                            autoResize
                        />
                    </FormField>
                </div>
            </div>
        </template>
        <template #footer>
            <!-- Checkbox for adding the new gear to the users gears when creating gear in trip page, checked by default -->
            <div
                class="flex align-self-center gap-2 w-full"
                v-if="props.isInTripPage && !editingGear"
            >
                <PrimeCheckbox
                    v-model="formState.addToGears"
                    inputId="for-one-trip"
                    binary
                />
                <label for="for-one-trip">
                    {{ $t('LABEL_ADD_TO_GEARS') }}
                </label>
            </div>
            <!-- Hint for editing gear -->
            <HintInfo
                v-else-if="isEditingGear && !editingGear?.isForOneTrip"
                :description="
                    props.isInTripPage
                        ? $t('INFO_EDIT_GEAR_SYNC_TO_GEARS')
                        : $t('INFO_EDIT_GEAR_SYNC_TO_TRIPS')
                "
                class="align-self-center w-full"
                size="sm"
            />
            <PrimeButton
                v-else
                :label="$t('ACTION_CANCEL')"
                text
                rounded
                severity="secondary"
                :disabled="isSaving"
                @click="
                    () => {
                        $emit('cancel');
                        onCancelEditGear();
                    }
                "
            />
            <PrimeButton
                :label="editingGear ? $t('ACTION_SAVE') : $t('ACTION_CREATE')"
                rounded
                :loading="isSaving"
                class="flex-shrink-0"
                @click="onSubmit"
            />
        </template>
    </PrimeDialog>
</template>

<script setup lang="ts">
import { intersection as _intersection } from 'lodash-es';
import useVuelidate from '@vuelidate/core';

const props = defineProps<{
    isInTripPage?: boolean;
}>();

const emit = defineEmits<{
    'complete-create': [gear: Gear];
    'complete-edit': [gear: Gear];
    cancel: [];
}>();

const {
    onCompleteCreateGear,
    onCompleteEditGear,
    onCancelEditGear,
    isAddingGear,
    isEditingGear,
    editingGear,
    defaultGearCategory,
    categories,
} = useEditGear();

const isOpen = computed(() => isAddingGear.value || isEditingGear.value);
const selectableCategories = computed(() =>
    categories.value
        ? _intersection(constants.GEAR_CATEGORY_KEYS, categories.value)
        : constants.GEAR_CATEGORY_KEYS,
);
const { gearCategoryToLabel } = useLangUtils();
const categoryOptions = computed(() =>
    selectableCategories.value.map((category) => ({
        value: category,
        label: gearCategoryToLabel(category),
    })),
);

// form state and validation rules
const initialFormState = {
    name: '',
    weight: undefined as number | undefined,
    brand: undefined as string | undefined,
    category: undefined as GearCategory | undefined,
    addToGears: true,
    description: '',
    privateNote: '',
    price: undefined as number | undefined,
    currency: constants.DEFAULT_CURRENCY_CODE as CurrencyCode,
    acquiredDate: undefined as Date | undefined,
};
const formState = reactive({ ...initialFormState });
const formValidators = useFormValidators();
const formRules = {
    name: {
        required: formValidators.required,
        minLength: formValidators.minLength(constants.LIMIT.minNameLength),
        maxLength: formValidators.maxLength(constants.LIMIT.maxNameLength),
    },
    weight: {
        minValue: formValidators.minValue(constants.LIMIT.minWeight),
        maxValue: formValidators.maxValue(constants.LIMIT.maxWeight),
    },
    price: {
        minValue: formValidators.minValue(0),
    },
    description: {
        maxLength: formValidators.maxLength(
            constants.LIMIT.maxGearDescriptionLength,
        ),
    },
    privateNote: {
        maxLength: formValidators.maxLength(
            constants.LIMIT.maxGearDescriptionLength,
        ),
    },
};
const vuelidate = useVuelidate(formRules, toRefs(formState), {
    $autoDirty: true,
});
const currencyOptions = computed(() =>
    Object.keys(constants.CURRENCIES).map(
        (code) => constants.CURRENCIES[code as CurrencyCode],
    ),
);

watch(isOpen, (newValue) => {
    if (newValue) {
        formState.name = editingGear.value?.name ?? initialFormState.name;
        formState.weight = editingGear.value?.weight || initialFormState.weight; // empty if not set or 0
        formState.brand =
            editingGear.value?.brand?.key ??
            editingGear.value?.brand?.custom ??
            initialFormState.brand;
        formState.category =
            editingGear.value?.category ??
            defaultGearCategory.value ??
            initialFormState.category;
        formState.addToGears = initialFormState.addToGears;
        formState.description =
            editingGear.value?.description ?? initialFormState.description;
        formState.privateNote =
            editingGear.value?.privateNote ?? initialFormState.privateNote;
        formState.price = editingGear.value?.price ?? initialFormState.price;
        formState.currency =
            editingGear.value?.currency ??
            (userMeta.value?.currency || initialFormState.currency);
        formState.acquiredDate = editingGear.value?.acquiredDate
            ? new Date(editingGear.value.acquiredDate)
            : initialFormState.acquiredDate;
        compressedPhotoFile.value = null;
        vuelidate.value.$reset();
    }
});

const isSaving = ref<boolean>(false);
const userMetaStore = useUserMetaStore();
const { userMeta } = storeToRefs(userMetaStore);
const userGearsStore = useUserGearsStore();
const { gears } = storeToRefs(userGearsStore);
const gearPhotoUrl = computed(() =>
    editingGear.value ? dataUtils.getGearPhotoUrl(editingGear.value, 'sm') : '',
);
const compressedPhotoFile = ref<Blob | null>(null);
const { uploadFile } = useStorage();
const { errorToast } = useErrorToast();
const onSubmit = async () => {
    const valid = await vuelidate.value.$validate();
    if (!valid) {
        return;
    }

    const gearData = dataUtils.formatFormStateToEditingGear(formState);

    // if not adding to gears, set isForOneTrip to true
    if (props.isInTripPage && !isEditingGear.value && !formState.addToGears) {
        gearData.isForOneTrip = true;
    }

    try {
        isSaving.value = true;

        if (editingGear.value) {
            // upload gear photo first
            if (compressedPhotoFile.value) {
                try {
                    const result = await uploadFile({
                        path: `${constants.STORAGE_PATH.GEAR}/${editingGear.value.id}`,
                        file: compressedPhotoFile.value,
                    });
                    if (result) {
                        gearData.photo = {
                            url: result.downloadUrl,
                            fileName: result.fileName,
                        };
                    } else {
                        throw new Error('Photo upload failed');
                    }
                } catch (error) {
                    errorToast('Failed to upload photo', error);
                    // Optionally show error to user
                    isSaving.value = false;
                    return;
                }
            }
            // update gear
            try {
                await userGearsStore.updateGear({
                    id: editingGear.value.id,
                    gearData,
                });
            } catch (error) {
                errorToast('Failed to update gear', error);
                isSaving.value = false;
                return;
            }
            emit(
                'complete-edit',
                userGearsStore.getGearById(editingGear.value.id),
            );
            onCompleteEditGear();
        } else {
            // create new gear first
            let newGear;
            try {
                newGear = await userGearsStore.createGear(gearData);
                if (!newGear) {
                    throw new Error('Failed to add gear');
                }
            } catch (error) {
                errorToast('Failed to create gear', error);
                isSaving.value = false;
                return;
            }

            if (!newGear) {
                errorToast('New gear creation returned null');
                isSaving.value = false;
                return;
            }

            // upload gear photo
            if (compressedPhotoFile.value) {
                try {
                    const result = await uploadFile({
                        path: `${constants.STORAGE_PATH.GEAR}/${newGear.id}`,
                        file: compressedPhotoFile.value,
                    });
                    if (result) {
                        const photo = {
                            url: result.downloadUrl,
                            fileName: result.fileName,
                        };
                        try {
                            await userGearsStore.updateGear({
                                id: newGear.id,
                                gearData: {
                                    photo,
                                },
                            });
                            newGear.photo = photo;
                        } catch (error) {
                            errorToast('Failed to update gear photo', error);
                            isSaving.value = false;
                            return;
                        }
                    } else {
                        throw new Error('Photo upload failed');
                    }
                } catch (error) {
                    errorToast('Failed to upload photo', error);
                    isSaving.value = false;
                    return;
                }
            }
            emit('complete-create', newGear);
            onCompleteCreateGear();
            analyticsUtils.log(constants.ANALYTICS_EVENTS.CREATE_GEAR, {
                gear_category: gearData.category,
                user_gear_num: gears.value.length,
            });
        }

        // save selected currency to user profile
        if (
            gearData.currency &&
            (!editingGear.value ||
                editingGear.value.currency !== gearData.currency)
        ) {
            try {
                await userMetaStore.updateUserMeta({
                    currency: gearData.currency,
                });
            } catch (error) {
                errorToast('Failed to update user currency', error);
            }
        }
    } catch (error) {
        errorToast('An error occurred while saving the gear', error);
    } finally {
        isSaving.value = false;
    }
};
</script>
