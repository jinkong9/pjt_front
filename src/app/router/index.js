import { createRouter, createWebHistory } from 'vue-router'

import AnalysisPage from '@/pages/analysis/ui/AnalysisPage.vue'
import HomePage from '@/pages/home/ui/HomePage.vue'
import LhCalendarPage from '@/pages/lh-calendar/ui/LhCalendarPage.vue'
import LoginPage from '@/pages/login/ui/LoginPage.vue'
import MemberPage from '@/pages/member/ui/MemberPage.vue'
import MyDataPage from '@/pages/mydata/ui/MyDataPage.vue'
import NoticeDetailPage from '@/pages/notice-detail/ui/NoticeDetailPage.vue'
import NoticesPage from '@/pages/notices/ui/NoticesPage.vue'
import PricesPage from '@/pages/prices/ui/PricesPage.vue'
import RegisterPage from '@/pages/register/ui/RegisterPage.vue'
import RentalDetailPage from '@/pages/rental-detail/ui/RentalDetailPage.vue'
import RentalsPage from '@/pages/rentals/ui/RentalsPage.vue'
import TransferCreatePage from '@/pages/transfer-create/ui/TransferCreatePage.vue'
import TransferDetailPage from '@/pages/transfer-detail/ui/TransferDetailPage.vue'
import TransferEditPage from '@/pages/transfer-edit/ui/TransferEditPage.vue'
import TransfersPage from '@/pages/transfers/ui/TransfersPage.vue'

const router = createRouter({
  history: createWebHistory('/'),
  routes: [
    { path: '/', redirect: '/home' },
    { path: '/home', name: 'home', component: HomePage },
    { path: '/prices', name: 'prices', component: PricesPage },
    { path: '/trades', redirect: '/prices' },
    { path: '/rentals', name: 'rentals', component: RentalsPage },
    { path: '/rentals/:noticeId', name: 'rental-detail', component: RentalDetailPage },
    { path: '/transfers', name: 'transfers', component: TransfersPage },
    { path: '/transfers/new', name: 'transfer-create', component: TransferCreatePage },
    { path: '/transfers/:transferId/edit', name: 'transfer-edit', component: TransferEditPage },
    { path: '/transfers/:transferId', name: 'transfer-detail', component: TransferDetailPage },
    { path: '/lh-calendar', name: 'lh-calendar', component: LhCalendarPage },
    { path: '/analysis', name: 'analysis', component: AnalysisPage },
    { path: '/notices', name: 'notices', component: NoticesPage },
    { path: '/notices/:noticeId', name: 'notice-detail', component: NoticeDetailPage },
    { path: '/login', name: 'login', component: LoginPage },
    { path: '/register', name: 'register', component: RegisterPage },
    { path: '/member', name: 'member', component: MemberPage },
    { path: '/mydata', name: 'mydata', component: MyDataPage },
  ],
})

export default router
