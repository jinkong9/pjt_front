<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchRentalNotices } from '@/entities/rental/api/rentalApi'
import LoadingState from '@/shared/ui/LoadingState.vue'

const loading = ref(false)
const notices = ref([])
const currentDate = ref(new Date())

const monthLabel = computed(() =>
  new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long' }).format(currentDate.value),
)

const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const start = new Date(year, month, 1 - firstDay.getDay())

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    const isoDate = toIsoDate(date)
    return {
      key: isoDate,
      date,
      day: date.getDate(),
      inMonth: date.getMonth() === month,
      events: eventsByDate.value[isoDate] ?? [],
    }
  })
})

const eventsByDate = computed(() => {
  const grouped = {}
  notices.value.forEach((notice) => {
    addEvent(grouped, notice.noticeDate, '공고일', notice)
    addEvent(grouped, notice.applyStartDate, '접수시작', notice)
    addEvent(grouped, notice.applyEndDate, '접수마감', notice)
    addEvent(grouped, notice.closeDate, '마감일', notice)
  })
  return grouped
})

function toIsoDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function addEvent(grouped, date, type, notice) {
  if (!date) return
  if (!grouped[date]) grouped[date] = []
  grouped[date].push({ type, notice })
}

function moveMonth(amount) {
  const next = new Date(currentDate.value)
  next.setMonth(next.getMonth() + amount)
  currentDate.value = next
}

async function loadCalendar() {
  loading.value = true
  try {
    notices.value = await fetchRentalNotices({ size: 100 })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  document.title = 'LH 캘린더 | SSAFY Home'
  loadCalendar()
})
</script>

<template>
  <main class="shell page-shell mx-auto w-[min(1480px,calc(100%_-_48px))] py-28">
    <div class="section-head mb-8 flex items-end justify-between gap-6">
      <div>
        <p class="eyebrow m-0 text-xs font-black uppercase tracking-[0.28em] text-[#b4212a]">LH Calendar</p>
        <h1 class="page-title mt-3 max-w-4xl text-[clamp(42px,6vw,76px)] font-black leading-none">
          LH 캘린더
        </h1>
        <p class="muted mt-3 text-sm font-bold leading-7 text-neutral-500">
          공고일, 접수 시작, 접수 마감, 마감일을 월간 일정으로 확인합니다.
        </p>
      </div>
      <div class="calendar-actions flex items-center gap-3">
        <button
          type="button"
          class="button danger inline-flex min-h-11 items-center justify-center border border-[#b4212a] bg-white px-[18px] font-black text-[#b4212a]"
          @click="moveMonth(-1)"
        >
          이전
        </button>
        <strong class="min-w-36 text-center text-xl font-black">{{ monthLabel }}</strong>
        <button
          type="button"
          class="button primary inline-flex min-h-11 items-center justify-center border border-[#b4212a] bg-[#b4212a] px-[18px] font-black text-white"
          @click="moveMonth(1)"
        >
          다음
        </button>
      </div>
    </div>

    <LoadingState v-if="loading" />
    <section v-else class="panel calendar-panel border border-neutral-200 bg-white p-6">
      <div class="calendar-weekdays grid grid-cols-7 border-b border-neutral-200 pb-3 text-center text-xs font-black text-neutral-500">
        <span>일</span>
        <span>월</span>
        <span>화</span>
        <span>수</span>
        <span>목</span>
        <span>금</span>
        <span>토</span>
      </div>
      <div class="calendar-grid mt-3 grid grid-cols-7 gap-px bg-neutral-200">
        <article
          v-for="day in calendarDays"
          :key="day.key"
          class="calendar-day min-h-36 bg-white p-3"
          :class="{ 'muted bg-[#f7f4ef] text-neutral-400': !day.inMonth }"
        >
          <strong class="text-sm font-black">{{ day.day }}</strong>
          <div class="calendar-events mt-3 grid gap-1.5">
            <RouterLink
              v-for="event in day.events"
              :key="`${event.type}-${event.notice.rentalNoticeId}`"
              class="calendar-event grid gap-1 bg-[#fff1f2] p-2 text-xs font-black leading-4 text-[#b4212a]"
              :to="`/rentals/${event.notice.rentalNoticeId}`"
            >
              <span class="text-[10px] uppercase tracking-[0.12em] text-[#b4212a]/70">{{ event.type }}</span>
              {{ event.notice.title }}
            </RouterLink>
          </div>
        </article>
      </div>
    </section>
  </main>
</template>
