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
  <header
    class="site-header border-b border-neutral-200 bg-white"
    :class="{
      'hero-header fixed inset-x-0 top-0 z-10 border-white/15 bg-[linear-gradient(180deg,rgba(0,0,0,0.34),rgba(0,0,0,0))] text-white':
        isHome,
    }"
  >
    <nav
      class="nav mx-auto flex min-h-20 w-[min(1480px,calc(100%_-_48px))] items-center justify-between"
      :class="{ 'border-b border-white/20': isHome }"
    >
      <RouterLink
        class="brand flex items-center gap-3 text-sm font-black uppercase tracking-[0.22em]"
        to="/home"
      >
        <span
          class="brand-mark grid h-10 w-16 place-items-center border border-current text-[10px] font-black leading-none tracking-[0.12em] [text-indent:0.12em] whitespace-nowrap"
          >HOME</span
        >
        <strong>SSAFY Home</strong>
      </RouterLink>
      <div
        class="nav-links flex flex-wrap items-center justify-end gap-x-[18px] gap-y-3.5 text-sm font-black"
      >
        <RouterLink
          v-if="!memberStore.isLoggedIn"
          class="nav-login-link inline-flex items-center justify-center border-0 bg-transparent p-0 text-center text-sm font-black text-inherit hover:text-[#b4212a]"
          :class="{ 'hover:text-white/70': isHome }"
          to="/login"
          >로그인</RouterLink
        >
        <button
          v-else
          type="button"
          class="nav-login-link inline-flex min-h-0 items-center justify-center border-0 bg-transparent p-0 text-center text-sm font-black text-inherit hover:text-[#b4212a]"
          :class="{ 'hover:text-white/70': isHome }"
          @click="logout"
        >
          로그아웃
        </button>
        <button
          type="button"
          class="menu-toggle inline-flex min-h-10 items-center justify-center gap-[5px] border border-current bg-transparent px-3 text-inherit"
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
      class="sidebar-backdrop fixed inset-0 z-[80] min-h-0 border-0 bg-neutral-900/35 p-0"
      aria-label="메뉴 닫기"
      @click="sidebarOpen = false"
    />
    <aside
      v-if="sidebarOpen"
      id="sidebar-drawer"
      class="sidebar-drawer fixed right-0 top-0 z-[90] grid h-screen w-[min(380px,100%)] content-start border-l border-neutral-300 bg-white text-[#171717] shadow-[-24px_0_60px_rgba(23,23,23,0.22)]"
      aria-label="전체 메뉴"
    >
      <div
        class="sidebar-head flex min-h-[84px] items-center justify-between border-b border-neutral-200 px-6"
      >
        <span
          class="brand-mark grid h-10 w-16 place-items-center border border-current text-[10px] font-black leading-none tracking-[0.12em] [text-indent:0.12em] whitespace-nowrap"
          >HOME</span
        >
        <button
          type="button"
          class="sidebar-close inline-flex min-h-10 items-center justify-center border border-[#171717] bg-white px-3.5 font-black text-[#171717]"
          @click="sidebarOpen = false"
        >
          닫기
        </button>
      </div>
      <nav class="sidebar-links grid py-[18px]">
        <RouterLink
          v-for="link in sidebarLinks"
          :key="link.to"
          class="flex min-h-[58px] items-center border-b border-neutral-100 px-7 text-lg font-black hover:bg-[#f4f0ea]"
          :to="link.to"
          >{{ link.label }}</RouterLink
        >
        <RouterLink
          v-if="!memberStore.isLoggedIn"
          class="flex min-h-[58px] items-center border-b border-neutral-100 px-7 text-lg font-black hover:bg-[#f4f0ea]"
          to="/register"
          >회원가입</RouterLink
        >
        <RouterLink
          v-if="memberStore.isLoggedIn"
          class="flex min-h-[58px] items-center border-b border-neutral-100 px-7 text-lg font-black hover:bg-[#f4f0ea]"
          to="/member"
          >회원정보</RouterLink
        >
      </nav>
    </aside>
  </header>
</template>
