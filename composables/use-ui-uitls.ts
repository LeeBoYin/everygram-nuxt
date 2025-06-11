export default function () {
    const i18n = useI18n();
    const confirm = useConfirm();
    const toast = useToast();

    return {
        confirmDeleteDialog: ({
            message,
            header,
            toastSummary,
            onAccept,
        }: {
            message: string;
            header: string;
            toastSummary: string;
            onAccept: () => void;
        }) => {
            confirm.require({
                message,
                header,
                icon: 'pi pi-exclamation-triangle',
                rejectClass: 'p-button-secondary p-button-outlined',
                acceptClass: 'p-button-danger p-button-outlined',
                rejectLabel: i18n.t('ACTION_CANCEL'),
                acceptLabel: i18n.t('ACTION_DELETE'),
                accept: async () => {
                    await onAccept();
                    toast.add({
                        severity: 'secondary',
                        summary: toastSummary,
                        life: constants.TOAST_TTL,
                    });
                },
            });
        },
    };
}
