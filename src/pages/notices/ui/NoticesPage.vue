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
  <main class="shell page-shell mx-auto w-[min(1480px,calc(100%_-_48px))] py-28">
    <div class="section-head mb-8 flex items-end justify-between gap-6">
      <div>
        <p class="eyebrow m-0 text-xs font-black uppercase tracking-[0.28em] text-[#b4212a]">
          Notice
        </p>
        <h1 class="page-title mt-3 max-w-4xl text-[clamp(42px,6vw,76px)] font-black leading-none">
          공지사항
        </h1>
      </div>
    </div>

    <LoadingState v-if="loading" />
    <EmptyState v-else-if="!notices.length" message="공지사항이 없습니다." />
    <div v-else class="panel table-wrap overflow-x-auto border border-neutral-200 bg-white p-6">
      <table class="table w-full border-collapse text-left">
        <thead>
          <tr>
            <th class="border-b border-neutral-200 px-0 py-3 text-xs uppercase tracking-[0.14em] text-neutral-500">
              번호
            </th>
            <th class="border-b border-neutral-200 px-0 py-3 text-xs uppercase tracking-[0.14em] text-neutral-500">
              제목
            </th>
            <th class="border-b border-neutral-200 px-0 py-3 text-xs uppercase tracking-[0.14em] text-neutral-500">
              작성자
            </th>
            <th class="border-b border-neutral-200 px-0 py-3 text-xs uppercase tracking-[0.14em] text-neutral-500">
              등록일
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="notice in notices" :key="notice.noticeId">
            <td class="border-b border-neutral-100 px-0 py-4 text-sm font-bold">{{ notice.noticeId }}</td>
            <td class="border-b border-neutral-100 px-0 py-4 text-sm font-bold">
              <RouterLink class="hover:text-[#b4212a]" :to="`/notices/${notice.noticeId}`">{{
                notice.title
              }}</RouterLink>
            </td>
            <td class="border-b border-neutral-100 px-0 py-4 text-sm font-bold">{{ notice.writer }}</td>
            <td class="border-b border-neutral-100 px-0 py-4 text-sm font-bold">
              {{ notice.createdAt?.slice(0, 10) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </main>
</template>
