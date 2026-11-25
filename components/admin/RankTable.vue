<template>
    <PrimeDataTable :value="rows" size="small">
        <template #empty>沒有資料</template>
        <PrimeColumn header="#" class="w-3rem">
            <template #body="{ index }">{{ index + 1 }}</template>
        </PrimeColumn>
        <PrimeColumn
            v-for="column in columns"
            :key="column.field"
            :header="column.header"
        >
            <template #body="{ data }">
                <slot :name="column.field" :row="data">
                    {{ data[column.field] }}
                </slot>
            </template>
        </PrimeColumn>
    </PrimeDataTable>
</template>

<script setup lang="ts">
defineProps<{
    columns: { field: string; header: string }[];
    rows: object[];
}>();
</script>
