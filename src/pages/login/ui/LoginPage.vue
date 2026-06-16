<script setup>
import { computed, reactive, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useMemberStore } from '@/entities/member/model/member'
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
  { id: 'kakao', label: 'Kakao', title: '카카오 계정으로 로그인' },
  { id: 'naver', label: 'Naver', title: '네이버 계정으로 로그인' },
  { id: 'google', label: 'Google', title: '구글 계정으로 로그인' },
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
  <main class="login-page">
    <section class="login-card">
      <div class="login-form-pane">
        <p class="login-eyebrow">Login</p>
        <h1>로그인</h1>
        <p v-if="error || oauthSetupMessage" class="alert error">{{ error || oauthSetupMessage }}</p>
        <form class="auth-form login-form" @submit.prevent="login">
          <label>이메일 <input v-model="form.email" type="email" required /></label>
          <label>비밀번호 <input v-model="form.password" type="password" required /></label>
          <button type="submit" class="login-submit">로그인</button>
        </form>
        <div class="oauth-panel login-oauth" aria-label="Social Login">
          <span>Social Login</span>
          <div class="oauth-actions">
            <a
              v-for="provider in oauthProviders"
              :key="provider.id"
              class="login-oauth-button"
              :class="provider.id"
              :href="oauthUrl(provider.id)"
              :title="provider.title"
            >
              <span class="login-oauth-mark">{{ provider.label[0] }}</span>
              {{ provider.label }}
            </a>
          </div>
        </div>
        <div class="login-links">
          <RouterLink to="/register">회원가입</RouterLink>
          <RouterLink to="/home">홈으로</RouterLink>
        </div>
      </div>
      <aside class="login-welcome-pane">
        <p class="login-welcome-eyebrow">Welcome Back</p>
        <h2>다시 만나서 반가워요</h2>
        <p>관심 매물과 주거 정보를 이어서 확인하세요.</p>
        <RouterLink class="login-register-button" to="/register">계정이 없나요?</RouterLink>
      </aside>
    </section>
  </main>
</template>

<style scoped>
.login-page {
  display: grid;
  min-height: calc(100svh - 80px);
  align-items: center;
  padding: clamp(28px, 4.8vh, 56px) 24px;
  background: #f4f0ea;
}

.login-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(360px, 0.95fr);
  width: min(1040px, calc(100vw - 48px));
  min-height: min(620px, calc(100svh - 132px));
  margin: 0 auto;
  overflow: hidden;
  border: 1px solid #e0ddd7;
  background: #ffffff;
  box-shadow: 0 22px 58px rgba(23, 23, 23, 0.12);
}

.login-form-pane {
  display: grid;
  width: min(100%, 460px);
  align-content: center;
  justify-self: center;
  padding: 52px 48px;
}

.login-eyebrow,
.login-welcome-eyebrow {
  margin: 0;
  color: #b4212a;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.28em;
  text-transform: uppercase;
}

.login-form-pane h1 {
  margin: 16px 0 0;
  font-size: clamp(38px, 4vw, 48px);
  font-weight: 400;
  line-height: 1;
}

.login-form {
  display: grid;
  gap: 14px;
  margin-top: 26px;
}

.login-form label {
  display: grid;
  gap: 8px;
  color: #171717;
  font-size: 14px;
  font-weight: 900;
}

.login-form input {
  min-height: 48px;
  border: 1px solid #d4d4d4;
  border-radius: 0;
  background: #ffffff;
  color: #171717;
  padding: 0 14px;
  font: inherit;
  outline: none;
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease;
}

.login-form input:focus {
  border-color: #b4212a;
  box-shadow: 0 0 0 3px rgba(180, 33, 42, 0.12);
}

.login-submit {
  min-height: 52px;
  margin-top: 2px;
  border: 1px solid #b4212a;
  background: #b4212a;
  color: #ffffff;
  font-weight: 900;
}

.login-submit:hover {
  border-color: #921b22;
  background: #921b22;
}

.login-oauth {
  margin-top: 22px;
  border-top: 1px solid #e5e5e5;
  padding-top: 20px;
}

.login-oauth > span {
  display: block;
  color: #666666;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.login-oauth .oauth-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-top: 12px;
}

.login-oauth-button {
  display: inline-flex;
  min-height: 46px;
  align-items: center;
  justify-content: center;
  border: 1px solid #d4d4d4;
  background: #ffffff;
  color: #171717;
  gap: 8px;
  padding: 0 12px;
  font-size: 13px;
  font-weight: 900;
  cursor: pointer;
  text-decoration: none;
}

.login-oauth-mark {
  display: inline-flex;
  width: 20px;
  height: 20px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  font-size: 11px;
  font-weight: 900;
}

.login-oauth-button.kakao {
  border-color: #fee500;
  background: #fee500;
  color: #171717;
}

.login-oauth-button.naver {
  border-color: #03c75a;
  background: #03c75a;
  color: #ffffff;
}

.login-oauth-button.google {
  border-color: #d4d4d4;
  background: #ffffff;
  color: #171717;
}

.login-oauth-button.google .login-oauth-mark {
  border: 1px solid #e0e0e0;
  color: #4285f4;
}

.login-links {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 12px;
  margin-top: 22px;
  font-size: 14px;
  font-weight: 900;
}

.login-links a {
  color: #b4212a;
}

.login-welcome-pane {
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 18px;
  padding: 48px 40px;
  background:
    linear-gradient(180deg, rgba(23, 23, 23, 0.9), rgba(23, 23, 23, 0.82)),
    url('https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80')
      center/cover;
  color: #ffffff;
  text-align: center;
}

.login-welcome-eyebrow {
  color: rgba(255, 255, 255, 0.74);
}

.login-welcome-pane h2 {
  margin: 0;
  color: #ffffff;
  font-size: clamp(28px, 3vw, 36px);
  font-weight: 400;
  line-height: 1.08;
}

.login-welcome-pane p:not(.login-welcome-eyebrow) {
  max-width: 320px;
  margin: 0;
  color: rgba(255, 255, 255, 0.82);
  font-size: 15px;
  font-weight: 800;
  line-height: 1.7;
}

.login-register-button {
  display: inline-flex;
  min-height: 42px;
  align-items: center;
  justify-content: center;
  margin-top: 4px;
  border: 1px solid rgba(255, 255, 255, 0.78);
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
  padding: 0 22px;
  font-size: 14px;
  font-weight: 900;
}

@media (max-width: 899px) {
  .login-page {
    min-height: calc(100svh - 72px);
    padding: 24px 16px 40px;
  }

  .login-card {
    grid-template-columns: 1fr;
    min-height: 0;
  }

  .login-form-pane {
    width: 100%;
    padding: 34px 24px;
  }

  .login-welcome-pane {
    order: -1;
    min-height: 220px;
    padding: 34px 24px;
  }
}
</style>
