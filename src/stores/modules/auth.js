import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/api/axios.js'

// 인증 상태 관리 스토어
export const useAuthStore = defineStore('auth', () => {

    // 로그인된 사용자 정보
    const user = ref(null)

    // 로그인 여부
    const isLoggedIn = ref(false)

    // 로그인 (POST /api/auth/login)
    async function login(email, password) {
        const res = await api.post('/auth/login', { email, password })
        user.value = res.data.resultData
        isLoggedIn.value = true
        return user.value
    }

    // 회원가입 (POST /api/auth/register)
    async function register(form) {
        await api.post('/auth/register', form)
    }

    // 로그아웃 (POST /api/auth/logout)
    async function logout() {
        try {
            await api.post('/auth/logout')
        } catch (e) {
            // 이미 로그아웃된 경우 무시
        }
        user.value = null
        isLoggedIn.value = false
    }

    // 내 정보 조회 (GET /api/auth/me)
    // 새로고침 시 로그인 상태 복원용
    async function fetchMe() {
        try {
            const res = await api.get('/users/me')
            user.value = res.data.resultData
            isLoggedIn.value = true
        } catch (e) {
            user.value = null
            isLoggedIn.value = false
        }
    }

    // 회원 탈퇴 (PATCH /api/auth/deactivate)
    async function deactivate() {
        await api.patch('/auth/deactivate')
        user.value = null
        isLoggedIn.value = false
    }

    // 내 정보 수정 (PUT /api/users/me)
    async function updateMe(form) {
        const res = await api.put('/users/me', form)
        await fetchMe() // 수정 후 사용자 정보 갱신
    }

    return { user, isLoggedIn, login, register, logout, deactivate, fetchMe, updateMe }

})
