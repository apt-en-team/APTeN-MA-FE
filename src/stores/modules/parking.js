import {defineStore} from 'pinia'
import {ref, computed} from 'vue'
import axios from '@/api/axios.js'

export const useParkingStore = defineStore('parking', () => {
    const currentCount = ref(0)
    const totalSpaces = ref(0)
    const availableCount = ref(0)

    const parkingPercent = computed(() =>
        totalSpaces.value > 0
            ? Math.round((currentCount.value / totalSpaces.value) * 100)
            : null
    )

    const fetchStats = async () => {
        const res = await axios.get('/parking/status')
        const pd = res.data?.resultData ?? res.data
        currentCount.value = pd.currentCount ?? 0
        totalSpaces.value = pd.totalSpaces ?? 0
        availableCount.value = pd.availableCount ?? 0
    }

    return {currentCount, totalSpaces, availableCount, parkingPercent, fetchStats}
})