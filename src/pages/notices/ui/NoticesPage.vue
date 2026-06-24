<script setup>
import { computed, onMounted, ref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { RouterLink } from 'vue-router'
import { appQueryOptions } from '@/shared/query/appQueries'
import EmptyState from '@/shared/ui/EmptyState.vue'
import LoadingState from '@/shared/ui/LoadingState.vue'

const keyword = ref('')
const searchKeyword = ref('')
const noticesQuery = useQuery(appQueryOptions.noticeList({ limit: 50 }))
const loading = computed(() => noticesQuery.isPending.value)
const notices = computed(() => noticesQuery.data.value ?? [])

const filteredNotices = computed(() => {
  const query = searchKeyword.value.trim().toLowerCase()
  if (!query) return notices.value
  return notices.value.filter((notice) =>
    [notice.title, notice.content, notice.writer]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query)),
  )
})

function searchNotices() {
  searchKeyword.value = keyword.value
}

function resetSearch() {
  keyword.value = ''
  searchKeyword.value = ''
}

onMounted(() => {
  document.title = '공지사항 | HOME FIT'
})
</script>

<template>
  <main class="min-h-[calc(100svh-80px)] bg-[#f4f0ea] px-6 py-[72px] text-[#171717]">
    <div class="mx-auto w-[min(960px,calc(100vw-48px))]">
      <header class="mb-8 flex items-end justify-between gap-6">
        <div>
          <p class="m-0 text-xs font-black uppercase tracking-[0.28em] text-[#b4212a]">
            Notice Board
          </p>
          <h1 class="mt-3 text-[46px] font-black leading-none">공지사항</h1>
        </div>
        <button type="button" class="min-h-11 bg-[#171717] px-5 text-sm font-black text-white">
          등록
        </button>
      </header>

      <form
        class="mb-6 grid grid-cols-[minmax(0,1fr)_80px_80px] items-center gap-2 border border-neutral-200 bg-white p-3 shadow-[0_12px_34px_rgba(23,23,23,0.08)] max-[640px]:grid-cols-1"
        @submit.prevent="searchNotices"
      >
        <input
          v-model="keyword"
          class="h-12 min-w-0 border-0 px-4 text-sm font-bold outline-none"
          placeholder="제목, 내용, 작성자 검색"
        />

        <button
          type="submit"
          class="flex h-12 w-full items-center justify-center bg-[#b4212a] text-sm font-black text-white"
        >
          검색
        </button>

        <button
          type="button"
          class="flex h-12 w-full items-center justify-center border border-neutral-200 bg-white text-sm font-black text-[#171717]"
          @click="resetSearch"
        >
          초기화
        </button>
      </form>

      <LoadingState v-if="loading" />
      <EmptyState v-else-if="!filteredNotices.length" message="공지사항이 없습니다." />
      <div
        v-else
        class="overflow-x-auto border border-neutral-200 bg-white shadow-[0_10px_26px_rgba(23,23,23,0.05)]"
      >
        <table class="w-full min-w-[760px] border-collapse text-left">
          <thead>
            <tr class="bg-[#f8f9fb]">
              <th
                class="w-20 border-b border-neutral-200 px-5 py-4 text-xs font-black uppercase tracking-[0.24em] text-slate-500"
              >
                No
              </th>
              <th
                class="border-b border-neutral-200 px-5 py-4 text-xs font-black uppercase tracking-[0.24em] text-slate-500"
              >
                Title
              </th>
              <th
                class="w-28 border-b border-neutral-200 px-5 py-4 text-xs font-black uppercase tracking-[0.24em] text-slate-500"
              >
                Writer
              </th>
              <th
                class="w-40 border-b border-neutral-200 px-5 py-4 text-xs font-black uppercase tracking-[0.24em] text-slate-500"
              >
                Date
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="notice in filteredNotices" :key="notice.noticeId">
              <td class="border-b border-neutral-100 px-5 py-5 text-sm font-black text-[#b4212a]">
                {{ notice.noticeId }}
              </td>
              <td class="border-b border-neutral-100 px-5 py-5 text-lg font-black">
                <RouterLink class="hover:text-[#b4212a]" :to="`/notices/${notice.noticeId}`">
                  {{ notice.title }}
                </RouterLink>
              </td>
              <td class="border-b border-neutral-100 px-5 py-5 text-sm font-black">
                {{ notice.writer }}
              </td>
              <td class="border-b border-neutral-100 px-5 py-5 text-sm font-bold text-neutral-500">
                {{ notice.createdAt?.replace('T', ' ').slice(0, 16) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </main>
</template>
