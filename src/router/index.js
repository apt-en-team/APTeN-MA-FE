import {createRouter, createWebHistory} from 'vue-router'
import {useAuthStore} from '@/stores/modules/auth.js'

// 레이아웃
import ResidentLayout from '@/components/layout/ResidentLayout.vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'

// 공통 페이지
import LandingView from '@/views/LandingView.vue'
import LoginView from '@/views/auth/ResidentLoginView.vue'
import AdminLoginView from '@/views/auth/AdminLoginView.vue'
import RegisterView from '@/views/auth/RegisterView.vue'
import OAuth2CallbackView from '@/views/auth/OAuth2CallbackView.vue'
import ForgotPasswordView from '@/views/auth/ForgotPasswordView.vue'
import ResetPasswordView from '@/views/auth/ResetPasswordView.vue'

// 입주민 - 대시보드
import ResidentDashboard from '@/views/resident/dashboard/DashboardView.vue'

// 입주민 - 게시판
import BoardListView from '@/views/resident/board/BoardListView.vue'
import BoardDetailView from '@/views/resident/board/BoardDetailView.vue'
import BoardFormView from '@/views/resident/board/BoardFormView.vue'
import MyPostsView from '@/views/resident/board/MyPostsView.vue'
import NoticeListView from '@/views/resident/board/NoticeListView.vue'
import NoticeDetailView from '@/views/resident/board/NoticeDetailView.vue'

// 입주민 - 시설/예약
import FacilityListView from '@/views/resident/facility/FacilityListView.vue'
import ReservationCalendarView from '@/views/resident/facility/ReservationCalendarView.vue'
import MyReservationView from '@/views/resident/reservation/MyReservationView.vue'

// 입주민 - 차량
import MyVehicleView from '@/views/resident/vehicle/MyVehicleView.vue'

// 입주민 - 주차/방문차량
import VisitorVehicleFormView from '@/views/resident/parking/VisitorVehicleFormView.vue'
import VisitorVehiclesListView from '@/views/resident/parking/VisitorVehiclesListView.vue'
import ParkingStatusView from '@/views/resident/parking/ParkingStatusView.vue'

// 입주민 - 마이페이지
import MyPageView from '@/views/resident/mypage/MyPageView.vue'
import MyPageEditView from '@/views/resident/mypage/MyPageEditView.vue'

// 관리자 - 대시보드
import AdminDashboard from '@/views/admin/dashboard/AdminDashboardView.vue'

// 관리자 - 세대
import HouseholdManageView from '@/views/admin/household/HouseholdManageView.vue'

// 관리자 - 게시판
import AdminBoardListView from '@/views/admin/board/AdminBoardListView.vue'
import AdminBoardWrite from '@/views/admin/board/AdminBoardWrite.vue'
import AdminBoardDetailView from '@/views/admin/board/AdminBoardDetailView.vue'
import AdminBoardModifyView from '@/views/admin/board/AdminBoardModifyView.vue'

// 관리자 - 차량
import AdminVehicleListView from '@/views/admin/vehicle/AdminVehicleListView.vue'

// 관리자 - 주차/방문차량
import AdminParkingLogView from '@/views/admin/parking/AdminParkingLogView.vue'
import ParkingDashboardView from '@/views/admin/parking/ParkingDashboardView.vue'
import ParkingStatsView from '@/views/admin/parking/ParkingStatsView.vue'
import AdminVisitorVehicleStatusView from '@/views/admin/parking/AdminVisitorVehicleStatusView.vue'
import FixedVisitorVehicleFormView from "@/views/resident/parking/FixedVisitorVehicleFormView.vue";
import FixedVisitorVehicleListView from "@/views/resident/parking/FixedVisitorVehicleListView.vue";
import AdminFixedVisitorVehicleListView from '@/views/admin/parking/Adminfixedvisitorvehiclelistview.vue'

// 관리자 - 시설/예약
// 시설/예약
import FacilityManageView from '@/views/admin/facility/FacilityManageView.vue'
import AdminReservationListView from '@/views/admin/reservation/AdminReservationListView.vue'
import AdminFacilityCalendarView from '@/views/admin/reservation/Adminfacilitycalendar.vue'


const routes = [

    // 공통 (인증 불필요)
    {path: '/', name: 'Landing', component: LandingView},
    {path: '/login', name: 'Login', component: LoginView},
    {path: '/admin/login', name: 'AdminLogin', component: AdminLoginView},
    {path: '/register', name: 'Register', component: RegisterView},
    {path: '/oauth2/callback', name: 'OAuth2Callback', component: OAuth2CallbackView},
    {path: '/forgot-password', name: 'ForgotPassword', component: ForgotPasswordView},
    {path: '/reset-password', name: 'ResetPassword', component: ResetPasswordView},

    // 입주민 페이지
    {
        path: '/resident',
        component: ResidentLayout,
        meta: {requiresAuth: true, role: 'RESIDENT'},
        children: [
            // 대시보드
            {path: 'dashboard', name: 'ResidentDashboard', component: ResidentDashboard, meta: {title: '대시보드'}},

            // 게시판
            { path: 'board/notice', name: 'NoticeList',  component: NoticeListView,  meta: { title: '공지사항' } },
            { path: 'board/notice/:id', name: 'NoticeDetail', component: NoticeDetailView, meta: { title: '공지사항 상세' } },
            { path: 'board',        name: 'BoardList',   component: BoardListView,   meta: { title: '자유게시판' } },
            { path: 'board/form',   name: 'BoardForm',   component: BoardFormView,   meta: { title: '게시글 작성' } },
            { path: 'board/my-posts',     name: 'MyPosts',     component: MyPostsView,     meta: { title: '내가 쓴 글' } },
            { path: 'board/:id',    name: 'BoardDetail', component: BoardDetailView, meta: { title: '게시글 상세보기' } },

            // 시설/예약
            {path: 'facility', name: 'FacilityList', component: FacilityListView, meta: {title: '시설'}},
            {
                path: 'reservation',
                name: 'ReservationCalendar',
                component: ReservationCalendarView,
                meta: {title: '시설 예약'}
            },
            {path: 'my-reservation', name: 'MyReservation', component: MyReservationView, meta: {title: '내 예약'}},

            // 차량
            {path: 'my-vehicle', name: 'MyVehicle', component: MyVehicleView, meta: {title: '내 차량'}},

            // 주차/방문차량
            {
                path: 'visitor-vehicles',
                name: 'VisitorVehicles',
                component: VisitorVehicleFormView,
                meta: {title: '방문차량 등록'}
            },
            {
                path: 'visitor-vehicles/list',
                name: 'VisitorVehiclesList',
                component: VisitorVehiclesListView,
                meta: {title: '방문차량 목록'}
            },
            {path: 'parking/status', name: 'ParkingStatus', component: ParkingStatusView, meta: {title: '주차 현황'}},
            {
                path: '/resident/visitor-vehicles/fixed',
                component: FixedVisitorVehicleListView,
                meta: {title: '고정 방문차량'}
            },
            {
                path: '/resident/visitor-vehicles/fixed/register',
                component: FixedVisitorVehicleFormView,
                meta: {title: '고정 방문차량 등록'}
            },

            // 마이페이지
            {path: 'mypage', name: 'MyPage', component: MyPageView, meta: {title: '마이페이지'}},
            {path: 'mypage/edit', name: 'MyPageEdit', component: MyPageEditView, meta: {title: '마이페이지 수정'}},
        ]
    },

    // 관리자 페이지
    {
        path: '/admin',
        component: AdminLayout,
        meta: {requiresAuth: true, role: 'ADMIN'},
        children: [
            // 대시보드
            {path: 'dashboard', name: 'AdminDashboard', component: AdminDashboard, meta: {title: '대시보드'}},

            // 세대
            {path: 'households', name: 'HouseholdManage', component: HouseholdManageView, meta: {title: '세대 관리'}},

            // 게시판
            {path: 'board', name: 'AdminBoardList', component: AdminBoardListView, meta: {title: '게시판 관리'}},
            {path: 'board/write', name: 'AdminBoardWrite', component: AdminBoardWrite, meta: {title: '공지사항 작성'}},
            {path: 'boards/:id', name: 'AdminBoardDetail', component: AdminBoardDetailView, meta: {title: '게시판 상세'}},
            {
                path: 'boards/modify/:id',
                name: 'AdminBoardModify',
                component: AdminBoardModifyView,
                meta: {title: '게시글 수정'}
            },

            // 차량
            {
                path: 'vehicles',
                name: 'AdminVehicleListView',
                component: AdminVehicleListView,
                meta: {title: '입주민 차량 목록'}
            },

            // 주차/방문차량
            {path: 'parking-logs', name: 'AdminParkingLog', component: AdminParkingLogView, meta: {title: '입출차 기록'}},
            {
                path: 'parking-dashboard',
                name: 'AdminParkingDashboard',
                component: ParkingDashboardView,
                meta: {title: '주차 현황'}
            },
            {path: 'parking-stats', name: 'AdminParkingStats', component: ParkingStatsView, meta: {title: '주차 통계'}},
            {
                path: 'visitor-vehicles',
                name: 'AdminVisitorVehicleList',
                component: AdminVisitorVehicleStatusView,
                meta: {title: '방문 차량 관리'}
            },
            {
                path: 'visitor-vehicles/fixed',
                name: 'AdminFixedVisitorVehicleList',
                component: AdminFixedVisitorVehicleListView,
                meta: {title: '고정 방문차량 관리'}
            },

            // 시설/예약
            { path: 'facility',                name: 'AdminFacilityManage',    component: FacilityManageView,         meta: { title: '시설 관리' } },
            { path: 'reservations',            name: 'AdminReservationListView', component: AdminReservationListView,  meta: { title: '전체 예약 현황' } },
            { path: 'reservations/facility/:typeId', name: 'AdminFacilityCalendar', component: AdminFacilityCalendarView, meta: { title: '시설별 예약 현황' } },
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

    if (to.meta.requiresAuth && !auth.isLoggedIn) {
        try {
            await auth.fetchMe()
        } catch (e) {
        }
    }

    if (to.meta.requiresAuth && !auth.isLoggedIn) {
        return '/login'
    }

    if (to.meta.role && auth.user && auth.user.role !== to.meta.role) {
        if (auth.user.role === 'ADMIN') return '/admin/dashboard'
        return '/resident/dashboard'
    }
})

export default router