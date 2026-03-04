<template>
    <PrimeDialog
        :visible="isOpenUserSettingsDialog"
        :header="$t('ACTION_USER_SETTINGS')"
        modal
        class="w-full mx-2 max-w-20rem"
        @update:visible="(value) => !value && closeUserSettingsDialog()"
    >
        <template v-if="isOpenUserSettingsDialog" #default>
            <!-- User Photo -->
            <FormField :label="$t('LABEL_PHOTO')">
                <ImageUploadBox
                    :width="120"
                    :aspectRatio="1"
                    :imageUrl="avatarUrl"
                    :isLoading="isSaving"
                    :compressorOptions="{
                        width: constants.LIMIT.avatarPhotoWidth,
                        height: constants.LIMIT.avatarPhotoHeight,
                        resize: 'cover',
                    }"
                    @file-compressed="(file) => (compressedPhotoFile = file)"
                    @file-removed="() => (compressedPhotoFile = null)"
                />
            </FormField>

            <!-- User Name -->
            <FormField
                :label="$t('LABEL_DISPLAY_NAME')"
                :errors="vuelidate.displayName.$errors"
                required
            >
                <PrimeInputText
                    v-model="formState.displayName"
                    class="w-full"
                    :minlength="constants.LIMIT.minNameLength"
                    :maxlength="constants.LIMIT.maxNameLength"
                    :invalid="vuelidate.displayName.$error"
                    @keypress.enter="onSubmit"
                />
            </FormField>
        </template>
        <template #footer>
            <PrimeButton
                :label="$t('ACTION_CANCEL')"
                text
                rounded
                severity="secondary"
                :disabled="isSaving"
                @click="closeUserSettingsDialog"
            />
            <PrimeButton
                :label="$t('ACTION_SAVE')"
                rounded
                :loading="isSaving"
                @click="onSubmit"
            />
        </template>
    </PrimeDialog>
</template>

<script setup lang="ts">
import useVuelidate from '@vuelidate/core';
import type { UserProfile } from 'firebase/auth';

const region = useRuntimeConfig().public.FIREBASE_FUNCTION_REGION;
const userStore = useUserStore();
const { user } = storeToRefs(userStore);
const { uploadFile } = useStorage();
const { isOpenUserSettingsDialog, closeUserSettingsDialog } =
    useUserSettingsDialog();

const initialFormState = {
    displayName: '',
};
const formState = reactive<{
    displayName: string;
}>({ ...initialFormState });

const formValidators = useFormValidators();
const formRules = {
    displayName: {
        required: formValidators.required,
        minLength: formValidators.minLength(constants.LIMIT.minNameLength),
        maxLength: formValidators.maxLength(constants.LIMIT.maxNameLength),
    },
};
const vuelidate = useVuelidate(formRules, formState, { $autoDirty: true });

const avatarUrl = computed(() => user.value?.photoURL || '');
const compressedPhotoFile = ref<Blob | null>(null);
const isSaving = ref(false);

// reset form state when dialog opens
watch(
    () => isOpenUserSettingsDialog.value,
    (newValue) => {
        if (newValue) {
            formState.displayName =
                user.value?.displayName || initialFormState.displayName;
            compressedPhotoFile.value = null;
            vuelidate.value.$reset();
        }
    },
);

async function onSubmit() {
    const valid = await vuelidate.value.$validate();
    if (!valid) return;

    isSaving.value = true;

    try {
        const newProfile: Partial<UserProfile> = {};
        let newPhotoURL = '';

        // upload photo if provided
        if (compressedPhotoFile.value) {
            const result = await uploadFile({
                path: `${constants.STORAGE_PATH.USER}/${user.value?.uid}/avatar`,
                file: compressedPhotoFile.value,
            });
            newPhotoURL = result ? result.downloadUrl : '';
        }

        // Update display name if changed
        if (formState.displayName !== user.value?.displayName) {
            newProfile.displayName = formState.displayName;
        }

        // Update photo URL if changed
        if (compressedPhotoFile.value && user.value?.photoURL !== newPhotoURL) {
            newProfile.photoURL = newPhotoURL;
        }

        if (Object.keys(newProfile).length === 0) {
            // No changes to save
            closeUserSettingsDialog();
            return;
        }

        // Update user profile
        await userStore.updateUserProfile(newProfile);

        // Also update tripShare owner info in Firestore via callable function
        try {
            const { getFunctions, httpsCallable } = await import(
                'firebase/functions'
            );
            const functions = getFunctions(undefined, region);
            const onUserProfileUpdated = httpsCallable(
                functions,
                'onUserProfileUpdated',
            );
            await onUserProfileUpdated({
                userId: user.value?.uid,
                ...newProfile,
            });
        } catch (e) {
            // Ignore error, do not block UI
        }

        closeUserSettingsDialog();
    } finally {
        isSaving.value = false;
    }
}
</script>
