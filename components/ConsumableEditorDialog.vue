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
            <FormField :label="$t('LABEL_CATEGORY')">
                <PrimeDropdown
                    v-model="formState.category"
                    :options="
                        constants.CONSUMABLE_CATEGORY_KEYS.map((category) => ({
                            value: category,
                        }))
                    "
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
// @ts-ignore
import { v4 as uuid } from 'uuid';

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

const isOpen = computed(
    () => isAddingConsumable.value || isEditingConsumable.value,
);

const { consumableCategoryToLabel } = useLangUtils();
const userTripsStore = useUserTripsStore();
const trip = computed(() => userTripsStore.getTripById(props.tripId));

// form state and validation rules
const initialFormState = {
    name: '',
    weight: undefined,
    category: undefined,
};
const formState = reactive<{
    name: string;
    weight: number | undefined;
    category: ConsumableCategory | undefined;
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
        vuelidate.value.$reset();
    }
});

const isSaving = ref<boolean>(false);
const onSubmit = async () => {
    const valid = await vuelidate.value.$validate();
    if (!valid) {
        return;
    }

    const consumableData = {
        id: editingConsumable.value?.id || uuid(),
        name: formState.name,
        weight: formState.weight || 0,
        category: formState.category || 'others',
    };

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
        console.error(error);
    } finally {
        isSaving.value = false;
    }
};
</script>
