<template>
    <div
        :class="[
            'gear-photo flex align-items-center justify-content-center border-round-md overflow-hidden relative',
            {
                'gear-photo--empty surface-100 text-color-lightest border-2 border-100':
                    !displayImageUrl,
                'hover:border-dashed hover:border-400 cursor-pointer':
                    !readonly && (!displayImageUrl || clickToUpload),
                'opacity-50':
                    !readonly && (isHovering || isCompressing || isLoading),
                // show dashed border when hovering on empty gear photo
                'border-dashed border-400':
                    !readonly && isHovering && !displayImageUrl,
                'w-3rem h-3rem': !size || size === 'xs',
                'w-4rem h-4rem': size === 'sm',
                'w-6rem h-6rem': size === 'md',
            },
        ]"
    >
        <img
            v-if="displayImageUrl"
            :src="displayImageUrl"
            :alt="gear.name"
            class="gear-photo__img"
            loading="lazy"
        />
        <span v-else class="material-symbols-outlined text-2xl">{{
            gearCategoryIcon
        }}</span>
        <!-- invisible image uploader -->
        <div
            v-if="!readonly"
            class="gear-photo__image-uploader absolute top-0 left-0 right-0 bottom-0"
            @dragover.prevent="onDragOver"
            @dragleave.prevent="onDragLeave"
            @drop.prevent="onDrop"
            @click="(!displayImageUrl || clickToUpload) && openFilePicker()"
        >
            <input
                type="file"
                accept="image/*"
                @change="onFileChange"
                ref="fileInput"
                style="display: none"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{
    gear: Gear;
    readonly?: boolean;
    clickToUpload?: boolean;
    size?: 'xs' | 'sm' | 'md';
}>();
const isLoading = ref(false);
const userGearsStore = useUserGearsStore();
const { uploadFile } = useStorage();
const {
    fileInput,
    selectedFilePath,
    openFilePicker,
    onFileChange,
    onDragOver,
    onDragLeave,
    onDrop,
    isHovering,
    isCompressing,
} = useImageUpload({
    width: constants.LIMIT.gearPhotoWidth,
    height: constants.LIMIT.gearPhotoHeight,
    resize: 'cover',
    onFileCompressed: async (file) => {
        // upload image right after compression
        try {
            isLoading.value = true;
            const result = await uploadFile({
                path: `${constants.STORAGE_PATH.GEAR}/${props.gear.id}`,
                file,
            });
            if (result) {
                await userGearsStore.updateGear({
                    id: props.gear.id,
                    gearData: {
                        photo: {
                            url: result.downloadUrl,
                            fileName: result.fileName,
                        },
                    },
                });
            }
        } catch (error) {
            console.error(error);
        } finally {
            isLoading.value = false;
        }
    },
});
const gearCategoryIcon = computed(
    () => constants.GEAR_CATEGORIES[props.gear.category].icon,
);
const displayImageUrl = computed(() => {
    if (selectedFilePath.value) {
        return selectedFilePath.value;
    }
    const thumbnailSize = props.size === 'md' ? 'sm' : 'xs';
    return dataUtils.getGearPhotoUrl(props.gear, thumbnailSize);
});
</script>

<style scoped lang="scss">
.gear-photo {
    &__img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    // not support image uploader on mobile devices
    @media not (hover: hover) {
        border: none !important;
        cursor: default !important;
        opacity: 1 !important;
        &__image-uploader {
            display: none !important;
        }
    }
}
</style>
