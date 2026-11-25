// Registers PrimeVue 3 (replaces the `nuxt-primevue` module, which does not support Nuxt 4).
// A component must be listed here before it can be used as `<Prime...>` in templates.
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';
import Tooltip from 'primevue/tooltip';
import BaseStyle from 'primevue/base/style';
import VirtualScrollerStyle from 'primevue/virtualscroller/style';

import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import Chart from 'primevue/chart';
import Checkbox from 'primevue/checkbox';
import Column from 'primevue/column';
import ConfirmDialog from 'primevue/confirmdialog';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import IconField from 'primevue/iconfield';
import Image from 'primevue/image';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';
import InputIcon from 'primevue/inputicon';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Menu from 'primevue/menu';
import OverlayPanel from 'primevue/overlaypanel';
import Panel from 'primevue/panel';
import ProgressSpinner from 'primevue/progressspinner';
import SelectButton from 'primevue/selectbutton';
import Sidebar from 'primevue/sidebar';
import Skeleton from 'primevue/skeleton';
import Stepper from 'primevue/stepper';
import StepperPanel from 'primevue/stepperpanel';
import Tag from 'primevue/tag';
import Textarea from 'primevue/textarea';
import Toast from 'primevue/toast';

const components = {
    Button,
    Calendar,
    Chart,
    Checkbox,
    Column,
    ConfirmDialog,
    DataTable,
    Dialog,
    Dropdown,
    IconField,
    Image,
    InputGroup,
    InputGroupAddon,
    InputIcon,
    InputNumber,
    InputText,
    Menu,
    OverlayPanel,
    Panel,
    ProgressSpinner,
    SelectButton,
    Sidebar,
    Skeleton,
    Stepper,
    StepperPanel,
    Tag,
    Textarea,
    Toast,
};

export default defineNuxtPlugin(({ vueApp }) => {
    vueApp.use(PrimeVue);
    vueApp.use(ConfirmationService);
    vueApp.use(ToastService);
    vueApp.directive('tooltip', Tooltip);

    for (const [name, component] of Object.entries(components)) {
        vueApp.component(`Prime${name}`, component);
    }

    // PrimeVue only injects its base styles on the client. Render them on the
    // server too; the client reuses the tags by `data-primevue-style-id`.
    if (import.meta.server) {
        useHead(
            {
                style: [BaseStyle, VirtualScrollerStyle].map((style: any) => ({
                    innerHTML: style.css,
                    'data-primevue-style-id': style.name,
                })),
            },
            { tagPriority: 'low' },
        );
    }
});
