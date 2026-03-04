<template>
    <div class="grid">
        <div class="col-12 lg:col-10 lg:col-offset-1">
            <Panel v-if="activeStep === 0">
                <div class="flex flex-column gap-3">
                    <h3>
                        {{ $t('ACTION_IMPORT_GEARS_FROM_LIGHTERPACK') }}
                    </h3>
                    <div class="grid lg:flex-row-reverse">
                        <!-- form -->
                        <div class="col-12 lg:col-6">
                            <div class="flex flex-column gap-3">
                                <FormField
                                    :label="$t('LABEL_LIGHTERPACK_URL')"
                                    required
                                    :errors="vuelidate.lighterpackUrl.$errors"
                                >
                                    <PrimeInputText
                                        id="lighterpack-url"
                                        v-model="formState.lighterpackUrl"
                                        type="text"
                                        placeholder="https://lighterpack.com/r/xxxxxx"
                                        class="w-full"
                                        :invalid="
                                            vuelidate.lighterpackUrl.$error
                                        "
                                        @keypress.enter="onStart"
                                    />
                                </FormField>
                                <FormField
                                    :label="$t('LABEL_LIGHTERPACK_CURRENCY')"
                                >
                                    <PrimeDropdown
                                        v-model="formState.currency"
                                        :options="currencyOptions"
                                        optionLabel="code"
                                        optionValue="code"
                                        class="w-full"
                                    />
                                </FormField>
                                <!-- form actions -->
                                <div class="flex gap-2 justify-content-end">
                                    <PrimeButton
                                        size="small"
                                        :label="$t('ACTION_CANCEL')"
                                        text
                                        severity="secondary"
                                        outlined
                                        rounded
                                        @click="
                                            hasLastVisited
                                                ? $router.back()
                                                : $router.push('/gears')
                                        "
                                    />
                                    <PrimeButton
                                        size="small"
                                        :label="$t('ACTION_START')"
                                        icon="pi pi-arrow-right"
                                        iconPos="right"
                                        rounded
                                        @click="onStart"
                                    />
                                </div>
                            </div>
                        </div>
                        <div class="col-12 lg:hidden">
                            <HorizontalLine />
                        </div>
                        <!-- instructions -->
                        <div class="col-12 lg:col-6">
                            <ul class="pl-5 line-height-3">
                                <li
                                    v-for="item in $t(
                                        'INFO_IMPORT_LIGHTERPACK_GEARS_DESC',
                                        {
                                            max: constants.LIMIT.importLimit,
                                        },
                                    ).split(';')"
                                >
                                    {{ item }}
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </Panel>
            <ImportGearsWidget
                v-else
                :title="$t('ACTION_IMPORT_GEARS_FROM_LIGHTERPACK')"
                :is-loading="isLoading"
                :importable-gears="importableGears"
                @back="onBack"
                @complete="$router.push('/gears')"
            >
                <template #message>
                    <p v-if="isLoading">
                        {{ $t('INFO_LOADING_LIGHTERPACK_DATA') }}
                    </p>
                    <p v-else-if="hasErrorInProcess" class="text-danger">
                        {{ $t('ERROR_FAILED_TO_IMPORT_LIGHTERPACK_DATA') }}
                    </p>
                    <p v-else>
                        {{
                            $t('INFO_IMPORT_GEARS_FROM_LIGHTERPACK', {
                                num: importableGears.length,
                            })
                        }}
                    </p>
                </template>
            </ImportGearsWidget>
        </div>
    </div>
</template>

<script lang="ts" setup>
import useVuelidate from '@vuelidate/core';
import { helpers } from '@vuelidate/validators';

definePageMeta({
    middleware: ['auth-guard'],
    layout: 'sub-page',
});

const region = useRuntimeConfig().public.FIREBASE_FUNCTION_REGION;
const { convertLighterpackGears } = useConvertLighterpackGears();
const { hasLastVisited } = useNavigation();
const i18n = useI18n();
const { errorToast } = useErrorToast();
const currencyOptions = Object.values(constants.CURRENCIES);

const userMetaStore = useUserMetaStore();
const { userMeta } = storeToRefs(userMetaStore);
const activeStep = ref(0);
const isLoading = ref(false);
const hasErrorInProcess = ref(false);
const convertedGears = ref<EditingGear[]>([]);
const importableGears = ref<Gear[]>([]);
const formState = reactive({
    lighterpackUrl: '',
    currency: constants.DEFAULT_CURRENCY_CODE as CurrencyCode,
});

// form validation
const urlPattern = /^https:\/\/lighterpack\.com\/r\/[a-zA-Z0-9]+$/;
const formValidators = useFormValidators();
const formRules = {
    lighterpackUrl: {
        required: formValidators.required,
        validUrl: helpers.withMessage(
            i18n.t('ERROR_INVALID_LIGHTERPACK_LINK'),
            helpers.regex(urlPattern),
        ),
    },
};
const vuelidate = useVuelidate(formRules, formState, { $autoDirty: true });

const getLighterPackPackData = async (listId: string): Promise<any[][]> => {
    const { getFunctions, httpsCallable } = await import('firebase/functions');
    const functions = getFunctions(undefined, region);
    const callable = httpsCallable(functions, 'getLighterPackPackData');
    const result = await callable({ listId });

    // result.data is { lighterpackGears: any[][] }
    return (result.data as any).lighterpackGears || [];
};

onMounted(async () => {
    formState.currency =
        userMeta.value?.currency || constants.DEFAULT_CURRENCY_CODE;
});

const onBack = () => {
    activeStep.value = 0;
    hasErrorInProcess.value = false;
    importableGears.value = [];
};

const onStart = async () => {
    const valid = await vuelidate.value.$validate();
    if (!valid) {
        return;
    }

    hasErrorInProcess.value = false;
    importableGears.value = [];
    isLoading.value = true;
    activeStep.value = 1;
    try {
        // extract the list ID from the provided URL
        const listId = new URL(formState.lighterpackUrl).pathname
            .split('/')
            .pop();
        if (!listId) {
            hasErrorInProcess.value = true;
            return;
        }

        // Fetch data from Lighterpack using Firebase callable function
        const lighterpackGears = await getLighterPackPackData(listId);
        if (!lighterpackGears || !Array.isArray(lighterpackGears)) {
            hasErrorInProcess.value = true;
            isLoading.value = false;
            return;
        }

        // Convert the fetched data to our gear format
        const gears = await convertLighterpackGears(lighterpackGears, {
            currency: formState.currency,
        });
        if (!gears || !Array.isArray(gears)) {
            hasErrorInProcess.value = true;
            isLoading.value = false;
            return;
        }

        // Update the reactive state with converted gears
        convertedGears.value = gears;
        importableGears.value = gears.map((gear) => ({
            ...dataUtils.convertedEditingGearToTempGear(gear),
            source: 'lp',
        }));
    } catch (e: any) {
        hasErrorInProcess.value = true;
    } finally {
        isLoading.value = false;

        // update user meta with the selected currency
        if (userMeta.value && formState.currency !== userMeta.value.currency) {
            try {
                await userMetaStore.updateUserMeta({
                    currency: formState.currency,
                });
            } catch (error) {
                errorToast('Failed to update user currency', error);
            }
        }
    }
};

useHead({
    title: i18n.t('PAGE_IMPORT_GEARS'),
});
</script>
