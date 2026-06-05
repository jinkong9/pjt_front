<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { api } from '@/shared/api/client'
import LoadingState from '@/shared/ui/LoadingState.vue'

const route = useRoute()
const loading = ref(true)
const notice = ref(null)

onMounted(async () => {
  loading.value = true
  try {
    const { data } = await api.get(`/notices/${route.params.noticeId}`)
    notice.value = data
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <main class="shell page-shell">
    <LoadingState v-if="loading" />
    <article v-else-if="notice" class="panel notice-detail">
      <RouterLink class="text-link" to="/notices">← 목록으로</RouterLink>
      <p class="eyebrow">Notice</p>
      <h1 class="page-title">{{ notice.title }}</h1>
      <p class="muted">{{ notice.writer }} · {{ notice.createdAt?.slice(0, 10) }}</p>
      <div class="notice-body">{{ notice.content }}</div>
    </article>
  </main>
</template>

