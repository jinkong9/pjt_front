<script setup>
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useMemberStore } from '@/entities/member/model/member'

const memberStore = useMemberStore()

onMounted(() => {
  if (!memberStore.loaded) {
    memberStore.fetchMe()
  }
})
</script>

<template>
  <header class="site-header">
    <nav class="nav">
      <RouterLink class="brand" to="/home">
        <span class="brand-mark">HOME</span>
        <strong>SSAFY Home</strong>
      </RouterLink>
      <div class="nav-links">
        <RouterLink to="/home">홈</RouterLink>
        <RouterLink to="/prices">부동산 시세</RouterLink>
        <RouterLink to="/rentals">공공임대</RouterLink>
        <RouterLink to="/transfers">양도 게시판</RouterLink>
        <RouterLink to="/lh-calendar">LH 캘린더</RouterLink>
        <RouterLink to="/notices">공지사항</RouterLink>
        <RouterLink to="/analysis">생활권 분석</RouterLink>
        <RouterLink v-if="!memberStore.isLoggedIn" to="/login">로그인</RouterLink>
        <RouterLink v-if="!memberStore.isLoggedIn" to="/register">회원가입</RouterLink>
        <RouterLink v-if="memberStore.isLoggedIn" to="/member">마이페이지</RouterLink>
        <RouterLink class="nav-cta" to="/rentals">공공임대 보기</RouterLink>
        <RouterLink class="nav-cta" to="/transfers">양도글 보기</RouterLink>
      </div>
    </nav>
    <aside class="quick-sidebar">
      <RouterLink to="/notices">공지사항</RouterLink>
      <RouterLink to="/prices">실거래 검색</RouterLink>
      <RouterLink to="/transfers">양도 게시판</RouterLink>
      <RouterLink to="/lh-calendar">LH 캘린더</RouterLink>
      <RouterLink to="/member">회원정보</RouterLink>
      <RouterLink to="/analysis">생활권 분석</RouterLink>
    </aside>
  </header>
</template>

