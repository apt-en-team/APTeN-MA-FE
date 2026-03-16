import { defineStore } from 'pinia'
import {
  getPostList,
  getPopularPosts,
  getMyPosts,
  createPost,
  updatePost,
  removePost,
} from '@/api/board'

export const useBoardStore = defineStore('boards', {
  state: () => ({
    posts:        [],
    notices:      [],
    totalCount:   0,
    maxPage:      0,
    currentPost:  null,
    popularPosts: [],
    myPosts:      [],
    // 아래는 관리자용
    adminPosts: [],
    adminTotalCount: 0,
    adminMaxPage: 0,
    adminNoticeTotalCount: 0,
    adminFreeTotalCount: 0,
  }),

  actions: {
    // ── 게시글 목록 ──────────────────────────────────────────
    async fetchPosts({ category = 'FREE', page = 1, size = 10 } = {}) {
      const res = await getPostList({ category, page, size })
      this.posts      = res.data.content
      this.totalCount = res.data.totalCount
      this.maxPage    = res.data.maxPage
      return res.data
    },

    // ── 공지사항 ──────────────────────────────────────────
    async fetchNotices({ size = 100 } = {}) {
      const res = await getPostList({ category: 'NOTICE', page: 1, size })
      this.notices = res.data.content
      return res.data
    },

    // ── 인기글 ───────────────────────────────────────────────
    async fetchPopularPosts() {
      const res = await getPopularPosts()
      this.popularPosts = res.data
      return res.data
    },

    // ── 내가 쓴 글 ──────────────────────────────────────────
    async fetchMyPosts({ size = 3 } = {}) {
      const res = await getMyPosts({ size })
      this.myPosts = res.data.content
      return res.data
    },

    // ── 게시글 등록 ──────────────────────────────────────────
    async createPost(payload) {
      const res = await createPost(payload)
      return res.data
    },

    // ── 게시글 수정 ──────────────────────────────────────────
    async updatePost(id, payload) {
      const res = await updatePost(id, payload)
      return res.data
    },

    // ── 게시글 삭제 ──────────────────────────────────────────
    async deletePost(id) {
      await removePost(id)
      this.posts   = this.posts.filter((p) => p.boardId !== id)
      this.myPosts = this.myPosts.filter((p) => p.boardId !== id)
      this.totalCount = Math.max(0, this.totalCount - 1)
    },

    // ── 관리자 게시글 목록 ──────────────────────────────────────────
    async fetchAdminPosts({ category = '', page = 1, size = 9 } = {}) {
      const params = { page, size }
      if (category) params.category = category
      const res = await getPostList({ category, page, size })
      this.adminPosts = res.data.content
      this.adminTotalCount = res.data.totalCount
      this.adminMaxPage = res.data.maxPage
    },
  },
})