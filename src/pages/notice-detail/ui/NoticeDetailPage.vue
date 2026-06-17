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
  <main class="shell page-shell mx-auto w-[min(1480px,calc(100%_-_48px))] py-28">
    <LoadingState v-if="loading" />
    <article v-else-if="notice" class="panel notice-detail border border-neutral-200 bg-white p-6">
      <RouterLink class="text-link text-sm font-black text-[#b4212a]" to="/notices">← 목록으로</RouterLink>
      <p class="eyebrow mt-8 text-xs font-black uppercase tracking-[0.28em] text-[#b4212a]">Notice</p>
      <h1 class="page-title mt-3 max-w-4xl text-[clamp(42px,6vw,76px)] font-black leading-none">
        {{ notice.title }}
      </h1>
      <p class="muted mt-3 text-sm font-bold leading-7 text-neutral-500">
        {{ notice.writer }} · {{ notice.createdAt?.slice(0, 10) }}
      </p>
      <div class="notice-body mt-8 whitespace-pre-wrap text-base font-bold leading-8 text-neutral-700">
        {{ notice.content }}
      </div>
    </article>
  </main>
</template>
