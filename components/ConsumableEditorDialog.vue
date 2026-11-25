<template>
    <PrimeDialog
        :visible="isOpen"
        :header="
            editingConsumable
                ? $t('ACTION_EDIT_CONSUMABLE')
                : $t('ACTION_CREATE_CONSUMABLE')
        "
        modal
        class="w-full mx-2 max-w-20rem"
        @update:visible="
            (value: boolean) => {
                if (!value) {
                    $emit('cancel');
                    onCancelEditConsumable();
                }
            }
        "
    >
        <template v-if="isOpen" #default>
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
                    :autofocus="!editingConsumable"
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
                        :maxFractionDigits="constants.LIMIT.maxFractionDigits"
                        :min="constants.LIMIT.minWeight"
                        :max="constants.LIMIT.maxWeight"
                        :invalid="vuelidate.weight.$error"
                        @keypress.enter="onSubmit"
                    />
                    <WeightUnitAddon />
                </PrimeInputGroup>
            </FormField>
            <!-- quantity -->
            <FormField :label="$t('LABEL_QUANTITY')">
                <PrimeInputNumber
                    v-model="formState.quantity"
                    :min="constants.LIMIT.minQuantity"
                    :max="constants.LIMIT.maxQuantity"
                    class="text-right flex w-full"
                    @keypress.enter="onSubmit"
                    showButtons
                    buttonLayout="horizontal"
                    :step="1"
                >
                    <template #incrementbuttonicon>
                        <span class="pi pi-plus" />
                    </template>
                    <template #decrementbuttonicon>
                        <span class="pi pi-minus" />
                    </template>
                </PrimeInputNumber>
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
                        <CategoryLabel :category="slotProps.option.value" />
                    </template>
                </PrimeDropdown>
            </FormField>
        </template>
        <template #footer>
            <PrimeButton
                :label="$t('ACTION_CANCEL')"
                text
                rounded
                severity="secondary"
                :disabled="isSaving"
                @click="
                    () => {
                        $emit('cancel');
                        onCancelEditConsumable();
                    }
                "
            />
            <PrimeButton
                rounded
                :label="
                    editingConsumable ? $t('ACTION_SAVE') : $t('ACTION_CREATE')
                "
                :loading="isSaving"
                @click="onSubmit()"
            />
        </template>
    </PrimeDialog>
</template>

<script setup lang="ts">
import useVuelidate from '@vuelidate/core';

const props = defineProps<{
    tripId: string;
}>();

const emit = defineEmits<{
    'complete-create': [consumable: Consumable];
    'complete-edit': [consumable: Consumable];
    cancel: [];
}>();

const {
    isAddingConsumable,
    isEditingConsumable,
    editingConsumable,
    defaultConsumableCategory,
    onCompleteCreateConsumable,
    onCompleteEditConsumable,
    onCancelEditConsumable,
} = useEditConsumable();
const { errorToast } = useErrorToast();

const isOpen = computed(
    () => isAddingConsumable.value || isEditingConsumable.value,
);

const { consumableCategoryToLabel } = useLangUtils();
const categoryOptions = computed(() =>
    constants.CONSUMABLE_CATEGORY_KEYS.map((category) => ({
        value: category,
        label: consumableCategoryToLabel(category),
    })),
);
const userTripsStore = useUserTripsStore();
const trip = computed(() => userTripsStore.getTripById(props.tripId));

// form state and validation rules
const initialFormState = {
    name: '',
    weight: undefined,
    category: undefined,
    quantity: undefined,
};
const formState = reactive<{
    name: string;
    weight: number | undefined;
    category: ConsumableCategory | undefined;
    quantity: number | undefined;
}>({ ...initialFormState });
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
    quantity: {
        minValue: formValidators.minValue(constants.LIMIT.minQuantity),
        maxValue: formValidators.maxValue(constants.LIMIT.maxQuantity),
    },
};
const vuelidate = useVuelidate(formRules, formState, { $autoDirty: true });

watch(isOpen, (newValue) => {
    if (newValue) {
        formState.name = editingConsumable.value?.name || initialFormState.name;
        formState.weight =
            editingConsumable.value?.weight || initialFormState.weight;
        formState.category =
            editingConsumable.value?.category ||
            defaultConsumableCategory.value ||
            initialFormState.category;
        formState.quantity =
            editingConsumable.value?.quantity || initialFormState.quantity;
        vuelidate.value.$reset();
    }
});

const isSaving = ref<boolean>(false);
const onSubmit = async () => {
    const valid = await vuelidate.value.$validate();
    if (!valid) {
        return;
    }

    const consumableData: Consumable = {
        id: editingConsumable.value?.id || crypto.randomUUID(),
        name: formState.name,
        weight: formState.weight || 0,
        category: formState.category || 'others',
    };

    if (formState.quantity !== undefined && formState.quantity > 0) {
        consumableData.quantity = formState.quantity;
    }

    try {
        isSaving.value = true;
        if (editingConsumable.value) {
            await userTripsStore.updateConsumableInTrip({
                tripId: props.tripId,
                consumableId: editingConsumable.value.id,
                consumable: consumableData,
            });
            emit('complete-edit', consumableData);
            onCompleteEditConsumable();
        } else {
            await userTripsStore.addConsumableToTrip({
                tripId: props.tripId,
                consumable: consumableData,
            });
            emit('complete-create', consumableData);
            onCompleteCreateConsumable();
            analyticsUtils.log(constants.ANALYTICS_EVENTS.CREATE_CONSUMABLE, {
                consumable_category: consumableData.category,
            });
        }
    } catch (error) {
        errorToast('Failed to save consumable', error);
    } finally {
        isSaving.value = false;
    }
};
</script>
