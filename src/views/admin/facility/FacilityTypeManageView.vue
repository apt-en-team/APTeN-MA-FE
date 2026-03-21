<script setup>
import { onMounted, reactive, ref, computed } from "vue";
import { useFacilityStore } from "@/stores/modules/facility";
import BaseModal from "@/components/common/BeseModel.vue";
import FilterBar from "@/components/layout/FilterBar.vue";
import ConfirmModal from "@/components/common/ConfirmModal.vue";
import ActionResultModal from "@/components/common/ActionResultModal.vue";

const facilityStore = useFacilityStore();

const searchQuery = ref("");
const formError = ref("");

const registerModal = reactive({ show: false, loading: false });
const registerForm = reactive({ name: "", description: "" });

const editModal = reactive({ show: false, loading: false, type: null });
const editForm = reactive({ name: "", description: "" });

const deleteModal = reactive({
  show: false,
  stage: "confirm",
  type: null,
  loading: false,
  resultType: "success",
  resultTitle: "",
  resultSubtitle: "",
});

// ── 필터 (스토어 types 직접 참조) ─────────────────────────────
const filteredList = computed(() =>
  facilityStore.types.filter(
    (t) => !searchQuery.value || t.name.includes(searchQuery.value)
  )
);

const formatDate = (val) => (val ? val.slice(0, 10).replace(/-/g, ".") : "-");

// ── 등록 ──────────────────────────────────────────────────────
const openRegister = () => {
  registerForm.name = "";
  registerForm.description = "";
  formError.value = "";
  registerModal.show = true;
};
const closeRegister = () => {
  registerModal.show = false;
  formError.value = "";
};

const handleRegister = async () => {
  if (!registerForm.name) {
    formError.value = "타입명을 입력해주세요.";
    return;
  }
  formError.value = "";
  registerModal.loading = true;
  try {
    await facilityStore.createType({ ...registerForm }); // ← 스토어 action
    closeRegister();
  } catch (e) {
    formError.value = e.response?.data?.message ?? "등록에 실패했습니다.";
  } finally {
    registerModal.loading = false;
  }
};

// ── 수정 ──────────────────────────────────────────────────────
const openEdit = (t) => {
  editForm.name = t.name;
  editForm.description = t.description ?? "";
  formError.value = "";
  editModal.type = t;
  editModal.loading = false;
  editModal.show = true;
};
const closeEdit = () => {
  editModal.show = false;
  editModal.type = null;
  formError.value = "";
};

const handleEdit = async () => {
  if (!editForm.name) {
    formError.value = "타입명을 입력해주세요.";
    return;
  }
  formError.value = "";
  editModal.loading = true;
  try {
    await facilityStore.updateType(editModal.type.typeId, { ...editForm }); // ← 스토어 action
    closeEdit();
  } catch (e) {
    formError.value = e.response?.data?.message ?? "수정에 실패했습니다.";
  } finally {
    editModal.loading = false;
  }
};

// ── 삭제 ──────────────────────────────────────────────────────
const openDelete = (t) => {
  deleteModal.type = t;
  deleteModal.loading = false;
  deleteModal.stage = "confirm";
  deleteModal.show = true;
};
const closeDeleteConfirm = () => {
  deleteModal.show = false;
  deleteModal.type = null;
  deleteModal.stage = "confirm";
};
const closeDeleteResult = () => {
  deleteModal.show = false;
  deleteModal.type = null;
  deleteModal.stage = "confirm";
};

const handleDelete = async () => {
  deleteModal.loading = true;
  try {
    await facilityStore.deleteType(deleteModal.type.typeId); // ← 스토어 action
    deleteModal.resultType = "success";
    deleteModal.resultTitle = "타입이 삭제되었습니다.";
    deleteModal.resultSubtitle = `${deleteModal.type.name} 타입이 삭제되었습니다.`;
  } catch (e) {
    deleteModal.resultType = "danger";
    deleteModal.resultTitle = "삭제에 실패했습니다.";
    deleteModal.resultSubtitle = "해당 타입의 시설이 있으면 삭제할 수 없습니다.";
  } finally {
    deleteModal.loading = false;
    deleteModal.stage = "result";
  }
};

const resetFilters = () => {
  searchQuery.value = "";
};

onMounted(async () => {
  // 타입 목록이 비어있을 때만 fetch
  if (!facilityStore.types.length) await facilityStore.fetchTypes();
});
</script>

<template>
  <div class="facility-type-manage-view">
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
            placeholder="타입명 검색"
          />
        </div>
        <button class="btn-add" @click="openRegister">+ 타입 추가</button>
      </FilterBar>

      <table class="type-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>타입명</th>
            <th>설명</th>
            <th>등록일</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in filteredList" :key="t.typeId">
            <td class="td-id">#{{ t.typeId }}</td>
            <td class="td-name">{{ t.name }}</td>
            <td class="td-desc">{{ t.description || "-" }}</td>
            <td class="td-date">{{ formatDate(t.createdAt) }}</td>
            <td class="td-actions">
              <button class="btn-edit" @click="openEdit(t)">수정</button>
              <button class="btn-delete" @click="openDelete(t)">삭제</button>
            </td>
          </tr>
          <tr v-if="filteredList.length === 0">
            <td colspan="5" class="empty">등록된 시설 타입이 없습니다.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 타입 등록 모달 -->
    <BaseModal v-if="registerModal.show" title="시설 타입 등록" @close="closeRegister">
      <div class="form-group">
        <label class="form-label">타입명 *</label>
        <input
          v-model="registerForm.name"
          class="form-input"
          placeholder="예: 편의 시설"
        />
        <div v-if="formError" class="error-msg">{{ formError }}</div>
      </div>
      <div class="form-group">
        <label class="form-label">설명</label>
        <textarea
          v-model="registerForm.description"
          class="form-textarea"
          placeholder="타입에 대한 설명을 입력해주세요."
          rows="3"
        />
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

    <!-- 타입 수정 모달 -->
    <BaseModal
      v-if="editModal.show"
      title="시설 타입 수정"
      :subtitle="'#' + editModal.type?.typeId"
      @close="closeEdit"
    >
      <div class="form-group">
        <label class="form-label">타입명 *</label>
        <input v-model="editForm.name" class="form-input" placeholder="예: 편의 시설" />
        <div v-if="formError" class="error-msg">{{ formError }}</div>
      </div>
      <div class="form-group">
        <label class="form-label">설명</label>
        <textarea
          v-model="editForm.description"
          class="form-textarea"
          placeholder="타입에 대한 설명을 입력해주세요."
          rows="3"
        />
      </div>
      <template #footer>
        <button class="btn-cancel" @click="closeEdit">취소</button>
        <button class="btn-submit" @click="handleEdit" :disabled="editModal.loading">
          {{ editModal.loading ? "수정 중..." : "수정완료" }}
        </button>
      </template>
    </BaseModal>

    <!-- ✅ 1단계: 삭제 확인 → ConfirmModal -->
    <ConfirmModal
      v-if="deleteModal.show && deleteModal.stage === 'confirm'"
      title="시설 타입을 삭제하시겠습니까?"
      subtitle="이 작업은 되돌릴 수 없습니다."
      subtitle-color="#e53e3e"
      item-label="타입명"
      action-text="설명"
      :item-name="deleteModal.type?.name"
      :action-label="deleteModal.type?.description || '설명 없음'"
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
.facility-type-manage-view {
  display: flex;
  flex-direction: column;

  color: #333;
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
}
.search-input::placeholder {
  color: #cbd5e0;
}
.btn-add {
  padding: 7px 16px;
  background: #2b3a55;
  color: #fff;
  border: none;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.btn-add:hover {
  background: #1e2a3e;
}

.type-table {
  width: 100%;
  border-collapse: collapse;
}
.type-table th {
  padding: 12px 20px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: #718096;
  background: #f5f6f8;
  border-bottom: 1px solid #e2e8f0;
}
.type-table td {
  padding: 14px 20px;
  font-size: 13px;
  color: #333;
  border-bottom: 1px solid #f5f6f8;
}
.type-table tr:last-child td {
  border-bottom: none;
}
.type-table tr:hover td {
  background: #fafafa;
}
.td-id {
  color: #a0aec0;
  font-size: 12px;
  width: 60px;
}
.td-name {
  font-weight: 600;
  color: #1a202c;
}
.td-desc {
  color: #718096;
}
.td-date {
  color: #a0aec0;
  font-size: 12px;
  white-space: nowrap;
}
.td-actions {
  display: flex;
  gap: 8px;
  white-space: nowrap;
}
.btn-edit,
.btn-delete {
  padding: 5px 14px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
}
.btn-edit {
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #2b3a55;
}
.btn-edit:hover {
  background: #f0f4ff;
}
.btn-delete {
  border: 1px solid #fecaca;
  background: #fff;
  color: #e53e3e;
}
.btn-delete:hover {
  background: #fee2e2;
}
.empty {
  text-align: center;
  color: #a0aec0;
  padding: 40px;
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
.form-input,
.form-textarea {
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  padding: 10px 14px;
  font-size: 13px;
  outline: none;
  width: 100%;

}
.form-input:focus,
.form-textarea:focus {
  border-color: #2b3a55;
}
.error-msg {
  color: #e53e3e;
  font-size: 12px;
  margin-top: 4px;
}
.btn-cancel {
  padding: 9px 20px;
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
  padding: 9px 24px;
  background: #2b3a55;
  color: #fff;
  border: none;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;

}
.btn-submit:hover:not(:disabled) {
  background: #1e2a3e;
}
.btn-submit:disabled {
  opacity: 0.5;
  cursor: default;
}
</style>
