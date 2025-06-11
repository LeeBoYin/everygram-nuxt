<template>
    <PrimeDialog
        :visible="isOpen"
        :header="$t('ACTION_ARCHIVE_GEAR')"
        modal
        class="w-full mx-2 max-w-20rem"
        @update:visible="onCancel"
    >
        <template v-if="isOpen && archivingGear" #default>
            <GearLabel :gear="archivingGear" class="mt-1 mb-4" />
            <!-- Archive reason selection -->
            <FormField
                :label="$t('LABEL_ARCHIVE_REASON')"
                :errors="vuelidate.archiveReason.$errors"
                required
            >
                <PrimeDropdown
                    v-model="formState.archiveReason"
                    :options="reasonOptions"
                    optionValue="value"
                    optionLabel="label"
                    class="w-full"
                    :invalid="vuelidate.archiveReason.$error"
                />
            </FormField>
            <!-- Archive note input -->
            <FormField :label="$t('LABEL_ARCHIVE_NOTE')">
                <PrimeInputText
                    v-model="formState.archiveNote"
                    class="w-full"
                    :maxlength="constants.LIMIT.maxGearArchiveNoteLength"
                    @keypress.enter="onSubmit"
                />
            </FormField>
            <HintInfo
                v-if="!isEditingArchivedGear"
                :description="$t('INFO_ARCHIVE_GEAR_HINT')"
                size="xs"
            />
        </template>
        <template #footer>
            <PrimeButton
                :label="$t('ACTION_CANCEL')"
                text
                rounded
                severity="secondary"
                :disabled="isSaving"
                @click="onCancel"
            />
            <PrimeButton
                :label="
                    isEditingArchivedGear
                        ? $t('ACTION_SAVE')
                        : $t('ACTION_ARCHIVE')
                "
                rounded
                :loading="isSaving"
                @click="onSubmit"
            />
        </template>
    </PrimeDialog>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import useArchiveGear from '~/composables/use-archive-gear';
import useVuelidate from '@vuelidate/core';

const emit = defineEmits<{
    'complete-archive': [gear: Gear];
    cancel: [];
}>();

const {
    isOpenArchiveGearDialog,
    isEditingArchivedGear,
    archivingGear,
    onCancelArchiveGear,
    onCompleteArchiveGear,
    archiveGear,
} = useArchiveGear();

const userGearsStore = useUserGearsStore();
const isSaving = ref(false);
const i18n = useI18n();
const toast = useToast();

const initialFormState = {
    archiveReason: null,
    archiveNote: '',
};
const formState = reactive<{
    archiveReason: GearArchiveReason | null;
    archiveNote: string;
}>({ ...initialFormState });

const formValidators = useFormValidators();
const formRules = {
    archiveReason: {
        required: formValidators.required,
    },
    archiveNote: {
        maxLength: formValidators.maxLength(
            constants.LIMIT.maxGearArchiveNoteLength,
        ),
    },
};
const vuelidate = useVuelidate(formRules, formState, { $autoDirty: true });

const reasonOptions: { value: GearArchiveReason; label: string }[] = [
    { value: 'unused', label: i18n.t('LABEL_ARCHIVE_REASON_UNUSED') },
    { value: 'lost', label: i18n.t('LABEL_ARCHIVE_REASON_LOST') },
    { value: 'broken', label: i18n.t('LABEL_ARCHIVE_REASON_BROKEN') },
    { value: 'sold', label: i18n.t('LABEL_ARCHIVE_REASON_SOLD') },
    { value: 'given', label: i18n.t('LABEL_ARCHIVE_REASON_GIVEN') },
    { value: 'trashed', label: i18n.t('LABEL_ARCHIVE_REASON_TRASHED') },
    { value: 'other', label: i18n.t('LABEL_ARCHIVE_REASON_OTHER') },
];

const isOpen = computed(
    () => isOpenArchiveGearDialog.value && !!archivingGear.value,
);

watch(
    () => isOpen.value,
    (val) => {
        if (val && archivingGear.value) {
            formState.archiveReason =
                archivingGear.value.archiveReason ||
                initialFormState.archiveReason;
            formState.archiveNote =
                archivingGear.value.archiveNote || initialFormState.archiveNote;
            vuelidate.value.$reset();
        } else {
            Object.assign(formState, initialFormState);
        }
    },
);

const onCancel = () => {
    emit('cancel');
    onCancelArchiveGear();
};

const onSubmit = async () => {
    if (!archivingGear.value) return;
    if (!(await vuelidate.value.$validate()) || !formState.archiveReason)
        return;

    isSaving.value = true;

    try {
        await archiveGear({
            gear: archivingGear.value,
            archiveReason: formState.archiveReason,
            archiveNote: formState.archiveNote,
        });

        emit(
            'complete-archive',
            userGearsStore.getGearById(archivingGear.value.id),
        );

        toast.add({
            severity: 'secondary',
            summary: i18n.t('FEEDBACK_GEAR_ARCHIVED', {
                gearName: archivingGear.value.name,
            }),
            life: constants.TOAST_TTL,
        });

        onCompleteArchiveGear();
    } catch (e) {
        // handle error (optional)
    } finally {
        isSaving.value = false;
    }
};
</script>
