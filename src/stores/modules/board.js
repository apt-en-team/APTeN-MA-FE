import { defineStore } from 'pinia'
import {
  getPostList,
  getAdminPostList,
  getPopularPosts,
  getMyPosts,
  createPost,
  updatePost,
  removePost,
  getAdminBoardStats,
  removePostByAdmin,
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
    adminPosts:            [],
    adminTotalCount:       0,
    adminMaxPage:          0,
    adminNoticeTotalCount: 0,
    adminFreeTotalCount:   0,
    adminInquiryTotalCount: 0,
    adminStats: {
      totalCount:   0,
      noticeCount:  0,
      freeCount:    0,
      inquiryCount: 0,
      todayCount:   0,
      deletedCount: 0,
      commentCount: 0,
    },
  }),

  // ── 게시글 조회 ──────────────────────────────────── 
  actions: {
    async fetchPosts({ category = 'FREE', page = 1, size = 10, keyword = '' } = {}) {
      const res = await getPostList({ category, page, size, keyword })
      this.posts      = res.data.content
      this.totalCount = res.data.totalCount
      this.maxPage    = res.data.maxPage
      return res.data
    },

    // ── 공지사항 조회 ──────────────────────────────────── 
    async fetchNotices({ size = 100 } = {}) {
      const res = await getPostList({ category: 'NOTICE', page: 1, size })
      this.notices = res.data.content
      return res.data
    },

    // ── 인기글 조회 ──────────────────────────────────── 
    async fetchPopularPosts() {
      const res = await getPopularPosts()
      this.popularPosts = res.data
      return res.data
    },

    // ── 내 게시글 조회(입주민) ──────────────────────────────────── 
    async fetchMyPosts({ size = 3 } = {}) {
      const res = await getMyPosts({ size })
      this.myPosts = res.data
      return res.data
    },

    // ── 게시글 등록 ──────────────────────────────────── 
    async createPost(payload) {
      const res = await createPost(payload)
      return res.data
    },

    // ── 게시글 수정 ──────────────────────────────────── 
    async updatePost(id, payload) {
      const res = await updatePost(id, payload)
      return res.data
    },

    // ── 게시글 삭제 ──────────────────────────────────── 
    async deletePost(id) {
      await removePost(id)
      this.posts      = this.posts.filter((p) => p.boardId !== id)
      this.myPosts    = this.myPosts.filter((p) => p.boardId !== id)
      this.totalCount = Math.max(0, this.totalCount - 1)
    },

    // ── 관리자 게시글 목록 ────────────────────────────────────
    async fetchAdminPosts({ category = '', page = 1, size = 9, isDeleted = null } = {}) {
      const res = await getAdminPostList({ category, page, size, isDeleted })
      this.adminPosts      = res.data.content
      this.adminTotalCount = res.data.totalCount
      this.adminMaxPage    = res.data.maxPage
    },

    // ── 관리자 게시글 통계 ──────────────────────────────────── 
    async fetchAdminBoardStats() {
      const res = await getAdminBoardStats()
      this.adminStats = res.data
    },

    async deletePostByAdmin(id) {
      await removePostByAdmin(id)
      this.adminPosts = this.adminPosts.filter(p => p.boardId !== Number(id))
    },
  },
})