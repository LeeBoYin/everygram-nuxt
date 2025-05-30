<template>
    <div
        :class="[
            'category-header flex align-items-center gap-3',
            { 'sticky z-1': sticky },
            { 'surface-glass': sticky && stickyTheme === 'surface-glass' },
            {
                'category-header--app-background':
                    sticky && stickyTheme === 'app-background',
            },
        ]"
    >
        <div class="flex-1 flex align-items-center gap-3">
            <template v-if="isGearCategory">
                <GearCategoryAvatar :category="gearCategory" size="medium" />
                <h3 class="text-lg">
                    {{ gearCategoryToLabel(category as GearCategory) }}
                </h3>
            </template>
            <template v-else>
                <ConsumableCategoryAvatar
                    :category="consumableCategory"
                    size="medium"
                />
                <h3>
                    {{
                        consumableCategoryToLabel(
                            category as ConsumableCategory,
                        )
                    }}
                </h3>
            </template>
            <template v-if="weight !== undefined">
                <DashedLine />
                <div class="text-color-light">
                    {{ formatWeight(weight) }}
                </div>
            </template>
        </div>
        <slot name="actions" />
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{
    category: GearCategory | ConsumableCategory;
    weight?: number;
    sticky?: boolean;
    stickyTheme?: 'surface-glass' | 'app-background';
}>();

const { gearCategoryToLabel, consumableCategoryToLabel, formatWeight } =
    useLangUtils();

const isGearCategory = computed(() =>
    constants.GEAR_CATEGORY_KEYS.includes(props.category as GearCategory),
);
const gearCategory = computed(() => props.category as GearCategory);
const consumableCategory = computed(() => props.category as ConsumableCategory);
</script>

<style lang="scss">
.category-header {
    top: var(--app-header-height);
    &--app-background {
        background-color: var(--app-background-color);
        // to cover the shadow of cards below
        box-shadow:
            -0.5rem 0 var(--app-background-color),
            0.5rem 0 var(--app-background-color);
    }
}
</style>
