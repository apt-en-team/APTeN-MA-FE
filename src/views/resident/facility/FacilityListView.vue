<script setup>
import { onMounted, reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import facilityAPI from '@/api/facility.js'
import reservationAPI from '@/api/reservation.js'
import { getPostList } from '@/api/board.js'

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

// ────────────────────────────────────────────
// 사이드바 데이터
// ────────────────────────────────────────────
const notices = ref([])
const myReservations = ref([])


/** 공지 조회 */
const fetchNotices = async () => {
  try {
    const { data } = await getPostList({ category: 'NOTICE', size: 3 })
    notices.value = data.content ?? [] 
  } catch (e) {
    console.error('공지 조회 실패', e)
  }
}

/** 내 예약 조회 */
const fetchMyReservations = async () => {
  try {
    const { data } = await reservationAPI.getMyReservations({ size: 3 })
    myReservations.value = data.content ?? data.resultData ?? []
  } catch (e) {
    console.error('내 예약 조회 실패', e)
    myReservations.value = []  
  }
}

/** 날짜 포맷 (2026-03-18 → 26.03.18) */
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const yy = String(d.getFullYear()).slice(2)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yy}.${mm}.${dd}`
}

/** 예약 날짜에서 일(day)만 추출 */
const getDay = (dateStr) => {
  if (!dateStr) return ''
  return String(new Date(dateStr).getDate()).padStart(2, '0')
}

/** 예약 시간 포맷 */
const formatReservationTime = (r) => {
  if (!r.reservationDate && !r.startTime) return ''
  const date = formatDate(r.reservationDate)
  const start = r.startTime?.slice(0, 5) ?? ''
  const end = r.endTime?.slice(0, 5) ?? ''
  return `${date} ${start} ~ ${end}`
}

// ────────────────────────────────────────────
// 기존 로직 유지
// ────────────────────────────────────────────
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

// 사이드바 페이지 이동
const goToNoticeList   = () => router.push('/resident/board/notice')
const goToNoticeDetail = (id) => router.push(`/resident/board/notice/${id}`)
const goToMyReservation = () => router.push('/resident/my-reservation')

onMounted(() => {
  fetchTypes()
  fetchNotices()
  fetchMyReservations()
})
</script>

<template>
  <div class="facility-list-view">
    <div class="main-layout">

      <!-- 왼쪽: 시설 목록 (기존 그대로) -->
      <div class="facility-section">
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
      </div>

      <!-- 오른쪽: 사이드바 (API 연결) -->
      <div class="sidebar">

        <!-- 관련 공지 -->
        <div class="sidebar-box">
          <div class="sidebar-header">
            <span class="sidebar-title">관련 공지</span>
            <span class="sidebar-more" @click="goToNoticeList">더보기 →</span>
          </div>
          <div class="notice-list">
            <div
              v-for="n in notices"
              :key="n.boardId"
              class="notice-item"
              @click="goToNoticeDetail(n.boardId)"
              style="cursor:pointer;"
            >
              <div
                class="notice-thumb"
                :style="n.imageUrl
                  ? { backgroundImage: `url(${n.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                  : { background: '#EDF2F7' }"
              ></div>
              <div class="notice-info">
                <div class="notice-title">{{ n.title }}</div>
                <div class="notice-date">등록일자: {{ formatDate(n.createdAt) }}</div>
              </div>
            </div>
            <div v-if="notices.length === 0" class="empty-msg" style="padding:16px 0;">
              공지가 없습니다.
            </div>
          </div>
        </div>

        <!-- 내 예약 -->
        <div class="sidebar-box">
          <div class="sidebar-header">
            <span class="sidebar-title">내 예약</span>
            <span class="sidebar-more" @click="goToMyReservation">더보기 →</span>
          </div>
          <div class="reservation-list">
            <div
              v-for="r in myReservations"
              :key="r.reservationId"
              class="reservation-item"
              @click="goToMyReservation"
              style="cursor:pointer;"
            >
              <div class="reservation-day">{{ getDay(r.reservationDate) }}</div>
              <div class="reservation-info">
                <div class="reservation-name">{{ r.facilityName }}</div>
                <div class="reservation-time">{{ formatReservationTime(r) }}</div>
              </div>
            </div>
            <div v-if="myReservations.length === 0" class="empty-msg" style="padding:16px 0;">
              예약 내역이 없습니다.
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
/* 기존 스타일 전체 유지 */
* { box-sizing: border-box; margin: 0; padding: 0; }
.facility-list-view { font-family: 'Noto Sans KR', sans-serif; color: #333; }
.main-layout { display: grid; grid-template-columns: 1fr 280px; gap: 24px; }
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
.facility-name   { font-size: 17px; font-weight: 700; color: #1A202C; }
.facility-desc   { font-size: 13px; color: #718096; line-height: 1.5; }
.facility-meta   { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 4px; }
.meta-item       { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #718096; }
.facility-arrow  { font-size: 20px; color: #CBD5E0; flex-shrink: 0; }
.status-badge           { display: inline-block; padding: 3px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; }
.status-badge.available { background: #EBF5EE; color: #4D8B5A; }
.status-badge.closed    { background: #FEF9C3; color: #ca8a04; }
.empty-msg { text-align: center; padding: 40px; color: #A0AEC0; font-size: 14px; }
.sidebar     { display: flex; flex-direction: column; gap: 16px; }
.sidebar-box { background: #fff; border-radius: 10px; border: 1px solid #E2E8F0; padding: 16px; }
.sidebar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.sidebar-title  { font-size: 14px; font-weight: 700; color: #1A202C; }
.sidebar-more   { font-size: 12px; color: #A0AEC0; cursor: pointer; }
.sidebar-more:hover { color: #2B3A55; }
.notice-list  { display: flex; flex-direction: column; gap: 10px; }
.notice-item  { display: flex; gap: 10px; align-items: center; }
.notice-thumb { width: 56px; height: 40px; border-radius: 6px; flex-shrink: 0; }
.notice-info  { flex: 1; }
.notice-title { font-size: 12px; font-weight: 600; color: #1A202C; line-height: 1.4; }
.notice-date  { font-size: 11px; color: #A0AEC0; margin-top: 2px; }
.reservation-list { display: flex; flex-direction: column; gap: 10px; }
.reservation-item { display: flex; gap: 12px; align-items: center; padding: 8px 0; border-bottom: 1px solid #F5F6F8; }
.reservation-item:last-child { border-bottom: none; }
.reservation-day  { width: 36px; height: 36px; background: #F0F4FF; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 700; color: #2B3A55; flex-shrink: 0; }
.reservation-info { flex: 1; }
.reservation-name { font-size: 13px; font-weight: 600; color: #1A202C; }
.reservation-time { font-size: 11px; color: #A0AEC0; margin-top: 2px; }
</style>