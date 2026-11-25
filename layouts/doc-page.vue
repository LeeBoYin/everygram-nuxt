<template>
    <AppHeader />
    <div class="page-container">
        <div class="grid">
            <div
                :class="[
                    'flex flex-column gap-5',
                    'col-12 lg:col-10 lg:col-offset-1',
                ]"
            >
                <div
                    :class="[
                        'doc-page-banner',
                        'flex align-items-center justify-content-start',
                        'border-round-lg',
                    ]"
                >
                    <h1 class="px-3 lg:px-6">
                        {{ title }}
                    </h1>
                </div>
                <div :class="['px-3 lg:px-6']">
                    <slot />
                </div>
            </div>
        </div>
    </div>
    <AppFooter />
</template>

<script lang="ts" setup>
defineProps<{
    title?: string;
}>();
</script>

<style lang="scss">
@import '~/assets/theme/_eg-colors.scss';
.doc-page-banner {
    background-color: $eg-c-brown-200;
    background-image:
        url('/image/doc-page-banner-pattern.png'),
        url('/image/doc-page-banner-bg.png');
    background-position:
        top left,
        center right;
    background-repeat: repeat, no-repeat;
    background-size: auto, contain;
    height: 160px;
}
</style>
