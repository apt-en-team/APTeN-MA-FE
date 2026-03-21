<script setup>
import { onMounted, reactive, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useFacilityStore } from "@/stores/modules/facility";
import facilityAPI from "@/api/facility.js";
import ConfirmModal from "@/components/common/ConfirmModal.vue";
import ActionResultModal from "@/components/common/ActionResultModal.vue";

const route = useRoute();
const router = useRouter();
const facilityStore = useFacilityStore();

const isEdit = computed(() => !!route.params.id);

// ── types는 스토어에서 직접 참조 (로컬 배열 제거) ─────────────
// template에서 facilityStore.types 로 사용

const form = reactive({
  typeId: null,
  name: "",
  description: "",
  maxCapacity: "",
  openTime: "09:00",
  closeTime: "22:00",
  slotDuration: 60,
  isActive: true,
  price: 0,
  createdAt: null,
});

const errors = reactive({
  typeId: "",
  name: "",
  maxCapacity: "",
  openTime: "",
  closeTime: "",
  server: "",
});

const deleteModal = reactive({
  show: false,
  stage: "confirm",
  loading: false,
  resultType: "success",
  resultTitle: "",
  resultSubtitle: "",
});

const fetchFacility = async () => {
  try {
    const { data } = await facilityAPI.getFacility(route.params.id);
    const f = data.resultData;
    form.typeId = f.typeId;
    form.name = f.name;
    form.description = f.description ?? "";
    form.maxCapacity = f.maxCapacity;
    form.openTime = f.openTime?.slice(0, 5) ?? "09:00";
    form.closeTime = f.closeTime?.slice(0, 5) ?? "22:00";
    form.slotDuration = f.slotDuration;
    form.isActive = f.isActive;
    form.price = f.price ?? 0;
    form.createdAt = f.createdAt;
  } catch (e) {
    console.error("시설 조회 실패", e);
  }
};

const handleSubmit = async () => {
  Object.keys(errors).forEach((k) => (errors[k] = ""));

  if (!form.typeId) {
    errors.typeId = "시설 타입을 선택해주세요.";
    return;
  }
  if (!form.name) {
    errors.name = "시설명을 입력해주세요.";
    return;
  }
  if (!form.maxCapacity) {
    errors.maxCapacity = "최대 인원을 입력해주세요.";
    return;
  }
  if (!form.openTime) {
    errors.openTime = "운영 시작 시간을 입력해주세요.";
    return;
  }
  if (!form.closeTime) {
    errors.closeTime = "운영 종료 시간을 입력해주세요.";
    return;
  }

  try {
    const payload = {
      typeId: form.typeId,
      name: form.name,
      description: form.description,
      maxCapacity: form.maxCapacity,
      openTime: form.openTime,
      closeTime: form.closeTime,
      slotDuration: form.slotDuration,
      active: form.isActive,
      price: form.price,
    };
    if (isEdit.value) await facilityAPI.updateFacility(route.params.id, payload);
    else await facilityAPI.createFacility(payload);

    // 시설 목록 갱신 후 이동
    await facilityStore.fetchFacilities();
    router.push("/admin/facility");
  } catch (e) {
    const message = e.response?.data?.resultMessage ?? "저장 중 오류가 발생했습니다.";
    const map = {
      "시설 타입을 선택해주세요": "typeId",
      "시설명을 입력해주세요": "name",
      "최대 인원을 입력해주세요": "maxCapacity",
      "시설 타입을 찾을 수 없습니다": "typeId",
      "시설을 찾을 수 없습니다": "server",
    };
    const key = map[message] ?? "server";
    errors[key] = message;
  }
};

const openDeleteModal = () => {
  deleteModal.stage = "confirm";
  deleteModal.show = true;
};
const closeDeleteConfirm = () => {
  deleteModal.show = false;
  deleteModal.stage = "confirm";
};
const closeDeleteResult = () => {
  deleteModal.show = false;
  deleteModal.stage = "confirm";
  if (deleteModal.resultType === "success") router.push("/admin/facility");
};

const handleDelete = async () => {
  deleteModal.loading = true;
  try {
    await facilityAPI.deleteFacility(route.params.id);
    await facilityStore.fetchFacilities(); // ← 삭제 후 스토어 갱신
    deleteModal.resultType = "success";
    deleteModal.resultTitle = "시설이 삭제되었습니다.";
    deleteModal.resultSubtitle = `${form.name} 시설이 삭제되었습니다.`;
  } catch (e) {
    const message = e.response?.data?.resultMessage ?? "잠시 후 다시 시도해주세요.";
    deleteModal.resultType = "danger";
    deleteModal.resultTitle = "삭제에 실패했습니다.";
    deleteModal.resultSubtitle = message;
  } finally {
    deleteModal.loading = false;
    deleteModal.stage = "result";
  }
};

onMounted(async () => {
  // 타입 목록이 비어있을 때만 fetch (이미 로드됐으면 재사용)
  if (!facilityStore.types.length) await facilityStore.fetchTypes();
  if (isEdit.value) await fetchFacility();
});
</script>

<template>
  <div class="facility-form-view">
    <div class="form-layout">
      <!-- 왼쪽: 입력폼 -->
      <div class="form-section">
        <h2 class="form-title">시설 정보 {{ isEdit ? "수정" : "입력" }}</h2>
        <p class="form-desc">모든 * 항목은 필수 입력입니다.</p>

        <div v-if="errors.server" class="server-error">{{ errors.server }}</div>

        <div class="form-group">
          <label class="form-label">시설 타입 *</label>
          <select
            v-model="form.typeId"
            class="form-select"
            :class="{ 'input-error': errors.typeId }"
          >
            <option :value="null" disabled>타입 선택</option>
            <option v-for="t in facilityStore.types" :key="t.typeId" :value="t.typeId">
              {{ t.name }}
            </option>
          </select>
          <span v-if="errors.typeId" class="error-msg">{{ errors.typeId }}</span>
        </div>

        <div class="form-group">
          <label class="form-label">시설명 *</label>
          <input
            v-model="form.name"
            class="form-input"
            :class="{ 'input-error': errors.name }"
            placeholder="예: 헬스장"
          />
          <span v-if="errors.name" class="error-msg">{{ errors.name }}</span>
        </div>

        <div class="form-group">
          <label class="form-label">시설 설명</label>
          <textarea
            v-model="form.description"
            class="form-textarea"
            placeholder="시설에 대한 간단한 설명을 입력해주세요."
            rows="4"
          />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">최대 인원 *</label>
            <div class="input-suffix-wrap">
              <input
                v-model="form.maxCapacity"
                class="form-input"
                :class="{ 'input-error': errors.maxCapacity }"
                type="number"
                placeholder="예: 30"
              />
              <span class="input-suffix">명</span>
            </div>
            <span v-if="errors.maxCapacity" class="error-msg">{{
              errors.maxCapacity
            }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">예약 단위</label>
            <div class="input-suffix-wrap">
              <input
                v-model="form.slotDuration"
                class="form-input"
                type="number"
                placeholder="60"
              />
              <span class="input-suffix">분</span>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">월 수강료</label>
          <div class="input-suffix-wrap">
            <input
              v-model="form.price"
              class="form-input"
              type="number"
              placeholder="0"
            />
            <span class="input-suffix">원</span>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">운영 시작 *</label>
            <input
              v-model="form.openTime"
              class="form-input"
              :class="{ 'input-error': errors.openTime }"
              type="time"
            />
            <span v-if="errors.openTime" class="error-msg">{{ errors.openTime }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">운영 종료 *</label>
            <input
              v-model="form.closeTime"
              class="form-input"
              :class="{ 'input-error': errors.closeTime }"
              type="time"
            />
            <span v-if="errors.closeTime" class="error-msg">{{ errors.closeTime }}</span>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">운영 여부</label>
          <div class="toggle-wrap">
            <label class="toggle">
              <input type="checkbox" v-model="form.isActive" />
              <span class="slider"></span>
            </label>
            <span class="toggle-label" :class="{ active: form.isActive }">
              {{ form.isActive ? "운영 중" : "운영 중단" }}
            </span>
          </div>
          <p class="toggle-desc">
            {{
              form.isActive
                ? "활성화 시 예약이 가능합니다."
                : "비활성화 시 예약이 불가합니다."
            }}
          </p>
        </div>

        <div class="form-actions">
          <button v-if="isEdit" class="btn-delete" @click="openDeleteModal">삭제</button>
          <div class="form-actions-right">
            <button class="btn-cancel" @click="router.push('/admin/facility')">
              취소
            </button>
            <button class="btn-submit" @click="handleSubmit">
              {{ isEdit ? "수정완료" : "등록하기" }}
            </button>
          </div>
        </div>
      </div>

      <!-- 오른쪽: 미리보기 -->
      <div class="preview-section">
        <div class="preview-box">
          <h3 class="preview-title">{{ isEdit ? "현재 정보" : "미리보기" }}</h3>
          <div class="preview-card">
            <div class="preview-card-header">
              <div class="card-icon">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                </svg>
              </div>
              <div class="preview-name-wrap">
                <span class="preview-name">{{ form.name || "시설명" }}</span>
                <span class="preview-id">facility_id #{{ route.params.id || "-" }}</span>
              </div>
              <span :class="['status-badge', form.isActive ? 'active' : 'inactive']">
                {{ form.isActive ? "운영 중" : "중단" }}
              </span>
            </div>
            <div class="preview-divider"></div>
            <div class="preview-info">
              <div class="preview-row">
                <span>최대 인원</span><span>{{ form.maxCapacity || "-" }}명</span>
              </div>
              <div class="preview-row">
                <span>예약 단위</span><span>{{ form.slotDuration }}분</span>
              </div>
              <div class="preview-row">
                <span>운영 시간</span
                ><span>{{ form.openTime }} ~ {{ form.closeTime }}</span>
              </div>
              <div class="preview-row">
                <span>등록일</span
                ><span>{{
                  form.createdAt ? form.createdAt.slice(0, 10).replace(/-/g, ".") : "-"
                }}</span>
              </div>
              <div class="preview-row">
                <span>월 수강료</span
                ><span>{{
                  form.price > 0 ? Number(form.price).toLocaleString() + "원" : "무료"
                }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="guide-box">
          <h3 class="guide-title">{{ isEdit ? "수정 주의사항" : "등록 안내" }}</h3>
          <div class="guide-divider"></div>
          <ul class="guide-list">
            <template v-if="!isEdit">
              <li>등록 즉시 예약 시스템에 반영됩니다.</li>
              <li>운영 시간은 HH:MM 형식으로 입력하세요.</li>
              <li>예약 단위는 분 기준으로 설정됩니다.</li>
              <li>운영 여부는 언제든지 변경 가능합니다.</li>
              <li>시설 삭제 시 예약 데이터도 삭제됩니다.</li>
            </template>
            <template v-else>
              <li>수정 내용은 즉시 예약에 반영됩니다.</li>
              <li>운영 시간 변경 시 기존 예약에 영향을 줄 수 있습니다.</li>
              <li>정원을 줄 수 있습니다.</li>
              <li>정원 감소 시 초과된 예약은 자동으로 취소됩니다.</li>
              <li>자동 취소되지 않습니다.</li>
            </template>
          </ul>
        </div>
      </div>
    </div>

    <!-- ✅ 1단계: 삭제 확인 → ConfirmModal -->
    <ConfirmModal
      v-if="deleteModal.show && deleteModal.stage === 'confirm'"
      title="시설을 삭제하시겠습니까?"
      subtitle="이 작업은 되돌릴 수 없습니다."
      subtitle-color="#e53e3e"
      item-label="시설명"
      action-text="운영 시간"
      extra-label="최대 인원"
      :item-name="form.name"
      :action-label="`${form.openTime} ~ ${form.closeTime}`"
      :extra-value="`${form.maxCapacity}명`"
      confirm-text="삭제"
      confirm-type="danger"
      :loading="deleteModal.loading"
      @confirm="handleDelete"
      @cancel="closeDeleteConfirm"
    />

    <!-- ✅ 2단계: 삭제 결과 → ActionResultModal -->
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
.facility-form-view {

  color: #333;
}
.form-layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 24px;
}

.form-section {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  padding: 32px;
}
.form-title {
  font-size: 18px;
  font-weight: 700;
  color: #1a202c;
  margin-bottom: 4px;
}
.form-desc {
  font-size: 12px;
  color: #a0aec0;
  margin-bottom: 28px;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 20px;
}
.form-label {
  font-size: 13px;
  font-weight: 600;
  color: #4a5568;
}
.form-input {
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  padding: 10px 14px;
  font-size: 13px;
  color: #333;
  outline: none;
  width: 100%;

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

}
.form-textarea:focus {
  border-color: #2b3a55;
}
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.input-suffix-wrap {
  position: relative;
}
.input-suffix {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: #a0aec0;
}

input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type="number"] {
  -moz-appearance: textfield;
}

.error-msg {
  font-size: 11px;
  color: #e53e3e;
  margin-top: 2px;
}
.input-error {
  border-color: #e53e3e !important;
}
.server-error {
  background: #fff5f5;
  border: 1px solid #fed7d7;
  border-radius: 7px;
  padding: 10px 14px;
  font-size: 13px;
  color: #e53e3e;
  margin-bottom: 20px;
}

.toggle-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}
.toggle {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}
.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}
.slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background: #e2e8f0;
  border-radius: 24px;
  transition: background 0.3s;
}
.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background: #fff;
  border-radius: 50%;
  transition: left 0.1s;
}
input:checked + .slider {
  background: #4d8b5a;
}
input:checked + .slider:before {
  transform: translateX(20px);
}
.toggle-label {
  font-size: 13px;
  font-weight: 600;
  color: #718096;
}
.toggle-label.active {
  color: #4d8b5a;
}
.toggle-desc {
  font-size: 12px;
  color: #a0aec0;
  margin-top: 4px;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e2e8f0;
}
.form-actions-right {
  display: flex;
  gap: 10px;
  margin-left: auto;
}
.btn-cancel {
  padding: 10px 24px;
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  background: #fff;
  font-size: 13px;
  color: #718096;
  cursor: pointer;

}
.btn-cancel:hover {
  background: #f5f6f8;
}
.btn-submit {
  padding: 10px 28px;
  background: #2b3a55;
  color: #fff;
  border: none;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;

}
.btn-submit:hover {
  background: #1e2a3e;
}
.btn-delete {
  padding: 10px 24px;
  background: #fee2e2;
  color: #e53e3e;
  border: 1px solid #fecaca;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;

}
.btn-delete:hover {
  background: #fecaca;
}

.preview-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.preview-box {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  padding: 20px;
}
.preview-title {
  font-size: 14px;
  font-weight: 700;
  color: #1a202c;
  margin-bottom: 14px;
}
.preview-card {
  padding: 4px;
}
.preview-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.card-icon {
  width: 32px;
  height: 32px;
  background: #f0f4ff;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2b3a55;
  flex-shrink: 0;
}
.preview-name-wrap {
  display: flex;
  flex-direction: column;
  flex: 1;
}
.preview-name {
  font-size: 14px;
  font-weight: 700;
  color: #1a202c;
}
.preview-id {
  font-size: 11px;
  color: #a0aec0;
  margin-top: 2px;
}
.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  width: fit-content;
}
.status-badge.active {
  background: #c6f6d5;
  color: #276749;
}
.status-badge.inactive {
  background: #f5f5f5;
  color: #718096;
}
.preview-divider {
  height: 1px;
  background: #e2e8f0;
  margin-bottom: 12px;
}
.preview-info {
  display: flex;
  flex-direction: column;
}
.preview-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  padding: 10px 0;
  border-bottom: 1px solid #e2e8f0;
}
.preview-row:last-child {
  border-bottom: none;
}
.preview-row span:first-child {
  color: #718096;
}
.preview-row span:last-child {
  font-weight: 600;
  color: #1a202c;
}

.guide-box {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  padding: 20px;
}
.guide-title {
  font-size: 14px;
  font-weight: 700;
  color: #1a202c;
  margin-bottom: 12px;
}
.guide-divider {
  height: 1px;
  background: #e2e8f0;
  margin-bottom: 12px;
}
.guide-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.guide-list li {
  font-size: 12px;
  color: #718096;
  padding-left: 14px;
  position: relative;
}
.guide-list li::before {
  content: "•";
  position: absolute;
  left: 0;
  color: #ed8936;
}
</style>
