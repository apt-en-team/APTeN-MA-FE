<script setup>
import { ref, computed } from 'vue'

// ─── 더미 데이터 (백엔드 연결 전 테스트용) ──────────────────────────
// TODO: 백엔드 연결 시 DUMMY_* 삭제 후 store/modules/board.js + api/board.js 로 교체
const DUMMY_FREE = [
  {
    id: 1,
    title: '분실물 가져가세요',
    content: '헬스장에서 찾아서 관리사무실에 맡겼습니다!!',
    thumbnail: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=300&q=80',
    authorName: '김다빈', authorUnit: '101동 1001호',
    commentCount: 12, likeCount: 25, createdAt: '2026.06.24', type: 'free',
  },
  {
    id: 2,
    title: '혹시 1층 로비 택배 본 적 있으신 분 있나요?ㅠㅠ',
    content: '오후 8시까지 없으면 문의 접수하려고요..',
    thumbnail: null,
    authorName: '김가은', authorUnit: '102동 1201호',
    commentCount: 12, likeCount: 25, createdAt: '2026.06.24', type: 'free',
  },
  {
    id: 3,
    title: '주차장 CCTV 화질 개선 요청 문의 남겼습니다.',
    content: '추가로 다른 문의할 점 있으시면 댓글 달아주세요.\n+ 헬스장 운동기구 추가 요청 확인했습니다.',
    thumbnail: null,
    authorName: '김철수', authorUnit: '102동 1202호',
    commentCount: 12, likeCount: 25, createdAt: '2026.06.24', type: 'free',
  },
  {
    id: 4,
    title: '산책하다가 만나면 인사해주세요',
    content: '애가 수줍음이 많아도 사람을 너무 좋아해요ㅎㅎ',
    thumbnail: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=300&q=80',
    authorName: '김다빈', authorUnit: '101동 1001호',
    commentCount: 12, likeCount: 25, createdAt: '2026.06.24', type: 'free',
  },
  {
    id: 5,
    title: '아파트 근처 카페 추천 리스트',
    content: '자주 가는 카페들 공유해요~ 분위기 좋은 곳 위주로 골라봤어요.',
    thumbnail: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=300&q=80',
    authorName: '박지현', authorUnit: '103동 302호',
    commentCount: 8, likeCount: 41, createdAt: '2026.06.23', type: 'free',
  },
  {
    id: 6,
    title: '엘리베이터 보수공사 일정 공유',
    content: '관리실에서 안내받은 내용인데요, 6/27~6/28 양일간 1호기 점검 예정이래요.',
    thumbnail: null,
    authorName: '이준호', authorUnit: '101동 805호',
    commentCount: 5, likeCount: 18, createdAt: '2026.06.23', type: 'free',
  },
  {
    id: 7,
    title: '단지 내 텃밭 참여하실 분?',
    content: '올해도 작은 텃밭 가꿀 예정인데 같이 하실 분 구해요. 씨앗은 제가 준비할게요!',
    thumbnail: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=300&q=80',
    authorName: '오서연', authorUnit: '104동 201호',
    commentCount: 22, likeCount: 67, createdAt: '2026.06.23', type: 'free',
  },
  {
    id: 8,
    title: '헬스장 러닝머신 2번 고장났어요',
    content: '오늘 아침에 사용하려는데 작동이 안 되더라고요. 빠른 수리 부탁드려요.',
    thumbnail: null,
    authorName: '최민재', authorUnit: '103동 1102호',
    commentCount: 3, likeCount: 9, createdAt: '2026.06.22', type: 'free',
  },
  {
    id: 9,
    title: '오늘 저녁 노을 너무 예쁘지 않았나요?',
    content: '발코니에서 찍었는데 진짜 힐링됐어요ㅠㅠ 사진 올려봅니다.',
    thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&q=80',
    authorName: '정유진', authorUnit: '105동 703호',
    commentCount: 17, likeCount: 88, createdAt: '2026.06.22', type: 'free',
  },
  {
    id: 10,
    title: '분리수거 제대로 해주세요 제발요...',
    content: '플라스틱에 음식물 그대로 버리시는 분 계신데, 씻어서 버려주셔야 해요.',
    thumbnail: null,
    authorName: '한수빈', authorUnit: '102동 401호',
    commentCount: 31, likeCount: 72, createdAt: '2026.06.22', type: 'free',
  },
  {
    id: 11,
    title: '아이들 자전거 보관 장소 건의',
    content: '지하주차장 한쪽에 자전거 거치대 몇 개 더 설치해주시면 좋겠어요.',
    thumbnail: null,
    authorName: '윤재원', authorUnit: '101동 302호',
    commentCount: 7, likeCount: 23, createdAt: '2026.06.21', type: 'free',
  },
  {
    id: 12,
    title: '주말 배드민턴 같이 치실 분!',
    content: '토요일 오전 7시~9시 사이에 단지 내 체육시설에서 같이 하실 분 연락주세요~',
    thumbnail: null,
    authorName: '장민서', authorUnit: '103동 501호',
    commentCount: 14, likeCount: 29, createdAt: '2026.06.21', type: 'free',
  },
  {
    id: 13,
    title: '고양이 밥 챙겨주시는 분 계신가요?',
    content: '단지 뒤편에 길고양이들 자주 보이는데 같이 돌봐주실 분 찾아요.',
    thumbnail: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=300&q=80',
    authorName: '임소희', authorUnit: '104동 902호',
    commentCount: 19, likeCount: 55, createdAt: '2026.06.21', type: 'free',
  },
  {
    id: 14,
    title: '택배 보관함 비밀번호 변경 안내',
    content: '관리실에서 이번 달 말 보관함 비번 일괄 변경 예정이라고 합니다. 참고하세요!',
    thumbnail: null,
    authorName: '강태양', authorUnit: '105동 104호',
    commentCount: 6, likeCount: 15, createdAt: '2026.06.20', type: 'free',
  },
  {
    id: 15,
    title: '샐러드 맛집 발견했어요',
    content: '아파트 정문에서 5분 거리인데 진짜 맛있어요. 가격도 착하고 양도 많아요!',
    thumbnail: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&q=80',
    authorName: '박지현', authorUnit: '102동 703호',
    commentCount: 26, likeCount: 94, createdAt: '2026.06.20', type: 'free',
  },
  {
    id: 16,
    title: '어린이날 행사 사진 공유해요',
    content: '지난 어린이날 단지 행사 때 찍은 사진들이에요. 아이들 표정이 너무 귀엽죠?',
    thumbnail: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=300&q=80',
    authorName: '신예은', authorUnit: '101동 603호',
    commentCount: 33, likeCount: 101, createdAt: '2026.06.20', type: 'free',
  },
  {
    id: 17,
    title: '입주민 할인 헬스장 정보 공유',
    content: '아파트 주민 신분증 지참하면 인근 헬스장 30% 할인된다고 하니 참고하세요.',
    thumbnail: null,
    authorName: '조현우', authorUnit: '103동 802호',
    commentCount: 9, likeCount: 37, createdAt: '2026.06.19', type: 'free',
  },
  {
    id: 18,
    title: '우리 단지 조경 진짜 예쁘지 않나요?',
    content: '봄마다 벚꽃 필 때 정말 장관이에요. 올해도 너무 좋았고 가을 단풍도 기대됩니다.',
    thumbnail: 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=300&q=80',
    authorName: '류하은', authorUnit: '104동 505호',
    commentCount: 15, likeCount: 62, createdAt: '2026.06.19', type: 'free',
  },
  {
    id: 19,
    title: '야식 먹고 싶은데 같이 시키실 분',
    content: '혼자 시키면 최소주문금액 안 돼서요ㅠ 치킨이나 피자 어떠세요?',
    thumbnail: null,
    authorName: '문지우', authorUnit: '105동 301호',
    commentCount: 42, likeCount: 78, createdAt: '2026.06.18', type: 'free',
  },
  {
    id: 20,
    title: '관리비 명세서 보는 법 아시는 분?',
    content: '처음 입주해서 항목들이 너무 낯선데 설명해주실 분 계신가요?',
    thumbnail: null,
    authorName: '배도윤', authorUnit: '102동 1001호',
    commentCount: 11, likeCount: 20, createdAt: '2026.06.18', type: 'free',
  },
]

const DUMMY_INQUIRY = [
  {
    id: 10,
    title: '주차장 야간 조명 너무 어두워요',
    content: '지하 2층 구석 쪽이 특히 어둡습니다. 개선 요청드립니다.',
    thumbnail: null,
    authorName: '이민준', authorUnit: '104동 501호',
    commentCount: 3, likeCount: 7, createdAt: '2026.06.22', type: 'inquiry',
  },
]

const DUMMY_POPULAR = [
  { id: 5, title: '샐러드 맛집 발견했당', commentCount: 12, likeCount: 25,
    thumbnail: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=120&q=80' },
  { id: 6, title: '문의는 문의사항 게시판에서 해주세요', commentCount: 120, likeCount: 32, thumbnail: null },
  { id: 7, title: '여름이 점점 길어지네요ㅠㅠ...', commentCount: 30, likeCount: 21, thumbnail: null },
  { id: 8, title: '아파트 조경이 넘 예쁘네요^^', commentCount: 21, likeCount: 48,
    thumbnail: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=120&q=80' },
]

const DUMMY_MY_POSTS = [
  { id: 11, title: '분리수거 어떻게 하면 좋을까요?', thumbnail: null },
  { id: 12, title: '분실물 찾았어요!!', thumbnail: null },
  { id: 5,  title: '아파트 근처 카페 추천 리스트',
    thumbnail: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=120&q=80' },
]
// ──────────────────────────────────────────────────────────────────────

const activeTab = ref('free')
const currentPage = ref(1)
const PAGE_SIZE = 10

const allPosts = computed(() => activeTab.value === 'free' ? DUMMY_FREE : DUMMY_INQUIRY)
const totalPages = computed(() => Math.ceil(allPosts.value.length / PAGE_SIZE))
const currentPosts = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return allPosts.value.slice(start, start + PAGE_SIZE)
})

const popularPosts = ref(DUMMY_POPULAR)
const myPosts = ref(DUMMY_MY_POSTS)

function setTab(tab) {
  activeTab.value = tab
  currentPage.value = 1
}

function deleteMyPost(id) {
  if (!confirm('삭제하시겠습니까?')) return
  myPosts.value = myPosts.value.filter(p => p.id !== id)
}

const avatarColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
function getAvatarStyle(name) {
  const idx = (name?.charCodeAt(0) ?? 0) % avatarColors.length
  return { background: avatarColors[idx] }
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
            <button class="tab-btn" :class="{ active: activeTab === 'free' }" @click="setTab('free')">자유게시판</button>
            <button class="tab-btn" :class="{ active: activeTab === 'inquiry' }" @click="setTab('inquiry')">문의사항</button>
          </div>
          <button class="write-btn">
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
          <div class="board-card" v-for="post in currentPosts" :key="post.id">
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
                <span class="post-date">{{ post.createdAt }}</span>
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
          <button class="page-btn arrow" :disabled="currentPage === 1" @click="currentPage--">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" width="14" height="14">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button
            v-for="page in totalPages" :key="page"
            class="page-btn" :class="{ active: page === currentPage }"
            @click="currentPage = page"
          >{{ page }}</button>
          <button class="page-btn arrow" :disabled="currentPage === totalPages" @click="currentPage++">
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
            <li class="popular-item" v-for="post in popularPosts" :key="post.id">
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
            <li class="my-post-item" v-for="post in myPosts" :key="post.id">
              <div v-if="post.thumbnail" class="my-post-thumb">
                <img :src="post.thumbnail" :alt="post.title" />
              </div>
              <div class="my-post-info">
                <p class="my-post-title">{{ post.title }}</p>
                <div class="my-post-actions">
                  <button class="action-btn edit">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" width="12" height="12">
                      <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                    </svg>
                    수정
                  </button>
                  <button class="action-btn delete" @click="deleteMyPost(post.id)">
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
  padding: 24px 0px 16px 0px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: 'Noto Sans KR';
}

/* 레이아웃 */
.board-layout { display: grid; grid-template-columns: 1fr 268px; gap: 34px; align-items: start; }

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
.empty-icon { margin-bottom: 14px; }
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

@media (max-width: 900px) {
  .board-layout { grid-template-columns: 1fr; }
  .board-list-view { padding: 20px 16px; }
}
</style>