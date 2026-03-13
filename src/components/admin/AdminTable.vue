<script setup>
defineProps({
  columns: Array, // [{ label, key }]
  rows: Array,
})
const emit = defineEmits(['row-click'])
</script>

<template>
  <table class="data-table">
    <thead>
      <tr>
        <th v-for="col in columns" :key="col.key">{{ col.label }}</th>
        <!-- 관리 컬럼 슬롯 -->
        <th v-if="$slots.action">관리</th>
      </tr>
    </thead>
    <tbody>
      <tr v-if="!rows || rows.length === 0" class="empty-row">
      <td colspan="8">데이터가 없습니다.</td>
      </tr>
      <tr v-else v-for="row in rows" :key="row.id ?? row.householdId" @click="emit('row-click', row)">
        <td v-for="col in columns" :key="col.key">
          <!-- 커스텀 셀 슬롯 없으면 기본값 -->
          <slot :name="'cell-' + col.key" :row="row">
            {{ row[col.key] ?? '-' }}
          </slot>
        </td>
        <!-- 관리 버튼 슬롯 -->
        <td v-if="$slots.action">
          <slot name="action" :row="row" />
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped>
.data-table { width: 100%; border-collapse: collapse; }
.data-table th { padding: 11px 16px; text-align: left; font-size: 12px; font-weight: 600; color: #718096; background: #F5F6F8; border-bottom: 1px solid #E2E8F0; text-align: center; }
.data-table td { padding: 13px 16px; font-size: 13px; color: #333; border-bottom: 1px solid #E2E8F0;  text-align: center;}
.data-table tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover td { background: #F5F6F8; }
.data-table tbody tr { cursor: pointer; }
.empty-row { text-align: center; color: #A0AEC0; font-size: 13px; padding: 48px 0; }

</style>