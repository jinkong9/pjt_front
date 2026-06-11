<script setup>
import { reactive, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useMemberStore } from '@/entities/member/model/member'

const router = useRouter()
const memberStore = useMemberStore()
const error = ref('')
const form = reactive({
  name: '',
  email: '',
  password: '',
  passwordConfirm: '',
  phone: '',
})

async function register() {
  error.value = ''
  if (form.password !== form.passwordConfirm) {
    error.value = '비밀번호가 일치하지 않습니다.'
    return
  }

  try {
    await memberStore.register({
      userId: form.email,
      email: form.email,
      password: form.password,
      name: form.name,
      phone: form.phone,
    })
    router.push('/login')
  } catch {
    error.value = '이미 사용 중인 이메일이거나 입력값이 올바르지 않습니다.'
  }
}
</script>

<template>
  <main class="auth-page form-only">
    <section class="auth-card">
      <div class="auth-form-pane">
        <p class="eyebrow">Register</p>
        <h1>회원가입</h1>
        <p v-if="error" class="alert error">{{ error }}</p>
        <form class="auth-form" @submit.prevent="register">
          <label>이름 <input v-model="form.name" required /></label>
          <label>이메일 <input v-model="form.email" type="email" required /></label>
          <label>비밀번호 <input v-model="form.password" type="password" required /></label>
          <label>비밀번호 확인 <input v-model="form.passwordConfirm" type="password" required /></label>
          <label>전화번호 <input v-model="form.phone" required /></label>
          <button type="submit">가입하기</button>
        </form>
        <div class="auth-links">
          <RouterLink to="/login">로그인</RouterLink>
          <RouterLink to="/home">홈으로</RouterLink>
        </div>
      </div>
      <aside class="auth-welcome-pane">
        <p class="eyebrow">Join SSAFY Home</p>
        <h2>주거 정보를 한곳에서 관리하세요</h2>
        <p>공공임대 일정, 양도글, 관심 매물을 편하게 이어서 볼 수 있어요.</p>
        <RouterLink class="button" to="/login">이미 계정이 있나요?</RouterLink>
      </aside>
    </section>
  </main>
</template>

