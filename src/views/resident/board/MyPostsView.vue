<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { onMounted } from 'vue'
import { getImageUrl } from '@/utils/image.js'
import { getMyPosts, getPopularPosts } from '@/api/board'
import ConfirmModal from '@/components/common/ConfirmModal.vue'

const router = useRouter()

const showDeleteConfirm = ref(false)
const deleteTargetId = ref(null)

// ─── 데이터 상태 ──────────────────────────────────────────────
const myPosts = ref([])
const loading = ref(false)

async function fetchMyPosts() {
  loading.value = true
  try {
    const res = await getMyPosts()
    myPosts.value = res.data
  } catch (e) {
    console.error('내가 쓴 글 조회 실패', e)
  } finally {
    loading.value = false
  }
}
onMounted(fetchMyPosts)

// ─── 검색 ──────────────────────────────────────────────
const searchKeyword = ref('')
const inputKeyword  = ref('')

// ─── 탭 ───────────────────────────────────────────────────────
const activeTab = ref('FREE') // 'FREE' | 'INQUIRY'

const filteredPosts = computed(() =>
  myPosts.value.filter(p => {
    const matchCategory = p.category === activeTab.value
    const keyword = searchKeyword.value.trim().toLowerCase()
    if (!keyword) return matchCategory
    const matchKeyword = p.title?.toLowerCase().includes(keyword) || p.content?.toLowerCase().includes(keyword)
    return matchCategory && matchKeyword
  })
)

function onSearch() {
  searchKeyword.value = inputKeyword.value.trim()
  currentPage.value = 1
}

function onReset() {
  inputKeyword.value  = ''
  searchKeyword.value = ''
  currentPage.value   = 1
}

function setTab(tab) {
  activeTab.value = tab
  currentPage.value = 1
}

// ─── 페이지네이션 ─────────────────────────────────────────────
const currentPage = ref(1)
const PAGE_SIZE = 10

const totalPages = computed(() => Math.max(1, Math.ceil(filteredPosts.value.length / PAGE_SIZE)))
const currentPosts = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredPosts.value.slice(start, start + PAGE_SIZE)
})

// ─── 액션 ─────────────────────────────────────────────────────
function editPost(id) {
  router.push(`/resident/board/form?id=${id}`)
}

function deletePost(id) {
  deleteTargetId.value = id
  showDeleteConfirm.value = true
}

async function confirmDelete() {
  showDeleteConfirm.value = false
  myPosts.value = myPosts.value.filter(p => p.boardId !== deleteTargetId.value)
  deleteTargetId.value = null
}

// ─── 인기글 (사이드바) ────────────────────────────────────────
const popularPosts = ref([])

async function fetchPopularPosts() {
  const res = await getPopularPosts()
  popularPosts.value = res.data
}
onMounted(fetchPopularPosts)

// ─── 아바타 색상 ──────────────────────────────────────────────
const avatarColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
function getAvatarStyle(name) {
  const idx = (name?.charCodeAt(0) ?? 0) % avatarColors.length
  return { background: avatarColors[idx] }
}

// ─── HTML 태그 제거 ──────────────────────────────────────────────
function stripHtml(html) {
  if (!html) return ''
  
  return html
    .replace(/<[^>]*>/g, '')         // 1. 모든 HTML 태그 제거
    .replace(/&nbsp;/g, ' ')         // 2. 연속 공백 기호 변환
    .replace(/&lt;/g, '<')           // 3. 부등호 변환
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim()                          // 4. 앞뒤 쓸데없는 공백 제거
    .slice(0, 100)                   // 5. 요약
}
</script>

<template>
  <div class="my-posts-view">
    <div class="board-layout">

      <!-- 메인 컨텐츠 -->
      <div class="board-main">

        <!-- 탭바 -->
        <div class="tab-bar">
          <div class="tabs">
            <button class="tab-btn" :class="{ active: activeTab === 'FREE' }" @click="setTab('FREE')">자유게시판</button>
            <button class="tab-btn" :class="{ active: activeTab === 'INQUIRY' }" @click="setTab('INQUIRY')">문의사항</button>
          </div>
        </div>

        <!-- 검색바 -->
        <div class="search-bar">
          <div class="search-wrap">
            <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/>
            </svg>
            <input
              v-model="inputKeyword"
              class="search-input"
              placeholder="제목 또는 내용 검색"
              @keyup.enter="onSearch"
            />
            <button v-if="inputKeyword" class="search-clear" @click="onReset">✕</button>
          </div>
          <button class="btn-search" @click="onSearch">검색</button>
        </div>

        <!-- 검색 결과 표시 -->
        <div v-if="searchKeyword" class="search-result-info">
          <span>
            "<strong>{{ searchKeyword }}</strong>" 검색 결과
            <span class="result-count">{{ filteredPosts.length }}건</span>
          </span>
          <button class="btn-reset-search" @click="onReset">초기화</button>
        </div>

        <!-- 로딩 -->
        <div v-if="loading" class="loading-state">
          <div class="spinner" />
          <span>불러오는 중...</span>
        </div>

        <!-- 빈 상태 -->
        <div v-else-if="currentPosts.length === 0" class="empty-state">
          <div class="empty-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.2" stroke="currentColor" width="52" height="52">
              <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
            </svg>
          </div>
          <p class="empty-title">작성한 글이 없어요</p>
          <p class="empty-sub">자유게시판에 글을 작성하면 여기서 모아볼 수 있어요.</p>
          <button class="btn-write" @click="router.push('/resident/board/form')">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" width="14" height="14">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            글 쓰러 가기
          </button>
        </div>

        <!-- 게시글 목록 -->
        <div v-else class="post-list">
          <div
            class="board-card"
            v-for="post in currentPosts"
            :key="post.boardId"
            @click="router.push(`/resident/board/${post.boardId}`)"
          >
            <div v-if="post.imageUrl" class="card-thumb">
              <img :src="getImageUrl(post.imageUrl)" :alt="post.title" />
            </div>
            <div class="card-body" :class="{ 'no-thumb': !post.imageUrl }">
              <div class="card-meta-top">
                <div class="author-info">
                  <div class="avatar" :style="getAvatarStyle(post.authorName)">
                    <span>{{ post.authorName?.[0] }}</span>
                  </div>
                  <div class="author-detail">
                    <span class="author-name">{{ post.authorName }}</span>
                    <span class="author-unit">{{ post.authorUnit }}</span>
                  </div>
                </div>
                <div class="card-right">
                  <span class="post-date">{{ post.createdAt }}</span>
                  <div class="post-actions" @click.stop>
                    <button class="action-btn edit" @click="editPost(post.boardId)">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" width="12" height="12">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                      </svg>
                      수정
                    </button>
                    <button class="action-btn delete" @click="deletePost(post.boardId)">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" width="12" height="12">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                      삭제
                    </button>
                  </div>
                </div>
              </div>
              <h3 class="card-title">{{ post.title }}</h3>
              <p class="card-preview">{{ stripHtml(post.content) }}</p>
              <div class="card-footer">
                <span class="stat-item">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="15" height="15">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                  </svg>
                  {{ post.commentCount }}
                </span>
                <span class="stat-item heart">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="15" height="15">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                  </svg>
                  {{ post.likeCount }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 페이지네이션 -->
        <div v-if="totalPages > 1" class="pagination">
          <button class="page-btn" :disabled="currentPage === 1" @click="currentPage--">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" width="14" height="14">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button
            v-for="page in totalPages" :key="page"
            class="page-btn" :class="{ active: page === currentPage }"
            @click="currentPage = page"
          >{{ page }}</button>
          <button class="page-btn" :disabled="currentPage === totalPages" @click="currentPage++">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" width="14" height="14">
              <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>

        <p v-if="filteredPosts.length > 0" class="summary">총 {{ filteredPosts.length }}개의 글</p>
      </div>

      <!-- 사이드바 -->
      <div class="board-sidebar">
        <div class="sidebar-card">
          <div class="sidebar-card-header">
            <span class="sidebar-card-title">인기글</span>
            <!-- <button class="more-btn" @click="router.push('/resident/board')">더보기 →</button> -->
          </div>
          <div v-if="popularPosts.length === 0" class="sidebar-empty">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="32" height="32">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" />
            </svg>
            <span>아직 인기글이 없어요</span>
          </div>
          <ul v-else class="popular-list">
            <li class="popular-item" v-for="post in popularPosts" :key="post.boardId" @click="router.push(`/resident/board/${post.boardId}`)">
              <div class="popular-text-wrap">
                <p class="popular-title">{{ post.title }}</p>
                <div class="popular-meta">
                  <span class="stat-item">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="13" height="13">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                    </svg>
                    {{ post.commentCount }}
                  </span>
                  <span class="stat-item heart">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="13" height="13">
                      <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
                    </svg>
                    {{ post.likeCount }}
                  </span>
                </div>
              </div>
              <div v-if="post.imageUrl" class="popular-thumb">
                <img :src="getImageUrl(post.imageUrl)" :alt="post.title" />
              </div>
            </li>
          </ul>
        </div>
      </div>

    </div>
  </div>

  <ConfirmModal
    v-if="showDeleteConfirm"
    title="게시글을 삭제하시겠습니까?"
    subtitle="이 작업은 되돌릴 수 없습니다."
    confirm-text="삭제"
    type="danger"
    @close="showDeleteConfirm = false"
    @confirm="confirmDelete"
  />

</template>

<style scoped>
.my-posts-view {
  max-width: 1200px;
  font-family: 'Noto Sans KR', sans-serif;
}

/* 2컬럼 레이아웃 */
.board-layout { display: grid; grid-template-columns: 1fr 268px; gap: 34px; align-items: start; }
.board-sidebar { margin-top: 60px; position: sticky; top: 20px; }

/* 사이드바 */
.sidebar-card { background: #fff; border-radius: 16px; border: 1px solid #f0f0f0; padding: 20px; margin-bottom: 16px; }
.sidebar-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.sidebar-card-title { font-size: 14px; font-weight: 700; color: #111827; }
.more-btn { font-size: 12px; color: #9ca3af; background: none; border: none; cursor: pointer; transition: color 0.15s; }
.more-btn:hover { color: #3b82f6; }
.sidebar-empty { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 20px 0; color: #d1d5db; font-size: 13px; }

/* 인기글 */
.popular-list { list-style: none; margin: 0; padding: 0; }
.popular-item { display: flex; gap: 12px; align-items: center; padding: 9px 8px; border-radius: 10px; cursor: pointer; transition: background 0.15s; }
.popular-item:hover { background: #f0f7ff; }
.popular-text-wrap { flex: 1; min-width: 0; }
.popular-title { font-size: 13px; font-weight: 500; color: #111827; margin-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.popular-meta { display: flex; gap: 10px; }
.popular-thumb { width: 52px; height: 44px; border-radius: 8px; overflow: hidden; flex-shrink: 0; }
.popular-thumb img { width: 100%; height: 100%; object-fit: cover; }

@media (max-width: 768px) {
  .board-layout { grid-template-columns: 1fr; }
}

/* 탭바 */
.tab-bar { margin-bottom: 16px; }
.tabs { display: inline-flex; gap: 4px; border-radius: 10px; padding: 4px; }
.tab-btn {
  padding: 8px 22px; border: none; background: transparent; border-radius: 8px;
  font-size: 14px; font-weight: 500; color: #6b7280; cursor: pointer; transition: all 0.18s;
}
.tab-btn.active { background: #fff; color: #3b82f6; font-weight: 700; box-shadow: 0 1px 6px rgba(0,0,0,0.08); }

/* 검색바 */
.search-bar { display: flex; gap: 8px; margin-bottom: 12px; }
.search-wrap { position: relative; flex: 1; }
.search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 15px; height: 15px; stroke: #9ca3af; pointer-events: none; }
.search-input { width: 100%; padding: 10px 36px; border: 1px solid #e5e7eb; border-radius: 10px; font-size: 14px; color: #374151; outline: none; transition: border-color 0.15s; box-sizing: border-box; font-family: 'Noto Sans KR', sans-serif; }
.search-input:focus { border-color: #3b82f6; }
.search-input::placeholder { color: #9ca3af; }
.search-clear { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #9ca3af; cursor: pointer; font-size: 13px; }
.search-clear:hover { color: #374151; }
.btn-search { padding: 10px 20px; background: #fff; color: #4973E5; border: 1px solid #e5e7eb; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; white-space: nowrap; font-family: 'Noto Sans KR', sans-serif; }
.btn-search:hover { background: #f3f4f6; }
.search-result-info { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: #eff6ff; border-radius: 8px; font-size: 13px; color: #374151; margin-bottom: 12px; }
.result-count { color: #3b82f6; font-weight: 700; margin-left: 4px; }
.btn-reset-search { background: none; border: none; color: #9ca3af; font-size: 12px; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; }
.btn-reset-search:hover { color: #374151; }

/* 로딩 */
.loading-state {
  display: flex; flex-direction: column; align-items: center;
  gap: 12px; padding: 80px 0; color: #9ca3af; font-size: 13px;
}
.spinner {
  width: 28px; height: 28px; border: 3px solid #e5e7eb;
  border-top-color: #3b82f6; border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* 빈 상태 */
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  padding: 80px 24px; background: #fff; border-radius: 16px;
  border: 1.5px dashed #e5e7eb; text-align: center; color: #d1d5db;
}
.empty-icon { margin-bottom: 14px; color: #d1d5db; }
.empty-title { font-size: 15px; font-weight: 600; color: #374151; margin-bottom: 6px; }
.empty-sub   { font-size: 13px; color: #9ca3af; margin-bottom: 20px; }
.btn-write {
  display: flex; align-items: center; gap: 6px;
  background: #3b82f6; color: #fff; border: none; border-radius: 10px;
  padding: 10px 22px; font-size: 14px; font-weight: 600; cursor: pointer;
  transition: background 0.15s;
}
.btn-write:hover { background: #2563eb; }

/* 카드 */
.board-card {
  display: flex; background: #fff; border-radius: 16px;
  border: 1px solid #f0f0f0; margin-bottom: 10px; overflow: hidden;
  cursor: pointer; transition: box-shadow 0.2s, transform 0.15s, border-color 0.2s;
}
.board-card:hover {
  box-shadow: 0 6px 24px rgba(59,130,246,0.10);
  border-color: #dbeafe;
  transform: scale(1.005);
}

.card-thumb { width: 200px; height: 200px; flex-shrink: 0; overflow: hidden; }
.card-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.3s; }
.board-card:hover .card-thumb img { transform: scale(1.04); }

.card-body { flex: 1; min-width: 0; padding: 16px 20px; display: flex; flex-direction: column; gap: 5px; }
.card-body.no-thumb { padding: 18px 22px; }

.card-meta-top { display: flex; justify-content: space-between; align-items: center; }
.author-info   { display: flex; align-items: center; gap: 8px; }
.avatar { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.avatar span { color: #fff; font-size: 12px; font-weight: 700; }
.author-detail { display: flex; flex-direction: column; line-height: 1.3; }
.author-name { font-size: 12px; font-weight: 600; color: #374151; }
.author-unit { font-size: 11px; color: #9ca3af; }

.card-right { display: flex; align-items: center; gap: 12px; }
.post-date { font-size: 11px; color: #9ca3af; white-space: nowrap; }

/* 수정/삭제 버튼 */
.post-actions { display: flex; gap: 6px; }
.action-btn {
  font-size: 11px; padding: 4px 10px; border-radius: 6px; border: none;
  cursor: pointer; display: flex; align-items: center; gap: 3px;
  font-weight: 600; transition: all 0.15s; white-space: nowrap;
}
.action-btn.edit   { background: #f3f4f6; color: #374151; }
.action-btn.edit:hover   { background: #e5e7eb; }
.action-btn.delete { background: #fee2e2; color: #dc2626; }
.action-btn.delete:hover { background: #fecaca; }

.card-title {
  font-size: 15px; font-weight: 700; color: #111827; margin: 0;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.card-preview {
  font-size: 13px; color: #6b7280; margin: 0; line-height: 1.55;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.card-footer { display: flex; gap: 14px; margin-top: 6px; }
.stat-item      { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #9ca3af; }
.stat-item.heart { color: #f87171; }

/* 페이지네이션 */
.pagination { display: flex; justify-content: center; gap: 6px; margin-top: 24px; }
.page-btn {
  width: 34px; height: 34px; border: 1px solid #e5e7eb; background: #fff;
  border-radius: 8px; font-size: 13px; color: #374151;
  cursor: pointer; transition: all 0.15s;
  display: flex; align-items: center; justify-content: center;
}
.page-btn:hover:not(:disabled) { background: #eff6ff; border-color: #bfdbfe; color: #3b82f6; }
.page-btn.active { background: #3b82f6; color: #fff; border-color: #3b82f6; font-weight: 700; }
.page-btn:disabled { opacity: 0.35; cursor: not-allowed; }

/* 요약 */
.summary { font-size: 12px; color: #9ca3af; text-align: left; margin-top: 12px; }
</style>