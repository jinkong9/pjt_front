<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useMemberStore } from '@/entities/member/model/member'

const memberStore = useMemberStore()
const route = useRoute()
const router = useRouter()
const isHome = computed(() => route.name === 'home')
const sidebarOpen = ref(false)

const sidebarLinks = computed(() => [
  { to: '/home', label: '홈' },
  { to: '/prices', label: '부동산 시세' },
  { to: '/rentals', label: '공공임대' },
  { to: '/transfers', label: '양도 게시판' },
  { to: '/notices', label: '공지사항' },
  { to: '/lh-calendar', label: 'LH 캘린더' },
  { to: '/analysis', label: '생활권 분석' },
])

watch(
  () => route.fullPath,
  () => {
    sidebarOpen.value = false
  },
)

onMounted(() => {
  if (!memberStore.loaded) {
    memberStore.fetchMe()
  }
})

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

async function logout() {
  await memberStore.logout()
  await router.push('/home')
}
</script>

<template>
  <header class="site-header" :class="{ 'hero-header': isHome }">
    <nav class="nav">
      <RouterLink class="brand" to="/home">
        <span class="brand-mark">HOME</span>
        <strong>SSAFY Home</strong>
      </RouterLink>
      <div class="nav-links">
        <RouterLink v-if="!memberStore.isLoggedIn" class="nav-login-link" to="/login">로그인</RouterLink>
        <button v-else type="button" class="nav-login-link" @click="logout">로그아웃</button>
        <button
          type="button"
          class="menu-toggle"
          :aria-expanded="sidebarOpen"
          aria-controls="sidebar-drawer"
          @click="toggleSidebar"
        >
          <strong>메뉴</strong>
        </button>
      </div>
    </nav>

    <button
      v-if="sidebarOpen"
      type="button"
      class="sidebar-backdrop"
      aria-label="메뉴 닫기"
      @click="sidebarOpen = false"
    />
    <aside v-if="sidebarOpen" id="sidebar-drawer" class="sidebar-drawer" aria-label="전체 메뉴">
      <div class="sidebar-head">
        <span class="brand-mark">HOME</span>
        <button type="button" class="sidebar-close" @click="sidebarOpen = false">닫기</button>
      </div>
      <nav class="sidebar-links">
        <RouterLink v-for="link in sidebarLinks" :key="link.to" :to="link.to">{{
          link.label
        }}</RouterLink>
        <RouterLink v-if="!memberStore.isLoggedIn" to="/register">회원가입</RouterLink>
        <RouterLink v-if="memberStore.isLoggedIn" to="/member">회원정보</RouterLink>
      </nav>
    </aside>
  </header>
</template>
