<script setup>
/**
 * BoardList.vue
 * 범용 카드 리스트 컴포넌트
 *
 * Props:
 *   posts        {Array}   - 게시글/아이템 배열
 *   cardHeight   {String}  - 카드 높이 (기본값: 'auto') ex) '140px', '200px'
 *   thumbWidth   {String}  - 썸네일 너비 (기본값: '180px')
 *   thumbHeight  {String}  - 썸네일 높이 (기본값: '100%')
 *   noThumbMode  {Boolean} - true면 썸네일 영역 자체를 렌더하지 않음
 *                            false(기본값): 이미지 있으면 썸네일 표시, 없으면 썸네일 영역 자체 숨김 → 카드 높이 자동 축소
 *                            시설예약처럼 항상 이미지가 있는 경우 false로 두고 thumbnail을 반드시 넘겨줄 것
 *
 * Slots:
 *   meta         - 카드 상단 좌측 (작성자 정보, 시설명 등)
 *   title        - 제목 영역
 *   preview      - 본문 미리보기
 *   footer       - 카드 하단 (댓글/좋아요, 운영시간, 태그 등)
 *   badge        - 썸네일 위에 뜨는 뱃지 (예약 가능 / 잔여석 등)
 *
 * Emit:
 *   card-click(post) - 카드 클릭 시
 */
import { getImageUrl } from '@/utils/image.js'

const props = defineProps({
  posts:       { type: Array,   default: () => [] },
  cardHeight:  { type: String,  default: 'auto'   },
  thumbWidth:  { type: String,  default: '180px'  },
  thumbHeight: { type: String,  default: '100%'   },
  noThumbMode: { type: Boolean, default: false    },
})

const emit = defineEmits(['card-click'])
</script>

<template>
  <div class="board-list">
    <div
      v-for="post in posts"
      :key="post.boardId ?? post.id"
      class="board-card"
      :style="{ height: cardHeight }"
      @click="emit('card-click', post)"
    >
      <!-- 썸네일 영역: 이미지가 있을 때만 렌더 (없으면 영역 자체 사라짐) -->
      <div
        v-if="!noThumbMode && post.imageUrl"
        class="card-thumb"
        :style="{ width: thumbWidth, height: thumbHeight, minWidth: thumbWidth }"
      >
        <img :src="getImageUrl(post.imageUrl)" :alt="post.title" />
        <!-- 뱃지 슬롯 (예약 가능 / 잔여석 등) -->
        <div v-if="$slots.badge" class="thumb-badge">
          <slot name="badge" :post="post" />
        </div>
      </div>

      <!-- 카드 본문 -->
      <div class="card-body" :class="{ 'no-thumb': noThumbMode || !post.imageUrl }">
        <!-- 상단 메타 -->
        <div class="card-meta-top">
          <slot name="meta" :post="post" />
        </div>

        <!-- 제목 -->
        <div class="card-title-wrap">
          <slot name="title" :post="post">
            <h3 class="card-title">{{ post.title }}</h3>
          </slot>
        </div>

        <!-- 미리보기 -->
        <div class="card-preview-wrap">
          <slot name="preview" :post="post" />
        </div>

        <!-- 푸터 -->
        <div class="card-footer">
          <slot name="footer" :post="post" />
        </div>
      </div>
    </div>

    <!-- 빈 상태 슬롯 -->
    <slot v-if="posts.length === 0" name="empty">
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" width="44" height="44">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
        </svg>
        <p class="empty-title">아직 게시글이 없어요</p>
      </div>
    </slot>
  </div>
</template>

<style scoped>
.board-list { display: flex; flex-direction: column; gap: 10px; }

/* ── 카드  */
.board-card {
  display: flex;
  background: #fff;
  border-radius: 16px;
  border: 1px solid #f0f0f0;
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow 0.2s, border-color 0.2s, transform 0.15s;
}
.board-card:hover {
  box-shadow: 0 6px 24px rgba(59, 130, 246, 0.10);
  border-color: #dbeafe;
  transform: scale(1.005);
}

/* ── 썸네일 ─────────── */
.card-thumb {
  position: relative;
  flex-shrink: 0;
  overflow: hidden;
  background: #f3f4f6;
}
.card-thumb img {
  width: 100%; height: 100%;
  object-fit: cover; display: block;
  transition: transform 0.3s;
}
.board-card:hover .card-thumb img { transform: scale(1.04); }

.thumb-placeholder {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  color: #d1d5db;
}

/* 뱃지 */
.thumb-badge {
  position: absolute;
  top: 10px; right: 10px;
}

/* ── 본문  */
.card-body {
  flex: 1;
  min-width: 0;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.card-body.no-thumb { padding: 18px 22px; }

.card-meta-top { display: flex; justify-content: space-between; align-items: center; }

.card-title-wrap { min-width: 0; }
.card-title {
  font-size: 15px; font-weight: 700; color: #111827; margin: 0;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.card-preview-wrap { flex: 1; min-width: 0; }

.card-footer { margin-top: auto; }

/* ── 빈 상태 ────────── */
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  gap: 10px; padding: 64px 24px;
  background: #fff; border-radius: 16px;
  border: 1.5px dashed #e5e7eb;
  color: #d1d5db; text-align: center;
}
.empty-title { font-size: 14px; font-weight: 600; color: #9ca3af; margin: 0; }
</style>