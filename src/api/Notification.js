import axios from './axios.js'

// AdminLayout.vue의 벨 버튼에서 이 API들을 호출한다
const notificationAPI = {

    // 내 알림 목록 조회 (최신순 30건)
    // 벨 버튼 클릭 시 드롭다운에 표시할 목록 불러오기
    getNotifications() {
        return axios.get('/notifications')
    },

    // 읽지 않은 알림 개수 조회
    // 페이지 로드 시 벨 아이콘 뱃지 숫자 표시에 사용
    getUnreadCount() {
        return axios.get('/notifications/unread-count')
    },

    // 알림 1건 읽음 처리
    // 드롭다운에서 특정 알림 클릭 시 호출
    markAsRead(notificationId) {
        return axios.patch(`/notifications/${notificationId}/read`)
    },

    // 전체 읽음 처리
    // 드롭다운에서 "모두 읽음" 버튼 클릭 시 호출
    markAllAsRead() {
        return axios.patch('/notifications/read-all')
    }
}

export default notificationAPI