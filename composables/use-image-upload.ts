import Compressor from 'compressorjs';

export default function (
    options?: PhotoCompressorOptions & {
        onFileSelected?: (params: { file: File; filePath: string }) => void;
        onFileRemoved?: () => void;
        onFileCompressed?: (file: Blob) => void;
    },
) {
    const {
        selectedFile,
        selectedFilePath,
        isHovering,
        onDragOver,
        onDragLeave,
        onDrop,
        fileInput,
        openFilePicker,
        onFileChange,
        onRemoveFile,
    } = useFileUpload({
        onFileSelected: options?.onFileSelected,
        onFileRemoved: options?.onFileRemoved,
    });
    const compressedFile = ref<Blob | null>(null);
    const isCompressing = ref(false);
    const toast = useToast();
    const i18n = useI18n();

    watch(selectedFile, (file) => {
        if (file) {
            compressImage(file);
        }
    });

    const compressImage = async (file: File) => {
        if (!file) {
            return;
        }
        const isImageSupported = await fileUtils.supportsImage(
            selectedFilePath.value,
        );
        if (!isImageSupported) {
            console.error('image format is not supported');
            toast.add({
                severity: 'error',
                summary: i18n.t('ERROR_IMAGE_FORMAT_NOT_SUPPORTED'),
                life: constants.TOAST_TTL,
            });
            return;
        }
        try {
            isCompressing.value = true;
            compressedFile.value = await new Promise<Blob>((resolve) => {
                new Compressor(file, {
                    ...options,
                    convertSize: 0, // always convert to jpg
                    quality: constants.LIMIT.jpgQuality,
                    success: (result) => {
                        resolve(result);
                    },
                    error: (error) => {
                        console.error(error.message);
                        resolve(file);
                    },
                });
            });
            options?.onFileCompressed?.(compressedFile.value);
        } catch (error) {
            console.error(error);
        } finally {
            isCompressing.value = false;
        }
    };

    return {
        fileInput,
        selectedFile,
        selectedFilePath,
        compressedFile,
        isCompressing,
        openFilePicker,
        onFileChange,
        onRemoveFile,
        isHovering,
        onDragOver,
        onDragLeave,
        onDrop,
    };
}
