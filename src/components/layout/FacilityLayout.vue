<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { getPostList } from "@/api/board.js";
//소영
import { useReservationStore } from "@/stores/modules/reservation.js";

const router = useRouter();
const reservationStore = useReservationStore();

const notices = ref([]);

/** 공지 조회 */
const fetchNotices = async () => {
  try {
    const { data } = await getPostList({ category: "NOTICE", size: 3 });
    notices.value = data.content ?? [];
  } catch (e) {
    console.error("공지 조회 실패", e);
  }
};

//내 예약 조회 - 소영
const fetchMyReservations = async () => {
  try {
    await reservationStore.fetchMyReservationList({
      page: 1,
      size: 3,
      tab: "UPCOMING",
    });
  } catch (e) {
    console.error("예약 조회 실패", e);
  }
};

//내 예약 리스트
const reservations = computed(() => reservationStore.myReservationList || []);

/** 페이지 이동 */
const notice = () => router.push("/resident/board/notice");
const reservation = () => router.push("/resident/my-reservation");
const goToNoticeDetail = (id) => router.push(`/resident/board/notice/${id}`);
const goToMyReservation = () => router.push("/resident/my-reservation");

/** 날짜 포맷 */
const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}.${mm}.${dd}`;
};

/** 예약 날짜에서 일(day)만 추출 */
const getDay = (dateStr) => {
  if (!dateStr) return "";
  return String(new Date(dateStr).getDate()).padStart(2, "0");
};

/** 예약 시간 포맷 */
const formatReservationTime = (r) => {
  const start = r.startTime?.slice(0, 5) ?? "";
  const end = r.endTime?.slice(0, 5) ?? "";
  if (!r.reservationDate) return `${start} ~ ${end}`;
  const date = formatDate(r.reservationDate);
  return `${date} ${start} ~ ${end}`;
};

/** 남은 시간 계산 */
const getRemaining = (r) => {
  if (!r.reservationDate || !r.startTime) return null;
  const now = new Date();
  const [h, m] = r.startTime.split(":").map(Number);
  const start = new Date(r.reservationDate);
  start.setHours(h, m, 0, 0);
  const diff = Math.floor((start - now) / 60000);
  if (diff < 0) return null;
  if (diff < 60) return `${diff}분 남았습니다.`;
  const hours = Math.floor(diff / 60);
  const mins = diff % 60;
  return mins > 0 ? `${hours}시간 ${mins}분 남았습니다.` : `${hours}시간 남았습니다.`;
};

onMounted(() => {
  fetchNotices();
  fetchMyReservations();
});
</script>

<template>
  <div class="layout">
    <!-- 왼쪽: 슬롯 (시설 목록이 들어오는 자리) -->
    <div class="content">
      <slot />
    </div>

    <!-- 오른쪽: 사이드바 -->
    <div class="sidebar">
      <!-- 공지 -->
      <div class="box">
        <div class="header">
          <span>공지 사항</span>
          <span class="more" @click="notice">더보기 →</span>
        </div>
        <div class="notice-list">
          <div
            v-for="n in notices"
            :key="n.boardId"
            class="notice-card"
            @click="goToNoticeDetail(n.boardId)"
          >
            <div
              class="notice-bg"
              :style="
                n.imageUrl
                  ? {
                      backgroundImage: `url(${n.imageUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }
                  : { background: '#4A5568' }
              "
            ></div>
            <div class="notice-overlay">
              <div class="notice-overlay-title">{{ n.title }}</div>
              <div class="notice-overlay-date">
                등록일자 : {{ formatDate(n.createdAt) }}
              </div>
            </div>
          </div>
          <div v-if="notices.length === 0" class="empty">공지가 없습니다.</div>
        </div>
      </div>

      <!-- 내 예약 -->
      <div class="box">
        <div class="header">
          <span>내 예약</span>
          <span class="more" @click="reservation">더보기 →</span>
        </div>
        <div class="reservation-list">
          <div
            v-for="r in reservations"
            :key="r.reservationId"
            class="reservation-item"
            @click="goToMyReservation"
          >
            <div class="day">{{ getDay(r.reservationDate) }}</div>
            <div class="info">
              <div class="name">{{ r.facilityName }}</div>
              <div class="remaining" v-if="getRemaining(r)">{{ getRemaining(r) }}</div>
              <div class="time">{{ formatReservationTime(r) }}</div>
            </div>
          </div>
          <div v-if="reservations.length === 0" class="empty">예약 내역이 없습니다.</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 레이아웃 그리드 */
.layout {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 24px;
  font-family: "Noto Sans KR", sans-serif;
}
.content {
  min-width: 0;
}

/* 사이드바 */
.sidebar {
  width: 280px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  isolation: auto;
  margin-top: 48px;
}
.box {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 16px;
}
.header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
  font-weight: 600;
}
.more {
  font-size: 12px;
  color: #999999;
  cursor: pointer;
}
.more:hover {
  color: #2b3a55;
}

/* 공지 카드 */
.notice-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.notice-card {
  position: relative;
  height: 90px;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  transition: opacity 0.15s;
}
.notice-card:hover {
  opacity: 0.9;
}
.notice-bg {
  position: absolute;
  inset: 0;
  background: #4a5568;
}
.notice-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.65) 60%, rgba(0, 0, 0, 0.1));
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 10px 12px;
}
.notice-overlay-title {
  font-size: 15px;
  font-weight: 700;
  color: #ffffff;
  line-height: 1.4;
  margin-bottom: 10px;
}
.notice-overlay-date {
  display: inline-block;
  background: #f5f5f5;
  color: #757575;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  width: fit-content;
}

/* 내 예약 */
.reservation-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.reservation-item {
  display: flex;
  gap: 12px;
  align-items: center;
  cursor: pointer;
  padding: 10px 0;
  border-bottom: 1px solid #f5f6f8;
}
.reservation-item:last-child {
  border-bottom: none;
}
.reservation-item:hover {
  opacity: 0.8;
}
.day {
  width: 40px;
  height: 40px;
  background: #f0f4ff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
  color: #2b3a55;
  flex-shrink: 0;
}
.name {
  font-size: 13px;
  font-weight: 600;
  color: #1a202c;
}
.remaining {
  font-size: 11px;
  color: #4d8b5a;
  margin-top: 2px;
}
.time {
  font-size: 11px;
  color: #a0aec0;
  margin-top: 1px;
}
.empty {
  text-align: center;
  font-size: 12px;
  color: #a0aec0;
  padding: 20px 0;
}
</style>
