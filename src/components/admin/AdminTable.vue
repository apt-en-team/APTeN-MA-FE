<script setup>
defineProps({
  columns: { type: Array, required: true },
  rows:    { type: Array, default: () => [] },
})
const emit = defineEmits(['row-click'])
</script>

<template>
  <table class="data-table">
    <thead>
      <tr>
        <th v-for="col in columns" :key="col.key">{{ col.label }}</th>
        <!-- action 헤더: 슬롯이 있으면 슬롯 내용, 없으면 기본 "관리" -->
        <th v-if="$slots.action">
          <slot name="action-header">관리</slot>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-if="!rows || rows.length === 0" class="empty-row">
        <td :colspan="columns.length + ($slots.action ? 1 : 0)">데이터가 없습니다.</td>
      </tr>
      <tr
        v-else
        v-for="row in rows"
        :key="row.id ?? row.householdId ?? row.reservationId"
        @click="emit('row-click', row)"
      >
        <td v-for="col in columns" :key="col.key">
          <!-- 커스텀 셀 슬롯 없으면 기본값 -->
          <slot :name="'cell-' + col.key" :row="row" :value="row[col.key]">
            {{ row[col.key] ?? '-' }}
          </slot>
        </td>
        <td v-if="$slots.action">
          <slot name="action" :row="row" />
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped>
.data-table { width: 100%; border-collapse: collapse; }
.data-table th {
  padding: 11px 16px; text-align: center;
  font-size: 12px; font-weight: 600; color: #718096;
  background: #F5F6F8; border-bottom: 1px solid #E2E8F0;
}
.data-table td {
  padding: 13px 16px; text-align: center;
  font-size: 13px; color: #333;
  border-bottom: 1px solid #E2E8F0;
}
.data-table tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover td { background: #F5F6F8; }
.data-table tbody tr { cursor: pointer; }
.empty-row td { text-align: center; color: #A0AEC0; font-size: 13px; padding: 48px 0; }

.badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}
.badge-confirmed { background: #e6f4ea; color: #2e7d32; }
.badge-pending   { background: #fff3e0; color: #e65100; }
.badge-cancelled { background: #fce4ec; color: #c62828; }
.badge-completed { background: #e8eaf6; color: #3949ab; }
.badge-approved  { background: #e3f2fd; color: #1565c0; }
.badge-rejected  { background: #fce4ec; color: #c62828; }
.badge-waiting   { background: #f3e5f5; color: #6a1b9a; }
</style>
 
