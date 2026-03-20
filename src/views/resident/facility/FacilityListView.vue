<script setup>
import { onMounted, reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import facilityAPI from '@/api/facility.js'
import FacilityLayout from '@/components/layout/FacilityLayout.vue'

const router = useRouter()

const state = reactive({
  types:      [],
  facilities: [],
})

const FACILITY_TYPE_IDS = [1, 2, 3]

const topTab   = ref('facility')
const gxSubTab = ref('전체')

const formatTime = (time) => time ? String(time).slice(0, 5) : '-'

const displayFacilities = computed(() => {
  if (topTab.value !== 'gx') return state.facilities
  if (gxSubTab.value === '전체') return state.facilities
  return state.facilities.filter(f => f.name.includes(gxSubTab.value === '오전' ? '오전' : '오후'))
})

const fetchFacilities = async (tab) => {
  try {
    if (tab === 'facility') {
      const results = await Promise.all(
        FACILITY_TYPE_IDS.map(id => facilityAPI.getFacilities(id))
      )
      state.facilities = results.flatMap(r => r.data.resultData ?? [])
    } else {
      const { data } = await facilityAPI.getFacilities(4)
      state.facilities = data.resultData?.content ?? data.resultData ?? []
    }
  } catch (e) { console.error('시설 목록 조회 실패', e) }
}

const fetchTypes = async () => {
  state.types = [
    { typeId: 1, name: '독서실' },
    { typeId: 2, name: '헬스장' },
    { typeId: 3, name: '골프연습장' },
    { typeId: 4, name: 'GX' },
  ]
  await fetchFacilities('facility')
}

const switchTopTab = async (tab) => {
  topTab.value   = tab
  gxSubTab.value = '전체'
  await fetchFacilities(tab)
}

const goToDetail = (f) => {
  router.push({ name: 'FacilityDetail', params: { id: f.facilityId } })
}

onMounted(() => {
  fetchTypes()
})
</script>

<template>
  <FacilityLayout>
    <div class="top-tab-bar">
      <button :class="['top-tab-btn', { active: topTab === 'facility' }]" @click="switchTopTab('facility')">편의 시설</button>
      <button :class="['top-tab-btn', { active: topTab === 'gx' }]" @click="switchTopTab('gx')">GX강습</button>
    </div>

    <div class="tab-bar" v-if="topTab === 'gx'">
      <button
        v-for="sub in ['전체', '오전', '오후']"
        :key="sub"
        :class="['tab-btn', { active: gxSubTab === sub }]"
        @click="gxSubTab = sub"
      >{{ sub }}</button>
    </div>

    <div class="facility-list">
      <div
        v-for="f in displayFacilities"
        :key="f.facilityId"
        class="facility-card"
        @click="goToDetail(f)"
      >
        <div class="facility-img">
          <img v-if="f.imageUrl" :src="f.imageUrl" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:10px;" />
          <svg v-else width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#CBD5E0" stroke-width="1">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
          </svg>
        </div>
        <div class="facility-info">
          <div class="facility-header">
            <span class="facility-name">{{ f.name }}</span>
            <span :class="['status-badge', f.isActive ? 'available' : 'closed']">
              {{ f.isActive ? '예약 가능' : '점검중' }}
            </span>
          </div>
          <p class="facility-desc">{{ f.description || '운영 시작 시 예약이 가능합니다.' }}</p>
          <div class="facility-meta">
            <span class="meta-item">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              운영 시간: {{ formatTime(f.openTime) }} ~ {{ formatTime(f.closeTime) }}
            </span>
            <span class="meta-item" v-if="topTab === 'facility'">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              </svg>
              자리 예약 필수 ({{ f.maxCapacity }}석)
            </span>
            <span class="meta-item" v-if="topTab === 'gx'">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              </svg>
              정원 {{ f.maxCapacity }}명
            </span>
            <span class="meta-item" v-if="topTab === 'gx'">예약 단위 {{ f.slotDuration }}분</span>
          </div>
        </div>
        <div class="facility-arrow">→</div>
      </div>

      <div v-if="displayFacilities.length === 0" class="empty-msg">
        등록된 시설이 없습니다.
      </div>
    </div>
  </FacilityLayout>
</template>

<style scoped>
* { box-sizing: border-box; margin: 0; padding: 0; }
.top-tab-bar  { display: flex; gap: 0; margin-bottom: 20px; border-bottom: 2px solid #E2E8F0; }
.top-tab-btn  { padding: 10px 24px; border: none; background: none; font-size: 15px; font-weight: 600; color: #A0AEC0; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; border-bottom: 2px solid transparent; margin-bottom: -2px; transition: all 0.15s; }
.top-tab-btn.active { color: #2B3A55; border-bottom-color: #2B3A55; }
.top-tab-btn:hover:not(.active) { color: #4A5568; }
.tab-bar  { display: flex; gap: 4px; margin-bottom: 16px; border-bottom: 1px solid #E2E8F0; }
.tab-btn  { padding: 6px 16px; border: none; background: none; font-size: 13px; color: #718096; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; border-bottom: 2px solid transparent; margin-bottom: -1px; }
.tab-btn.active { color: #2B3A55; font-weight: 700; border-bottom-color: #2B3A55; }
.tab-btn:hover:not(.active) { color: #4A5568; }
.facility-list { display: flex; flex-direction: column; gap: 16px; }
.facility-card { background: #fff; border-radius: 12px; border: 1px solid #E2E8F0; padding: 20px; display: flex; gap: 20px; cursor: pointer; transition: box-shadow 0.15s; align-items: center; }
.facility-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); border-color: #2B3A55; }
.facility-img  { width: 200px; height: 130px; background: #F5F6F8; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; }
.facility-info { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.facility-header { display: flex; align-items: center; gap: 10px; }
.facility-name   { font-size: 28px; font-weight: 700; color: #1A202C; }
.facility-desc   { font-size: 15px; color: #718096; line-height: 1.5; }
.facility-meta   { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 4px; }
.meta-item       { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #718096; }
.facility-arrow  { font-size: 20px; color: #CBD5E0; flex-shrink: 0; }
.status-badge           { display: inline-block; padding: 3px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; }
.status-badge.available { background: #E5F8EB; color: #50C878; }
.status-badge.closed    { background: #FEF6E9; color: #F5A623; }
.empty-msg { text-align: center; padding: 40px; color: #A0AEC0; font-size: 14px; }
</style>