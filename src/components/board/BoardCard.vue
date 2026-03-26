<script setup>
/**
 * BoardCard.vue
 * 게시글/공지사항 상세보기 공통 카드 컴포넌트
 *
 * Props:
 *   title       {String} - 제목
 *   content     {String} - 본문 HTML (v-html로 렌더)
 *   authorName  {String} - 작성자 이름
 *   authorUnit  {String} - 세대 정보
 *   createdAt   {String} - 작성일
 *   viewCount   {Number} - 조회수
 *   imageUrl    {String} - 대표 이미지 URL (없으면 null) ← Swiper로 대체되어 사용 안 함
 *
 * Slots:
 *   #badge        - 카테고리 배지 (공지 / 자유 / 문의 등)
 *   #author-extra - 작성자 이름 옆 추가 뱃지 (관리자 등)
 */

import { computed } from 'vue'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Navigation, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'quill/dist/quill.snow.css'

const modules = [Navigation, Pagination]

const props = defineProps({
  title:      { type: String, default: '' },
  content:    { type: String, default: '' },
  authorName: { type: String, default: '' },
  authorUnit: { type: String, default: '' },
  createdAt:  { type: String, default: '' },
  viewCount:  { type: Number, default: 0  },
  imageUrl:   { type: String, default: null },
})

// content에서 모든 이미지 URL 추출 (Swiper용)
const imageUrls = computed(() => {
  if (!props.content) return []
  const matches = [...props.content.matchAll(/<img[^>]+src="([^"]+)"/g)]
  return matches.map(m => {
    const url = m[1]
    // 상대경로면 http://localhost:8080 붙임
    return url.startsWith('http') ? url : `http://localhost:8080${url}`
  })
})

// content에서 img 태그 제거한 텍스트 본문
const textContent = computed(() => {
  if (!props.content) return ''
  return props.content.replace(/<img[^>]*>/g, '')
})

const avatarColors = ['#4973E5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
function getAvatarColor(name) {
  const idx = (name?.charCodeAt(0) ?? 0) % avatarColors.length
  return avatarColors[idx]
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return dateStr.replace('T', ' ').slice(0, 16)
}
</script>

<template>
  <div class="detail-card">

    <!-- 카테고리 배지 슬롯 -->
    <slot name="badge" />

    <!-- 제목 -->
    <h1 class="detail-title">{{ title }}</h1>

    <!-- 작성자 정보 -->
    <div class="detail-meta">
      <div class="author-info">
        <div class="avatar" :style="{ background: getAvatarColor(authorName) }">
          {{ authorName?.[0] }}
        </div>
        <div class="author-detail">
          <div class="author-name-wrap">
            <span class="author-name">{{ authorName }}</span>
            <slot name="author-extra" />
          </div>
          <div class="author-sub">
            <span class="author-unit">{{ authorUnit }}</span>
            <span class="author-date">{{ formatDate(createdAt) }}</span>
          </div>
        </div>
      </div>
      <span class="view-count">조회 {{ viewCount }}</span>
    </div>

    <div class="divider" />

    <!-- 이미지 Swiper (이미지 있을 때만) -->
    <div v-if="imageUrls.length > 0" class="swiper-wrap">
      <Swiper
        :modules="modules"
        :slides-per-view="1"
        :space-between="0"
        navigation
        :pagination="{ clickable: true }"
        class="board-swiper"
      >
        <SwiperSlide v-for="(url, idx) in imageUrls" :key="idx">
          <div class="slide-img-wrap">
            <img :src="url" :alt="`이미지 ${idx + 1}`" class="slide-img" />
          </div>
        </SwiperSlide>
      </Swiper>

      <!-- 이미지 카운터 -->
      <div class="img-counter">{{ imageUrls.length }}장의 사진</div>
    </div>

    <!-- 본문 (이미지 태그 제거된 텍스트만) -->
    <div class="detail-body ql-editor" v-html="textContent" />

  </div>
</template>

<style scoped>
.detail-card {
  background: #fff;
  border-radius: 16px;
  border: 1px solid #E8EBF0;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 제목 */
.detail-title {
  font-size: 22px; font-weight: 700;
  color: #1A1A2E; line-height: 1.4; margin: 6px 0;
}

/* 작성자 */
.detail-meta { display: flex; justify-content: space-between; align-items: center; }
.author-info { display: flex; align-items: center; gap: 10px; }
.avatar {
  width: 38px; height: 38px; border-radius: 50%;
  color: #fff; display: flex; align-items: center;
  justify-content: center; font-size: 15px;
  font-weight: 700; flex-shrink: 0;
}
.author-detail { display: flex; flex-direction: column; }
.author-name-wrap { display: flex; align-items: center; gap: 6px; }
.author-name { font-size: 14px; font-weight: 600; color: #333; }
.author-sub {
  display: flex; align-items: center;
  color: #999; font-size: 12px; white-space: nowrap; gap: 6px;
}
.author-unit { font-size: 12px; color: #999; }
.author-date { font-size: 12px; color: #999; }
.view-count { font-size: 12px; color: #999; }

/* 구분선 */
.divider { height: 1px; background: #E8EBF0; }

/* Swiper 래퍼 */
.swiper-wrap {
  width: 720px;
  border-radius: 12px;
  overflow: hidden;
  background: #f3f4f6;
  position: relative;
  max-width: 720px;
  margin: 0 auto;
}

.board-swiper {
  width: 720px;
  height: 420px;
  max-width: 720px;
}

.swiper-wrapper {
  height: 420px;
}

.swiper-slide {
  height: 420px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
}

.slide-img-wrap {
  width: 720px;
  height: 420px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.slide-img {
  max-width: 720px;
  max-height: 420px;
  object-fit: contain;
  display: block;
}

/* 이미지 카운터 */
.img-counter {
  position: absolute;
  bottom: 40px;
  right: 16px;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 99px;
  z-index: 10;
  pointer-events: none;
}

/* Swiper 네비게이션 색상 override */
.swiper-button-next,
.swiper-button-prev {
  color: #fff;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 50%;
  width: 36px;
  height: 36px;
}
.swiper-button-next::after,
.swiper-button-prev::after {
  font-size: 14px;
  font-weight: 700;
}
.swiper-pagination-bullet-active {
  background: #4973E5;
}

/* 본문 */
.detail-body {
  font-size: 15px; line-height: 1.9;
  color: #444; min-height: 100px;
}
</style>