<script setup>
import { onMounted, reactive, ref } from 'vue'
import facilityAPI from '@/api/facility.js'

const state = reactive({
  types:      [],   // 시설 타입 목록 (탭)
  facilities: [],   // 시설 목록
})

/** 선택된 타입 ID (null = 전체) */
const selectedTypeId = ref(null)

/** 시설 상세 모달 */
const detailModal = reactive({ show: false, facility: null })

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
  { id: 1, day: '07', facilityName: '헬스장',  time: '오전9시 ~ 10시', dayLabel: '3월 7일' },
  { id: 2, day: '08', facilityName: '독서실',  time: '3월22일 4시 ~ 5시', dayLabel: '3월 8일' },
  { id: 3, day: '12', facilityName: '그룹PT(오후)', time: '3월12일(오후) 3시 ~ 4시', dayLabel: '3월 12일' },
]

/** API-044 | 시설 타입 목록 조회 */
const fetchTypes = async () => {
  try {
    const { data } = await facilityAPI.getTypes()
    state.types = data.resultData ?? []
    // 첫 번째 타입 자동 선택
    if (state.types.length > 0) {
      selectedTypeId.value = state.types[0].typeId
      await fetchFacilities(selectedTypeId.value)
    }
  } catch (e) { console.error('시설 타입 조회 실패', e) }
}

/** API-048 | 시설 목록 조회 (타입 필터) */
const fetchFacilities = async (typeId = null) => {
  try {
    const { data } = await facilityAPI.getFacilities(typeId)
    state.facilities = data.resultData ?? []
  } catch (e) { console.error('시설 목록 조회 실패', e) }
}

/** 탭 클릭 */
const selectType = async (typeId) => {
  selectedTypeId.value = typeId
  await fetchFacilities(typeId)
}

/** 상세 모달 열기/닫기 */
const openDetail  = (f) => { detailModal.facility = f; detailModal.show = true }
const closeDetail = () => { detailModal.show = false; detailModal.facility = null }

onMounted(() => fetchTypes())
</script>

<template>
  <div class="facility-list-view">
    <div class="main-layout">

      <!-- 왼쪽: 시설 목록 -->
      <div class="facility-section">

        <!-- 탭 -->
        <div class="tab-bar">
          <button
            v-for="t in state.types"
            :key="t.typeId"
            :class="['tab-btn', { active: selectedTypeId === t.typeId }]"
            @click="selectType(t.typeId)"
          >
            {{ t.name }}
          </button>
        </div>

        <!-- 시설 카드 목록 -->
        <div class="facility-list">
          <div
            v-for="f in state.facilities"
            :key="f.facilityId"
            class="facility-card"
            @click="openDetail(f)"
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
                <span :class="['status-badge', f.active ? 'available' : 'closed']">
                  {{ f.active ? '예약 가능' : '운영 중단' }}
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
                <span class="meta-item">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  </svg>
                  최대 {{ f.maxCapacity }}명
                </span>
                <span class="meta-item">
                  예약 단위 {{ f.slotDuration }}분
                </span>
              </div>
            </div>

            <!-- 더보기 -->
            <div class="facility-more">더 보기 →</div>
          </div>

          <!-- 시설 없음 -->
          <div v-if="state.facilities.length === 0" class="empty-msg">
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

    <!-- 시설 상세 모달 -->
    <div v-if="detailModal.show" class="modal-overlay" @click.self="closeDetail">
      <div class="modal-box">
        <div class="modal-header">
          <h3 class="modal-title">{{ detailModal.facility?.name }}</h3>
          <button class="modal-close" @click="closeDetail">✕</button>
        </div>
        <div class="modal-body">
          <div class="modal-img">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#CBD5E0" stroke-width="1">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
            </svg>
          </div>
          <div class="modal-info">
            <div class="modal-row"><span>시설 타입</span><span>{{ detailModal.facility?.typeName }}</span></div>
            <div class="modal-row"><span>운영 시간</span><span>{{ formatTime(detailModal.facility?.openTime) }} ~ {{ formatTime(detailModal.facility?.closeTime) }}</span></div>
            <div class="modal-row"><span>최대 인원</span><span>{{ detailModal.facility?.maxCapacity }}명</span></div>
            <div class="modal-row"><span>예약 단위</span><span>{{ detailModal.facility?.slotDuration }}분</span></div>
            <div class="modal-row"><span>운영 여부</span>
              <span :class="['status-badge', detailModal.facility?.active ? 'available' : 'closed']">
                {{ detailModal.facility?.active ? '운영 중' : '운영 중단' }}
              </span>
            </div>
            <p class="modal-desc">{{ detailModal.facility?.description || '-' }}</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeDetail">닫기</button>
          <button class="btn-reserve" @click="closeDetail">예약하기</button>
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

/* 탭 */
.tab-bar  { display: flex; gap: 4px; margin-bottom: 16px; border-bottom: 2px solid #E2E8F0; padding-bottom: 0; }
.tab-btn  { padding: 8px 20px; border: none; background: none; font-size: 14px; color: #718096; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; border-bottom: 2px solid transparent; margin-bottom: -2px; }
.tab-btn.active { color: #2B3A55; font-weight: 700; border-bottom-color: #2B3A55; }
.tab-btn:hover:not(.active) { color: #4A5568; }

/* 시설 카드 */
.facility-list { display: flex; flex-direction: column; gap: 16px; }
.facility-card { background: #fff; border-radius: 10px; border: 1px solid #E2E8F0; padding: 20px; display: flex; gap: 20px; cursor: pointer; transition: box-shadow 0.15s; }
.facility-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
.facility-img  { width: 180px; height: 120px; background: #F5F6F8; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.facility-info { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.facility-header { display: flex; align-items: center; gap: 10px; }
.facility-name   { font-size: 16px; font-weight: 700; color: #1A202C; }
.facility-desc   { font-size: 13px; color: #718096; line-height: 1.5; }
.facility-meta   { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 4px; }
.meta-item       { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #718096; }
.facility-more   { font-size: 12px; color: #A0AEC0; align-self: flex-end; white-space: nowrap; }

/* 상태 뱃지 */
.status-badge           { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
.status-badge.available { background: #EBF5EE; color: #4D8B5A; }
.status-badge.closed    { background: #F5F5F5; color: #718096; }

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

/* 모달 */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal-box     { background: #fff; border-radius: 12px; width: 480px; max-width: 90vw; }
.modal-header  { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #E2E8F0; }
.modal-title   { font-size: 16px; font-weight: 700; color: #1A202C; }
.modal-close   { background: none; border: none; font-size: 18px; color: #A0AEC0; cursor: pointer; }
.modal-close:hover { color: #333; }
.modal-body    { padding: 20px 24px; }
.modal-img     { width: 100%; height: 160px; background: #F5F6F8; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
.modal-info    { display: flex; flex-direction: column; gap: 10px; }
.modal-row     { display: flex; justify-content: space-between; font-size: 13px; padding: 8px 0; border-bottom: 1px solid #F5F6F8; }
.modal-row span:first-child { color: #718096; }
.modal-row span:last-child  { font-weight: 600; color: #1A202C; }
.modal-desc    { font-size: 13px; color: #718096; margin-top: 8px; line-height: 1.6; }
.modal-footer  { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 24px; border-top: 1px solid #E2E8F0; }
.btn-cancel    { padding: 9px 20px; border: 1px solid #E2E8F0; border-radius: 7px; background: #fff; font-size: 13px; color: #718096; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; }
.btn-cancel:hover { background: #F5F6F8; }
.btn-reserve   { padding: 9px 24px; background: #2B3A55; color: #fff; border: none; border-radius: 7px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; }
.btn-reserve:hover { background: #1E2A3E; }
</style>