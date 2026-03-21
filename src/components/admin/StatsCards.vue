<script setup>
defineProps({
  stats: {
    type: Array,
    default: () => []
    // 형식: [{ label, value, unit, desc, descClass, iconClass }]
  },
  showIcon: { type: Boolean, default: false }  // 아이콘 영역 표시 여부
})
</script>

<template>
  <div class="stats-grid">
    <div v-for="(item, i) in stats" :key="i" class="stat-card">

      <div class="card-main">
        <div class="stat-label">{{ item.label }}</div>
        <div class="stat-value">
          {{ item.value }}<span class="stat-unit"> {{ item.unit }}</span>
        </div>
        <!-- 프로그레스바 (주차현황용) -->
        <div v-if="item.progress !== undefined" class="progress-bar-wrap">
          <div class="progress-bar">
            <div class="progress-fill blue" :style="{ width: (item.progress ?? 0) + '%' }"></div>
          </div>
        </div>
        <div class="stat-desc" :class="item.descClass">{{ item.desc }}</div>
      </div>

      <!-- 아이콘 (대시보드용) -->
      <div v-if="showIcon && item.iconClass" :class="['card-icon', item.iconClass]">
        <slot :name="'icon-' + i" />
      </div>

    </div>
  </div>
</template>

<style scoped>
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 20px; }
.stat-card  { height: 139px; background: #fff; border-radius: 10px; padding: 22px 24px; border: 1px solid #E2E8F0; display: flex; align-items: flex-start; justify-content: space-between; }
.card-main  { display: flex; flex-direction: column; justify-content: space-between; height: 95px; }
.stat-label { font-size: 12px; color: #687282; font-weight: 500; }
.stat-value { font-size: 30px; font-weight: 800; color: ; line-height: 1.2; }
.stat-unit  { font-size: 12px; font-weight: 500; color: #6b7280; padding: 5px;}
.stat-desc  { font-size: 12px; color: #6B7280; }
.stat-desc.success { color: #276749; }
.stat-desc.warning { color: #C08B2D; }
.stat-desc.highlight-orange { color: #C08B2D; }
.stat-desc.highlight-green  { color: #276749; }
.card-icon  { width: 40px; height: 40px; border-radius: 50px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.card-icon :deep(svg) { width: 20px; height: 20px; }
.icon-orange { background: #FDF6E8; color: #C08B2D; }
.icon-blue   { background: #E8EBF2; color: #2B3A55; }
.icon-green  { background: #C6F6D5; color: #276749; }
.icon-gray   { background: #EDEEF2; color: #6B7280; }
.progress-bar-wrap { margin: 6px 0 2px; }
.progress-bar { width: 100%; height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden; }
.progress-fill { height: 100%; border-radius: 3px; transition: width 0.4s ease; }
.progress-fill.blue   { background: #3b82f6; }
.progress-fill.green  { background: #276749; }
.progress-fill.dark   { background: #2B3A55; }
.progress-fill.yellow { background: #C08B2D; }
</style>