<script setup>
import { reactive, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useMemberStore } from '@/entities/member/model/member'

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
    router.push('/member')
  } catch {
    error.value = '이메일 또는 비밀번호를 확인하세요.'
  }
}
</script>

<template>
  <main class="auth-page form-only">
    <section class="auth-card">
      <div class="auth-form-pane">
        <p class="eyebrow">Login</p>
        <h1>로그인</h1>
        <p v-if="error" class="alert error">{{ error }}</p>
        <form class="auth-form" @submit.prevent="login">
          <label>이메일 <input v-model="form.email" type="email" required /></label>
          <label>비밀번호 <input v-model="form.password" type="password" required /></label>
          <button type="submit">로그인</button>
        </form>
        <div class="oauth-panel" aria-label="Social Login">
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
      <aside class="auth-welcome-pane">
        <p class="eyebrow">Welcome Back</p>
        <h2>다시 만나서 반가워요</h2>
        <p>관심 매물과 주거 정보를 이어서 확인하세요.</p>
        <RouterLink class="button" to="/register">계정이 없나요?</RouterLink>
      </aside>
    </section>
  </main>
</template>

