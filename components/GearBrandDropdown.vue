<template>
    <PrimeDropdown
        v-model="value"
        :options="options"
        editable
        optionValue="value"
        optionLabel="label"
        :optionDisabled="(option) => !option.value"
        :virtualScrollerOptions="{ itemSize: 40 }"
    />
</template>

<script setup lang="ts">
import { uniq as _uniq } from 'lodash-es';
const value = defineModel<string | undefined>({ required: true });
const userGearsStore = useUserGearsStore();
const { gears } = storeToRefs(userGearsStore);
const i18n = useI18n();
const customBrandOptions = computed(() => {
    return _uniq(
        gears.value
            .map((gear) => gear.brand?.custom)
            .filter((custom) => custom),
    )
        .sort()
        .map((custom) => ({
            value: custom,
            label: custom,
        }));
});
const options = computed(() => {
    return [
        ...constants.GEAR_BRAND_KEYS.map((brand) => ({
            value: brand,
            label: constants.GEAR_BRANDS[brand].name,
        })),
        ...(customBrandOptions.value.length
            ? [
                  {
                      label: i18n.t('LABEL_CUSTOM_BRAND'),
                      value: null,
                      disabled: true,
                  },
                  ...customBrandOptions.value,
              ]
            : []),
    ];
});
</script>
