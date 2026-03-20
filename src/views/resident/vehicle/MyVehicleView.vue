<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import vehicleAPI from '@/api/vehicle.js'
import BaseModal  from '@/components/common/BeseModel.vue'

const state = reactive({
  list: [],
  logs: [],
})

/** 모달 상태 */
const registerModal = reactive({ show: false, loading: false })
const editModal     = reactive({ show: false, vehicle: null, loading: false })
const deleteModal   = reactive({ show: false, vehicle: null, loading: false })

/** 등록 폼 */
const registerForm = reactive({
  licensePlate: '',
  carModel:     '',
  carType:      '',
})

/** 수정 폼 */
const editForm = reactive({
  licensePlate: '',
  carModel:     '',
})

/** 에러 메시지 */
const registerError = reactive({
  licensePlate: '',
  carModel:     '',
  carType:      '',
})
const editError = reactive({
  licensePlate: '',
  carModel:     '',
})

/** 승인 상태 라벨/클래스 */
const statusLabel = (s) => ({ APPROVED: '완료', PENDING: '대기', REJECTED: '거부' }[s] ?? s)
const statusClass = (s) => ({ APPROVED: 'approved', PENDING: 'pending', REJECTED: 'rejected' }[s] ?? '')

/** 날짜 포맷 */
const formatDate = (val) => val ? val.slice(0, 10).replace(/-/g, '.') : '-'

/** 입출차 기록 시간 포맷 */
const formatLogTime = (vehicleId) => {
  const logs = state.logs
    .filter(l => l.vehicleId === vehicleId)
    .sort((a, b) => new Date(b.loggedAt) - new Date(a.loggedAt))

  if (!logs.length) return '-'

  const log  = logs[0]
  const d    = new Date(log.loggedAt)
  const yyyy = d.getFullYear()
  const mm   = String(d.getMonth() + 1).padStart(2, '0')
  const dd   = String(d.getDate()).padStart(2, '0')
  const days = ['일', '월', '화', '수', '목', '금', '토']
  const day  = days[d.getDay()]
  const hh   = d.getHours()
  const min  = String(d.getMinutes()).padStart(2, '0')
  const ampm = hh < 12 ? '오전' : '오후'
  const hour = hh % 12 || 12
  const type = log.entryType === 'IN' ? '입차' : '출차'

  return `${type} : ${yyyy}.${mm}.${dd}(${day}) ${ampm} ${hour}시 ${min}분`
}

/** API-038 | 내 차량 목록 조회 */
const fetchVehicles = async () => {
  try {
    const { data } = await vehicleAPI.getMyVehicles()
    state.list = data.resultData ?? []
  } catch (e) { console.error('차량 목록 조회 실패', e) }
}

/** API-043 | 내 차량 입출차 기록 조회 */
const fetchLogs = async () => {
  try {
    const { data } = await vehicleAPI.getMyVehicleLogs()
    state.logs = data.resultData ?? []
  } catch (e) { console.error('입출차 기록 조회 실패', e) }
}

/** 등록 모달 열기 */
const openRegister = () => {
  registerForm.licensePlate  = ''
  registerForm.carModel      = ''
  registerForm.carType       = ''
  registerError.licensePlate = ''
  registerError.carModel     = ''
  registerError.carType      = ''
  registerModal.show         = true
}
const closeRegister = () => {
  registerModal.show         = false
  registerError.licensePlate = ''
  registerError.carModel     = ''
  registerError.carType      = ''
}

/** API-039 | 차량 등록 */
const handleRegister = async () => {
  registerError.licensePlate = ''
  registerError.carModel     = ''
  registerError.carType      = ''

  if (!registerForm.licensePlate || !registerForm.licensePlate.trim()) {
    registerError.licensePlate = '차량 번호를 입력해주세요.'
    return
  }
  if (!registerForm.carModel || !registerForm.carModel.trim()) {
    registerError.carModel = '차 모델을 입력해주세요.'
    return
  }
  if (!registerForm.carType) {
    registerError.carType = '차량 종류를 선택해주세요.'
    return
  }

  registerModal.loading = true
  try {
    await vehicleAPI.registerVehicle({ ...registerForm })
    closeRegister()
    await fetchVehicles()
  } catch (e) {
    if (e.response?.status === 400) {
      registerError.licensePlate = e.response?.data?.message ?? '등록에 실패했습니다.'
    } else { console.error('차량 등록 실패', e) }
  } finally { registerModal.loading = false }
}

/** 수정 모달 열기 */
const openEdit = (v) => {
  editForm.licensePlate  = v.licensePlate
  editForm.carModel      = v.carModel
  editError.licensePlate = ''
  editError.carModel     = ''
  editModal.vehicle      = v
  editModal.loading      = false
  editModal.show         = true
}
const closeEdit = () => {
  editModal.show         = false
  editModal.vehicle      = null
  editError.licensePlate = ''
  editError.carModel     = ''
}

/** API-040 | 차량 수정 */
const handleEdit = async () => {
  editError.licensePlate = ''
  editError.carModel     = ''

  if (!editForm.licensePlate || !editForm.licensePlate.trim()) {
    editError.licensePlate = '차량 번호를 입력해주세요.'
    return
  }
  if (!editForm.carModel || !editForm.carModel.trim()) {
    editError.carModel = '차 모델을 입력해주세요.'
    return
  }

  editModal.loading = true
  try {
    await vehicleAPI.updateVehicle(editModal.vehicle.vehicleId, {
      licensePlate: editForm.licensePlate,
      carModel:     editForm.carModel,
    })
    closeEdit()
    await fetchVehicles()
  } catch (e) {
    if (e.response?.status === 400) {
      editError.licensePlate = e.response?.data?.message ?? '이미 등록된 차량 번호입니다.'
    } else { console.error('차량 수정 실패', e) }
  } finally { editModal.loading = false }
}

/** 삭제 모달 열기 */
const openDelete  = (v) => { deleteModal.vehicle = v; deleteModal.loading = false; deleteModal.show = true }
const closeDelete = () => { deleteModal.show = false; deleteModal.vehicle = null }

/** API-041 | 차량 삭제 */
const handleDelete = async () => {
  deleteModal.loading = true
  try {
    await vehicleAPI.deleteVehicle(deleteModal.vehicle.vehicleId)
    closeDelete()
    await fetchVehicles()
  } catch (e) { console.error('차량 삭제 실패', e) }
  finally { deleteModal.loading = false }
}

/** 등록 폼 번호판 실시간 중복 체크 */
watch(() => registerForm.licensePlate, (val) => {
  if (!val || !val.trim()) { registerError.licensePlate = ''; return }
  const clean = val.replace(/\s/g, '')
  const isDuplicate = state.list.some(v => v.licensePlate.replace(/\s/g, '') === clean)
  registerError.licensePlate = isDuplicate ? '이미 등록된 차량 번호입니다.' : ''
})

/** 수정 폼 번호판 실시간 중복 체크 */
watch(() => editForm.licensePlate, (val) => {
  if (!val || !val.trim()) { editError.licensePlate = ''; return }
  const clean = val.replace(/\s/g, '')
  const isSelf = editModal.vehicle?.licensePlate?.replace(/\s/g, '') === clean
  if (isSelf) { editError.licensePlate = ''; return }
  const isDuplicate = state.list.some(v =>
    v.licensePlate.replace(/\s/g, '') === clean &&
    v.vehicleId !== editModal.vehicle?.vehicleId
  )
  editError.licensePlate = isDuplicate ? '이미 등록된 차량 번호입니다.' : ''
})

onMounted(async () => {
  await fetchVehicles()
  await fetchLogs()
})
</script>

<template>
  <div class="my-vehicle-view">

    <!-- 차량 목록 -->
    <div class="vehicle-list">

      <!-- 등록된 차량 카드 -->
      <div v-for="(v, idx) in state.list" :key="v.vehicleId" class="vehicle-card">
        <div class="vehicle-image">
          <svg width="80" height="50" viewBox="0 0 24 24" fill="none" stroke="#CBD5E0" stroke-width="1">
            <rect x="1" y="3" width="15" height="13" rx="2"/>
            <path d="M16 8h4l3 5v3h-7V8z"/>
            <circle cx="5.5" cy="18.5" r="2.5"/>
            <circle cx="18.5" cy="18.5" r="2.5"/>
          </svg>
        </div>

        <div class="vehicle-info">
          <div class="vehicle-title">내 차량 {{ idx + 1 }}</div>

          <div class="vehicle-meta">
            <div class="meta-group">
              <span class="meta-label">차주</span>
              <span class="meta-value">{{ v.userName ?? '-' }}</span>
            </div>
            <div class="meta-group">
              <span class="meta-label">등록 상태</span>
              <span :class="['status-badge', statusClass(v.status)]">{{ statusLabel(v.status) }}</span>
            </div>
            <div class="meta-group">
              <span class="meta-label">차량 번호</span>
              <span class="meta-value bold">{{ v.licensePlate }}</span>
            </div>
            <div class="meta-group">
              <span class="meta-label">등록일</span>
              <span class="meta-value">{{ formatDate(v.createdAt) }}</span>
            </div>
            <div class="meta-group">
              <span class="meta-label">차 모델</span>
              <span class="meta-value">{{ v.carModel ?? '-' }}</span>
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
            >등록 수정</button>
            <button class="btn-delete" @click="openDelete(v)">등록 취소</button>
          </div>
        </div>
      </div>

      <!-- 차량 등록하기 버튼 (최대 2대) -->
      <div v-if="state.list.length < 2" class="vehicle-add" @click="openRegister">
        <div class="add-icon">+</div>
        <span class="add-label">내 차량 등록하기</span>
      </div>

    </div>

    <!-- 차량 등록 모달 -->
    <BaseModal v-if="registerModal.show" title="차량 등록" @close="closeRegister">
      <div class="form-group">
        <label class="form-label">차량 번호 <span class="required">*</span></label>
        <input v-model="registerForm.licensePlate" class="form-input" :class="{ 'input-error': registerError.licensePlate }" placeholder="예: 12가 3456" />
        <span v-if="registerError.licensePlate" class="field-error">{{ registerError.licensePlate }}</span>
      </div>
      <div class="form-group">
        <label class="form-label">차 모델 <span class="required">*</span></label>
        <input v-model="registerForm.carModel" class="form-input" :class="{ 'input-error': registerError.carModel }" placeholder="예: 현대 소나타" />
        <span v-if="registerError.carModel" class="field-error">{{ registerError.carModel }}</span>
      </div>
      <div class="form-group">
        <label class="form-label">차량 종류 <span class="required">*</span></label>
        <select v-model="registerForm.carType" class="form-select" :class="{ 'input-error': registerError.carType }">
          <option value="">선택</option>
          <option value="경차">경차</option>
          <option value="승용차">승용차</option>
          <option value="SUV">SUV</option>
          <option value="승합차">승합차</option>
        </select>
        <span v-if="registerError.carType" class="field-error">{{ registerError.carType }}</span>
      </div>
      <template #footer>
        <button class="btn-cancel" @click="closeRegister">취소</button>
        <button class="btn-submit" @click="handleRegister" :disabled="registerModal.loading">
          {{ registerModal.loading ? '등록 중...' : '등록하기' }}
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
      <!-- 차주명 (읽기 전용) -->
      <div class="form-group">
        <label class="form-label">차주명 <span class="required">*</span></label>
        <div class="select-wrap">
          <span class="select-value">{{ editModal.vehicle?.userName ?? '-' }}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A0AEC0" stroke-width="2">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>

      <!-- 차량번호 / 차 모델 -->
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">차량번호 <span class="required">*</span></label>
          <input v-model="editForm.licensePlate" class="form-input" :class="{ 'input-error': editError.licensePlate }" placeholder="예: 12가 3456" />
          <span v-if="editError.licensePlate" class="field-error">{{ editError.licensePlate }}</span>
        </div>
        <div class="form-group">
          <label class="form-label">차 모델 <span class="required">*</span></label>
          <input v-model="editForm.carModel" class="form-input" :class="{ 'input-error': editError.carModel }" placeholder="예: 현대 소나타" />
          <span v-if="editError.carModel" class="field-error">{{ editError.carModel }}</span>
        </div>
      </div>

      <p class="form-hint">* 표시는 필수 입력 항목입니다.</p>

      <template #footer>
        <button class="btn-cancel" @click="closeEdit">취소</button>
        <button class="btn-submit" @click="handleEdit" :disabled="editModal.loading">
          {{ editModal.loading ? '수정 중...' : '수정하기' }}
        </button>
      </template>
    </BaseModal>

    <!-- 차량 삭제 모달 -->
    <BaseModal v-if="deleteModal.show" title="차량을 삭제하시겠습니까?" @close="closeDelete">
      <p class="delete-warning">이 작업은 되돌릴 수 없습니다.</p>
      <div class="delete-card">
        <div>
          <div class="delete-name">{{ deleteModal.vehicle?.licensePlate }}</div>
          <div class="delete-info">{{ deleteModal.vehicle?.carModel ?? '-' }} · {{ deleteModal.vehicle?.userName ?? '-' }}</div>
        </div>
      </div>
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
.my-vehicle-view { display: flex; flex-direction: column; gap: 16px; font-family: 'Noto Sans KR', sans-serif; color: #333; }

.vehicle-list { display: flex; flex-direction: column; gap: 16px; margin-top: 40px; }

.vehicle-card  { background: #fff; border-radius: 10px; border: 1px solid #E2E8F0; padding: 20px; display: flex; gap: 24px; align-items: flex-start; }
.vehicle-image { width: 220px; height: 140px; background: #F5F6F8; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.vehicle-info  { flex: 1; display: flex; flex-direction: column; gap: 12px; height: 100%; }
.vehicle-title { font-size: 15px; font-weight: 700; color: #1A202C; }

.vehicle-meta  { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 32px; }
.meta-group    { display: flex; flex-direction: column; gap: 3px; }
.meta-label    { font-size: 11px; color: #A0AEC0; }
.meta-value    { font-size: 13px; color: #1A202C; }
.meta-value.bold { font-weight: 700; font-size: 15px; }

.status-badge          { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; width: fit-content; }
.status-badge.approved { background: #EBF5EE; color: #4D8B5A; }
.status-badge.pending  { background: #FEF9C3; color: #ca8a04; }
.status-badge.rejected { background: #FEE2E2; color: #E53E3E; }

.vehicle-time    { font-size: 11px; color: #A0AEC0; }
.vehicle-actions { display: flex; gap: 8px; margin-top: auto; justify-content: flex-end; }
.btn-edit   { padding: 7px 18px; border: 1px solid #E2E8F0; border-radius: 7px; background: #fff; font-size: 12px; color: #2B3A55; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; }
.btn-edit:hover { background: #F0F4FF; }
.btn-delete { padding: 7px 18px; border: 1px solid #FECACA; border-radius: 7px; background: #fff; font-size: 12px; color: #E53E3E; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; }
.btn-delete:hover { background: #FEE2E2; }
.btn-disabled { opacity: 0.4; cursor: not-allowed !important; }
.btn-disabled:hover { background: #fff !important; }

.vehicle-add { background: #fff; border-radius: 10px; border: 2px dashed #E2E8F0; padding: 40px; display: flex; flex-direction: column; align-items: center; gap: 10px; cursor: pointer; transition: all 0.15s; }
.vehicle-add:hover { border-color: #2B3A55; background: #F8FAFF; }
.add-icon  { width: 40px; height: 40px; border-radius: 50%; border: 2px solid #CBD5E0; display: flex; align-items: center; justify-content: center; font-size: 20px; color: #A0AEC0; }
.add-label { font-size: 13px; color: #A0AEC0; }

.form-group   { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
.form-label   { font-size: 13px; font-weight: 600; color: #4A5568; }
.required     { color: #E53E3E; }
.form-input   { border: 1px solid #E2E8F0; border-radius: 7px; padding: 10px 14px; font-size: 13px; color: #333; outline: none; width: 100%; font-family: 'Noto Sans KR', sans-serif; }
.form-input:focus { border-color: #2B3A55; }
.form-select  { border: 1px solid #E2E8F0; border-radius: 7px; padding: 10px 32px 10px 14px; font-size: 13px; color: #333; background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23A0AEC0' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 12px center; appearance: none; outline: none; width: 100%; font-family: 'Noto Sans KR', sans-serif; }
.form-row     { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-hint    { font-size: 11px; color: #A0AEC0; margin-top: -8px; margin-bottom: 8px; }

.input-error  { border-color: #E53E3E !important; }
.field-error  { font-size: 11px; color: #E53E3E; margin-top: 2px; }

.select-wrap  { display: flex; align-items: center; justify-content: space-between; border: 1px solid #E2E8F0; border-radius: 7px; padding: 10px 14px; font-size: 13px; color: #333; background: #F5F6F8; }
.select-value { flex: 1; }

.btn-cancel  { padding: 9px 20px; border: 1px solid #E2E8F0; border-radius: 7px; background: #fff; font-size: 13px; color: #718096; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; }
.btn-cancel:hover { background: #F5F6F8; }
.btn-submit  { padding: 9px 24px; background: #2B3A55; color: #fff; border: none; border-radius: 7px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; }
.btn-submit:hover:not(:disabled) { background: #1E2A3E; }
.btn-submit:disabled { opacity: 0.5; cursor: default; }

.delete-warning     { font-size: 13px; color: #718096; margin-bottom: 16px; text-align: center; }
.delete-card        { display: flex; align-items: center; gap: 12px; background: #FFF5F5; border: 1px solid #FED7D7; border-left: 3px solid #E53E3E; border-radius: 8px; padding: 12px 16px; margin-bottom: 12px; }
.delete-name        { font-size: 14px; font-weight: 700; color: #1A202C; }
.delete-info        { font-size: 12px; color: #718096; margin-top: 2px; }
.btn-delete-confirm { padding: 9px 24px; background: #E53E3E; color: #fff; border: none; border-radius: 7px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; }
.btn-delete-confirm:hover:not(:disabled) { background: #c53030; }
.btn-delete-confirm:disabled { opacity: 0.5; cursor: default; }
</style>