<template>
    <h1 class="text-2xl mt-0">使用者</h1>
    <AdminStatsState v-slot="{ stats }">
        <div class="grid">
            <div class="col-3">
                <AdminKpiCard
                    label="DAU（1 天內活躍）"
                    :value="formatAdminNumber(stats.users.dau)"
                />
            </div>
            <div class="col-3">
                <AdminKpiCard
                    label="WAU（7 天內活躍）"
                    :value="formatAdminNumber(stats.users.wau)"
                />
            </div>
            <div class="col-3">
                <AdminKpiCard
                    label="MAU（30 天內活躍）"
                    :value="formatAdminNumber(stats.users.mau)"
                />
            </div>
            <div class="col-3">
                <AdminKpiCard
                    label="沉睡（超過 90 天沒活躍）"
                    :value="formatAdminNumber(stats.users.dormant90d)"
                />
            </div>
            <div class="col-4">
                <AdminCard title="登入方式" class="h-full">
                    <AdminBarChart
                        :items="
                            toAdminChartItems(
                                stats.users.byProvider,
                                'provider',
                            )
                        "
                    />
                </AdminCard>
            </div>
            <div class="col-4">
                <AdminCard title="語言" class="h-full">
                    <AdminBarChart
                        :items="
                            toAdminChartItems(stats.users.byLocale, 'locale')
                        "
                    />
                </AdminCard>
            </div>
            <div class="col-4">
                <AdminCard title="幣別" class="h-full">
                    <AdminBarChart
                        :items="
                            toAdminChartItems(
                                stats.users.byCurrency,
                                'currency',
                            )
                        "
                    />
                </AdminCard>
            </div>
        </div>
    </AdminStatsState>

    <AdminCard title="使用者列表（即時資料）" class="mt-3">
        <div class="flex justify-content-between align-items-center mb-3">
            <PrimeInputText
                v-model="filters.global.value"
                type="search"
                placeholder="搜尋 email、名字"
                aria-label="搜尋使用者"
                class="w-20rem"
            />
            <span class="text-sm text-color-secondary">
                共 {{ rows.length }} 位
            </span>
        </div>
        <PrimeDataTable
            v-model:filters="filters"
            :value="rows"
            :loading="isLoadingRows"
            :globalFilterFields="['email', 'displayName']"
            dataKey="uid"
            sortField="created"
            :sortOrder="-1"
            paginator
            :rows="50"
            size="small"
        >
            <template #empty>沒有資料</template>
            <PrimeColumn field="email" header="email" sortable />
            <PrimeColumn field="displayName" header="名字" sortable />
            <PrimeColumn field="created" header="註冊日" sortable>
                <template #body="{ data }">
                    {{ formatAdminDate(data.created) }}
                </template>
            </PrimeColumn>
            <PrimeColumn field="lastActive" header="最後活躍" sortable>
                <template #body="{ data }">
                    {{ formatAdminDate(data.lastActive) }}
                </template>
            </PrimeColumn>
            <PrimeColumn field="gearCount" header="裝備數" sortable />
            <PrimeColumn field="tripCount" header="行程數" sortable />
            <PrimeColumn field="tripShareCount" header="公開行程數" sortable />
            <PrimeColumn field="locale" header="語言" sortable>
                <template #body="{ data }">
                    {{ formatAdminLocale(data.locale) }}
                </template>
            </PrimeColumn>
        </PrimeDataTable>
    </AdminCard>
</template>

<script setup lang="ts">
import { FilterMatchMode } from 'primevue/api';

definePageMeta({
    layout: 'admin',
    middleware: ['admin-guard'],
});
useSeoMeta({ title: '使用者｜管理後台' });

const { fetchAdminUserRows } = useAdminStats();
const { errorToast } = useErrorToast();

const rows = ref<AdminUserRow[]>([]);
const isLoadingRows = ref(true);
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
});

onMounted(async () => {
    try {
        rows.value = await fetchAdminUserRows();
    } catch (error) {
        errorToast('讀取使用者列表失敗', error);
    } finally {
        isLoadingRows.value = false;
    }
});
</script>
