<script setup>
import { onMounted, reactive, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import facilityAPI from '@/api/facility.js'
import BaseModal  from '@/components/common/BeseModel.vue'

const route  = useRoute()
const router = useRouter()

/** 수정 모드 여부 | URL에 :id 파라미터 있으면 수정, 없으면 등록 */
const isEdit = computed(() => !!route.params.id)

/** 시설 타입 목록 */
const types = reactive([])

/** 폼 데이터 */
const form = reactive({
  typeId:       null,
  name:         '',
  description:  '',
  maxCapacity:  '',
  openTime:     '09:00',
  closeTime:    '22:00',
  slotDuration: 60,
  isActive:     true,
  createdAt:    null,
})

/** API-044 | 시설 타입 목록 조회 */
const fetchTypes = async () => {
  try {
    const { data } = await facilityAPI.getTypes()
    types.push(...(data.resultData ?? []))
  } catch (e) { console.error('타입 조회 실패', e) }
}

/** API-049 | 시설 단건 조회 (수정 모드 시 기존 데이터 불러오기) */
const fetchFacility = async () => {
  try {
    const { data } = await facilityAPI.getFacility(route.params.id)
    const f = data.resultData
    form.typeId       = f.typeId
    form.name         = f.name
    form.description  = f.description ?? ''
    form.maxCapacity  = f.maxCapacity
    form.openTime     = f.openTime?.slice(0, 5) ?? '09:00'
    form.closeTime    = f.closeTime?.slice(0, 5) ?? '22:00'
    form.slotDuration = f.slotDuration
    form.isActive     = f.active 
    form.createdAt    = f.createdAt 
  } catch (e) { console.error('시설 조회 실패', e) }
}

/** API-050 | 시설 등록 / API-051 | 시설 수정 */
const handleSubmit = async () => {
  // 필수값 체크
  if (!form.typeId)       { alert('시설 타입을 선택해주세요.'); return }
  if (!form.name)         { alert('시설명을 입력해주세요.'); return }
  if (!form.maxCapacity)  { alert('최대 인원을 입력해주세요.'); return }
  if (!form.openTime)     { alert('운영 시작 시간을 입력해주세요.'); return }
  if (!form.closeTime)    { alert('운영 종료 시간을 입력해주세요.'); return }

  try {
    const payload = {
      typeId:       form.typeId,
      name:         form.name,
      description:  form.description,
      maxCapacity:  form.maxCapacity,
      openTime:     form.openTime,
      closeTime:    form.closeTime,
      slotDuration: form.slotDuration,
      active:     form.isActive,  // ← 명시적으로 키 지정
    }
    if (isEdit.value) {
      await facilityAPI.updateFacility(route.params.id, payload)
    } else {
      await facilityAPI.createFacility(payload)
    }
    router.push('/admin/facility')
  } catch (e) { console.error('저장 실패', e) }
}

/** 삭제 확인 모달 */
const deleteModal = reactive({ show: false, loading: false })
const openDeleteModal  = () => { deleteModal.show = true }
const closeDeleteModal = () => { deleteModal.show = false }

/** API-052 | 시설 삭제 (수정 페이지에서만 노출) */
const handleDelete = async () => {
  deleteModal.loading = true
  try {
    await facilityAPI.deleteFacility(route.params.id)
    closeDeleteModal()
    router.push('/admin/facility')
  } catch (e) { console.error('삭제 실패', e) }
  finally { deleteModal.loading = false }
}

onMounted(async () => {
  await fetchTypes()
  if (isEdit.value) await fetchFacility()
})
</script>

<template>
  <div class="facility-form-view">
    <div class="form-layout">

      <!-- 왼쪽: 입력폼 -->
      <div class="form-section">
        <h2 class="form-title">시설 정보 {{ isEdit ? '수정' : '입력' }}</h2>
        <p class="form-desc">모든 * 항목은 필수 입력입니다.</p>

        <!-- 시설 타입 -->
        <div class="form-group">
          <label class="form-label">시설 타입 *</label>
          <select v-model="form.typeId" class="form-select">
            <option :value="null" disabled>타입 선택</option>
            <option v-for="t in types" :key="t.typeId" :value="t.typeId">{{ t.name }}</option>
          </select>
        </div>

        <!-- 시설명 -->
        <div class="form-group">
          <label class="form-label">시설명 *</label>
          <input v-model="form.name" class="form-input" placeholder="예: 헬스장" />
        </div>

        <!-- 시설 설명 -->
        <div class="form-group">
          <label class="form-label">시설 설명</label>
          <textarea v-model="form.description" class="form-textarea" placeholder="시설에 대한 간단한 설명을 입력해주세요." rows="4" />
        </div>

        <!-- 최대 인원 / 예약 단위 -->
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">최대 인원 *</label>
            <div class="input-suffix-wrap">
              <input v-model="form.maxCapacity" class="form-input" type="number" placeholder="예: 30" />
              <span class="input-suffix">명</span>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">예약 단위</label>
            <div class="input-suffix-wrap">
              <input v-model="form.slotDuration" class="form-input" type="number" placeholder="60" />
              <span class="input-suffix">분</span>
            </div>
          </div>
        </div>

        <!-- 운영 시작 / 종료 시간 -->
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">운영 시작 *</label>
            <input v-model="form.openTime" class="form-input" type="time" />
          </div>
          <div class="form-group">
            <label class="form-label">운영 종료 *</label>
            <input v-model="form.closeTime" class="form-input" type="time" />
          </div>
        </div>

        <!-- 운영 여부 토글 -->
        <div class="form-group">
          <label class="form-label">운영 여부</label>
          <div class="toggle-wrap">
            <label class="toggle">
              <input type="checkbox" v-model="form.isActive" />
              <span class="slider"></span>
            </label>
            <span class="toggle-label" :class="{ active: form.isActive }">
              {{ form.isActive ? '운영 중' : '운영 중단' }}
            </span>
          </div>
          <p class="toggle-desc">{{ form.isActive ? '활성화 시 예약이 가능합니다.' : '비활성화 시 예약이 불가합니다.' }}</p>
        </div>

        <!-- 하단 버튼 (삭제는 수정 모드에서만 노출) -->
        <div class="form-actions">
          <button v-if="isEdit" class="btn-delete" @click="openDeleteModal">삭제</button>
          <div class="form-actions-right">
            <button class="btn-cancel" @click="router.push('/admin/facility')">취소</button>
            <button class="btn-submit" @click="handleSubmit">{{ isEdit ? '수정완료' : '등록하기' }}</button>
          </div>
        </div>
      </div>

      <!-- 오른쪽: 미리보기 / 안내 -->
      <div class="preview-section">

        <!-- 미리보기 카드 -->
        <div class="preview-box">
          <h3 class="preview-title">{{ isEdit ? '현재 정보' : '미리보기' }}</h3>
          <div class="preview-card">
            <div class="preview-card-header">
              <div class="card-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                </svg>
              </div>
              <div class="preview-name-wrap">
                <span class="preview-name">{{ form.name || '시설명' }}</span>
                <span class="preview-id">facility_id #{{ route.params.id || '-' }}</span>
              </div>
              <span :class="['status-badge', form.isActive ? 'active' : 'inactive']">
                {{ form.isActive ? '운영 중' : '중단' }}
              </span>
            </div>
            <div class="preview-divider"></div>
            <div class="preview-info">
              <div class="preview-row"><span>최대 인원</span><span>{{ form.maxCapacity || '-' }}명</span></div>
              <div class="preview-row"><span>예약 단위</span><span>{{ form.slotDuration }}분</span></div>
              <div class="preview-row"><span>운영 시간</span><span>{{ form.openTime }} ~ {{ form.closeTime }}</span></div>
             <div class="preview-row">
             <span>등록일</span>
             <span>{{ form.createdAt ? form.createdAt.slice(0, 10).replace(/-/g, '.') : '-' }}</span>
             </div>
            </div>
          </div>
        </div>

        <!-- 등록/수정 안내 -->
        <div class="guide-box">
          <h3 class="guide-title">{{ isEdit ? '수정 주의사항' : '등록 안내' }}</h3>
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

    <!-- 삭제 확인 모달 (form-layout 밖으로 이동) ← 핵심 -->
    <BaseModal v-if="deleteModal.show" title="시설을 삭제하시겠습니까?" @close="closeDeleteModal">

      <!-- 경고 아이콘 -->
        <div class="delete-icon-wrap">
        <div class="delete-icon">
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#E53E3E" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="7" x2="12" y2="13"/>
            <line x1="12" y1="18" x2="12.01" y2="1"/>
          </svg>
        </div>
        </div>

      <p class="delete-warning">이 작업은 되돌릴 수 없습니다.</p>

      <!-- 시설 정보 카드 -->
      <div class="delete-card">
        <div class="card-icon-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E53E3E" stroke-width="2">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
          </svg>
        </div>
        <div>
          <div class="delete-name">{{ form.name }}</div>
          <div class="delete-info">최대 {{ form.maxCapacity }}명 · {{ form.openTime }} ~ {{ form.closeTime }} · 예약 {{ form.slotDuration }}분 단위</div>
        </div>
      </div>

      <p class="delete-hint">⚠ 삭제 시 해당 시설의 모든 예약 데이터도 함께 삭제됩니다.</p>

      <template #footer>
        <button class="btn-cancel" @click="closeDeleteModal">취소</button>
        <button class="btn-delete-confirm" @click="handleDelete" :disabled="deleteModal.loading">
          {{ deleteModal.loading ? '삭제 중...' : '삭제' }}
        </button>
      </template>
    </BaseModal>

  </div>
</template>

<style scoped>
* { box-sizing: border-box; margin: 0; padding: 0; }
.facility-form-view { font-family: 'Noto Sans KR', sans-serif; color: #333; }
.form-layout { display: grid; grid-template-columns: 1fr 320px; gap: 24px; }

/* 폼 섹션 */
.form-section  { background: #fff; border-radius: 10px; border: 1px solid #E2E8F0; padding: 32px; }
.form-title    { font-size: 18px; font-weight: 700; color: #1A202C; margin-bottom: 4px; }
.form-desc     { font-size: 12px; color: #A0AEC0; margin-bottom: 28px; }
.form-group    { display: flex; flex-direction: column; gap: 6px; margin-bottom: 20px; }
.form-label    { font-size: 13px; font-weight: 600; color: #4A5568; }
.form-input    { border: 1px solid #E2E8F0; border-radius: 7px; padding: 10px 14px; font-size: 13px; color: #333; outline: none; width: 100%; font-family: 'Noto Sans KR', sans-serif; }
.form-input:focus { border-color: #2B3A55; }
.form-select   { border: 1px solid #E2E8F0; border-radius: 7px; padding: 10px 32px 10px 14px; font-size: 13px; color: #333; background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23A0AEC0' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 12px center; appearance: none; outline: none; width: 100%; font-family: 'Noto Sans KR', sans-serif; }
.form-textarea { border: 1px solid #E2E8F0; border-radius: 7px; padding: 10px 14px; font-size: 13px; color: #333; outline: none; resize: none; width: 100%; font-family: 'Noto Sans KR', sans-serif; }
.form-textarea:focus { border-color: #2B3A55; }
.form-row      { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.input-suffix-wrap { position: relative; }
.input-suffix  { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); font-size: 12px; color: #A0AEC0; }

/* 토글 */
.toggle-wrap { display: flex; align-items: center; gap: 10px; }
.toggle { position: relative; display: inline-block; width: 44px; height: 24px; }
.toggle input { opacity: 0; width: 0; height: 0; }
.slider { position: absolute; cursor: pointer; inset: 0; background: #E2E8F0; border-radius: 24px; transition: background 0.3s; }
.slider:before { position: absolute; content: ''; height: 18px; width: 18px; left: 3px; bottom: 3px; background: #fff; border-radius: 50%; transition: left 0.1s; }
input:checked + .slider { background: #4D8B5A; }
input:checked + .slider:before { transform: translateX(20px); }
.toggle-label { font-size: 13px; font-weight: 600; color: #718096; }
.toggle-label.active { color: #4D8B5A; }
.toggle-desc { font-size: 12px; color: #A0AEC0; margin-top: 4px; }

/* 액션 버튼 */
.form-actions       { display: flex; justify-content: space-between; align-items: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #E2E8F0; }
.form-actions-right { display: flex; gap: 10px; margin-left: auto; }
.btn-cancel  { padding: 10px 24px; border: 1px solid #E2E8F0; border-radius: 7px; background: #fff; font-size: 13px; color: #718096; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; }
.btn-cancel:hover  { background: #F5F6F8; }
.btn-submit  { padding: 10px 28px; background: #2B3A55; color: #fff; border: none; border-radius: 7px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; }
.btn-submit:hover  { background: #1E2A3E; }
.btn-delete  { padding: 10px 24px; background: #FEE2E2; color: #E53E3E; border: 1px solid #FECACA; border-radius: 7px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; }
.btn-delete:hover  { background: #fecaca; }

/* 삭제 모달 */
.delete-icon-wrap   { display: flex; justify-content: center; margin-bottom: 16px; }
.delete-icon { width: 52px; height: 52px; display: flex; align-items: center; justify-content: center; }

.delete-warning     { font-size: 13px; color: #718096; margin-bottom: 16px; text-align: center; }
.delete-card        { display: flex; align-items: center; gap: 12px; background: #FFF5F5; border: 1px solid #FED7D7; border-left: 3px solid #E53E3E; border-radius: 8px; padding: 12px 16px; margin-bottom: 12px; }
.card-icon-sm       { width: 32px; height: 32px; background: #FED7D7; border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.delete-name        { font-size: 14px; font-weight: 700; color: #1A202C; }
.delete-info        { font-size: 12px; color: #718096; margin-top: 2px; }
.delete-hint        { font-size: 12px; color: #E53E3E; }
.btn-delete-confirm { padding: 9px 24px; background: #E53E3E; color: #fff; border: none; border-radius: 7px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; }
.btn-delete-confirm:hover:not(:disabled) { background: #c53030; }
.btn-delete-confirm:disabled { opacity: 0.5; cursor: default; }

/* 미리보기 */
.preview-section { display: flex; flex-direction: column; gap: 16px; }
.preview-box     { background: #fff; border-radius: 10px; border: 1px solid #E2E8F0; padding: 20px; }
.preview-title   { font-size: 14px; font-weight: 700; color: #1A202C; margin-bottom: 14px; }
.preview-card    { padding: 4px; }
.preview-card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.card-icon       { width: 32px; height: 32px; background: #F0F4FF; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #2B3A55; flex-shrink: 0; }
.preview-name-wrap { display: flex; flex-direction: column; flex: 1; }
.preview-name    { font-size: 14px; font-weight: 700; color: #1A202C; }
.preview-id      { font-size: 11px; color: #A0AEC0; margin-top: 2px; }
.status-badge          { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
.status-badge.active   { background: #C6F6D5; color: #276749; }
.status-badge.inactive { background: #F5F5F5; color: #718096; }
.preview-divider { height: 1px; background: #E2E8F0; margin-bottom: 12px; }
.preview-info    { display: flex; flex-direction: column; }
.preview-row     { display: flex; justify-content: space-between; font-size: 13px; padding: 10px 0; border-bottom: 1px solid #E2E8F0; }
.preview-row:last-child { border-bottom: none; }
.preview-row span:first-child { color: #718096; }
.preview-row span:last-child  { font-weight: 600; color: #1A202C; }

/* 안내 박스 */
.guide-box   { background: #fff; border-radius: 10px; border: 1px solid #E2E8F0; padding: 20px; }
.guide-title { font-size: 14px; font-weight: 700; color: #1A202C; margin-bottom: 12px; }
.guide-divider { height: 1px; background: #E2E8F0; margin-bottom: 12px; }
.guide-list  { list-style: none; display: flex; flex-direction: column; gap: 8px; }
.guide-list li { font-size: 12px; color: #718096; padding-left: 14px; position: relative; }
.guide-list li::before { content: '•'; position: absolute; left: 0; color: #ED8936; }
</style>