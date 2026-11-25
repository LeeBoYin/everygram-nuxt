<template>
    <h1 class="text-2xl mt-0 mb-2">管理者</h1>
    <p class="mt-0 text-color-secondary">
        新增、改角色或移除後，對方要重新登入才會生效。
    </p>

    <form
        class="flex align-items-center gap-2 bg-white border-1 border-200 border-round-md p-3 mb-3"
        @submit.prevent="onAdd"
    >
        <PrimeInputText
            v-model="newEmail"
            type="email"
            placeholder="對方註冊用的 email"
            aria-label="email"
            class="w-20rem"
        />
        <PrimeDropdown
            v-model="newRole"
            :options="ROLE_OPTIONS"
            optionLabel="label"
            optionValue="value"
            aria-label="角色"
            class="w-14rem"
        />
        <PrimeButton
            type="submit"
            label="新增管理者"
            icon="pi pi-plus"
            :loading="savingEmail !== null && savingEmail === newEmail.trim()"
            :disabled="!newEmail.trim() || savingEmail !== null"
        />
    </form>

    <PrimeDataTable
        :value="adminUsers"
        :loading="isLoading"
        dataKey="uid"
        class="border-1 border-200"
    >
        <template #empty>沒有資料</template>
        <PrimeColumn field="email" header="email" sortable />
        <PrimeColumn field="displayName" header="名字" sortable />
        <PrimeColumn header="角色">
            <template #body="{ data }">
                <PrimeDropdown
                    :modelValue="data.role"
                    :options="ROLE_OPTIONS"
                    optionLabel="label"
                    optionValue="value"
                    :aria-label="`${data.email} 的角色`"
                    :disabled="data.uid === user?.uid || savingEmail !== null"
                    class="w-14rem"
                    @update:modelValue="
                        (role: AdminRole) => confirmChangeRole(data, role)
                    "
                />
            </template>
        </PrimeColumn>
        <PrimeColumn header="加入時間">
            <template #body="{ data }">
                {{ formatDate(data.added) }}
            </template>
        </PrimeColumn>
        <PrimeColumn header="由誰新增">
            <template #body="{ data }">
                {{ addedByLabel(data.addedBy) }}
            </template>
        </PrimeColumn>
        <PrimeColumn>
            <template #body="{ data }">
                <span
                    v-if="data.uid === user?.uid"
                    class="text-sm text-color-secondary"
                >
                    你自己
                </span>
                <PrimeButton
                    v-else
                    label="移除"
                    icon="pi pi-trash"
                    severity="danger"
                    size="small"
                    text
                    :loading="savingEmail === data.email"
                    :disabled="savingEmail !== null"
                    @click="confirmRemove(data)"
                />
            </template>
        </PrimeColumn>
    </PrimeDataTable>

    <AdminCard title="歷史資料" class="mt-3">
        <p class="mt-0 text-color-secondary">
            用現有資料的建立時間，回補每個月新增的使用者、裝備和行程數。可以重複執行，會覆寫上次的結果。已刪除的資料不會算到。
        </p>
        <PrimeButton
            label="回補歷史資料"
            icon="pi pi-history"
            outlined
            :loading="isBackfilling"
            @click="onBackfill"
        />
    </AdminCard>
</template>

<script setup lang="ts">
import { collection, getDocs } from 'firebase/firestore';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';

definePageMeta({
    layout: 'admin',
    middleware: ['admin-guard'],
    requiresOwner: true,
});
useSeoMeta({ title: '管理者｜管理後台' });

const ROLE_OPTIONS: { label: string; value: AdminRole }[] = [
    { label: 'admin（只能看）', value: 'admin' },
    { label: 'owner', value: 'owner' },
];

const ERROR_MESSAGES: Record<string, string> = {
    'functions/not-found': '找不到這個 email 的帳號',
    'functions/invalid-argument': '輸入的資料格式不正確',
    'functions/permission-denied': '你沒有權限，請重新登入',
    'functions/failed-precondition':
        '不能修改自己的角色，也不能移除最後一位 owner',
};

const { user } = storeToRefs(useUserStore());
const confirm = useConfirm();
const toast = useToast();
const { errorToast } = useErrorToast();

const { backfillHistory } = useAdminStats();

const isBackfilling = ref(false);
const adminUsers = ref<AdminUser[]>([]);
const isLoading = ref(true);
const savingEmail = ref<string | null>(null);
const newEmail = ref('');
const newRole = ref<AdminRole>('admin');

const fetchAdminUsers = async () => {
    isLoading.value = true;
    try {
        const snapshot = await getDocs(
            collection(firebaseUtils.getFirestoreDB(), 'adminUsers'),
        );
        adminUsers.value = snapshot.docs
            .map((doc) => doc.data() as AdminUser)
            .sort((a, b) => a.added.toMillis() - b.added.toMillis());
    } catch (error) {
        errorToast('讀取管理者名單失敗', error);
    } finally {
        isLoading.value = false;
    }
};

// returns whether the role has been saved
const saveRole = async (
    email: string,
    role: AdminRole | null,
    successMessage: string,
) => {
    savingEmail.value = email;
    try {
        const { getFunctions, httpsCallable } =
            await import('firebase/functions');
        const functions = getFunctions(undefined, 'asia-northeast1');
        await httpsCallable(functions, 'setAdminRole')({ email, role });
        toast.add({
            severity: 'success',
            summary: successMessage,
            detail: '對方要重新登入才會生效',
            life: constants.TOAST_TTL,
        });
        await fetchAdminUsers();
        return true;
    } catch (error: any) {
        errorToast(ERROR_MESSAGES[error?.code] ?? '儲存失敗', error);
        return false;
    } finally {
        savingEmail.value = null;
    }
};

const onAdd = async () => {
    const email = newEmail.value.trim();
    if (!email || savingEmail.value !== null) {
        return;
    }
    // adding an existing admin would silently change their role
    const existing = adminUsers.value.find(
        (adminUser) => adminUser.email.toLowerCase() === email.toLowerCase(),
    );
    if (existing) {
        errorToast('這個帳號已經是管理者，請直接在名單修改角色');
        return;
    }
    if (await saveRole(email, newRole.value, '已新增管理者')) {
        newEmail.value = '';
    }
};

const confirmChangeRole = (adminUser: AdminUser, role: AdminRole) => {
    if (role === adminUser.role) {
        return;
    }
    confirm.require({
        header: '修改角色',
        message: `要把 ${adminUser.email} 的角色改成 ${role} 嗎？`,
        acceptLabel: '修改',
        rejectLabel: '取消',
        accept: () => saveRole(adminUser.email, role, '已修改角色'),
    });
};

const confirmRemove = (adminUser: AdminUser) => {
    confirm.require({
        header: '移除管理者',
        message: `要移除 ${adminUser.email} 的後台權限嗎？`,
        acceptLabel: '移除',
        rejectLabel: '取消',
        acceptClass: 'p-button-danger',
        accept: () => saveRole(adminUser.email, null, '已移除管理者'),
    });
};

const formatDate = (timestamp?: Timestamp) =>
    timestamp
        ? timestamp
              .toDate()
              .toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })
        : '—';

const addedByLabel = (addedBy: string) => {
    if (addedBy === 'bootstrap') {
        return '初始化 script';
    }
    const adder = adminUsers.value.find(
        (adminUser) => adminUser.uid === addedBy,
    );
    return adder ? adder.displayName || adder.email : addedBy;
};

const onBackfill = async () => {
    isBackfilling.value = true;
    try {
        const { monthCount } = await backfillHistory();
        toast.add({
            severity: 'success',
            summary: '已回補歷史資料',
            detail: `共 ${monthCount} 個月`,
            life: constants.TOAST_TTL,
        });
    } catch (error: any) {
        errorToast(ERROR_MESSAGES[error?.code] ?? '回補失敗', error);
    } finally {
        isBackfilling.value = false;
    }
};

onMounted(fetchAdminUsers);
</script>
