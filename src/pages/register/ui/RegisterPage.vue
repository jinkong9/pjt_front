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
  <main class="register-page">
    <section class="register-card">
      <div class="register-form-pane">
        <p class="register-eyebrow">Register</p>
        <h1>회원가입</h1>
        <p v-if="error" class="alert error">{{ error }}</p>
        <form class="register-form" @submit.prevent="register">
          <label>이름 <input v-model="form.name" required /></label>
          <label>이메일 <input v-model="form.email" type="email" required /></label>
          <label>비밀번호 <input v-model="form.password" type="password" required /></label>
          <label>비밀번호 확인 <input v-model="form.passwordConfirm" type="password" required /></label>
          <label>전화번호 <input v-model="form.phone" required /></label>
          <button type="submit" class="register-submit">가입하기</button>
        </form>
        <div class="register-links">
          <RouterLink to="/login">로그인</RouterLink>
          <RouterLink to="/home">홈으로</RouterLink>
        </div>
      </div>
      <aside class="register-welcome-pane">
        <p class="register-welcome-eyebrow">Join SSAFY Home</p>
        <h2>주거 정보를 한곳에서 관리하세요</h2>
        <p>공공임대 일정, 양도글, 관심 매물을 편하게 이어서 볼 수 있어요.</p>
        <RouterLink class="register-login-button" to="/login">이미 계정이 있나요?</RouterLink>
      </aside>
    </section>
  </main>
</template>

<style scoped>
.register-page {
  display: grid;
  min-height: calc(100svh - 80px);
  align-items: center;
  padding: clamp(28px, 4.8vh, 56px) 24px;
  background: #f4f0ea;
}

.register-card {
  display: grid;
  grid-template-columns: minmax(0, 1.04fr) minmax(360px, 0.96fr);
  width: min(1120px, calc(100vw - 48px));
  min-height: min(690px, calc(100svh - 118px));
  margin: 0 auto;
  overflow: hidden;
  border: 1px solid #e0ddd7;
  background: #ffffff;
  box-shadow: 0 22px 58px rgba(23, 23, 23, 0.12);
}

.register-form-pane {
  display: grid;
  width: min(100%, 500px);
  align-content: center;
  justify-self: center;
  padding: 48px 52px;
}

.register-eyebrow,
.register-welcome-eyebrow {
  margin: 0;
  color: #b4212a;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.28em;
  text-transform: uppercase;
}

.register-form-pane h1 {
  margin: 16px 0 0;
  font-size: clamp(38px, 4vw, 50px);
  font-weight: 400;
  line-height: 1;
}

.register-form {
  display: grid;
  gap: 13px;
  margin-top: 26px;
}

.register-form label {
  display: grid;
  gap: 8px;
  color: #171717;
  font-size: 14px;
  font-weight: 900;
}

.register-form input {
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

.register-form input:focus {
  border-color: #b4212a;
  box-shadow: 0 0 0 3px rgba(180, 33, 42, 0.12);
}

.register-submit {
  min-height: 54px;
  margin-top: 6px;
  border: 1px solid #b4212a;
  background: #b4212a;
  color: #ffffff;
  font-size: 15px;
  font-weight: 900;
}

.register-submit:hover {
  border-color: #921b22;
  background: #921b22;
}

.register-links {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 12px;
  margin-top: 24px;
  font-size: 14px;
  font-weight: 900;
}

.register-links a {
  color: #b4212a;
}

.register-welcome-pane {
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 18px;
  padding: 48px 42px;
  background:
    linear-gradient(180deg, rgba(23, 23, 23, 0.9), rgba(23, 23, 23, 0.82)),
    url('https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80')
      center/cover;
  color: #ffffff;
  text-align: center;
}

.register-welcome-eyebrow {
  color: rgba(255, 255, 255, 0.74);
}

.register-welcome-pane h2 {
  max-width: 380px;
  margin: 0;
  color: #ffffff;
  font-size: clamp(32px, 3.2vw, 44px);
  font-weight: 400;
  line-height: 1.12;
}

.register-welcome-pane p:not(.register-welcome-eyebrow) {
  max-width: 380px;
  margin: 0;
  color: rgba(255, 255, 255, 0.84);
  font-size: 15px;
  font-weight: 800;
  line-height: 1.7;
}

.register-login-button {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  margin-top: 4px;
  border: 1px solid rgba(255, 255, 255, 0.78);
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
  padding: 0 24px;
  font-size: 14px;
  font-weight: 900;
}

@media (max-width: 899px) {
  .register-page {
    min-height: calc(100svh - 72px);
    padding: 24px 16px 40px;
  }

  .register-card {
    grid-template-columns: 1fr;
    min-height: 0;
  }

  .register-form-pane {
    width: 100%;
    padding: 34px 24px;
  }

  .register-welcome-pane {
    order: -1;
    min-height: 230px;
    padding: 34px 24px;
  }
}
</style>
