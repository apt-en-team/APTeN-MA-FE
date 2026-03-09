import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/modules/auth.js'

// 레이아웃
import ResidentLayout from '@/components/layout/ResidentLayout.vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'

// 공통 페이지
import LandingView from '@/views/LandingView.vue'
import LoginView from '@/views/auth/ResidentLoginView.vue'
import AdminLoginView from '@/views/auth/AdminLoginView.vue'
import RegisterView from '@/views/auth/RegisterView.vue'
import OAuth2CallbackView from '@/views/auth/OAuth2CallbackView.vue'

// 입주민 페이지
import ResidentDashboard from '@/views/resident/DashboardView.vue'
import BoardListView from '@/views/resident/BoardListView.vue'
import BoardDetailView from '@/views/resident/BoardDetailView.vue'
import BoardFormView from '@/views/resident/BoardFormView.vue'
import FacilityListView from '@/views/resident/FacilityListView.vue'
import ReservationCalendarView from '@/views/resident/ReservationCalendarView.vue'
import MyReservationView from '@/views/resident/MyReservationView.vue'
import MyVehicleView from '@/views/resident/MyVehicleView.vue'
import MyPageView from '@/views/resident/MyPageView.vue'
import MyPageEditView from '@/views/resident/MyPageEditView.vue'

// 관리자 페이지
import AdminDashboard from '@/views/admin/AdminDashboardView.vue'
import HouseholdManageView from '@/views/admin/HouseholdManageView.vue'
import AdminBoardListView from '@/views/admin/AdminBoardListView.vue'
import FacilityManageView from '@/views/admin/FacilityManageView.vue'
import VisitorApprovalView from '@/views/admin/VisitorApprovalView.vue'
import ParkingStatsView from '@/views/admin/ParkingStatsView.vue'

const routes = [

    // 공통 (인증 불필요)
    { path: '/',            name: 'Landing',    component: LandingView },
    { path: '/login',       name: 'Login',      component: LoginView },
    { path: '/admin/login', name: 'AdminLogin', component: AdminLoginView },
    { path: '/register',    name: 'Register',   component: RegisterView },
    { path: '/oauth2/callback', name: 'OAuth2Callback', component: OAuth2CallbackView },

    // 입주민 페이지 - ResidentLayout 안의 <router-view>에 렌더링
    {
        path: '/resident',
        component: ResidentLayout,
        meta: { requiresAuth: true, role: 'RESIDENT' },
        children: [
            { path: 'dashboard', name: 'ResidentDashboard', component: ResidentDashboard, meta: { title: '대시보드' } },
            { path: 'board', name: 'BoardList', component: BoardListView, meta: { title: '게시판' } },
            { path: 'board/:id', name: 'BoardDetail', component: BoardDetailView, meta: { title: '게시판' } },
            { path: 'board/form', name: 'BoardForm', component: BoardFormView, meta: { title: '게시판 작성' } },
            { path: 'facility', name: 'FacilityList', component: FacilityListView, meta: { title: '시설' } },
            { path: 'reservation', name: 'ReservationCalendar', component: ReservationCalendarView, meta: { title: '시설 예약' } },
            { path: 'my-reservation', name: 'MyReservation', component: MyReservationView, meta: { title: '내 예약' } },
            { path: 'my-vehicle', name: 'MyVehicle', component: MyVehicleView, meta: { title: '내 차량' } },
            { path: 'mypage', name: 'MyPage', component: MyPageView, meta: { title: '마이페이지' } },
            { path: 'mypage/edit', name: 'MyPageEdit', component: MyPageEditView, meta: { title: '마이페이지 수정' } },
        ]
    },

    // 관리자 페이지 - AdminLayout 안의 <router-view>에 렌더링
    {
        path: '/admin',
        component: AdminLayout,
        meta: { requiresAuth: true, role: 'ADMIN' },
        children: [
            { path: 'dashboard',  name: 'AdminDashboard',  component: AdminDashboard,       meta: { title: '대시보드' } },
            { path: 'households', name: 'HouseholdManage', component: HouseholdManageView,  meta: { title: '세대 관리' } },
            { path: 'board',      name: 'AdminBoardList',  component: AdminBoardListView,   meta: { title: '게시판 관리' } },
            { path: 'facility',   name: 'FacilityManage',  component: FacilityManageView,   meta: { title: '시설 관리' } },
            { path: 'visitor',    name: 'VisitorApproval', component: VisitorApprovalView,  meta: { title: '방문차량 승인' } },
            { path: 'parking',    name: 'ParkingStats',    component: ParkingStatsView,     meta: { title: '주차 통계' } },
        ]
    }

]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// 네비게이션 가드 - 페이지 접근 권한 체크
router.beforeEach(async (to) => {

    const auth = useAuthStore()

    // 로그인 필요한 페이지인데 유저 정보 없으면 서버에서 가져오기
    if (to.meta.requiresAuth && !auth.isLoggedIn) {
        try {
            await auth.fetchMe()
        } catch (e) {
            // fetchMe 실패해도 아래에서 /login으로 보냄
        }
    }

    // 로그인 안 됐으면 로그인 페이지로
    if (to.meta.requiresAuth && !auth.isLoggedIn) {
        return '/login'
    }

    // role이 맞지 않으면 해당 역할의 대시보드로 리다이렉트
    if (to.meta.role && auth.user?.role !== to.meta.role) {
        if (auth.user?.role === 'ADMIN') return '/admin/dashboard'
        return '/resident/dashboard'
    }

})

export default router