<script setup>
import { computed, onMounted, reactive, ref, watch, inject } from "vue";
import { useRoute } from "vue-router";
import vehicleAPI from "@/api/vehicle.js";
import { useVehicleStore } from "@/stores/modules/vehicle.js";

import StatsCards from "@/components/admin/StatsCards.vue";
import FilterBar from "@/components/layout/FilterBar.vue";
import AdminTable from "@/components/admin/AdminTable.vue";
import Pagination from "@/components/layout/Pagination.vue";
import BaseModal from "@/components/common/BeseModel.vue";
import ConfirmModal from "@/components/common/ConfirmModal.vue";
import ActionResultModal from "@/components/common/ActionResultModal.vue";

const route = useRoute();
const vehicleStore = useVehicleStore();
const registerOpenModal = inject("registerOpenModal");

const state = reactive({
  list: [],
  searchQuery: "",
  filterStatus: "",
  filterHousehold: "",
  filterType: "",
  filterDong: "",
  dongs: [],
  size: 10,
  currentPage: 1,
  maxPage: 0,
  totalFiltered: 0,
  totalAll: 0,
});

const detailModal = reactive({ show: false, vehicle: null });

const approveModal = reactive({
  show: false,
  stage: "confirm",
  vehicle: null,
  loading: false,
  resultType: "success",
  resultTitle: "",
  resultSubtitle: "",
});

const rejectModal = reactive({
  show: false,
  stage: "confirm",
  vehicle: null,
  loading: false,
  reason: "",
  memo: "",
  resultType: "success",
  resultTitle: "",
  resultSubtitle: "",
});

const deleteModal = reactive({
  show: false,
  stage: "confirm",
  vehicle: null,
  loading: false,
  resultType: "success",
  resultTitle: "",
  resultSubtitle: "",
});

const registerModal = reactive({ show: false, loading: false });

const registerForm = reactive({
  dong: "",
  householdId: null,
  userId: null,
  licensePlate: "",
  carModel: "",
  carType: "",
});

const errors = reactive({
  userId: "",
  licensePlate: "",
  carModel: "",
  carType: "",
  general: "",
});

const registerDongs = ref([]);
const registerHouseholds = ref([]);
const registerResidents = ref([]);
const vehicleCount = ref(0);

const rejectReasons = ["중복 차량", "세대 한도 초과", "정보 불일치", "직접 입력"];

const columns = [
  { label: "ID", key: "vehicleId" },
  { label: "차량번호", key: "licensePlate" },
  { label: "차 모델", key: "carModel" },
  { label: "차종", key: "carType" },
  { label: "소속 세대", key: "household" },
  { label: "등록자", key: "user" },
  { label: "승인 상태", key: "status" },
  { label: "등록일", key: "createdAt" },
];

const statsCards = computed(() => [
  {
    label: "전체 등록 차량",
    value: vehicleStore.total,
    unit: "대",
    desc: "승인 완료 기준",
    status: "",
  },
  {
    label: "승인 대기",
    value: vehicleStore.pending,
    unit: "대",
    desc: "즉시 처리 필요",
    descClass: "urgent",
    status: "PENDING",
  },
  {
    label: "승인 완료",
    value: vehicleStore.approved,
    unit: "대",
    desc: "정상 등록",
    status: "APPROVED",
  },
  {
    label: "거부",
    value: vehicleStore.rejected,
    unit: "대",
    desc: "재신청 가능",
    status: "REJECTED",
  },
]);

const statusLabel = (s) =>
  ({ APPROVED: "승인", PENDING: "대기", REJECTED: "거부" }[s] ?? s);
const statusClass = (s) =>
  ({ APPROVED: "approved", PENDING: "pending", REJECTED: "rejected" }[s] ?? "");
const formatDate = (val) => (val ? val.replace("T", " ").substring(0, 16) : "-");

const householdLabel = (household) => {
  if (!household) return "-";
  return `${household.dong ?? ""} ${household.ho ?? ""}`.trim() || "-";
};

const getApprovalDate = (vehicle) => {
  if (vehicle?.approvedAt) return formatDate(vehicle.approvedAt);
  if (vehicle?.status === "REJECTED" && vehicle?.deletedAt)
    return formatDate(vehicle.deletedAt);
  if (vehicle?.updatedAt && vehicle?.status !== "PENDING")
    return formatDate(vehicle.updatedAt);
  return "-";
};

const sortByPendingFirst = (list) =>
  [...list].sort((a, b) => {
    if (a.status === "PENDING" && b.status !== "PENDING") return -1;
    if (a.status !== "PENDING" && b.status === "PENDING") return 1;
    return 0;
  });

const fetchVehicles = async () => {
  try {
    const { data } = await vehicleAPI.getAllVehicles({
      search: state.searchQuery || null,
      status: state.filterStatus || null,
      householdId: state.filterHousehold || null,
      carType: state.filterType || null,
      dong: state.filterDong || null,
      page: state.currentPage - 1,
      size: state.size,
    });
    const result = data.resultData;
    state.list = sortByPendingFirst(result.content ?? []);
    state.maxPage = result.totalPages ?? 0;
    state.totalFiltered = result.content?.length ?? 0;
    state.totalAll = vehicleStore.total ?? 0;
  } catch (e) {
    console.error("차량 목록 조회 실패", e);
  }
};

const fetchStats = () => vehicleStore.fetchStats();

const fetchDongs = async () => {
  try {
    const { data } = await vehicleAPI.getDongs();
    state.dongs = data.resultData ?? [];
  } catch (e) {
    console.error("동 목록 조회 실패", e);
  }
};

/* ───────── 상세 모달 ───────── */
const openDetailModal = async (vehicle) => {
  detailModal.vehicle = vehicle;
  detailModal.show = true;
  if (vehicle?.household?.dong) {
    try {
      const { data } = await vehicleAPI.getAllVehicles({
        dong: vehicle.household.dong,
        size: 999,
        status: null,
      });
      vehicleCount.value =
        data.resultData?.content?.filter((v) => v.household?.ho === vehicle.household.ho)
          .length ?? 0;
    } catch (e) {
      vehicleCount.value = 0;
    }
  } else {
    vehicleCount.value = 0;
  }
};
const closeDetailModal = () => {
  detailModal.show = false;
  detailModal.vehicle = null;
};

/* ───────── 승인 모달 ───────── */
const openApproveModal = (vehicle) => {
  approveModal.vehicle = vehicle;
  approveModal.loading = false;
  approveModal.stage = "confirm";
  approveModal.show = true;
};
const closeApproveConfirm = () => {
  approveModal.show = false;
  approveModal.vehicle = null;
  approveModal.stage = "confirm";
};
const closeApproveResult = () => {
  approveModal.show = false;
  approveModal.vehicle = null;
  approveModal.stage = "confirm";
};

const handleApprove = async () => {
  approveModal.loading = true;
  try {
    await vehicleAPI.approveVehicle(approveModal.vehicle.vehicleId);
    await Promise.all([fetchVehicles(), fetchStats()]);
    approveModal.resultType = "success";
    approveModal.resultTitle = "승인이 완료되었습니다.";
    approveModal.resultSubtitle = `${approveModal.vehicle.licensePlate} 차량이 승인되었습니다.`;
  } catch (e) {
    console.error("승인 실패", e);
    approveModal.resultType = "danger";
    approveModal.resultTitle = "승인에 실패했습니다.";
    approveModal.resultSubtitle = "잠시 후 다시 시도해주세요.";
  } finally {
    approveModal.loading = false;
    approveModal.stage = "result";
  }
};

/* ───────── 거부 모달 ───────── */
const openRejectModal = (vehicle) => {
  rejectModal.vehicle = vehicle;
  rejectModal.loading = false;
  rejectModal.reason = "";
  rejectModal.memo = "";
  rejectModal.stage = "confirm";
  rejectModal.show = true;
};
const closeRejectConfirm = () => {
  rejectModal.show = false;
  rejectModal.vehicle = null;
  rejectModal.stage = "confirm";
};
const closeRejectResult = () => {
  rejectModal.show = false;
  rejectModal.vehicle = null;
  rejectModal.stage = "confirm";
};

const handleReject = async () => {
  rejectModal.loading = true;
  try {
    await vehicleAPI.rejectVehicle(rejectModal.vehicle.vehicleId);
    await Promise.all([fetchVehicles(), fetchStats()]);
    rejectModal.resultType = "success";
    rejectModal.resultTitle = "거부 처리되었습니다.";
    rejectModal.resultSubtitle = `${rejectModal.vehicle.licensePlate} 차량이 거부되었습니다.`;
  } catch (e) {
    console.error("거부 실패", e);
    rejectModal.resultType = "danger";
    rejectModal.resultTitle = "거부 처리에 실패했습니다.";
    rejectModal.resultSubtitle = "잠시 후 다시 시도해주세요.";
  } finally {
    rejectModal.loading = false;
    rejectModal.stage = "result";
  }
};

/* ───────── 삭제 모달 ───────── */
const openDeleteModal = (vehicle) => {
  deleteModal.vehicle = vehicle;
  deleteModal.loading = false;
  deleteModal.stage = "confirm";
  deleteModal.show = true;
};
const closeDeleteConfirm = () => {
  deleteModal.show = false;
  deleteModal.vehicle = null;
  deleteModal.stage = "confirm";
};
const closeDeleteResult = () => {
  deleteModal.show = false;
  deleteModal.vehicle = null;
  deleteModal.stage = "confirm";
};

const handleDelete = async () => {
  deleteModal.loading = true;
  try {
    await vehicleAPI.deleteVehicle(deleteModal.vehicle.vehicleId);
    closeDetailModal();
    await Promise.all([fetchVehicles(), fetchStats()]);
    deleteModal.resultType = "success";
    deleteModal.resultTitle = "차량이 삭제되었습니다.";
    deleteModal.resultSubtitle = `${deleteModal.vehicle.licensePlate} 차량이 삭제되었습니다.`;
  } catch (e) {
    console.error("삭제 실패", e);
    deleteModal.resultType = "danger";
    deleteModal.resultTitle = "삭제에 실패했습니다.";
    deleteModal.resultSubtitle = "잠시 후 다시 시도해주세요.";
  } finally {
    deleteModal.loading = false;
    deleteModal.stage = "result";
  }
};

/* ───────── 차량 등록 모달 ───────── */
const openRegisterModal = async () => {
  Object.assign(registerForm, {
    dong: "",
    householdId: null,
    userId: null,
    licensePlate: "",
    carModel: "",
    carType: "",
  });
  Object.assign(errors, {
    userId: "",
    licensePlate: "",
    carModel: "",
    carType: "",
    general: "",
  });
  registerHouseholds.value = [];
  registerResidents.value = [];
  vehicleCount.value = 0;
  try {
    const { data } = await vehicleAPI.getHouseholdDongs();
    registerDongs.value = data.resultData ?? [];
  } catch (e) {
    console.error("동 목록 조회 실패", e);
  }
  registerModal.show = true;
};
const closeRegisterModal = () => {
  registerModal.show = false;
};

const onDongChange = async () => {
  registerForm.householdId = null;
  registerForm.userId = null;
  registerResidents.value = [];
  vehicleCount.value = 0;
  if (!registerForm.dong) {
    registerHouseholds.value = [];
    return;
  }
  try {
    const { data } = await vehicleAPI.getHouseholds({ dong: registerForm.dong });
    registerHouseholds.value = data.resultData ?? [];
  } catch (e) {
    console.error("세대 목록 조회 실패", e);
  }
};

const onHouseholdChange = async () => {
  registerForm.userId = null;
  vehicleCount.value = 0;
  if (!registerForm.householdId) {
    registerResidents.value = [];
    return;
  }
  try {
    const [residentRes, vehicleRes] = await Promise.all([
      vehicleAPI.getResidents(registerForm.householdId),
      vehicleAPI.getAllVehicles({ householdId: registerForm.householdId, size: 999 }),
    ]);
    registerResidents.value = residentRes.data.resultData ?? [];
    vehicleCount.value = vehicleRes.data.resultData?.content?.length ?? 0;
  } catch (e) {
    console.error("입주민/차량 조회 실패", e);
  }
};

const handleRegister = async () => {
  Object.assign(errors, {
    userId: "",
    licensePlate: "",
    carModel: "",
    carType: "",
    general: "",
  });
  if (!registerForm.userId) {
    errors.userId = "입주민을 선택해주세요.";
    return;
  }
  if (!registerForm.licensePlate) {
    errors.licensePlate = "차량 번호를 입력해주세요.";
    return;
  }
  if (!registerForm.carModel) {
    errors.carModel = "차 모델을 입력해주세요.";
    return;
  }
  if (!registerForm.carType) {
    errors.carType = "차종을 선택해주세요.";
    return;
  }
  if (vehicleCount.value >= 2) {
    errors.general = "세대당 최대 2대까지 등록 가능합니다.";
    return;
  }
  try {
    const { data } = await vehicleAPI.getAllVehicles({
      search: registerForm.licensePlate,
      size: 999,
    });
    const existing = data.resultData?.content?.find(
      (v) =>
        v.licensePlate === registerForm.licensePlate &&
        (v.status === "APPROVED" || v.status === "PENDING")
    );
    if (existing) {
      errors.licensePlate = "이미 등록된 차량입니다. (승인 또는 대기 중)";
      return;
    }
  } catch (e) {
    console.error("중복 체크 실패:", e);
  }
  registerModal.loading = true;
  try {
    await vehicleAPI.adminRegisterVehicle({
      userId: registerForm.userId,
      licensePlate: registerForm.licensePlate,
      carModel: registerForm.carModel,
      carType: registerForm.carType,
      status: "APPROVED",
    });
    closeRegisterModal();
    await new Promise((resolve) => setTimeout(resolve, 500));
    await Promise.all([fetchVehicles(), fetchStats()]);
  } catch (e) {
    const errorMsg = e.response?.data?.resultMessage ?? "등록에 실패했습니다.";
    if (errorMsg.includes("차량") || errorMsg.includes("번호"))
      errors.licensePlate = errorMsg;
    else errors.general = errorMsg;
  } finally {
    registerModal.loading = false;
  }
};

watch(
  () => route.query.register,
  (val) => {
    if (val) openRegisterModal();
  }
);

const doSearch = () => {
  state.currentPage = 1;
  fetchVehicles();
};
let searchTimer = null;
const onSearch = () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => doSearch(), 300);
};
const resetFilters = () => {
  state.searchQuery = "";
  state.filterStatus = "";
  state.filterHousehold = "";
  state.filterType = "";
  state.filterDong = "";
  state.currentPage = 1;
  fetchVehicles();
};
const goToPage = (page) => {
  state.currentPage = page;
  fetchVehicles();
};

onMounted(() => {
  fetchVehicles();
  fetchStats();
  fetchDongs();
  if (registerOpenModal) registerOpenModal(openRegisterModal);
});
</script>

<template>
  <div class="vehicle-list-view">
    <!-- 통계 카드 -->
    <div class="stats-cards">
      <div v-for="(stat, index) in statsCards" :key="index" class="stat-card">
        <div class="stat-label">{{ stat.label }}</div>
        <div class="stat-value-wrap">
          <span class="stat-value">{{ stat.value }}</span
          ><span class="stat-unit">{{ stat.unit }}</span>
        </div>
        <div class="stat-desc" :class="stat.descClass">{{ stat.desc }}</div>
      </div>
    </div>

    <div class="table-section">
      <FilterBar @reset="resetFilters">
        <div class="search-wrap">
          <svg
            class="search-icon"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            v-model="state.searchQuery"
            class="search-input"
            placeholder="차량번호, 차종, 세대 검색"
            @input="onSearch"
          />
        </div>
        <select v-model="state.filterStatus" class="filter-select" @change="doSearch">
          <option value="">승인 상태</option>
          <option value="APPROVED">승인</option>
          <option value="PENDING">대기</option>
          <option value="REJECTED">거부</option>
        </select>
        <select v-model="state.filterDong" class="filter-select" @change="doSearch">
          <option value="">세대 선택</option>
          <option v-for="dong in state.dongs" :key="dong" :value="dong">
            {{ dong }}
          </option>
        </select>
        <select v-model="state.filterType" class="filter-select" @change="doSearch">
          <option value="">차종</option>
          <option value="경차">경차</option>
          <option value="승용차">승용차</option>
          <option value="SUV">SUV</option>
          <option value="승합차">승합차</option>
        </select>
      </FilterBar>

      <AdminTable :columns="columns" :rows="state.list" @row-click="openDetailModal">
        <template #cell-vehicleId="{ row }"
          ><span class="td-cell td-id">#{{ row.vehicleId }}</span></template
        >
        <template #cell-licensePlate="{ row }"
          ><span class="td-cell td-plate">{{ row.licensePlate }}</span></template
        >
        <template #cell-carModel="{ row }"
          ><span class="td-cell">{{ row.carModel ?? "-" }}</span></template
        >
        <template #cell-carType="{ row }"
          ><span class="td-cell">{{ row.carType ?? "-" }}</span></template
        >
        <template #cell-household="{ row }"
          ><span class="td-cell">{{ householdLabel(row.household) }}</span></template
        >
        <template #cell-user="{ row }"
          ><span class="td-cell">{{ row.user?.name ?? "-" }}</span></template
        >
        <template #cell-status="{ row }">
          <span class="td-cell"
            ><span class="status-badge" :class="statusClass(row.status)">{{
              statusLabel(row.status)
            }}</span></span
          >
        </template>
        <template #cell-createdAt="{ row }"
          ><span class="td-cell">{{ formatDate(row.createdAt) }}</span></template
        >
        <template #action="{ row }">
          <div class="action-buttons">
            <template v-if="row.status === 'PENDING'">
              <button class="btn-approve" @click.stop="openApproveModal(row)">
                승인
              </button>
              <button class="btn-reject" @click.stop="openRejectModal(row)">거부</button>
            </template>
            <span v-else class="td-dash">-</span>
          </div>
        </template>
      </AdminTable>

      <Pagination
        :currentPage="state.currentPage"
        :maxPage="state.maxPage"
        :totalAll="state.totalAll"
        :totalFiltered="state.totalFiltered"
        unit="대"
        @change="goToPage"
      />
    </div>

    <!-- 상세 모달 -->
    <BaseModal
      v-if="detailModal.show"
      title="차량 상세 정보"
      :subtitle="'ID ' + detailModal.vehicle?.vehicleId"
      @close="closeDetailModal"
    >
      <div class="detail-header-card">
        <span
          :class="['detail-header-badge', statusClass(detailModal.vehicle?.status)]"
          >{{ statusLabel(detailModal.vehicle?.status) }}</span
        >
        <h2 class="detail-header-title">{{ detailModal.vehicle?.licensePlate }}</h2>
        <p class="detail-header-sub">
          {{ detailModal.vehicle?.carModel ?? "-" }} ·
          {{ householdLabel(detailModal.vehicle?.household) }}
        </p>
      </div>
      <div class="detail-grid">
        <div class="detail-cell">
          <span class="detail-label">차량 ID</span
          ><span class="detail-value">{{ detailModal.vehicle?.vehicleId }}</span>
        </div>
        <div class="detail-cell">
          <span class="detail-label">등록자</span
          ><span class="detail-value">{{ detailModal.vehicle?.user?.name ?? "-" }}</span>
        </div>
        <div class="detail-cell">
          <span class="detail-label">차량번호</span
          ><span class="detail-value bold">{{ detailModal.vehicle?.licensePlate }}</span>
        </div>
        <div class="detail-cell">
          <span class="detail-label">소속 세대</span
          ><span class="detail-value">{{
            householdLabel(detailModal.vehicle?.household)
          }}</span>
        </div>
        <div class="detail-cell">
          <span class="detail-label">차 모델</span
          ><span class="detail-value">{{ detailModal.vehicle?.carModel ?? "-" }}</span>
        </div>
        <div class="detail-cell">
          <span class="detail-label">차종</span
          ><span class="detail-value">{{ detailModal.vehicle?.carType ?? "-" }}</span>
        </div>
        <div class="detail-cell">
          <span class="detail-label">승인 상태</span
          ><span :class="['status-badge', statusClass(detailModal.vehicle?.status)]">{{
            statusLabel(detailModal.vehicle?.status)
          }}</span>
        </div>
        <div class="detail-cell">
          <span class="detail-label">등록일</span
          ><span class="detail-value">{{
            formatDate(detailModal.vehicle?.createdAt)
          }}</span>
        </div>
        <div class="detail-cell">
          <span class="detail-label">승인일시</span
          ><span class="detail-value">{{ getApprovalDate(detailModal.vehicle) }}</span>
        </div>
        <div class="detail-cell">
          <span class="detail-label">세대 차량 수</span
          ><span class="detail-value">{{ vehicleCount }} / 2대</span>
        </div>
      </div>
      <template #footer>
        <button class="btn-delete-vehicle" @click="openDeleteModal(detailModal.vehicle)">
          차량 삭제
        </button>
        <button class="btn-cancel" @click="closeDetailModal">닫기</button>
      </template>
    </BaseModal>

    <!-- ✅ 승인 confirm (3열: 차량번호 / 차모델·차종 / 등록자) -->
    <ConfirmModal
      v-if="approveModal.show && approveModal.stage === 'confirm'"
      title="차량을 승인하시겠습니까?"
      subtitle="승인 시 해당 세대에 알림이 발송됩니다."
      item-label="차량 번호"
      action-text="차 모델 · 차종"
      extra-label="등록자"
      :item-name="approveModal.vehicle?.licensePlate"
      :action-label="`${approveModal.vehicle?.carModel ?? '-'} · ${
        approveModal.vehicle?.carType ?? '-'
      }`"
      :extra-value="approveModal.vehicle?.user?.name ?? '-'"
      confirm-text="승인"
      confirm-type="success"
      :loading="approveModal.loading"
      @confirm="handleApprove"
      @cancel="closeApproveConfirm"
    />
    <ActionResultModal
      v-if="approveModal.show && approveModal.stage === 'result'"
      :type="approveModal.resultType"
      :title="approveModal.resultTitle"
      :subtitle="approveModal.resultSubtitle"
      confirm-text="확인"
      @close="closeApproveResult"
    />

    <!-- ✅ 거부 confirm (3열: 차량번호 / 차모델·차종 / 등록자) + 거부사유 슬롯 -->
    <ConfirmModal
      v-if="rejectModal.show && rejectModal.stage === 'confirm'"
      title="차량을 거부하시겠습니까?"
      subtitle="거부 사유를 선택해주세요."
      item-label="차량 번호"
      action-text="차 모델 · 차종"
      extra-label="등록자"
      :item-name="rejectModal.vehicle?.licensePlate"
      :action-label="`${rejectModal.vehicle?.carModel ?? '-'} · ${
        rejectModal.vehicle?.carType ?? '-'
      }`"
      :extra-value="rejectModal.vehicle?.user?.name ?? '-'"
      confirm-text="거부"
      confirm-type="danger"
      :loading="rejectModal.loading"
      @confirm="handleReject"
      @cancel="closeRejectConfirm"
    >
      <div class="form-group" style="text-align: left; margin-top: 4px">
        <label class="form-label">거부 사유 <span class="required">*</span></label>
        <select class="form-select" v-model="rejectModal.reason">
          <option value="">사유 선택</option>
          <option v-for="r in rejectReasons" :key="r" :value="r">{{ r }}</option>
        </select>
      </div>
      <div class="reason-chips">
        <button
          v-for="r in rejectReasons"
          :key="r"
          :class="['reason-chip', { active: rejectModal.reason === r }]"
          @click="rejectModal.reason = r"
        >
          {{ r }}
        </button>
      </div>
      <div class="form-group" style="text-align: left">
        <label class="form-label">상세 내용 (선택)</label>
        <textarea
          class="form-textarea"
          v-model="rejectModal.memo"
          placeholder="거부 사유를 상세히 입력해주세요."
          rows="3"
        />
      </div>
    </ConfirmModal>
    <ActionResultModal
      v-if="rejectModal.show && rejectModal.stage === 'result'"
      :type="rejectModal.resultType"
      :title="rejectModal.resultTitle"
      :subtitle="rejectModal.resultSubtitle"
      confirm-text="확인"
      @close="closeRejectResult"
    />

    <!-- ✅ 삭제 confirm (3열: 차량번호 / 차모델·차종 / 등록자) -->
    <ConfirmModal
      v-if="deleteModal.show && deleteModal.stage === 'confirm'"
      title="차량을 삭제하시겠습니까?"
      subtitle="이 작업은 되돌릴 수 없습니다."
      subtitle-color="#e53e3e"
      item-label="차량 번호"
      action-text="차 모델 · 차종"
      extra-label="등록자"
      :item-name="deleteModal.vehicle?.licensePlate"
      :action-label="`${deleteModal.vehicle?.carModel ?? '-'} · ${
        deleteModal.vehicle?.carType ?? '-'
      }`"
      :extra-value="deleteModal.vehicle?.user?.name ?? '-'"
      confirm-text="삭제"
      confirm-type="danger"
      :loading="deleteModal.loading"
      @confirm="handleDelete"
      @cancel="closeDeleteConfirm"
    />
    <ActionResultModal
      v-if="deleteModal.show && deleteModal.stage === 'result'"
      :type="deleteModal.resultType"
      :title="deleteModal.resultTitle"
      :subtitle="deleteModal.resultSubtitle"
      confirm-text="확인"
      @close="closeDeleteResult"
    />

    <!-- 차량 등록 모달 -->
    <BaseModal
      v-if="registerModal.show"
      title="차량 등록"
      subtitle="새 차량 정보를 입력해주세요"
      @close="closeRegisterModal"
    >
      <div class="form-group">
        <label class="form-label">소속 세대 <span class="required">*</span></label>
        <div class="form-row-2">
          <select v-model="registerForm.dong" class="form-select" @change="onDongChange">
            <option value="">동 선택</option>
            <option v-for="dong in registerDongs" :key="dong" :value="dong">
              {{ dong }}
            </option>
          </select>
          <select
            v-model="registerForm.householdId"
            class="form-select"
            @change="onHouseholdChange"
            :disabled="!registerForm.dong"
          >
            <option :value="null">호수 선택</option>
            <option
              v-for="h in registerHouseholds"
              :key="h.householdId"
              :value="h.householdId"
            >
              {{ h.ho }}
            </option>
          </select>
        </div>
        <div
          v-if="registerForm.householdId"
          class="vehicle-count-badge"
          :class="{ full: vehicleCount >= 2 }"
        >
          현재 등록 차량 {{ vehicleCount }} / 2대<span v-if="vehicleCount >= 2">
            · 등록 불가</span
          >
        </div>
        <span v-if="errors.general" class="field-error">{{ errors.general }}</span>
      </div>
      <div class="form-group">
        <label class="form-label">등록자 (입주민) <span class="required">*</span></label>
        <select
          v-model="registerForm.userId"
          class="form-select"
          :class="{ 'input-error': errors.userId }"
          :disabled="!registerForm.householdId"
        >
          <option :value="null">입주민 선택</option>
          <option v-for="r in registerResidents" :key="r.userId" :value="r.userId">
            {{ r.name }}
          </option>
        </select>
        <span v-if="errors.userId" class="field-error">{{ errors.userId }}</span>
      </div>
      <div class="form-group">
        <label class="form-label">차량 번호 <span class="required">*</span></label>
        <input
          v-model="registerForm.licensePlate"
          class="form-input"
          :class="{ 'input-error': errors.licensePlate }"
          placeholder="예: 12가 3456"
        />
        <span v-if="errors.licensePlate" class="field-error">{{
          errors.licensePlate
        }}</span>
      </div>
      <div class="form-row-2">
        <div class="form-group">
          <label class="form-label">차 모델 <span class="required">*</span></label>
          <input
            v-model="registerForm.carModel"
            class="form-input"
            :class="{ 'input-error': errors.carModel }"
            placeholder="예: 현대 소나타"
          />
          <span v-if="errors.carModel" class="field-error">{{ errors.carModel }}</span>
        </div>
        <div class="form-group">
          <label class="form-label">차종 <span class="required">*</span></label>
          <select
            v-model="registerForm.carType"
            class="form-select"
            :class="{ 'input-error': errors.carType }"
          >
            <option value="">선택</option>
            <option value="경차">경차</option>
            <option value="승용차">승용차</option>
            <option value="SUV">SUV</option>
            <option value="승합차">승합차</option>
          </select>
          <span v-if="errors.carType" class="field-error">{{ errors.carType }}</span>
        </div>
      </div>
      <div class="form-divider"></div>
      <template #footer>
        <span class="form-hint">* 표시는 필수 입력 항목입니다.</span>
        <button type="button" class="btn-cancel" @click="closeRegisterModal">취소</button>
        <button
          type="button"
          class="btn-submit-approve"
          @click="handleRegister"
          :disabled="registerModal.loading || vehicleCount >= 2"
        >
          {{ registerModal.loading ? "등록 중..." : "등록하기" }}
        </button>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
.vehicle-list-view {
  display: flex;
  flex-direction: column;
  font-family: "Noto Sans KR", sans-serif;
  color: #333;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}
.stat-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 20px;
}
.stat-label {
  font-size: 13px;
  color: #718096;
  margin-bottom: 8px;
}
.stat-value-wrap {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 4px;
}
.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1a202c;
}
.stat-unit {
  font-size: 14px;
  color: #a0aec0;
}
.stat-desc {
  font-size: 11px;
  color: #a0aec0;
}
.stat-desc.urgent {
  color: #e53e3e;
  font-weight: 600;
}

.table-section {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}
.search-wrap {
  display: flex;
  align-items: center;
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  padding: 7px 12px;
  gap: 6px;
  background: #f5f6f8;
}
.search-icon {
  color: #a0aec0;
  flex-shrink: 0;
}
.search-input {
  border: none;
  background: transparent;
  font-size: 13px;
  outline: none;
  color: #333;
  width: 150px;
  font-family: "Noto Sans KR", sans-serif;
}
.search-input::placeholder {
  color: #cbd5e0;
}
.filter-select {
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  padding: 7px 28px 7px 12px;
  font-size: 13px;
  color: #333;
  background: #fff
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23A0AEC0' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")
    no-repeat right 10px center;
  appearance: none;
  cursor: pointer;
  outline: none;
  font-family: "Noto Sans KR", sans-serif;
}

.status-badge {
  display: inline-block;
  padding: 2px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  width: fit-content;
}
.status-badge.approved {
  background: #ebf5ee;
  color: #4d8b5a;
}
.status-badge.pending {
  background: #fef9c3;
  color: #ca8a04;
}
.status-badge.rejected {
  background: #fee2e2;
  color: #e53e3e;
}

.td-cell {
  display: block;
  width: 100%;
  height: 100%;
  padding: 13px 16px;
  box-sizing: border-box;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.td-id {
  color: #a0aec0;
  font-size: 12px;
}
.td-plate {
  font-weight: 600;
}
.td-dash {
  color: #a0aec0;
  font-size: 14px;
}

.action-buttons {
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
}
.btn-approve {
  padding: 4px 14px;
  background: #ebf5ee;
  color: #4d8b5a;
  border: 1px solid #c6e6cc;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  font-family: "Noto Sans KR", sans-serif;
}
.btn-approve:hover {
  background: #d4edda;
}
.btn-reject {
  padding: 4px 14px;
  background: #fee2e2;
  color: #e53e3e;
  border: 1px solid #fecaca;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  font-family: "Noto Sans KR", sans-serif;
}
.btn-reject:hover {
  background: #fecaca;
}

.detail-header-card {
  background: #f7fafc;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}
.detail-header-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  margin-bottom: 10px;
}
.detail-header-badge.approved {
  background: #c6f6d5;
  color: #276749;
}
.detail-header-badge.pending {
  background: #fefce8;
  color: #c08b2d;
}
.detail-header-badge.rejected {
  background: #fff5f5;
  color: #e53e3e;
}
.detail-header-title {
  font-size: 22px;
  font-weight: 700;
  color: #1a202c;
  margin-bottom: 6px;
}
.detail-header-sub {
  font-size: 13px;
  color: #718096;
}
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  margin-bottom: 8px;
}
.detail-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 16px;
  border-bottom: 1px solid #f0f4f8;
}
.detail-cell:nth-last-child(-n + 2) {
  border-bottom: none;
}
.detail-label {
  font-size: 11px;
  color: #a0aec0;
}
.detail-value {
  font-size: 13px;
  color: #1a202c;
  font-weight: 500;
}
.detail-value.bold {
  font-weight: 700;
}
.btn-delete-vehicle {
  padding: 8px 10px;
  background: #ffffff;
  color: #e53e3e;
  border: 1px solid #e53e3e;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: "Noto Sans KR", sans-serif;
  margin-right: auto;
}
.btn-delete-vehicle:hover {
  background: #e53e3e;
  color: #ffffff;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}
.form-label {
  font-size: 13px;
  font-weight: 600;
  color: #4a5568;
}
.required {
  color: #e53e3e;
}
.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.form-input {
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  padding: 10px 14px;
  font-size: 13px;
  color: #333;
  outline: none;
  width: 100%;
  font-family: "Noto Sans KR", sans-serif;
}
.form-input:focus {
  border-color: #2b3a55;
}
.field-error {
  font-size: 12px;
  color: #e53e3e;
  margin-top: 4px;
  display: block;
}
.input-error {
  border-color: #e53e3e !important;
}
.form-select {
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  padding: 9px 32px 9px 12px;
  font-size: 13px;
  color: #333;
  background: #fff
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23A0AEC0' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")
    no-repeat right 12px center;
  appearance: none;
  outline: none;
  width: 100%;
  font-family: "Noto Sans KR", sans-serif;
}
.form-textarea {
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  padding: 10px 14px;
  font-size: 13px;
  color: #333;
  outline: none;
  resize: none;
  width: 100%;
  font-family: "Noto Sans KR", sans-serif;
}
.form-textarea:focus {
  border-color: #2b3a55;
}
.vehicle-count-badge {
  margin-top: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #4d8b5a;
}
.vehicle-count-badge.full {
  color: #e53e3e;
}
.form-divider {
  height: 1px;
  background: #e2e8f0;
  margin: 4px 0;
}
.form-hint {
  font-size: 11px;
  color: #a0aec0;
  margin-right: auto;
}

.reason-chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.reason-chip {
  padding: 6px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  font-size: 12px;
  color: #718096;
  background: #fff;
  cursor: pointer;
  font-family: "Noto Sans KR", sans-serif;
  transition: all 0.15s;
}
.reason-chip.active {
  background: #2b3a55;
  color: #fff;
  border-color: #2b3a55;
}
.reason-chip:hover:not(.active) {
  background: #f5f6f8;
}

.btn-cancel {
  padding: 9px 30px;
  border: 1px solid #1e2a3e;
  border-radius: 7px;
  background: #1e2a3e;
  font-size: 13px;
  color: #ffffff;
  cursor: pointer;
  font-family: "Noto Sans KR", sans-serif;
}
.btn-cancel:hover {
  background: #121a27;
}
.btn-submit-approve {
  padding: 9px 24px;
  background: #2b3a55;
  color: #fff;
  border: none;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: "Noto Sans KR", sans-serif;
}
.btn-submit-approve:hover:not(:disabled) {
  background: #1e2a3e;
}
.btn-submit-approve:disabled {
  opacity: 0.5;
  cursor: default;
}
</style>
