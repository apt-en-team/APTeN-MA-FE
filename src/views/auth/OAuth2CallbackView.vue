<script setup>
import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/modules/auth.js'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

onMounted(async () => {
  // 소셜 로그인 성공 후 백엔드가 쿠키(AT/RT) 발급 완료한 상태
  // /me API로 사용자 정보 조회하여 로그인 상태 세팅
  await auth.fetchMe()

  if (auth.isLoggedIn) {
    // role에 따라 대시보드로 이동
    const role = route.query.role || auth.user?.role
    if (role === 'ADMIN') {
      router.replace('/admin/dashboard')
    } else {
      router.replace('/resident/dashboard')
    }
  } else {
    router.replace('/login')
  }
})
</script>

<template>
  <div class="callback-page">
    <div class="loading-card">
      <div class="spinner"></div>
      <p>소셜 로그인 처리 중...</p>
    </div>
  </div>
</template>

<style scoped>
.callback-page {
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  background: #F5F6FA;
}
.loading-card { text-align: center; }
.loading-card p { color: #666; margin-top: 16px; font-size: 14px; }
.spinner {
  width: 40px; height: 40px; border: 3px solid #E8EBF0;
  border-top-color: #4F6EF7; border-radius: 50%;
  animation: spin 0.8s linear infinite; margin: 0 auto;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
