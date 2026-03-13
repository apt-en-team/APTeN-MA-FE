<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBoardStore } from '@/stores/modules/board'

const router = useRouter()
const boardStore = useBoardStore()

// ─── 탭 & 페이지 ──────────────────────────────────────────────
const activeTab = ref('FREE')
const currentPage = ref(1)
const PAGE_SIZE = 10

// ─── 게시글 목록 ──────────────────────────────────────────────
const currentPosts = computed(() => boardStore.posts || [])
const totalPages = computed(() => boardStore.maxPage || 0)

// ─── 인기글 & 내가 쓴 글 ──────────────────────────────────────
const popularPosts = computed(() => boardStore.popularPosts || [])
const myPosts = computed(() => boardStore.myPosts || [])

// ─── 데이터 불러오기 ──────────────────────────────────────────
async function fetchData() {
  await boardStore.fetchPosts({ type: activeTab.value, page: currentPage.value, size: PAGE_SIZE })
  
  // 500 에러가 나도 메인 목록에 영향 없게 분리
  boardStore.fetchPopularPosts().catch(() => {})
  boardStore.fetchMyPosts({ size: 3 }).catch(() => {})
}

onMounted(() => fetchData())

// ─── 탭 변경 ──────────────────────────────────────────────────
function setTab(tab) {
  activeTab.value = tab
  currentPage.value = 1
  boardStore.fetchPosts({ type: activeTab.value, page: 1, size: PAGE_SIZE })
}

// ─── 페이지 변경 ──────────────────────────────────────────────
function changePage(page) {
  currentPage.value = page
  boardStore.fetchPosts({ type: activeTab.value, page, size: PAGE_SIZE })
}

// ─── 내가 쓴 글 삭제 ──────────────────────────────────────────
function deleteMyPost(id) {
  if (!confirm('삭제하시겠습니까?')) return
  boardStore.deletePost(id)
}

const avatarColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
function getAvatarStyle(name) {
  const idx = (name?.charCodeAt(0) ?? 0) % avatarColors.length
  return { background: avatarColors[idx] }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return dateStr.replace('T', ' ').slice(0, 16)
}
</script>

<template>
  <div class="board-list-view">

    <div class="board-layout">
      <!-- 메인 컨텐츠 -->
      <div class="board-main">

        <!-- 탭 + 글쓰기 버튼 -->
        <div class="tab-bar">
          <div class="tabs">
            <button class="tab-btn" :class="{ active: activeTab === 'FREE' }" @click="setTab('FREE')">자유게시판</button>
            <button class="tab-btn" :class="{ active: activeTab === 'INQUIRY' }" @click="setTab('INQUIRY')">문의사항</button>
          </div>
          <button class="write-btn" @click="router.push(`/resident/board/form?category=${activeTab}`)">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" width="15" height="15">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            글 등록
          </button>
        </div>

        <!-- 빈 상태 -->
        <div v-if="currentPosts.length === 0" class="empty-state">
          <div class="empty-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.2" stroke="currentColor" width="52" height="52">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
            </svg>
          </div>
          <p class="empty-title">아직 게시글이 없어요</p>
          <p class="empty-sub">첫 번째 글을 작성해 이웃들과 소통해보세요!</p>
          <button class="write-btn-lg">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" width="16" height="16">
              <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
            </svg>
            첫 글 쓰기
          </button>
        </div>

        <!-- 게시글 목록 -->
        <div v-else class="post-list">
          <div class="board-card" v-for="post in currentPosts" :key="post.boardId" @click="router.push(`/resident/board/${post.boardId}`)">
            <div v-if="post.thumbnail" class="card-thumb">
              <img :src="post.thumbnail" :alt="post.title" />
            </div>
            <div class="card-body" :class="{ 'no-thumb': !post.thumbnail }">
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
                <span class="post-date">{{ formatDate(post.createdAt) }}</span>
              </div>
              <h3 class="card-title">{{ post.title }}</h3>
              <p class="card-preview">{{ post.content }}</p>
              <div class="card-footer">
                <span class="stat-item">
                  <!-- heroicons: chat-bubble-left (outline) -->
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="15" height="15">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                  </svg>
                  {{ post.commentCount }}
                </span>
                <span class="stat-item heart">
                  <!-- heroicons: heart (outline) -->
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
          <button class="page-btn arrow" :disabled="currentPage === 1" @click="changePage(currentPage - 1)">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" width="14" height="14">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button
            v-for="page in totalPages" :key="page"
            class="page-btn" :class="{ active: page === currentPage }"
            @click="changePage(page)"
          >{{ page }}</button>
          <button class="page-btn arrow" :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" width="14" height="14">
              <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>

      <!-- 사이드바 -->
      <div class="board-sidebar">

        <!-- 인기글 -->
        <div class="sidebar-card">
          <div class="sidebar-card-header">
            <span class="sidebar-card-title">인기글</span>
            <button class="more-btn">더보기 →</button>
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
                    <!-- heroicons: heart (solid) -->
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="13" height="13">
                      <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
                    </svg>
                    {{ post.likeCount }}
                  </span>
                </div>
              </div>
              <div v-if="post.thumbnail" class="popular-thumb">
                <img :src="post.thumbnail" :alt="post.title" />
              </div>
            </li>
          </ul>
        </div>

        <!-- 내가 쓴 글 -->
        <div class="sidebar-card">
          <div class="sidebar-card-header">
            <span class="sidebar-card-title">내가 쓴 글</span>
            <button class="more-btn">더보기 →</button>
          </div>
          <div v-if="myPosts.length === 0" class="sidebar-empty">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="32" height="32">
              <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
            </svg>
            <span>작성한 글이 없어요</span>
          </div>
          <ul v-else class="my-post-list">
            <li class="my-post-item" v-for="post in myPosts" :key="post.boardId" @click="router.push(`/resident/board/${post.boardId}`)">
              <div v-if="post.thumbnail" class="my-post-thumb">
                <img :src="post.thumbnail" :alt="post.title" />
              </div>
              <div class="my-post-info">
                <p class="my-post-title">{{ post.title }}</p>
                <div class="my-post-actions">
                  <button class="action-btn edit" @click.stop="router.push(`/resident/board/form?id=${post.boardId}`)">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" width="12" height="12">
                      <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                    </svg>
                    수정
                  </button>
                  <button class="action-btn delete" @click.stop="deleteMyPost(post.boardId)">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" width="12" height="12">
                      <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                    삭제
                  </button>
                </div>
              </div>
            </li>
          </ul>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.board-list-view {
  padding: 0px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: 'Noto Sans KR';
}

/* 레이아웃 */
.board-layout { display: grid; grid-template-columns: 1fr 268px; gap: 34px; align-items: start; }
/* 사이드바 */
.board-sidebar { margin-top: 60px; }

/* 탭바 */
.tab-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.tabs { display: flex; gap: 4px; background: #f3f4f6; border-radius: 10px; padding: 4px; }
.tab-btn {
  padding: 8px 22px; border: none; background: transparent; border-radius: 8px;
  font-size: 14px; font-weight: 500; color: #6b7280; cursor: pointer; transition: all 0.18s;
}
.tab-btn.active { background: #fff; color: #3b82f6; font-weight: 700; box-shadow: 0 1px 6px rgba(0,0,0,0.08); }
.write-btn {
  display: flex; align-items: center; gap: 6px;
  background: #3b82f6; color: #fff; border: none; border-radius: 10px;
  padding: 9px 18px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.15s;
}
.write-btn:hover { background: #2563eb; }

/* 빈 상태 */
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  padding: 72px 24px; background: #fff; border-radius: 16px;
  border: 1.5px dashed #e5e7eb; text-align: center; color: #d1d5db;
}
.empty-icon { margin-bottom: 14px; color: #d1d5db; }
.empty-title { font-size: 15px; font-weight: 600; color: #374151; margin-bottom: 6px; }
.empty-sub { font-size: 13px; color: #9ca3af; margin-bottom: 20px; }
.write-btn-lg {
  display: flex; align-items: center; gap: 7px;
  background: #3b82f6; color: #fff; border: none; border-radius: 10px;
  padding: 10px 22px; font-size: 14px; font-weight: 600; cursor: pointer;
}

/* 게시글 카드 */
.board-card {
  display: flex; background: #fff; border-radius: 16px;
  border: 1px solid #f0f0f0; margin-bottom: 10px; overflow: hidden;
  cursor: pointer; transition: box-shadow 0.2s, transform 0.15s, border-color 0.2s;
}
.board-card:hover {
  box-shadow: 0 6px 24px rgba(59,130,246,0.10);
  border-color: #dbeafe;
}
.card-thumb { width: 200px; height: 200px; flex-shrink: 0; overflow: hidden; }
.card-thumb img {
  width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.3s;
}
.board-card:hover { transform: scale(1.01); }

.card-body { flex: 1; min-width: 0; padding: 16px 20px; display: flex; flex-direction: column; gap: 5px; }
.card-body.no-thumb { padding: 18px 22px; }

.card-meta-top { display: flex; justify-content: space-between; align-items: center; }
.author-info { display: flex; align-items: center; gap: 8px; }
.avatar { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.avatar span { color: #fff; font-size: 12px; font-weight: 700; }
.author-detail { display: flex; flex-direction: column; line-height: 1.3; }
.author-name { font-size: 12px; font-weight: 600; color: #374151; }
.author-unit { font-size: 11px; color: #9ca3af; }
.post-date { font-size: 11px; color: #9ca3af; }

.card-title {
  font-size: 15px; font-weight: 700; color: #111827; margin: 0;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.card-preview {
  font-size: 13px; color: #6b7280; margin: 0; line-height: 1.55;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.card-footer { display: flex; gap: 14px; margin-top: 6px; }
.stat-item { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #9ca3af; }
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

/* 사이드바 공통 */
.sidebar-card { background: #fff; border-radius: 16px; border: 1px solid #f0f0f0; padding: 20px; margin-bottom: 16px; }
.sidebar-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.sidebar-card-title { font-size: 14px; font-weight: 700; color: #111827; }
.more-btn { font-size: 12px; color: #9ca3af; background: none; border: none; cursor: pointer; transition: color 0.15s; }
.more-btn:hover { color: #3b82f6; }
.sidebar-empty { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 20px 0; color: #d1d5db; font-size: 13px; }

/* 인기글 */
.popular-list { list-style: none; margin: 0; padding: 0; }
.popular-item {
  display: flex; gap: 12px; align-items: center;
  padding: 9px 8px; border-radius: 10px; cursor: pointer; transition: background 0.15s;
}
.popular-item:hover { background: #f0f7ff; }
.popular-text-wrap { flex: 1; min-width: 0; }
.popular-title { font-size: 13px; font-weight: 500; color: #111827; margin-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.popular-meta { display: flex; gap: 10px; }
.popular-thumb { width: 52px; height: 44px; border-radius: 8px; overflow: hidden; flex-shrink: 0; }
.popular-thumb img { width: 100%; height: 100%; object-fit: cover; }

/* 내가 쓴 글 */
.my-post-list { list-style: none; margin: 0; padding: 0; }
.my-post-item {
  display: flex; gap: 12px; align-items: center;
  padding: 9px 8px; border-radius: 10px; transition: background 0.15s;
}
.my-post-item:hover { background: #f0f7ff; }
.my-post-thumb { width: 52px; height: 44px; border-radius: 8px; overflow: hidden; flex-shrink: 0; }
.my-post-thumb img { width: 100%; height: 100%; object-fit: cover; }
.my-post-info { flex: 1; min-width: 0; }
.my-post-title { font-size: 13px; font-weight: 500; color: #111827; margin-bottom: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.my-post-actions { display: flex; gap: 6px; }
.action-btn {
  font-size: 11px; padding: 3px 9px; border-radius: 6px; border: none;
  cursor: pointer; display: flex; align-items: center; gap: 3px; font-weight: 600; transition: all 0.15s;
}
.action-btn.edit { background: #f3f4f6; color: #374151; }
.action-btn.edit:hover { background: #e5e7eb; }
.action-btn.delete { background: #fee2e2; color: #dc2626; }
.action-btn.delete:hover { background: #fecaca; }

@media (max-width: 768px) {
  .board-layout { grid-template-columns: 1fr; }
  .board-list-view { padding: 0px; }
}
</style>