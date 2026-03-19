<script setup>
import { onMounted, reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import facilityAPI from '@/api/facility.js'
import FacilityLayout from '@/components/layout/FacilityLayout.vue';

const router = useRouter()


const state = reactive({
  types:      [],
  facilities: [],
})

/** GX 타입 ID */
const GX_TYPE_IDS = [4]
const FACILITY_TYPE_IDS = [1, 2, 3]

/** 상위 탭 */
const topTab = ref('facility')

/** GX 하위 탭 (전체/오전/오후) */
const gxSubTab = ref('전체')

/** 운영 시간 포맷 */
const formatTime = (time) => time ? String(time).slice(0, 5) : '-'

/** 더미 공지 데이터 */
const notices = [
  { id: 1, title: '분실물 접수 안내',     date: '24.04.02', color: '#4D8B5A' },
  { id: 2, title: '서비스 만족도 설문조사', date: '26.02.28', color: '#2B3A55' },
  { id: 3, title: '서비스 문의 관리사무소 방문 절차 안내', date: '26.02.27', color: '#718096' },
]

/** 더미 내 예약 데이터 */
const myReservations = [
  { id: 1, day: '07', facilityName: '헬스장',      time: '오전9시 ~ 10시' },
  { id: 2, day: '08', facilityName: '독서실',      time: '3월22일 4시 ~ 5시' },
  { id: 3, day: '12', facilityName: '그룹PT(오후)', time: '3월12일(오후) 3시 ~ 4시' },
]

/** GX 하위 탭 필터링된 시설 목록 */
const displayFacilities = computed(() => {
  if (topTab.value !== 'gx') return state.facilities
  if (gxSubTab.value === '전체') return state.facilities
  return state.facilities.filter(f => f.name.includes(gxSubTab.value === '오전' ? '오전' : '오후'))
})

const goToPage = async (page) => {
  currentPage.value = page
  await fetchFacilities('gx')
}

/** API-048 | 시설 목록 조회 */
const fetchFacilities = async (tab) => {
  try {
    if (tab === 'facility') {
      const results = await Promise.all(
        FACILITY_TYPE_IDS.map(id => facilityAPI.getFacilities(id))
      )
      state.facilities = results.flatMap(r => r.data.resultData ?? [])
    } else {
      const { data } = await facilityAPI.getFacilities(4, currentPage.value - 1, 5)
      state.facilities = data.resultData?.content ?? data.resultData ?? []
      maxPage.value    = data.resultData?.totalPages ?? 1
      totalAll.value   = data.resultData?.totalElements ?? state.facilities.length
    }
  } catch (e) { console.error('시설 목록 조회 실패', e) }
}

/** 초기 로드 */
const fetchTypes = async () => {
  state.types = [
    { typeId: 1, name: '독서실' },
    { typeId: 2, name: '헬스장' },
    { typeId: 3, name: '골프연습장' },
    { typeId: 4, name: 'GX' },
  ]
  await fetchFacilities('facility')
}

/** 상위 탭 전환 */
const switchTopTab = async (tab) => {
  topTab.value   = tab
  gxSubTab.value = '전체'
  await fetchFacilities(tab)
}

/** 시설 상세 페이지 이동 */
const goToDetail = (f) => {
  router.push({ name: 'FacilityDetail', params: { id: f.facilityId } })
}

onMounted(() => fetchTypes())
</script>

<template>
  <div class="facility-list-view">
    <div class="main-layout">

      <!-- 왼쪽: 시설 목록 -->
      <div class="facility-section">

        <!-- 상위 탭: 편의 시설 / GX강습 -->
        <div class="top-tab-bar">
          <button :class="['top-tab-btn', { active: topTab === 'facility' }]" @click="switchTopTab('facility')">편의 시설</button>
          <button :class="['top-tab-btn', { active: topTab === 'gx' }]" @click="switchTopTab('gx')">GX강습</button>
        </div>

        <!-- GX 하위 탭: 전체/오전/오후 -->
        <div class="tab-bar" v-if="topTab === 'gx'">
          <button
            v-for="sub in ['전체', '오전', '오후']"
            :key="sub"
            :class="['tab-btn', { active: gxSubTab === sub }]"
            @click="gxSubTab = sub"
          >{{ sub }}</button>
        </div>

        <!-- 시설 카드 목록 -->
        <div class="facility-list">
          <div
            v-for="f in displayFacilities"
            :key="f.facilityId"
            class="facility-card"
            @click="goToDetail(f)"
          >
            <!-- 시설 이미지 -->
            <div class="facility-img">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#CBD5E0" stroke-width="1">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
              </svg>
            </div>

            <!-- 시설 정보 -->
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
                <span class="meta-item" v-if="topTab === 'gx'">
                  예약 단위 {{ f.slotDuration }}분
                </span>
              </div>
            </div>

            <!-- 화살표 -->
            <div class="facility-arrow">→</div>
          </div>

          <!-- 시설 없음 -->
          <div v-if="displayFacilities.length === 0" class="empty-msg">
            등록된 시설이 없습니다.
          </div>
        </div>
      </div>



      <!-- 오른쪽: 사이드바 -->
      <div class="sidebar">

        <!-- 관련 공지 -->
        <div class="sidebar-box">
          <div class="sidebar-header">
            <span class="sidebar-title">관련 공지</span>
            <span class="sidebar-more">더보기 →</span>
          </div>
          <div class="notice-list">
            <div v-for="n in notices" :key="n.id" class="notice-item">
              <div class="notice-thumb" :style="{ background: n.color }"></div>
              <div class="notice-info">
                <div class="notice-title">{{ n.title }}</div>
                <div class="notice-date">등록일자: {{ n.date }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 내 예약 -->
        <div class="sidebar-box">
          <div class="sidebar-header">
            <span class="sidebar-title">내 예약</span>
            <span class="sidebar-more">더보기 →</span>
          </div>
          <div class="reservation-list">
            <div v-for="r in myReservations" :key="r.id" class="reservation-item">
              <div class="reservation-day">{{ r.day }}</div>
              <div class="reservation-info">
                <div class="reservation-name">{{ r.facilityName }}</div>
                <div class="reservation-time">{{ r.time }}</div>
              </div>
            </div>
          </div>
        </div>
      
      </div>
    </div>
  </div>

</template>

<style scoped>
* { box-sizing: border-box; margin: 0; padding: 0; }
.facility-list-view { font-family: 'Noto Sans KR', sans-serif; color: #333; }

/* 레이아웃 */
.main-layout { display: grid; grid-template-columns: 1fr 280px; gap: 24px; }

/* 상위 탭 */
.top-tab-bar  { display: flex; gap: 0; margin-bottom: 20px; border-bottom: 2px solid #E2E8F0; }
.top-tab-btn  { padding: 10px 24px; border: none; background: none; font-size: 15px; font-weight: 600; color: #A0AEC0; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; border-bottom: 2px solid transparent; margin-bottom: -2px; transition: all 0.15s; }
.top-tab-btn.active { color: #2B3A55; border-bottom-color: #2B3A55; }
.top-tab-btn:hover:not(.active) { color: #4A5568; }

/* GX 하위 탭 */
.tab-bar  { display: flex; gap: 4px; margin-bottom: 16px; border-bottom: 1px solid #E2E8F0; }
.tab-btn  { padding: 6px 16px; border: none; background: none; font-size: 13px; color: #718096; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; border-bottom: 2px solid transparent; margin-bottom: -1px; }
.tab-btn.active { color: #2B3A55; font-weight: 700; border-bottom-color: #2B3A55; }
.tab-btn:hover:not(.active) { color: #4A5568; }

/* 시설 카드 */
.facility-list { display: flex; flex-direction: column; gap: 16px; }
.facility-card { background: #fff; border-radius: 12px; border: 1px solid #E2E8F0; padding: 20px; display: flex; gap: 20px; cursor: pointer; transition: box-shadow 0.15s; align-items: center; }
.facility-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); border-color: #2B3A55; }
.facility-img  { width: 200px; height: 130px; background: #F5F6F8; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; }
.facility-info { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.facility-header { display: flex; align-items: center; gap: 10px; }
.facility-name   { font-size: 17px; font-weight: 700; color: #1A202C; }
.facility-desc   { font-size: 13px; color: #718096; line-height: 1.5; }
.facility-meta   { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 4px; }
.meta-item       { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #718096; }
.facility-arrow  { font-size: 20px; color: #CBD5E0; flex-shrink: 0; }

/* 상태 뱃지 */
.status-badge           { display: inline-block; padding: 3px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; }
.status-badge.available { background: #EBF5EE; color: #4D8B5A; }
.status-badge.closed    { background: #FEF9C3; color: #ca8a04; }

/* 빈 상태 */
.empty-msg { text-align: center; padding: 40px; color: #A0AEC0; font-size: 14px; }

/* 사이드바 */
.sidebar     { display: flex; flex-direction: column; gap: 16px; }
.sidebar-box { background: #fff; border-radius: 10px; border: 1px solid #E2E8F0; padding: 16px; }
.sidebar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.sidebar-title  { font-size: 14px; font-weight: 700; color: #1A202C; }
.sidebar-more   { font-size: 12px; color: #A0AEC0; cursor: pointer; }
.sidebar-more:hover { color: #2B3A55; }

/* 공지 */
.notice-list  { display: flex; flex-direction: column; gap: 10px; }
.notice-item  { display: flex; gap: 10px; align-items: center; }
.notice-thumb { width: 56px; height: 40px; border-radius: 6px; flex-shrink: 0; }
.notice-info  { flex: 1; }
.notice-title { font-size: 12px; font-weight: 600; color: #1A202C; line-height: 1.4; }
.notice-date  { font-size: 11px; color: #A0AEC0; margin-top: 2px; }

/* 내 예약 */
.reservation-list { display: flex; flex-direction: column; gap: 10px; }
.reservation-item { display: flex; gap: 12px; align-items: center; padding: 8px 0; border-bottom: 1px solid #F5F6F8; }
.reservation-item:last-child { border-bottom: none; }
.reservation-day  { width: 36px; height: 36px; background: #F0F4FF; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 700; color: #2B3A55; flex-shrink: 0; }
.reservation-info { flex: 1; }
.reservation-name { font-size: 13px; font-weight: 600; color: #1A202C; }
.reservation-time { font-size: 11px; color: #A0AEC0; margin-top: 2px; }
</style>