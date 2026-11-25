<template>
    <!-- admin dashboard: desktop only, zh-TW only -->
    <div class="admin-layout">
        <aside
            class="admin-layout__sidebar flex flex-column gap-1 p-3 bg-white border-right-1 border-200"
        >
            <div class="px-2 pt-2 pb-4">
                <NuxtLink to="/admin">
                    <img
                        src="/image/logo-horizontal.svg"
                        alt="Everygram"
                        height="24px"
                    />
                </NuxtLink>
                <div class="text-sm text-color-secondary mt-2">管理後台</div>
            </div>
            <template v-for="item in navItems" :key="item.label">
                <NuxtLink
                    v-if="item.to"
                    :to="item.to"
                    class="admin-layout__nav-item"
                    exact-active-class="admin-layout__nav-item--active"
                >
                    <i :class="item.icon"></i>{{ item.label }}
                </NuxtLink>
                <span
                    v-else
                    class="admin-layout__nav-item admin-layout__nav-item--disabled"
                    title="尚未開放"
                    aria-disabled="true"
                >
                    <i :class="item.icon"></i>{{ item.label }}
                </span>
            </template>
            <NuxtLink to="/trips" class="admin-layout__nav-item mt-auto">
                <i class="pi pi-arrow-left"></i>回到 Everygram
            </NuxtLink>
        </aside>
        <div class="admin-layout__main">
            <div class="admin-layout__content">
                <div
                    class="flex justify-content-end align-items-center gap-3 mb-3"
                >
                    <span class="text-sm text-color-secondary">
                        最後更新：—
                    </span>
                    <!-- enabled in P2 with the stats functions -->
                    <PrimeButton
                        label="重新計算"
                        icon="pi pi-refresh"
                        size="small"
                        outlined
                        disabled
                    />
                </div>
                <slot />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const { isOwner } = useAdminRole();

// items without `to` are not available yet
const navItems = computed<{ label: string; icon: string; to?: string }[]>(
    () => [
        { label: '總覽', icon: 'pi pi-home', to: '/admin' },
        { label: '使用者', icon: 'pi pi-users' },
        { label: '裝備', icon: 'pi pi-box' },
        { label: '行程', icon: 'pi pi-map' },
        { label: '趨勢', icon: 'pi pi-chart-line' },
        { label: '歷史', icon: 'pi pi-history' },
        ...(isOwner.value
            ? [{ label: '管理者', icon: 'pi pi-shield', to: '/admin/admins' }]
            : []),
    ],
);
</script>

<style scoped lang="scss">
@import '~/assets/theme/themes/mytheme/_variables.scss';

$sidebar-width: 220px;

.admin-layout {
    display: flex;
    min-height: 100vh;
    min-width: 1200px;

    &__sidebar {
        position: sticky;
        top: 0;
        height: 100vh;
        flex: 0 0 $sidebar-width;
    }

    &__nav-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.625rem 0.75rem;
        border-radius: 6px;
        color: var(--text-color);

        &:hover {
            background-color: var(--surface-100);
        }

        &--active,
        &--active:hover {
            background-color: $eg-c-primary-lighter;
        }

        &--disabled,
        &--disabled:hover {
            background-color: transparent;
            opacity: 0.4;
            cursor: default;
        }
    }

    &__main {
        flex: 1;
        min-width: 0;
        padding: 1.5rem;
    }

    &__content {
        max-width: 1440px;
        margin: 0 auto;
    }
}
</style>
