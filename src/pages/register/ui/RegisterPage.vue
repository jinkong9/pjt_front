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
  <main class="grid min-h-[calc(100svh-80px)] items-center bg-[#f4f0ea] px-6 py-[clamp(28px,4.8vh,56px)] max-[899px]:min-h-[calc(100svh-72px)] max-[899px]:px-4 max-[899px]:pb-10 max-[899px]:pt-6">
    <section
      data-testid="register-card"
      class="mx-auto grid min-h-[min(690px,calc(100svh-118px))] w-[min(1120px,calc(100vw-48px))] grid-cols-[minmax(0,1.04fr)_minmax(360px,0.96fr)] overflow-hidden border border-[#e0ddd7] bg-white shadow-[0_22px_58px_rgba(23,23,23,0.12)] max-[899px]:min-h-0 max-[899px]:grid-cols-1"
    >
      <div class="grid w-[min(100%,500px)] content-center justify-self-center px-[52px] py-12 max-[899px]:w-full max-[899px]:px-6 max-[899px]:py-[34px]">
        <p class="m-0 text-xs font-black uppercase tracking-[0.28em] text-[#b4212a]">Register</p>
        <h1 class="mt-4 text-[clamp(38px,4vw,50px)] font-normal leading-none">회원가입</h1>
        <p v-if="error" class="mt-4 border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">
          {{ error }}
        </p>
        <form class="mt-[26px] grid gap-[13px]" @submit.prevent="register">
          <label class="grid gap-2 text-sm font-black text-[#171717]">
            이름
            <input
              v-model="form.name"
              required
              class="min-h-12 border border-[#d4d4d4] bg-white px-3.5 text-inherit outline-none transition-[border-color,box-shadow] duration-150 focus:border-[#b4212a] focus:shadow-[0_0_0_3px_rgba(180,33,42,0.12)]"
            />
          </label>
          <label class="grid gap-2 text-sm font-black text-[#171717]">
            이메일
            <input
              v-model="form.email"
              type="email"
              required
              class="min-h-12 border border-[#d4d4d4] bg-white px-3.5 text-inherit outline-none transition-[border-color,box-shadow] duration-150 focus:border-[#b4212a] focus:shadow-[0_0_0_3px_rgba(180,33,42,0.12)]"
            />
          </label>
          <label class="grid gap-2 text-sm font-black text-[#171717]">
            비밀번호
            <input
              v-model="form.password"
              type="password"
              required
              class="min-h-12 border border-[#d4d4d4] bg-white px-3.5 text-inherit outline-none transition-[border-color,box-shadow] duration-150 focus:border-[#b4212a] focus:shadow-[0_0_0_3px_rgba(180,33,42,0.12)]"
            />
          </label>
          <label class="grid gap-2 text-sm font-black text-[#171717]">
            비밀번호 확인
            <input
              v-model="form.passwordConfirm"
              type="password"
              required
              class="min-h-12 border border-[#d4d4d4] bg-white px-3.5 text-inherit outline-none transition-[border-color,box-shadow] duration-150 focus:border-[#b4212a] focus:shadow-[0_0_0_3px_rgba(180,33,42,0.12)]"
            />
          </label>
          <label class="grid gap-2 text-sm font-black text-[#171717]">
            전화번호
            <input
              v-model="form.phone"
              required
              class="min-h-12 border border-[#d4d4d4] bg-white px-3.5 text-inherit outline-none transition-[border-color,box-shadow] duration-150 focus:border-[#b4212a] focus:shadow-[0_0_0_3px_rgba(180,33,42,0.12)]"
            />
          </label>
          <button
            type="submit"
            class="mt-1.5 min-h-[54px] border border-[#b4212a] bg-[#b4212a] text-[15px] font-black text-white hover:border-[#921b22] hover:bg-[#921b22]"
          >
            가입하기
          </button>
        </form>
        <div class="mt-6 flex flex-wrap justify-between gap-3 text-sm font-black">
          <RouterLink class="text-[#b4212a]" to="/login">로그인</RouterLink>
          <RouterLink class="text-[#b4212a]" to="/home">홈으로</RouterLink>
        </div>
      </div>
      <aside class="grid content-center justify-items-center gap-[18px] bg-[linear-gradient(180deg,rgba(23,23,23,0.9),rgba(23,23,23,0.82)),url('https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center px-[42px] py-12 text-center text-white max-[899px]:order-[-1] max-[899px]:min-h-[230px] max-[899px]:px-6 max-[899px]:py-[34px]">
        <p class="m-0 text-xs font-black uppercase tracking-[0.28em] text-white/75">Join SSAFY Home</p>
        <h2 class="m-0 max-w-[380px] text-[clamp(32px,3.2vw,44px)] font-normal leading-[1.12] text-white">
          주거 정보를 한곳에서 관리하세요
        </h2>
        <p class="m-0 max-w-[380px] text-[15px] font-extrabold leading-[1.7] text-white/85">
          공공임대 일정, 양도글, 관심 매물을 편하게 이어서 볼 수 있어요.
        </p>
        <RouterLink
          class="mt-1 inline-flex min-h-11 items-center justify-center border border-white/80 bg-white/10 px-6 text-sm font-black text-white"
          to="/login"
        >
          이미 계정이 있나요?
        </RouterLink>
      </aside>
    </section>
  </main>
</template>
