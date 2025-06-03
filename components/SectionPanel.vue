<template>
    <div class="section-panel flex flex-column bg-white lg:border-round-md">
        <slot name="header" />
        <div v-if="$slots.default" class="flex flex-column gap-6 p-3">
            <slot />
        </div>
    </div>
</template>

<style lang="scss">
@import '~/assets/theme/primeflex/core/_variables.scss';
.section-panel {
    margin: 0 calc(-1 * var(--page-container-padding));
    @media (min-width: $lg) {
        margin: 0;
    }
}
</style>
