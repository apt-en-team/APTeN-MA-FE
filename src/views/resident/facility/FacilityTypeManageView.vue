<script setup>
import { onMounted, reactive, ref } from 'vue'
import facilityAPI from '@/api/facility.js'
import BaseModal from '@/components/common/BeseModel.vue'
import FilterBar from '@/components/admin/FilterBar.vue'

const state = reactive({
  list:        [],
  searchQuery: '',
})

/** 에러 메시지 */
const formError = ref('')

/** 등록 모달 */
const registerModal = reactive({ show: false, loading: false })
const registerForm  = reactive({ name: '', description: '' })

/** 수정 모달 */
const editModal = reactive({ show: false, loading: false, type: null })
const editForm  = reactive({ name: '', description: '' })

/** 삭제 모달 */
const deleteModal = reactive({ show: false, loading: false, type: null })

/** 검색 필터 */
const filteredList = () =>
  state.list.filter(t =>
    !state.searchQuery || t.name.includes(state.searchQuery)
  )

/** 날짜 포맷 */
const formatDate = (val) => val ? val.slice(0, 10).replace(/-/g, '.') : '-'

/** API-044 | 시설 타입 목록 조회 */
const fetchTypes = async () => {
  try {
    const { data } = await facilityAPI.getTypes()
    state.list = data.resultData ?? []
  } catch (e) { console.error('타입 목록 조회 실패', e) }
}

/** 등록 모달 열기 */
const openRegister = () => {
  registerForm.name        = ''
  registerForm.description = ''
  formError.value          = ''
  registerModal.show       = true
}
const closeRegister = () => { registerModal.show = false; formError.value = '' }

/** API-045 | 시설 타입 등록 */
const handleRegister = async () => {
  if (!registerForm.name) { formError.value = '타입명을 입력해주세요.'; return }
  formError.value        = ''
  registerModal.loading  = true
  try {
    await facilityAPI.createType({ ...registerForm })
    closeRegister()
    await fetchTypes()
  } catch (e) {
    formError.value = e.response?.data?.message ?? '등록에 실패했습니다.'
  }
  finally { registerModal.loading = false }
}

/** 수정 모달 열기 */
const openEdit = (t) => {
  editForm.name        = t.name
  editForm.description = t.description ?? ''
  formError.value      = ''
  editModal.type       = t
  editModal.loading    = false
  editModal.show       = true
}
const closeEdit = () => { editModal.show = false; editModal.type = null; formError.value = '' }

/** API-046 | 시설 타입 수정 */
const handleEdit = async () => {
  if (!editForm.name) { formError.value = '타입명을 입력해주세요.'; return }
  formError.value   = ''
  editModal.loading = true
  try {
    await facilityAPI.updateType(editModal.type.typeId, { ...editForm })
    closeEdit()
    await fetchTypes()
  } catch (e) {
    formError.value = e.response?.data?.message ?? '수정에 실패했습니다.'
  }
  finally { editModal.loading = false }
}

/** 삭제 모달 열기 */
const openDelete  = (t) => { deleteModal.type = t; deleteModal.loading = false; deleteModal.show = true }
const closeDelete = () => { deleteModal.show = false; deleteModal.type = null }

/** API-047 | 시설 타입 삭제 */
const handleDelete = async () => {
  deleteModal.loading = true
  try {
    await facilityAPI.deleteType(deleteModal.type.typeId)
    closeDelete()
    await fetchTypes()
  } catch (e) { console.error('타입 삭제 실패', e) }
  finally { deleteModal.loading = false }
}

/** 필터 초기화 */
const resetFilters = () => { state.searchQuery = '' }

onMounted(() => fetchTypes())
</script>

<template>
  <div class="facility-type-manage-view">

    <!-- 필터 바 -->
    <div class="table-section">
      <FilterBar @reset="resetFilters">
        <div class="search-wrap">
          <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input v-model="state.searchQuery" class="search-input" placeholder="타입명 검색" />
        </div>
        <!-- 타입 추가 버튼 -->
        <button class="btn-add" @click="openRegister">+ 타입 추가</button>
      </FilterBar>

      <!-- 타입 목록 테이블 -->
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
          <tr v-for="t in filteredList()" :key="t.typeId">
            <td class="td-id">#{{ t.typeId }}</td>
            <td class="td-name">{{ t.name }}</td>
            <td class="td-desc">{{ t.description || '-' }}</td>
            <td class="td-date">{{ formatDate(t.createdAt) }}</td>
            <td class="td-actions">
              <button class="btn-edit" @click="openEdit(t)">수정</button>
              <button class="btn-delete" @click="openDelete(t)">삭제</button>
            </td>
          </tr>
          <tr v-if="filteredList().length === 0">
            <td colspan="5" class="empty">등록된 시설 타입이 없습니다.</td>
          </tr>
        </tbody>
      </table>

    </div>

    <!-- 타입 등록 모달 -->
    <BaseModal v-if="registerModal.show" title="시설 타입 등록" @close="closeRegister">

      <!-- 에러 메시지 -->
      <div v-if="formError" class="error-msg">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        {{ formError }}
      </div>

      <div class="form-group">
        <label class="form-label">타입명 *</label>
        <input v-model="registerForm.name" class="form-input" placeholder="예: 편의 시설" />
      </div>
      <div class="form-group">
        <label class="form-label">설명</label>
        <textarea v-model="registerForm.description" class="form-textarea" placeholder="타입에 대한 설명을 입력해주세요." rows="3" />
      </div>
      <template #footer>
        <button class="btn-cancel" @click="closeRegister">취소</button>
        <button class="btn-submit" @click="handleRegister" :disabled="registerModal.loading">
          {{ registerModal.loading ? '등록 중...' : '등록하기' }}
        </button>
      </template>
    </BaseModal>

    <!-- 타입 수정 모달 -->
    <BaseModal v-if="editModal.show" title="시설 타입 수정" :subtitle="'#' + editModal.type?.typeId" @close="closeEdit">

      <!-- 에러 메시지 -->
      <div v-if="formError" class="error-msg">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        {{ formError }}
      </div>

      <div class="form-group">
        <label class="form-label">타입명 *</label>
        <input v-model="editForm.name" class="form-input" placeholder="예: 편의 시설" />
      </div>
      <div class="form-group">
        <label class="form-label">설명</label>
        <textarea v-model="editForm.description" class="form-textarea" placeholder="타입에 대한 설명을 입력해주세요." rows="3" />
      </div>
      <template #footer>
        <button class="btn-cancel" @click="closeEdit">취소</button>
        <button class="btn-submit" @click="handleEdit" :disabled="editModal.loading">
          {{ editModal.loading ? '수정 중...' : '수정완료' }}
        </button>
      </template>
    </BaseModal>

    <!-- 타입 삭제 모달 -->
    <BaseModal v-if="deleteModal.show" title="시설 타입을 삭제하시겠습니까?" @close="closeDelete">
      <div class="delete-icon-wrap">
        <div class="delete-icon">
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#E53E3E" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="7" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
      </div>
      <p class="delete-warning">이 작업은 되돌릴 수 없습니다.</p>
      <div class="delete-card">
        <div>
          <div class="delete-name">{{ deleteModal.type?.name }}</div>
          <div class="delete-info">{{ deleteModal.type?.description || '설명 없음' }}</div>
        </div>
      </div>
      <p class="delete-hint">⚠ 해당 타입의 시설이 있으면 삭제할 수 없습니다.</p>
      <template #footer>
        <button class="btn-cancel" @click="closeDelete">취소</button>
        <button class="btn-delete-confirm" @click="handleDelete" :disabled="deleteModal.loading">
          {{ deleteModal.loading ? '삭제 중...' : '삭제' }}
        </button>
      </template>
    </BaseModal>

  </div>
</template>

<style scoped>
* { box-sizing: border-box; margin: 0; padding: 0; }
.facility-type-manage-view { display: flex; flex-direction: column; font-family: 'Noto Sans KR', sans-serif; color: #333; }

/* 테이블 섹션 */
.table-section { background: #fff; border-radius: 10px; border: 1px solid #E2E8F0; overflow: hidden; }

/* 필터 */
.search-wrap  { display: flex; align-items: center; border: 1px solid #E2E8F0; border-radius: 7px; padding: 7px 12px; gap: 6px; background: #F5F6F8; }
.search-icon  { color: #A0AEC0; flex-shrink: 0; }
.search-input { border: none; background: transparent; font-size: 13px; outline: none; color: #333; width: 150px; font-family: 'Noto Sans KR', sans-serif; }
.search-input::placeholder { color: #CBD5E0; }
.btn-add      { padding: 7px 16px; background: #2B3A55; color: #fff; border: none; border-radius: 7px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; }
.btn-add:hover { background: #1E2A3E; }

/* 테이블 */
.type-table  { width: 100%; border-collapse: collapse; }
.type-table th { padding: 12px 20px; text-align: left; font-size: 12px; font-weight: 600; color: #718096; background: #F5F6F8; border-bottom: 1px solid #E2E8F0; }
.type-table td { padding: 14px 20px; font-size: 13px; color: #333; border-bottom: 1px solid #F5F6F8; }
.type-table tr:last-child td { border-bottom: none; }
.type-table tr:hover td { background: #FAFAFA; }
.td-id     { color: #A0AEC0; font-size: 12px; width: 60px; }
.td-name   { font-weight: 600; color: #1A202C; }
.td-desc   { color: #718096; }
.td-date   { color: #A0AEC0; font-size: 12px; white-space: nowrap; }
.td-actions { display: flex; gap: 8px; white-space: nowrap; }
.btn-edit   { padding: 5px 14px; border: 1px solid #E2E8F0; border-radius: 6px; background: #fff; font-size: 12px; color: #2B3A55; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; }
.btn-edit:hover { background: #F0F4FF; }
.btn-delete { padding: 5px 14px; border: 1px solid #FECACA; border-radius: 6px; background: #fff; font-size: 12px; color: #E53E3E; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; }
.btn-delete:hover { background: #FEE2E2; }
.empty { text-align: center; color: #A0AEC0; padding: 40px; }

/* 폼 */
.form-group    { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
.form-label    { font-size: 13px; font-weight: 600; color: #4A5568; }
.form-input    { border: 1px solid #E2E8F0; border-radius: 7px; padding: 10px 14px; font-size: 13px; color: #333; outline: none; width: 100%; font-family: 'Noto Sans KR', sans-serif; }
.form-input:focus { border-color: #2B3A55; }
.form-textarea { border: 1px solid #E2E8F0; border-radius: 7px; padding: 10px 14px; font-size: 13px; color: #333; outline: none; resize: none; width: 100%; font-family: 'Noto Sans KR', sans-serif; }
.form-textarea:focus { border-color: #2B3A55; }

/* 에러 메시지 */
.error-msg { display: flex; align-items: center; gap: 6px; padding: 10px 14px; background: #FFF5F5; border: 1px solid #FED7D7; border-radius: 7px; font-size: 12px; color: #E53E3E; margin-bottom: 12px; }

/* 버튼 */
.btn-cancel  { padding: 9px 20px; border: 1px solid #E2E8F0; border-radius: 7px; background: #fff; font-size: 13px; color: #718096; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; }
.btn-cancel:hover { background: #F5F6F8; }
.btn-submit  { padding: 9px 24px; background: #2B3A55; color: #fff; border: none; border-radius: 7px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; }
.btn-submit:hover:not(:disabled) { background: #1E2A3E; }
.btn-submit:disabled { opacity: 0.5; cursor: default; }

/* 삭제 모달 */
.delete-icon-wrap { display: flex; justify-content: center; margin-bottom: 16px; }
.delete-icon      { display: flex; align-items: center; justify-content: center; }
.delete-warning   { font-size: 13px; color: #718096; margin-bottom: 16px; text-align: center; }
.delete-card      { display: flex; align-items: center; gap: 12px; background: #FFF5F5; border: 1px solid #FED7D7; border-left: 3px solid #E53E3E; border-radius: 8px; padding: 12px 16px; margin-bottom: 12px; }
.delete-name      { font-size: 14px; font-weight: 700; color: #1A202C; }
.delete-info      { font-size: 12px; color: #718096; margin-top: 2px; }
.delete-hint      { font-size: 12px; color: #E53E3E; margin-bottom: 4px; }
.btn-delete-confirm { padding: 9px 24px; background: #E53E3E; color: #fff; border: none; border-radius: 7px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; }
.btn-delete-confirm:hover:not(:disabled) { background: #c53030; }
.btn-delete-confirm:disabled { opacity: 0.5; cursor: default; }
</style>