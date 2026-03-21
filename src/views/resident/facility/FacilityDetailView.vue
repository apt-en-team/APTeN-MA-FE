<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import facilityAPI from '@/api/facility.js'
import FacilityLayout from '@/components/layout/FacilityLayout.vue'

const route  = useRoute()
const router = useRouter()

const facility = reactive({})
const loading  = ref(true)

/** 운영 시간 포맷 */
const formatTime = (time) => time ? String(time).slice(0, 5) : '-'

/** API-049 | 시설 상세 조회 */
const fetchFacility = async () => {
  try {
    const { data } = await facilityAPI.getFacility(route.params.id)
    Object.assign(facility, data.resultData)
  } catch (e) {
    console.error('시설 상세 조회 실패', e)
  } finally {
    loading.value = false
  }
}

/** 이전 버튼 */
const goBack = () => router.back()


//수정한다!!!!!!!!!!!
const handleNextAction = async () => {
  //독서실
  if (facility.typeId === 1) {
    router.push({
      name: 'StudyRoomReservationView',
      query: {
        facilityId: facility.facilityId,
        typeId: facility.typeId,
      },
    })
    return
  }

  //골프연습장
  if (facility.typeId === 3) {
    router.push({
      name: 'GolfReservationView',
      query: {
        facilityId: facility.facilityId,
        typeId: facility.typeId,
      },
    })
    return
  }

  //헬스장 / GX
  router.push({
    name: 'MyReservation',
  })
}

//버튼 텍스트
const actionButtonText = () => {
  return facility.typeId === 1 || facility.typeId === 3 ? '다음' : '예약하기'
}

onMounted(() => fetchFacility())
</script>

<template>
  <FacilityLayout>

    <!-- 브레드크럼 -->
    <div class="breadcrumb">
      <span class="breadcrumb-title">{{ facility.name }} 예약하기</span>
      <span class="breadcrumb-sep"> / </span>
      <span class="breadcrumb-sub">{{ [4].includes(facility.typeId) ? 'GX 시설' : '편의 시설' }}</span>
    </div>

    <!-- 로딩 -->
    <div v-if="loading" class="loading-msg">불러오는 중...</div>

    <template v-else>
      <!-- 안내사항 카드 -->
      <div class="detail-card">
        <h3 class="card-title">안내사항</h3>

        <!-- 기본 정보 테이블 -->
        <table class="info-table">
          <tbody>
            <tr>
              <td class="info-label">운영시간</td>
              <td class="info-value">{{ formatTime(facility.openTime) }} ~ {{ formatTime(facility.closeTime) }}</td>
            </tr>
            <tr v-if="facility.slotDuration">
              <td class="info-label">예약 단위</td>
              <td class="info-value">{{ facility.slotDuration }}분</td>
            </tr>
            <tr>
              <td class="info-label">최대 인원</td>
              <td class="info-value">{{ facility.maxCapacity }}명</td>
            </tr>
            <tr>
              <td class="info-label">사용료</td>
              <td class="info-value">{{ facility.price ? facility.price.toLocaleString() + '원' : '무료' }}</td>
          </tr>
            <tr>
              <td class="info-label">운영 여부</td>
              <td class="info-value">
                <span :class="['status-badge', facility.active ? 'available' : 'closed']">
                  {{ facility.active ? '운영 중' : '점검중' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- 구분선 -->
        <div class="divider"></div>

        <!-- 설명 -->
        <!-- 설명 -->
        <div class="desc-section">
          <p class="desc-text">※ 하루 1인 1회 예약입니다.</p>
          <h4 class="desc-title" style="margin-top: 16px;">시설 설명 및 주의 안내</h4>
          <p class="desc-text">{{ facility.description }}</p>
        </div>

        <!-- 버튼 -->
        <div class="card-footer">
          <button class="btn-back" @click="goBack">이전</button>
          <button
            class="btn-reserve"
            @click="handleNextAction"
            :disabled="!facility.active"
          >
            {{ actionButtonText() }}
          </button>
        </div>
      </div>
    </template>

  </FacilityLayout>
</template>

<style scoped>
* { box-sizing: border-box; margin: 0; padding: 0; }

/* 브레드크럼 */
.breadcrumb       { display: flex; align-items: center; gap: 4px; margin-bottom: 20px; }
.breadcrumb-title { font-size: 20px; font-weight: 700; color: #1A202C; }
.breadcrumb-sep   { font-size: 18px; color: #A0AEC0; }
.breadcrumb-sub   { font-size: 16px; color: #A0AEC0; }

/* 로딩 */
.loading-msg { text-align: center; padding: 60px; color: #A0AEC0; font-size: 14px; }

/* 상세 카드 */
.detail-card  { background: #fff; border-radius: 12px; border: 1px solid #E2E8F0; padding: 32px; }
.card-title   { font-size: 20px; font-weight: 700; color: #1A202C; margin-bottom: 20px; }

/* 정보 테이블 */
.info-table   { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
.info-table tr { border-bottom: 1px solid #F5F6F8; }
.info-table tr:last-child { border-bottom: none; }
.info-label   { padding: 14px 20px; font-size: 14px; color: #718096; background: #F8FAFC; width: 140px; font-weight: 500; }
.info-value   { padding: 14px 20px; font-size: 14px; color: #1A202C; font-weight: 500; }

/* 상태 뱃지 */
.status-badge           { display: inline-block; padding: 3px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; }
.status-badge.available { background: #E5F8EB  ; color: #50C878; }
.status-badge.closed    { background: #E0E0E0; color: #757575; }

/* 구분선 */
.divider { height: 1px; background: #E2E8F0; margin: 24px 0; }

/* 설명 */
.desc-section { margin-bottom: 8px; }
.desc-title   { font-size: 17px; font-weight: 700; color: #1A202C; margin-bottom: 10px; }
.desc-text    { font-size: 13px; color: #333333; line-height: 1.8; }

/* 버튼 */
.card-footer  { display: flex; justify-content: center; gap: 12px; margin-top: 32px; }
.btn-back     { padding: 11px 32px; border: 1px solid #E2E8F0; border-radius: 8px; background: #fff; font-size: 14px; color: #718096; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; }
.btn-back:hover { background: #F5F6F8; }
.btn-reserve  { padding: 11px 40px; background: #4973E5; color: #FFFFFF; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; }
.btn-reserve:hover:not(:disabled) { background: rgb(25, 98, 224); }
.btn-reserve:disabled { background: #757575; color: #E0E0E0; cursor: default; }
</style>