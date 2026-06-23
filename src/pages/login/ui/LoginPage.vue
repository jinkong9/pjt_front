<script setup>
import { computed, reactive, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useMemberStore } from '@/entities/member/model/member'
import { safeRedirect } from '@/shared/lib/safeRedirect'
import kakaoLoginImage from '@/assets/oauth/kakao-login.svg'
import naverLoginImage from '@/assets/oauth/naver-login.svg'
import googleLoginImage from '@/assets/oauth/google-login.svg'

const route = useRoute()
const router = useRouter()
const memberStore = useMemberStore()
const error = ref('')
const form = reactive({
  email: '',
  password: '',
})

const oauthProviders = [
  { id: 'kakao', label: 'Kakao', title: '카카오 계정으로 로그인', image: kakaoLoginImage },
  { id: 'naver', label: 'Naver', title: '네이버 계정으로 로그인', image: naverLoginImage },
  { id: 'google', label: 'Google', title: '구글 계정으로 로그인', image: googleLoginImage },
]

const oauthRedirect = computed(() => safeRedirect(route.query.redirect))
const oauthSetupMessage = computed(() => {
  const provider = route.query.oauthSetup
  if (!provider) {
    return ''
  }
  return `${String(provider).toUpperCase()} 로그인 설정이 아직 완료되지 않았습니다. 관리자에게 OAuth client id와 redirect URI 설정을 확인해 주세요.`
})

function backendOrigin() {
  if (import.meta.env.VITE_BACKEND_ORIGIN) {
    return import.meta.env.VITE_BACKEND_ORIGIN
  }
  if (window.location.port === '5173') {
    return 'http://localhost:8080'
  }
  return ''
}

function oauthUrl(provider) {
  const redirectUrl = new URL(oauthRedirect.value, window.location.origin).toString()
  return `${backendOrigin()}/api/oauth/redirect/${provider}?redirect=${encodeURIComponent(redirectUrl)}`
}

async function login() {
  error.value = ''
  try {
    await memberStore.login({
      email: form.email,
      userId: form.email,
      password: form.password,
    })
    await router.push(safeRedirect(route.query.redirect))
  } catch {
    error.value = '이메일 또는 비밀번호를 확인하세요.'
  }
}
</script>

<template>
  <main
    class="grid min-h-[calc(100svh-80px)] items-center bg-[#f4f0ea] px-6 py-[clamp(28px,4.8vh,56px)] max-[899px]:min-h-[calc(100svh-72px)] max-[899px]:px-4 max-[899px]:pb-10 max-[899px]:pt-6"
  >
    <section
      data-testid="login-card"
      class="mx-auto grid min-h-[min(620px,calc(100svh-132px))] w-[min(1040px,calc(100vw-48px))] grid-cols-[minmax(0,1fr)_minmax(360px,0.95fr)] overflow-hidden border border-[#e0ddd7] bg-white shadow-[0_22px_58px_rgba(23,23,23,0.12)] max-[899px]:min-h-0 max-[899px]:grid-cols-1"
    >
      <div
        class="grid w-[min(100%,460px)] content-center justify-self-center px-12 py-[52px] max-[899px]:w-full max-[899px]:px-6 max-[899px]:py-[34px]"
      >
        <p class="m-0 text-xs font-black uppercase tracking-[0.28em] text-[#b4212a]">Login</p>
        <h1 class="mt-4 text-[clamp(38px,4vw,48px)] font-normal leading-none">로그인</h1>
        <p
          v-if="error || oauthSetupMessage"
          class="mt-4 border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700"
        >
          {{ error || oauthSetupMessage }}
        </p>
        <form class="mt-[26px] grid gap-3.5" @submit.prevent="login">
          <label class="grid gap-2 text-sm font-black text-[#171717]">
            이메일
            <input
              v-model="form.email"
              type="email"
              required
              class="min-h-12 border border-[#bdbdbd] bg-white px-3.5 text-inherit outline-none transition-[border-color,box-shadow] duration-150 focus:border-[#b4212a] focus:shadow-[0_0_0_3px_rgba(180,33,42,0.12)]"
            />
          </label>
          <label class="grid gap-2 text-sm font-black text-[#171717]">
            비밀번호
            <input
              v-model="form.password"
              type="password"
              required
              class="min-h-12 border border-[#bdbdbd] bg-white px-3.5 text-inherit outline-none transition-[border-color,box-shadow] duration-150 focus:border-[#b4212a] focus:shadow-[0_0_0_3px_rgba(180,33,42,0.12)]"
            />
          </label>
          <button
            type="submit"
            class="mt-0.5 min-h-[52px] border border-[#b4212a] bg-[#b4212a] font-black text-white hover:border-[#921b22] hover:bg-[#921b22]"
          >
            로그인
          </button>
        </form>
        <div class="mt-[22px] border-t border-neutral-200 pt-5" aria-label="Social Login">
          <span class="block text-xs font-black uppercase tracking-[0.18em] text-[#666666]"
            >Social Login</span
          >
          <div class="mt-3 grid !grid-cols-3 gap-2">
            <a
              v-for="provider in oauthProviders"
              :key="provider.id"
              :data-testid="`oauth-${provider.id}`"
              class="inline-flex h-10 min-w-0 cursor-pointer items-center justify-center overflow-hidden rounded-md no-underline transition-opacity hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b4212a]"
              :href="oauthUrl(provider.id)"
              :title="provider.title"
            >
              <img class="h-full w-full object-contain" :src="provider.image" :alt="provider.title" />
            </a>
          </div>
        </div>
        <div class="mt-[22px] flex flex-wrap justify-between gap-3 text-sm font-black">
          <RouterLink class="text-[#b4212a]" to="/register">회원가입</RouterLink>
          <RouterLink class="text-[#b4212a]" to="/home">홈으로</RouterLink>
        </div>
      </div>
      <aside
        class="grid content-center justify-items-center gap-[18px] bg-[linear-gradient(180deg,rgba(23,23,23,0.9),rgba(23,23,23,0.82)),url('https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center px-10 py-12 text-center text-white max-[899px]:order-[-1] max-[899px]:min-h-[220px] max-[899px]:px-6 max-[899px]:py-[34px]"
      >
        <p class="m-0 text-xs font-black uppercase tracking-[0.28em] text-white/75">Welcome Back</p>
        <h2 class="m-0 text-[clamp(28px,3vw,36px)] font-normal leading-[1.08] text-white">
          다시 만나서 반가워요
        </h2>
        <p class="m-0 max-w-xs text-[15px] font-extrabold leading-[1.7] text-white/80">
          관심 매물과 주거 정보를 이어서 확인하세요.
        </p>
        <RouterLink
          class="mt-1 inline-flex min-h-[42px] items-center justify-center border border-white/80 bg-white/10 px-[22px] text-sm font-black text-white"
          to="/register"
        >
          계정이 없나요?
        </RouterLink>
      </aside>
    </section>
  </main>
</template>
