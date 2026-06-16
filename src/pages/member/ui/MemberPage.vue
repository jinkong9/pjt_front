<script setup>
import { onMounted, reactive, ref, watchEffect } from 'vue'
import { RouterLink } from 'vue-router'
import { api } from '@/shared/api/client'
import { useMemberStore } from '@/entities/member/model/member'
import EmptyState from '@/shared/ui/EmptyState.vue'
import FinancialProfileForm from '@/features/property-detail/ui/FinancialProfileForm.vue'
import { getFinancialProfile, saveFinancialProfile } from '@/entities/member/api/financialProfileApi'

const memberStore = useMemberStore()
const favorites = ref([])
const message = ref('')
const financialProfile = ref(null)
const financialProfileLoaded = ref(false)
const financialSaving = ref(false)
const financialMessage = ref('')
const form = reactive({
  password: '',
  name: '',
  email: '',
  phone: '',
})

watchEffect(() => {
  if (memberStore.current) {
    form.name = memberStore.current.name
    form.email = memberStore.current.email
    form.phone = memberStore.current.phone
  }
})

async function loadFavorites() {
  try {
    const { data } = await api.get('/favorites')
    favorites.value = data
  } catch {
    favorites.value = []
  }
}

async function updateMe() {
  message.value = ''
  await memberStore.update(form)
  form.password = ''
  message.value = '회원 정보가 수정되었습니다.'
}

async function loadFinancialProfile() {
  try {
    financialProfile.value = await getFinancialProfile()
  } catch (error) {
    if (error.response?.status !== 204) {
      financialMessage.value = '금융 프로필을 불러오지 못했습니다.'
    }
  } finally {
    financialProfileLoaded.value = true
  }
}

async function updateFinancialProfile(payload) {
  financialSaving.value = true
  financialMessage.value = ''
  try {
    financialProfile.value = await saveFinancialProfile(payload)
    financialMessage.value = '금융 프로필이 저장되었습니다.'
  } finally {
    financialSaving.value = false
  }
}

onMounted(async () => {
  await memberStore.fetchMe()
  if (memberStore.isLoggedIn) {
    await Promise.all([loadFavorites(), loadFinancialProfile()])
  }
})
</script>

<template>
  <main class="shell page-shell">
    <section v-if="!memberStore.isLoggedIn" class="panel">
      <p class="eyebrow">Member</p>
      <h1 class="page-title">로그인이 필요합니다</h1>
      <RouterLink class="button primary" to="/login">로그인</RouterLink>
    </section>

    <template v-else>
      <div class="section-head">
        <div>
          <p class="eyebrow">My Page</p>
          <h1 class="page-title">{{ memberStore.current.name }}님</h1>
          <p class="muted">{{ memberStore.current.email }} · {{ memberStore.current.phone }}</p>
        </div>
      </div>

      <section class="split">
        <article class="panel">
          <h2>회원 정보 수정</h2>
          <p v-if="message" class="alert">{{ message }}</p>
          <form class="auth-form" @submit.prevent="updateMe">
            <label>새 비밀번호 <input v-model="form.password" type="password" placeholder="변경 시 입력" /></label>
            <label>이름 <input v-model="form.name" required /></label>
            <label>이메일 <input v-model="form.email" type="email" required /></label>
            <label>전화번호 <input v-model="form.phone" required /></label>
            <button type="submit">수정하기</button>
          </form>
        </article>

        <article class="panel">
          <h2>관심 실거래</h2>
          <EmptyState v-if="!favorites.length" message="저장한 관심 실거래가 없습니다." />
          <ul v-else class="clean-list">
            <li v-for="deal in favorites" :key="deal.no">
              <strong>{{ deal.aptName }}</strong>
              <span>{{ deal.address }} · {{ deal.dealAmount }}만원</span>
            </li>
          </ul>
        </article>
      </section>

      <section v-if="financialProfileLoaded" class="panel mt-6">
        <h2>금융 프로필</h2>
        <p class="muted">실거래 지도 대출 계산에 사용할 자산과 상환 정보를 관리합니다.</p>
        <p v-if="financialMessage" class="alert">{{ financialMessage }}</p>
        <div class="mt-5 max-w-xl">
          <FinancialProfileForm
            :initial-value="financialProfile"
            :saving="financialSaving"
            @save="updateFinancialProfile"
          />
        </div>
      </section>
    </template>
  </main>
</template>
