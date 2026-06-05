<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMemberStore } from '@/entities/member/model/member'

const router = useRouter()
const memberStore = useMemberStore()
const error = ref('')
const form = reactive({
  userId: '',
  password: '',
  name: '',
  email: '',
  phone: '',
})

async function register() {
  error.value = ''
  try {
    await memberStore.register(form)
    router.push('/login')
  } catch {
    error.value = '이미 사용 중인 아이디이거나 입력값이 올바르지 않습니다.'
  }
}
</script>

<template>
  <main class="auth-page">
    <section class="auth-visual">
      <div>
        <p class="eyebrow">Join HappyHome</p>
        <h1>나에게 맞는 주거 정보를 모아보세요</h1>
      </div>
    </section>
    <section class="auth-panel">
      <div class="auth-box">
        <p class="eyebrow">Register</p>
        <h1>회원가입</h1>
        <p v-if="error" class="alert error">{{ error }}</p>
        <form class="auth-form" @submit.prevent="register">
          <label>아이디 <input v-model="form.userId" required /></label>
          <label>비밀번호 <input v-model="form.password" type="password" required /></label>
          <label>이름 <input v-model="form.name" required /></label>
          <label>이메일 <input v-model="form.email" type="email" required /></label>
          <label>전화번호 <input v-model="form.phone" required /></label>
          <button type="submit">가입하기</button>
        </form>
      </div>
    </section>
  </main>
</template>

