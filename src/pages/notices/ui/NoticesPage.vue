<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { api } from '@/shared/api/client'
import EmptyState from '@/shared/ui/EmptyState.vue'
import LoadingState from '@/shared/ui/LoadingState.vue'

const loading = ref(true)
const notices = ref([])

onMounted(async () => {
  loading.value = true
  try {
    const { data } = await api.get('/notices', { params: { limit: 50 } })
    notices.value = data
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <main class="shell page-shell">
    <div class="section-head">
      <div>
        <p class="eyebrow">Notice</p>
        <h1 class="page-title">공지사항</h1>
      </div>
    </div>

    <LoadingState v-if="loading" />
    <EmptyState v-else-if="!notices.length" message="공지사항이 없습니다." />
    <div v-else class="panel table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>번호</th>
            <th>제목</th>
            <th>작성자</th>
            <th>등록일</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="notice in notices" :key="notice.noticeId">
            <td>{{ notice.noticeId }}</td>
            <td><RouterLink :to="`/notices/${notice.noticeId}`">{{ notice.title }}</RouterLink></td>
            <td>{{ notice.writer }}</td>
            <td>{{ notice.createdAt?.slice(0, 10) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </main>
</template>

