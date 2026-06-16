<script setup>
import { reactive, ref } from 'vue'
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
        <p v-if="error" class="alert error">{{ error }}</p>
        <form class="auth-form login-form" @submit.prevent="login">
          <label>이메일 <input v-model="form.email" type="email" required /></label>
          <label>비밀번호 <input v-model="form.password" type="password" required /></label>
          <button type="submit" class="login-submit">로그인</button>
        </form>
        <div class="oauth-panel login-oauth" aria-label="Social Login">
          <span>Social Login</span>
          <div class="oauth-actions">
            <button type="button" class="login-oauth-button kakao">Kakao</button>
            <button type="button" class="login-oauth-button naver">Naver</button>
            <button type="button" class="login-oauth-button google">Google</button>
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
  padding: clamp(32px, 6vh, 64px) 24px;
  background: #f4f0ea;
}

.login-card {
  display: grid;
  grid-template-columns: minmax(0, 0.96fr) minmax(320px, 0.88fr);
  width: min(880px, calc(100vw - 48px));
  min-height: min(540px, calc(100svh - 150px));
  margin: 0 auto;
  overflow: hidden;
  border: 1px solid #e0ddd7;
  background: #ffffff;
  box-shadow: 0 22px 58px rgba(23, 23, 23, 0.12);
}

.login-form-pane {
  display: grid;
  width: min(100%, 420px);
  align-content: center;
  justify-self: center;
  padding: 44px 40px;
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
  min-height: 42px;
  align-items: center;
  justify-content: center;
  border: 1px solid #d4d4d4;
  background: #ffffff;
  color: #171717;
  padding: 0 12px;
  font-size: 13px;
  font-weight: 900;
  cursor: pointer;
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
