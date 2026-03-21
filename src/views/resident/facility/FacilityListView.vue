<script setup>
import { onMounted, ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useFacilityStore } from "@/stores/modules/facility";
import FacilityLayout from "@/components/layout/FacilityLayout.vue";
import Pagination from "@/components/layout/Pagination.vue";

const router = useRouter();
const facilityStore = useFacilityStore();

// 이미지맵
const facilityImageMap = {
  "독서실(남)": new URL("@/assets/images/readingroom.png", import.meta.url).href,
  "독서실(여)": new URL("@/assets/images/readingroom.png", import.meta.url).href,
  헬스장: new URL("@/assets/images/PT.png", import.meta.url).href,
  골프연습장: new URL("@/assets/images/golf.png", import.meta.url).href,
  "GX-필라테스(오전)": new URL("@/assets/images/pilates.png", import.meta.url).href,
  "GX-필라테스(오후)": new URL("@/assets/images/pilates.png", import.meta.url).href,
  "GX-그룹PT(오전)": new URL("@/assets/images/Group PT.png", import.meta.url).href,
  "GX-그룹PT(오후)": new URL("@/assets/images/Group PT.png", import.meta.url).href,
};
const getFacilityImage = (name) => facilityImageMap[name] ?? null;

const PAGE_SIZE = 5;
const topTab = ref("facility");
const gxSubTab = ref("전체");
const gxPage = ref(1);

const formatTime = (time) => (time ? String(time).slice(0, 5) : "-");

const filteredGxFacilities = computed(() => {
  if (gxSubTab.value === "전체") return facilityStore.gxList;
  const keyword = gxSubTab.value === "오전" ? "오전" : "오후";
  return facilityStore.gxList.filter((f) => f.name.includes(keyword));
});

const displayFacilities = computed(() => {
  if (topTab.value !== "gx") return facilityStore.facilityList;
  const start = (gxPage.value - 1) * PAGE_SIZE;
  return filteredGxFacilities.value.slice(start, start + PAGE_SIZE);
});

const gxMaxPage = computed(
  () => Math.ceil(filteredGxFacilities.value.length / PAGE_SIZE) || 1
);

const switchTopTab = async (tab) => {
  topTab.value = tab;
  gxSubTab.value = "전체";
  gxPage.value = 1;
  if (tab === "facility") await facilityStore.fetchFacilityList();
  else await facilityStore.fetchGxList();
};

const switchGxSubTab = (sub) => {
  gxSubTab.value = sub;
  gxPage.value = 1;
};

const goToDetail = (f) =>
  router.push({ name: "FacilityDetail", params: { id: f.facilityId } });

onMounted(async () => {
  if (!facilityStore.facilityList.length) await facilityStore.fetchFacilityList();
});
</script>

<template>
  <FacilityLayout>
    <div class="top-tab-bar">
      <button
        :class="['top-tab-btn', { active: topTab === 'facility' }]"
        @click="switchTopTab('facility')"
      >
        편의 시설
      </button>
      <button
        :class="['top-tab-btn', { active: topTab === 'gx' }]"
        @click="switchTopTab('gx')"
      >
        GX강습
      </button>
    </div>

    <div class="tab-bar" v-if="topTab === 'gx'">
      <button
        v-for="sub in ['전체', '오전', '오후']"
        :key="sub"
        :class="['tab-btn', { active: gxSubTab === sub }]"
        @click="switchGxSubTab(sub)"
      >
        {{ sub }}
      </button>
    </div>

    <div class="facility-list">
      <div
        v-for="f in displayFacilities"
        :key="f.facilityId"
        class="facility-card"
        @click="goToDetail(f)"
      >
        <div class="facility-img">
          <img
            v-if="getFacilityImage(f.name)"
            :src="getFacilityImage(f.name)"
            :alt="f.name"
            style="width: 100%; height: 100%; object-fit: cover; border-radius: 10px"
          />
          <svg
            v-else
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#CBD5E0"
            stroke-width="1"
          >
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
          </svg>
        </div>
        <div class="facility-info">
          <div class="facility-header">
            <span class="facility-name">{{ f.name }}</span>
            <span :class="['status-badge', f.isActive ? 'available' : 'closed']">
              {{ f.isActive ? "예약 가능" : "점검중" }}
            </span>
          </div>
          <p class="facility-desc">
            <span v-if="f.description && f.description.includes('\n')">
              {{ f.description.split("\n")[0] }}&nbsp;&nbsp;&nbsp;
              <span class="desc-more">... 더보기</span>
            </span>
            <span v-else>
              {{ f.description || "운영 시작 시 예약이 가능합니다." }}
            </span>
          </p>

          <div class="facility-meta">
            <span class="meta-item">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              운영 시간: {{ formatTime(f.openTime) }} ~ {{ formatTime(f.closeTime) }}
            </span>
            <span class="meta-item" v-if="topTab === 'facility'">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
              자리 예약 필수 ({{ f.maxCapacity }}석)
            </span>
            <span class="meta-item" v-if="topTab === 'gx'">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
              정원 {{ f.maxCapacity }}명
            </span>
            <span class="meta-item" v-if="topTab === 'gx'"
              >예약 단위 {{ f.slotDuration }}분</span
            >
          </div>
        </div>
        <div class="facility-arrow">→</div>
      </div>

      <div v-if="displayFacilities.length === 0" class="empty-msg">
        등록된 시설이 없습니다.
      </div>
    </div>

    <!-- GX 탭일 때만 페이지네이션 표시 -->
    <Pagination
      v-if="topTab === 'gx'"
      :currentPage="gxPage"
      :maxPage="gxMaxPage"
      :totalAll="filteredGxFacilities.length"
      :totalFiltered="filteredGxFacilities.length"
      unit="개"
      @change="gxPage = $event"
    />
  </FacilityLayout>
</template>

<style scoped>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
.top-tab-bar {
  display: flex;
  gap: 0;
  margin-bottom: 20px;
  border-bottom: 2px solid #e2e8f0;
}
.top-tab-btn {
  padding: 10px 24px;
  border: none;
  background: none;
  font-size: 20px;
  font-weight: 600;
  color: #a0aec0;
  cursor: pointer;

  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: all 0.15s;
}
.top-tab-btn.active {
  color: #4973e5;
  border-bottom-color: #4973e5;
}
.top-tab-btn:hover:not(.active) {
  color: #757575;
}
.tab-bar {
  display: flex;
  gap: 4px;
  margin-bottom: 16px;
  border-bottom: 1px solid #e2e8f0;
}
.tab-btn {
  padding: 6px 16px;
  border: none;
  background: none;
  font-size: 15px;
  color: #757575;
  cursor: pointer;

  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
}
.tab-btn.active {
  color: #4973e5;
  font-weight: 700;
  border-bottom-color: #4973e5;
}
.tab-btn:hover:not(.active) {
  color: #4a5568;
}
.facility-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.facility-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 20px;
  display: flex;
  gap: 20px;
  cursor: pointer;
  transition: box-shadow 0.15s;
  align-items: center;
}
.facility-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: #2b3a55;
}
.facility-img {
  width: 200px;
  height: 130px;
  background: #f5f6f8;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}
.facility-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.facility-header {
  display: flex;
  align-items: center;
  gap: 10px;
}
.facility-name {
  font-size: 28px;
  font-weight: 700;
  color: #1a202c;
}
.facility-desc {
  font-size: 15px;
  color: #718096;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
} 

.facility-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 4px;
}
.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #718096;
}
.facility-arrow {
  font-size: 20px;
  color: #cbd5e0;
  flex-shrink: 0;
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
.empty-msg {
  text-align: center;
  padding: 40px;
  color: #aaa;
  font-size: 14px;
}
</style>
