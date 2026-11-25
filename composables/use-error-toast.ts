import { useToast } from 'primevue/usetoast';
export default function useErrorToast() {
    const toast = useToast();
    const errorToast = (message: string, error?: any) => {
        toast.add({
            severity: 'error',
            summary: message,
            life: constants.TOAST_TTL_ERROR,
        });
        console.error('Error:', message, error);
    };
    return {
        errorToast,
    };
}
