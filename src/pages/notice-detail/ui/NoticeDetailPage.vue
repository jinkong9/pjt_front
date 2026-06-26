<script setup>
import { computed, onMounted } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { RouterLink, useRoute } from 'vue-router'
import { appQueryOptions } from '@/shared/query/appQueries'
import LoadingState from '@/shared/ui/LoadingState.vue'

const route = useRoute()
const noticeQuery = useQuery(computed(() => appQueryOptions.noticeDetail(route.params.noticeId)))
const loading = computed(() => noticeQuery.isPending.value)
const notice = computed(() => noticeQuery.data.value)

onMounted(() => {
  document.title = '공지사항 상세 | HOME FIT'
})
</script>

<template>
  <main class="min-h-[calc(100svh-80px)] bg-[#f4f0ea] px-6 py-[72px] text-[#171717]">
    <div class="mx-auto w-[min(680px,calc(100vw-48px))]">
      <RouterLink class="text-sm font-black text-[#b4212a]" to="/notices">
        공지사항 목록
      </RouterLink>

      <LoadingState v-if="loading" />
      <template v-else-if="notice">
        <article
          class="mt-7 border border-neutral-200 bg-white px-10 py-9 shadow-[0_18px_44px_rgba(23,23,23,0.08)] max-[640px]:px-6"
        >
          <p class="m-0 text-xs font-black uppercase tracking-[0.28em] text-[#b4212a]">Notice</p>
          <h1 class="mt-4 text-[clamp(34px,4vw,48px)] font-black leading-tight">
            {{ notice.title }}
          </h1>

          <dl class="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm font-black text-neutral-500">
            <div class="flex gap-1">
              <dt>작성자</dt>
              <dd>{{ notice.writer }}</dd>
            </div>
            <div class="flex gap-1">
              <dt>등록</dt>
              <dd>{{ notice.createdAt?.replace('T', ' ').slice(0, 16) }}</dd>
            </div>
          </dl>

          <div class="mt-8 border-t border-neutral-200 pt-8">
            <p class="whitespace-pre-wrap text-base font-bold leading-8 text-neutral-700">
              {{ notice.content }}
            </p>
          </div>
        </article>
      </template>
    </div>
  </main>
</template>
