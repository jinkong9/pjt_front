<script setup>
import { reactive, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useMemberStore } from '@/entities/member/model/member'

const router = useRouter()
const memberStore = useMemberStore()
const error = ref('')
const form = reactive({
  userId: '',
  password: '',
})

async function login() {
  error.value = ''
  try {
    await memberStore.login(form)
    router.push('/member')
  } catch {
    error.value = '아이디 또는 비밀번호를 확인하세요.'
  }
}
</script>

<template>
  <main class="auth-page compact">
    <section class="auth-visual">
      <div>
        <p class="eyebrow">Welcome Back</p>
        <h1>로그인하고 관심 매물을 이어서 확인하세요</h1>
      </div>
    </section>
    <section class="auth-panel">
      <div class="auth-box">
        <p class="eyebrow">Login</p>
        <h1>로그인</h1>
        <p v-if="error" class="alert error">{{ error }}</p>
        <form class="auth-form" @submit.prevent="login">
          <label>아이디 <input v-model="form.userId" required /></label>
          <label>비밀번호 <input v-model="form.password" type="password" required /></label>
          <button type="submit">로그인</button>
        </form>
        <div class="auth-links">
          <RouterLink to="/register">회원가입</RouterLink>
          <RouterLink to="/home">홈으로</RouterLink>
        </div>
      </div>
    </section>
  </main>
</template>

