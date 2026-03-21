<script setup>
import { onMounted, reactive, watch, computed } from "vue";
import vehicleAPI from "@/api/vehicle.js";
import BaseModal from "@/components/common/BeseModel.vue";
import ConfirmModal from "@/components/common/ConfirmModal.vue";
import ActionResultModal from "@/components/common/ActionResultModal.vue";

const state = reactive({ list: [], logs: [] });

const carImageMap = {
  경차: new URL("@/assets/images/Compact car.png", import.meta.url).href,
  승용차: new URL("@/assets/images/Sedan.png", import.meta.url).href,
  SUV: new URL("@/assets/images/suv.png", import.meta.url).href,
  승합차: new URL("@/assets/images/Van.png", import.meta.url).href,
};
const getCarImage = (carType) => carImageMap[carType] ?? null;

const registerModal = reactive({ show: false, loading: false });
const editModal = reactive({ show: false, vehicle: null, loading: false });

const deleteModal = reactive({
  show: false,
  stage: "confirm",
  vehicle: null,
  loading: false,
  resultType: "success",
  resultTitle: "",
  resultSubtitle: "",
});

const registerForm = reactive({ licensePlate: "", carModel: "", carType: "" });
const editForm = reactive({ licensePlate: "", carModel: "", carType: "" });
const registerError = reactive({ licensePlate: "", carModel: "", carType: "" });
const editError = reactive({ licensePlate: "", carModel: "", carType: "" });

// 등록 모달 하단 에러 요약
const firstRegisterError = computed(() => {
  if (registerError.licensePlate) return registerError.licensePlate;
  if (registerError.carModel) return registerError.carModel;
  if (registerError.carType) return registerError.carType;
  return "";
});

// 수정 모달 하단 에러 요약
const firstEditError = computed(() => {
  if (editError.licensePlate) return editError.licensePlate;
  if (editError.carModel) return editError.carModel;
  if (editError.carType) return editError.carType;
  return "";
});

const statusLabel = (s) =>
  ({ APPROVED: "완료", PENDING: "대기", REJECTED: "거부" }[s] ?? s);
const statusClass = (s) =>
  ({ APPROVED: "approved", PENDING: "pending", REJECTED: "rejected" }[s] ?? "");
const formatDate = (val) => (val ? val.slice(0, 10).replace(/-/g, ".") : "-");

// 입출차 기록 시간 포맷 - vehicleId 타입 무관하게 비교
const formatLogTime = (vehicleId) => {
  const logs = state.logs
    .filter((l) => String(l.vehicleId) === String(vehicleId))
    .sort((a, b) => new Date(b.loggedAt) - new Date(a.loggedAt));
  if (!logs.length) return "-";
  const log = logs[0];
  const d = new Date(log.loggedAt);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const day = days[d.getDay()];
  const hh = d.getHours();
  const min = String(d.getMinutes()).padStart(2, "0");
  const ampm = hh < 12 ? "오전" : "오후";
  const hour = hh % 12 || 12;
  const type = log.entryType === "IN" ? "입차" : "출차";
  return `${type} : ${yyyy}.${mm}.${dd}(${day}) ${ampm} ${hour}시 ${min}분`;
};

// 차량 목록 조회
const fetchVehicles = async () => {
  try {
    const { data } = await vehicleAPI.getMyVehicles();
    state.list = data.resultData ?? [];
  } catch (e) {
    console.error("차량 목록 조회 실패", e);
  }
};

// 입출차 기록 조회
const fetchLogs = async () => {
  try {
    const { data } = await vehicleAPI.getMyVehicleLogs();
    state.logs = data.resultData ?? [];
  } catch (e) {
    console.error("입출차 기록 조회 실패", e);
  }
};

// 등록 모달 열기
const openRegister = () => {
  registerForm.licensePlate = "";
  registerForm.carModel = "";
  registerForm.carType = "";
  registerError.licensePlate = "";
  registerError.carModel = "";
  registerError.carType = "";
  registerModal.show = true;
};
// 등록 모달 닫기
const closeRegister = () => {
  registerModal.show = false;
  registerError.licensePlate = "";
  registerError.carModel = "";
  registerError.carType = "";
};

// 등록 처리
const handleRegister = async () => {
  registerError.licensePlate = "";
  registerError.carModel = "";
  registerError.carType = "";
  if (!registerForm.licensePlate?.trim()) {
    registerError.licensePlate = "차량 번호를 입력해주세요.";
    return;
  }
  if (!registerForm.carModel?.trim()) {
    registerError.carModel = "차 모델을 입력해주세요.";
    return;
  }
  if (!registerForm.carType) {
    registerError.carType = "차량를 선택해주세요.";
    return;
  }
  registerModal.loading = true;
  try {
    await vehicleAPI.registerVehicle({ ...registerForm });
    closeRegister();
    await fetchVehicles();
  } catch (e) {
    if (e.response?.status === 400) {
      registerError.licensePlate = e.response?.data?.message ?? "등록에 실패했습니다.";
    } else {
      console.error("차량 등록 실패", e);
    }
  } finally {
    registerModal.loading = false;
  }
};

// 수정 모달 열기
const openEdit = (v) => {
  editForm.licensePlate = v.licensePlate;
  editForm.carModel = v.carModel;
  editForm.carType = v.carType ?? "";
  editError.licensePlate = "";
  editError.carModel = "";
  editError.carType = "";
  editModal.vehicle = v;
  editModal.loading = false;
  editModal.show = true;
};
// 수정 모달 닫기
const closeEdit = () => {
  editModal.show = false;
  editModal.vehicle = null;
  editError.licensePlate = "";
  editError.carModel = "";
  editError.carType = "";
  editForm.carType = "";
};

// 수정 처리
const handleEdit = async () => {
  editError.licensePlate = "";
  editError.carModel = "";
  editError.carType = "";
  if (!editForm.licensePlate?.trim()) {
    editError.licensePlate = "차량 번호를 입력해주세요.";
    return;
  }
  if (!editForm.carModel?.trim()) {
    editError.carModel = "차 모델을 입력해주세요.";
    return;
  }
  if (!editForm.carType?.trim()) {
    editError.carType = "차종을 선택해주세요.";
    return;
  }
  editModal.loading = true;
  try {
    await vehicleAPI.updateVehicle(editModal.vehicle.vehicleId, {
      licensePlate: editForm.licensePlate,
      carModel: editForm.carModel,
      carType: editForm.carType,
    });
    closeEdit();
    await fetchVehicles();
  } catch (e) {
    if (e.response?.status === 400) {
      editError.licensePlate =
        e.response?.data?.message ?? "이미 등록된 차량 번호입니다.";
    } else {
      console.error("차량 수정 실패", e);
    }
  } finally {
    editModal.loading = false;
  }
};

// 삭제 모달 열기
const openDelete = (v) => {
  deleteModal.vehicle = v;
  deleteModal.loading = false;
  deleteModal.stage = "confirm";
  deleteModal.show = true;
};
// 삭제 확인 닫기
const closeDeleteConfirm = () => {
  deleteModal.show = false;
  deleteModal.vehicle = null;
  deleteModal.stage = "confirm";
};
// 삭제 결과 닫기
const closeDeleteResult = () => {
  deleteModal.show = false;
  deleteModal.vehicle = null;
  deleteModal.stage = "confirm";
};

// 삭제 처리
const handleDelete = async () => {
  deleteModal.loading = true;
  try {
    await vehicleAPI.deleteVehicle(deleteModal.vehicle.vehicleId);
    await fetchVehicles();
    deleteModal.resultType = "success";
    deleteModal.resultTitle = "차량이 삭제되었습니다.";
    deleteModal.resultSubtitle = `${deleteModal.vehicle.licensePlate} 차량 등록이 취소되었습니다.`;
  } catch (e) {
    console.error("차량 삭제 실패", e);
    deleteModal.resultType = "danger";
    deleteModal.resultTitle = "삭제에 실패했습니다.";
    deleteModal.resultSubtitle = "잠시 후 다시 시도해주세요.";
  } finally {
    deleteModal.loading = false;
    deleteModal.stage = "result";
  }
};

// 등록 - 차량번호 실시간 중복 체크
watch(
  () => registerForm.licensePlate,
  (val) => {
    if (!val?.trim()) {
      registerError.licensePlate = "";
      return;
    }
    const clean = val.replace(/\s/g, "");
    registerError.licensePlate = state.list.some(
      (v) => v.licensePlate.replace(/\s/g, "") === clean
    )
      ? "이미 등록된 차량 번호입니다."
      : "";
  }
);

// 수정 - 차량번호 실시간 중복 체크
watch(
  () => editForm.licensePlate,
  (val) => {
    if (!val?.trim()) {
      editError.licensePlate = "";
      return;
    }
    const clean = val.replace(/\s/g, "");
    const isSelf = editModal.vehicle?.licensePlate?.replace(/\s/g, "") === clean;
    if (isSelf) {
      editError.licensePlate = "";
      return;
    }
    editError.licensePlate = state.list.some(
      (v) =>
        v.licensePlate.replace(/\s/g, "") === clean &&
        v.vehicleId !== editModal.vehicle?.vehicleId
    )
      ? "이미 등록된 차량 번호입니다."
      : "";
  }
);

onMounted(async () => {
  await fetchVehicles();
  await fetchLogs();
});
</script>

<template>
  <div class="my-vehicle-view">
    <div class="vehicle-list">
      <div v-for="(v, idx) in state.list" :key="v.vehicleId" class="vehicle-card">
        <div class="vehicle-image">
          <img
            v-if="getCarImage(v.carType)"
            :src="getCarImage(v.carType)"
            :alt="v.carType"
            style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px"
          />
          <svg
            v-else
            width="80"
            height="50"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#CBD5E0"
            stroke-width="1"
          >
            <rect x="1" y="3" width="15" height="13" rx="2" />
            <path d="M16 8h4l3 5v3h-7V8z" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
          </svg>
        </div>

        <div class="vehicle-info">
          <div class="vehicle-title">내 차량 {{ idx + 1 }}</div>
          <div class="vehicle-meta">
            <div class="meta-group">
              <span class="meta-label">차주</span
              ><span class="meta-value">{{ v.userName ?? "-" }}</span>
            </div>
            <div class="meta-group">
              <span class="meta-label">등록 상태</span
              ><span :class="['status-badge', statusClass(v.status)]">{{
                statusLabel(v.status)
              }}</span>
            </div>
            <div class="meta-group">
              <span class="meta-label">차량 번호</span
              ><span class="meta-value bold">{{ v.licensePlate }}</span>
            </div>
            <div class="meta-group">
              <span class="meta-label">등록일</span
              ><span class="meta-value">{{ formatDate(v.createdAt) }}</span>
            </div>
            <div class="meta-group">
              <span class="meta-label">차 모델</span
              ><span class="meta-value">{{ v.carModel ?? "-" }}</span>
            </div>
          </div>
          <div class="vehicle-time">
            입출차 기록 시간 / {{ formatLogTime(v.vehicleId) }}
          </div>
          <div class="vehicle-actions">
            <button
              class="btn-edit"
              @click="openEdit(v)"
              :disabled="v.status === 'APPROVED'"
              :class="{ 'btn-disabled': v.status === 'APPROVED' }"
            >
              등록 수정
            </button>
            <button class="btn-delete" @click="openDelete(v)">등록 취소</button>
          </div>
        </div>
      </div>

      <div v-if="state.list.length < 2" class="vehicle-add" @click="openRegister">
        <div class="add-icon">+</div>
        <span class="add-label">내 차량 등록하기</span>
      </div>
    </div>

    <!-- 차량 등록 모달 -->
    <BaseModal v-if="registerModal.show" title="차량 등록" @close="closeRegister">
      <!-- 차량 번호 -->
      <div class="form-group">
        <label class="form-label">차량 번호 <span class="required">*</span></label>
        <input
          v-model="registerForm.licensePlate"
          class="form-input"
          :class="{ 'input-error': registerError.licensePlate }"
          placeholder="예: 12가 3456"
        />
      </div>
      <!-- 차 모델 -->
      <div class="form-group">
        <label class="form-label">차 모델 <span class="required">*</span></label>
        <input
          v-model="registerForm.carModel"
          class="form-input"
          :class="{ 'input-error': registerError.carModel }"
          placeholder="예: 현대 소나타"
        />
      </div>
      <!-- 차종 -->
      <div class="form-group">
        <label class="form-label">차종 <span class="required">*</span></label>
        <select
          v-model="registerForm.carType"
          class="form-select"
          :class="{ 'input-error': registerError.carType }"
        >
          <option value="">선택</option>
          <option value="경차">경차</option>
          <option value="승용차">승용차</option>
          <option value="SUV">SUV</option>
          <option value="승합차">승합차</option>
        </select>
      </div>
      <!-- 하단 에러메시지 -->
      <div v-if="firstRegisterError" class="form-bottom-error">
        {{ firstRegisterError }}
      </div>
      <template #footer>
        <button class="btn-cancel" @click="closeRegister">취소</button>
        <button
          class="btn-submit"
          @click="handleRegister"
          :disabled="registerModal.loading"
        >
          {{ registerModal.loading ? "등록 중..." : "등록하기" }}
        </button>
      </template>
    </BaseModal>

    <!-- 차량 수정 모달 -->
    <BaseModal
      v-if="editModal.show"
      title="내 차량 수정"
      subtitle="수정할 차량 정보를 입력해주세요"
      @close="closeEdit"
    >
      <!-- 차주명 -->
      <div class="form-group">
        <label class="form-label">차주명 <span class="required">*</span></label>
        <div class="select-wrap">
          <span class="select-value">{{ editModal.vehicle?.userName ?? "-" }}</span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#A0AEC0"
            stroke-width="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      <!-- 차량번호 - 풀 너비 -->
      <div class="form-group">
        <label class="form-label">차량번호 <span class="required">*</span></label>
        <input
          v-model="editForm.licensePlate"
          class="form-input"
          :class="{ 'input-error': editError.licensePlate }"
          placeholder="예: 12가 3456"
        />
      </div>

      <!-- 차 모델 + 차종 한 줄 -->
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">차 모델 <span class="required">*</span></label>
          <input
            v-model="editForm.carModel"
            class="form-input"
            :class="{ 'input-error': editError.carModel }"
            placeholder="예: 현대 소나타"
          />
        </div>
        <div class="form-group">
          <label class="form-label">차종 <span class="required">*</span></label>
          <select
            v-model="editForm.carType"
            class="form-select"
            :class="{ 'input-error': editError.carType }"
          >
            <option value="">선택</option>
            <option value="경차">경차</option>
            <option value="승용차">승용차</option>
            <option value="SUV">SUV</option>
            <option value="승합차">승합차</option>
          </select>
        </div>
      </div>

      <!-- 하단 에러메시지 -->
      <div v-if="firstEditError" class="form-bottom-error">
        {{ firstEditError }}
      </div>

      <p class="form-hint">* 표시는 필수 입력 항목입니다.</p>
      <template #footer>
        <button class="btn-cancel" @click="closeEdit">취소</button>
        <button class="btn-submit" @click="handleEdit" :disabled="editModal.loading">
          {{ editModal.loading ? "수정 중..." : "수정하기" }}
        </button>
      </template>
    </BaseModal>

    <!-- 삭제 확인 모달 -->
    <ConfirmModal
      v-if="deleteModal.show && deleteModal.stage === 'confirm'"
      title="차량을 삭제하시겠습니까?"
      subtitle="이 작업은 되돌릴 수 없습니다."
      subtitle-color="#e53e3e"
      item-label="차량 번호"
      action-text="차 모델 · 차주"
      :item-name="deleteModal.vehicle?.licensePlate"
      :action-label="`${deleteModal.vehicle?.carModel ?? '-'} · ${
        deleteModal.vehicle?.userName ?? '-'
      }`"
      confirm-text="삭제"
      confirm-type="danger"
      :loading="deleteModal.loading"
      @confirm="handleDelete"
      @cancel="closeDeleteConfirm"
    />

    <!-- 삭제 결과 모달 -->
    <ActionResultModal
      v-if="deleteModal.show && deleteModal.stage === 'result'"
      :type="deleteModal.resultType"
      :title="deleteModal.resultTitle"
      :subtitle="deleteModal.resultSubtitle"
      confirm-text="확인"
      @close="closeDeleteResult"
    />
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
.my-vehicle-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
  font-family: "Noto Sans KR", sans-serif;
  color: #333;
}
.vehicle-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 40px;
}
.vehicle-card {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  padding: 20px;
  display: flex;
  gap: 24px;
  align-items: flex-start;
}
.vehicle-image {
  width: 350px;
  height: 240px;
  background: #f5f6f8;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.vehicle-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
}
.vehicle-title {
  font-size: 16px;
  font-weight: 600;
  color: #333333;
}
.vehicle-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 32px;
}
.meta-group {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.meta-label {
  font-size: 14px;
  color: #a0aec0;
}
.meta-value {
  font-size: 18px;
  color: #333333;
}
.meta-value.bold {
  font-weight: 700;
  font-size: 20px;
}
.status-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  width: fit-content;
}
.status-badge.approved {
  background: #c6f6d5;
  color: #276749;
}
.status-badge.pending {
  background: #fef6e9;
  color: #f5a623;
}
.status-badge.rejected {
  background: #fee2e2;
  color: #e53e3e;
}
.vehicle-time {
  font-size: 11px;
  color: #a0aec0;
}
.vehicle-actions {
  display: flex;
  gap: 8px;
  margin-top: auto;
  justify-content: flex-end;
}
.btn-edit {
  padding: 7px 18px;
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  background: #fff;
  font-size: 12px;
  color: #2b3a55;
  cursor: pointer;
  font-family: "Noto Sans KR", sans-serif;
}
.btn-edit:hover {
  background: #f0f4ff;
}
.btn-delete {
  padding: 7px 18px;
  border: 1px solid #e74c3c;
  border-radius: 7px;
  background: #fff;
  font-size: 12px;
  color: #e74c3c;
  cursor: pointer;
  font-family: "Noto Sans KR", sans-serif;
}
.btn-delete:hover {
  background: #fee2e2;
}
.btn-disabled {
  opacity: 0.4;
  cursor: not-allowed !important;
}
.btn-disabled:hover {
  background: #fff !important;
}
.vehicle-add {
  background: #fff;
  border-radius: 10px;
  border: 2px dashed #e2e8f0;
  padding: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.15s;
}
.vehicle-add:hover {
  border-color: #c9cacb;
  background: #f8faff;
}
.add-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid #4973e5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #4973e5;
}
.add-label {
  font-size: 13px;
  color: #4973e5;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}
.form-label {
  font-size: 13px;
  font-weight: 600;
  color: #4a5568;
}
.required {
  color: #e53e3e;
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
.form-select {
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  padding: 10px 32px 10px 14px;
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
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.form-hint {
  font-size: 11px;
  color: #a0aec0;
  margin-top: -4px;
  margin-bottom: 8px;
}
.input-error {
  border-color: #e53e3e !important;
}
.field-error {
  font-size: 11px;
  color: #e53e3e;
  margin-top: 2px;
}
.form-bottom-error {
  font-size: 12px;
  color: #e53e3e;
  margin-top: -8px;
  margin-bottom: 8px;
}
.select-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  padding: 10px 14px;
  font-size: 13px;
  color: #333;
  background: #f5f6f8;
}
.select-value {
  flex: 1;
}
.btn-cancel {
  padding: 9px 20px;
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  background: #fff;
  font-size: 13px;
  color: #718096;
  cursor: pointer;
  font-family: "Noto Sans KR", sans-serif;
}
.btn-cancel:hover {
  background: #f5f6f8;
}
.btn-submit {
  padding: 9px 24px;
  background: #4973e5;
  color: #fff;
  border: none;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: "Noto Sans KR", sans-serif;
}
.btn-submit:hover:not(:disabled) {
  background: rgb(25, 98, 224);
}
.btn-submit:disabled {
  opacity: 0.5;
  cursor: default;
}
</style>
