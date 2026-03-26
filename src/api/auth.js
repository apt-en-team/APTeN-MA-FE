// src/api/auth.js
import api from './axios'

// 로그인
export const login = (data) => api.post('/auth/login', data)

// 회원가입
export const register = (data) => api.post('/auth/register', data)

// 로그아웃
export const logout = () => api.post('/auth/logout')

// 내 정보 조회
export const getMe = () => api.get('/users/me')

// 내 정보 수정
export const updateMe = (data) => api.put('/users/me', data)

// 회원 탈퇴
export const deactivate = () => api.patch('/users/deactivate')

// 이메일 중복 확인
export const checkEmail = (email) => api.get(`/auth/check-email?email=${email}`)

// 토큰 재발급
export const refresh = () => api.post('/auth/refresh')