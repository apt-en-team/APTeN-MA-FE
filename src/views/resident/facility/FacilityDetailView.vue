<script setup>
import { onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useFacilityStore } from "@/stores/modules/facility";
import FacilityLayout from "@/components/layout/FacilityLayout.vue";

const route = useRoute();
const router = useRouter();
const facilityStore = useFacilityStore();

const facility = reactive({});
const loading = ref(true);

const formatTime = (time) => (time ? String(time).slice(0, 5) : "-");

const fetchFacility = async () => {
  const result = await facilityStore.fetchFacilityDetail(route.params.id);
  if (result) Object.assign(facility, result);
  loading.value = false;
};

const goToReservation = () =>
  router.push({
    name: "ReservationCalendar",
    query: { facilityId: facility.facilityId },
  });

const goBack = () => router.back();

onMounted(() => fetchFacility());
</script>

<template>
  <FacilityLayout>
    <div class="breadcrumb">
      <span class="breadcrumb-title">{{ facility.name }} 예약하기</span>
      <span class="breadcrumb-sep"> / </span>
      <span class="breadcrumb-sub">{{
        [4].includes(facility.typeId) ? "GX 시설" : "편의 시설"
      }}</span>
    </div>

    <div v-if="loading" class="loading-msg">불러오는 중...</div>

    <template v-else>
      <div class="detail-card">
        <h3 class="card-title">안내사항</h3>
        <table class="info-table">
          <tbody>
            <tr>
              <td class="info-label">운영시간</td>
              <td class="info-value">
                {{ formatTime(facility.openTime) }} ~ {{ formatTime(facility.closeTime) }}
              </td>
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
              <td class="info-value">
                {{ facility.price > 0 ? facility.price.toLocaleString() + "원" : "무료" }}
              </td>
            </tr>
            <tr>
              <td class="info-label">운영 여부</td>
              <td class="info-value">
                <span
                  :class="['status-badge', facility.isActive ? 'available' : 'closed']"
                >
                  {{ facility.isActive ? "운영 중" : "점검중" }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="divider"></div>

        <div class="desc-section">
          <p class="desc-text">※ 하루 1인 1회 예약입니다.</p>
          <h4 class="desc-title" style="margin-top: 16px">시설 설명 및 주의 안내</h4>
          <p class="desc-text">{{ facility.description }}</p>
        </div>

        <div class="card-footer">
          <button class="btn-back" @click="goBack">이전</button>
          <button
            class="btn-reserve"
            @click="goToReservation"
            :disabled="!facility.isActive"
          >
            예약하기
          </button>
        </div>
      </div>
    </template>
  </FacilityLayout>
</template>

<style scoped>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 20px;
}
.breadcrumb-title {
  font-size: 20px;
  font-weight: 700;
  color: #1a202c;
}
.breadcrumb-sep {
  font-size: 18px;
  color: #a0aec0;
}
.breadcrumb-sub {
  font-size: 16px;
  color: #a0aec0;
}
.loading-msg {
  text-align: center;
  padding: 60px;
  color: #a0aec0;
  font-size: 14px;
}
.detail-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 32px;
}
.card-title {
  font-size: 20px;
  font-weight: 700;
  color: #1a202c;
  margin-bottom: 20px;
}
.info-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 8px;
}
.info-table tr {
  border-bottom: 1px solid #f5f6f8;
}
.info-table tr:last-child {
  border-bottom: none;
}
.info-label {
  padding: 14px 20px;
  font-size: 14px;
  color: #718096;
  background: #f8fafc;
  width: 140px;
  font-weight: 500;
}
.info-value {
  padding: 14px 20px;
  font-size: 14px;
  color: #1a202c;
  font-weight: 500;
}
.status-badge {
  display: inline-block;
  padding: 3px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
}
.status-badge.available {
  background: #e5f8eb;
  color: #50c878;
}
.status-badge.closed {
  background: #e0e0e0;
  color: #757575;
}
.divider {
  height: 1px;
  background: #e2e8f0;
  margin: 24px 0;
}
.desc-section {
  margin-bottom: 8px;
}
.desc-title {
  font-size: 17px;
  font-weight: 700;
  color: #1a202c;
  margin-bottom: 10px;
}
.desc-text {
  font-size: 13px;
  color: #333333;
  line-height: 1.8;
}
.card-footer {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 32px;
}
.btn-back {
  padding: 11px 32px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  font-size: 14px;
  color: #718096;
  cursor: pointer;
  font-family: "Noto Sans KR", sans-serif;
}
.btn-back:hover {
  background: #f5f6f8;
}
.btn-reserve {
  padding: 11px 40px;
  background: #4973e5;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: "Noto Sans KR", sans-serif;
}
.btn-reserve:hover:not(:disabled) {
  background: rgb(25, 98, 224);
}
.btn-reserve:disabled {
  background: #757575;
  color: #e0e0e0;
  cursor: default;
}
</style>
