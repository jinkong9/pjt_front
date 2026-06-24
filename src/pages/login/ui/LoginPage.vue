<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useMemberStore } from '@/entities/member/model/member'
import { saveAuthToken } from '@/shared/api/authToken'
import { safeRedirect } from '@/shared/lib/safeRedirect'

const route = useRoute()
const router = useRouter()
const memberStore = useMemberStore()
const error = ref('')
const form = reactive({
  email: '',
  password: '',
})

const oauthProviders = [
  { id: 'kakao', label: '카카오 로그인', title: '카카오 계정으로 로그인' },
  { id: 'naver', label: '네이버 로그인', title: '네이버 계정으로 로그인' },
  { id: 'google', label: 'Google 로그인', title: '구글 계정으로 로그인' },
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
  const callbackUrl = new URL('/login', window.location.origin)
  callbackUrl.searchParams.set('redirect', oauthRedirect.value)
  const redirectUrl = callbackUrl.toString()
  return `${backendOrigin()}/api/oauth/redirect/${provider}?redirect=${encodeURIComponent(redirectUrl)}`
}

function routeQueryValue(key) {
  const value = route.query[key]
  return Array.isArray(value) ? value[0] : value
}

async function consumeOauthToken() {
  const accessToken = routeQueryValue('accessToken')
  const refreshToken = routeQueryValue('refreshToken')
  const grantType = routeQueryValue('grantType') || 'Bearer'
  if (!accessToken || !refreshToken) {
    return
  }

  saveAuthToken({
    grantType: String(grantType),
    accessToken: String(accessToken),
    refreshToken: String(refreshToken),
  })
  await memberStore.fetchMe()
  await router.replace(safeRedirect(route.query.redirect))
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

onMounted(() => {
  consumeOauthToken()
})
</script>

<template>
  <main
    class="grid min-h-[calc(100svh-80px)] items-center bg-[#f4f0ea] px-6 py-[clamp(28px,4.8vh,56px)] max-[899px]:min-h-[calc(100svh-72px)] max-[899px]:px-4 max-[899px]:pb-10 max-[899px]:pt-6"
  >
    <section
      data-testid="login-card"
      class="mx-auto grid min-h-[min(690px,calc(100svh-118px))] w-[min(1120px,calc(100vw-48px))] grid-cols-[minmax(0,1.04fr)_minmax(360px,0.96fr)] overflow-hidden border border-[#e0ddd7] bg-white shadow-[0_22px_58px_rgba(23,23,23,0.12)] max-[899px]:min-h-0 max-[899px]:grid-cols-1"
    >
      <div
        class="grid w-[min(100%,500px)] content-center justify-self-center px-[52px] py-12 max-[899px]:w-full max-[899px]:px-6 max-[899px]:py-[34px]"
      >
        <p class="m-0 text-xs font-black uppercase tracking-[0.28em] text-[#b4212a]">Login</p>
        <h1 class="mt-4 text-[clamp(38px,4vw,50px)] font-normal leading-none">로그인</h1>
        <p
          v-if="error || oauthSetupMessage"
          class="mt-4 border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700"
        >
          {{ error || oauthSetupMessage }}
        </p>
        <form class="mt-[26px] grid gap-[13px]" @submit.prevent="login">
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
            class="mt-1.5 min-h-[54px] border border-[#b4212a] bg-[#b4212a] text-[15px] font-black text-white hover:border-[#921b22] hover:bg-[#921b22]"
          >
            로그인
          </button>
        </form>
        <div class="mt-[22px] border-t border-neutral-200 pt-5" aria-label="Social Login">
          <span class="block text-xs font-black uppercase tracking-[0.18em] text-[#666666]"
            >Social Login</span
          >
          <div data-testid="oauth-list" class="mt-3 grid grid-cols-1 gap-2.5">
            <a
              v-for="provider in oauthProviders"
              :key="provider.id"
              :data-testid="`oauth-${provider.id}`"
              class="oauth-provider-link grid min-h-[54px] w-full min-w-0 cursor-pointer grid-cols-[56px_minmax(0,1fr)_56px] items-center rounded-md border no-underline transition-opacity hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b4212a]"
              :class="`oauth-provider-${provider.id}`"
              :href="oauthUrl(provider.id)"
              :title="provider.title"
            >
              <span class="oauth-icon grid place-items-center" aria-hidden="true">
                <span v-if="provider.id === 'kakao'" class="oauth-icon-kakao"></span>
                <span v-else-if="provider.id === 'naver'" class="oauth-icon-naver">N</span>
                <span v-else class="oauth-icon-google">
                  <span class="google-letter google-blue">G</span>
                </span>
              </span>
              <span class="oauth-label justify-self-center text-center text-[16px] font-black">
                {{ provider.label }}
              </span>
              <span aria-hidden="true"></span>
              <span class="sr-only">{{ provider.title }}</span>
            </a>
          </div>
        </div>
        <div class="mt-[22px] flex flex-wrap justify-between gap-3 text-sm font-black">
          <RouterLink class="text-[#b4212a]" to="/register">회원가입</RouterLink>
          <RouterLink class="text-[#b4212a]" to="/home">홈으로</RouterLink>
        </div>
      </div>
      <aside
        class="grid content-center justify-items-center gap-[18px] bg-[linear-gradient(180deg,rgba(23,23,23,0.9),rgba(23,23,23,0.82)),url('https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center px-[42px] py-12 text-center text-white max-[899px]:order-[-1] max-[899px]:min-h-[230px] max-[899px]:px-6 max-[899px]:py-[34px]"
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

<style scoped>
.oauth-provider-link {
  border-radius: 6px;
}

.oauth-provider-kakao {
  border-color: #fee500;
  background: #fee500;
  color: rgba(0, 0, 0, 0.85);
}

.oauth-provider-naver {
  border-color: #03c75a;
  background: #03c75a;
  color: #ffffff;
}

.oauth-provider-google {
  border-color: #dadce0;
  background: #ffffff;
  color: #3c4043;
}

.oauth-icon-kakao {
  position: relative;
  width: 23px;
  height: 18px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.9);
}

.oauth-icon-kakao::after {
  content: '';
  position: absolute;
  left: 3px;
  bottom: -4px;
  width: 8px;
  height: 7px;
  background: rgba(0, 0, 0, 0.9);
  clip-path: polygon(0 0, 100% 0, 0 100%);
}

.oauth-icon-naver {
  font-family: Arial, sans-serif;
  font-size: 28px;
  font-weight: 900;
  line-height: 1;
}

.oauth-icon-google {
  display: grid;
  width: 24px;
  height: 24px;
  place-items: center;
  border-radius: 50%;
  font-family: Arial, sans-serif;
  font-size: 25px;
  font-weight: 700;
  line-height: 1;
}

.google-letter {
  background: conic-gradient(from -45deg, #4285f4 0 25%, #34a853 0 50%, #fbbc04 0 75%, #ea4335 0);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
</style>
