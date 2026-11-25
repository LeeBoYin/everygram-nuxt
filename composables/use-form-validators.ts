import { snakeCase as _snakeCase } from 'lodash-es';
import * as vuelidateValidators from '@vuelidate/validators';
import { createI18nMessage } from '@vuelidate/validators';

export default function validators() {
    const i18n = useI18n();
    const withI18nMessage = createI18nMessage({
        t: i18n.t.bind(i18n),
        messagePath: ({ $validator }) => `VALIDATION.${$validator}`,
        messageParams: (params) => ({
            ...params,
            label: i18n.t(`LABEL_${_snakeCase(params.property).toUpperCase()}`),
        }),
    });

    return {
        required: withI18nMessage(vuelidateValidators.required),
        integer: withI18nMessage(vuelidateValidators.integer),
        minLength: withI18nMessage(vuelidateValidators.minLength, {
            withArguments: true,
        }),
        maxLength: withI18nMessage(vuelidateValidators.maxLength, {
            withArguments: true,
        }),
        minValue: withI18nMessage(vuelidateValidators.minValue, {
            withArguments: true,
        }),
        maxValue: withI18nMessage(vuelidateValidators.maxValue, {
            withArguments: true,
        }),
    };
}
