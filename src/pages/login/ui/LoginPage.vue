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
  <main class="auth-page form-only login-page">
    <section class="auth-card login-card">
      <div class="auth-form-pane login-form-pane">
        <p class="eyebrow">Login</p>
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
            <button type="button" class="oauth-button kakao">Kakao</button>
            <button type="button" class="oauth-button naver">Naver</button>
            <button type="button" class="oauth-button google">Google</button>
          </div>
        </div>
        <div class="auth-links">
          <RouterLink to="/register">회원가입</RouterLink>
          <RouterLink to="/home">홈으로</RouterLink>
        </div>
      </div>
      <aside class="auth-welcome-pane login-welcome-pane">
        <p class="eyebrow">Welcome Back</p>
        <h2>다시 만나서 반가워요</h2>
        <p>관심 매물과 주거 정보를 이어서 확인하세요.</p>
        <RouterLink class="button" to="/register">계정이 없나요?</RouterLink>
      </aside>
    </section>
  </main>
</template>

<style scoped>
.login-page {
  display: grid;
  min-height: 100vh;
  align-items: center;
  padding: 112px 24px 56px;
  background: #f4f0ea;
}

.login-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 0.88fr);
  width: min(960px, 100%);
  min-height: 560px;
  margin: 0 auto;
  overflow: hidden;
  border: 1px solid #e0ddd7;
  background: #ffffff;
  box-shadow: 0 24px 70px rgba(23, 23, 23, 0.12);
}

.login-form-pane {
  display: grid;
  width: min(100%, 480px);
  align-content: center;
  justify-self: center;
  padding: 56px 48px;
}

.login-form-pane h1 {
  margin: 18px 0 0;
  font-size: clamp(34px, 4vw, 48px);
  line-height: 1;
}

.login-form {
  display: grid;
  gap: 16px;
  margin-top: 28px;
}

.login-form label {
  display: grid;
  gap: 8px;
  color: #171717;
  font-size: 14px;
  font-weight: 900;
}

.login-form input {
  min-height: 52px;
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
  min-height: 54px;
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
  margin-top: 24px;
  border-top: 1px solid #e5e5e5;
  padding-top: 22px;
}

.login-oauth .oauth-button {
  min-height: 46px;
  border: 1px solid #d4d4d4;
  background: #ffffff;
  color: #171717;
  padding: 0 10px;
  font-size: 13px;
  font-weight: 900;
}

.login-oauth .kakao {
  border-color: #fee500;
  background: #fee500;
  color: #171717;
}

.login-oauth .naver {
  border-color: #03c75a;
  background: #03c75a;
  color: #ffffff;
}

.login-oauth .google {
  border-color: #d4d4d4;
  background: #ffffff;
  color: #171717;
}

.login-welcome-pane {
  align-content: center;
}

@media (max-width: 899px) {
  .login-page {
    padding: 96px 16px 40px;
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
