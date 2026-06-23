<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { RouterLink } from 'vue-router'
import { rentalQueryOptions } from '@/entities/rental/model/rentalQueries'
import LoadingState from '@/shared/ui/LoadingState.vue'

const currentDate = ref(new Date())
const todayKey = toIsoDate(new Date())
const selectedDay = ref(null)
const calendarQuery = useQuery(rentalQueryOptions.list({ size: 100 }))
const loading = computed(() => calendarQuery.isPending.value)
const notices = computed(() => calendarQuery.data.value ?? [])

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
      isToday: isoDate === todayKey,
      events: eventsByDate.value[isoDate] ?? [],
    }
  })
})

const eventsByDate = computed(() => {
  const grouped = {}
  notices.value.forEach((notice) => {
    addEvent(grouped, notice.noticeDate, '공고일', 'notice', notice)
    addEvent(grouped, notice.applyStartDate, '접수시작', 'start', notice)
    addEvent(grouped, notice.applyEndDate, '접수마감', 'end', notice)
    addEvent(grouped, notice.closeDate, '마감일', 'close', notice)
  })
  return grouped
})

function toIsoDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function normalizeDateKey(value) {
  if (!value) return ''
  const raw = String(value).trim()
  const isoMatch = raw.match(/^(\d{4})[-./년\s]?(\d{1,2})[-./월\s]?(\d{1,2})/)
  if (isoMatch) {
    const [, year, month, day] = isoMatch
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }
  const compactMatch = raw.match(/^(\d{4})(\d{2})(\d{2})$/)
  if (compactMatch) {
    const [, year, month, day] = compactMatch
    return `${year}-${month}-${day}`
  }
  return ''
}

function addEvent(grouped, date, type, tone, notice) {
  const dateKey = normalizeDateKey(date)
  if (!dateKey) return
  if (!grouped[dateKey]) grouped[dateKey] = []
  grouped[dateKey].push({ type, tone, notice })
}

function collectNoticeDateKeys(items) {
  return items
    .flatMap((notice) => [
      normalizeDateKey(notice.applyStartDate),
      normalizeDateKey(notice.applyEndDate),
      normalizeDateKey(notice.closeDate),
      normalizeDateKey(notice.noticeDate),
    ])
    .filter(Boolean)
    .sort()
}

function moveToFirstScheduleMonth(items) {
  const todayKey = toIsoDate(new Date())
  const dateKeys = collectNoticeDateKeys(items)
  const targetKey = dateKeys.find((dateKey) => dateKey >= todayKey) || dateKeys[0]
  if (!targetKey) return
  currentDate.value = new Date(`${targetKey}T00:00:00`)
}

function eventToneClass(tone) {
  if (tone === 'start') return 'bg-blue-50 text-blue-700'
  if (tone === 'end' || tone === 'close') return 'bg-[#fff1f2] text-[#b4212a]'
  return 'bg-[#f7f4ef] text-[#171717]'
}

function openDayModal(day) {
  selectedDay.value = day
}

function closeDayModal() {
  selectedDay.value = null
}

function moveMonth(amount) {
  const next = new Date(currentDate.value)
  next.setMonth(next.getMonth() + amount)
  currentDate.value = next
}

function syncCalendarMonth(rentalNotices) {
  moveToFirstScheduleMonth(rentalNotices)
}

onMounted(() => {
  document.title = 'LH 캘린더 | SSAFY Home'
  syncCalendarMonth(notices.value)
})

watch(notices, syncCalendarMonth, { immediate: true })
</script>

<template>
  <main class="shell page-shell mx-auto w-[min(1720px,calc(100%_-_48px))] py-24">
    <div class="section-head mb-8 flex items-end justify-between gap-6">
      <div>
        <p class="eyebrow m-0 text-xs font-black uppercase tracking-[0.28em] text-[#b4212a]">LH Calendar</p>
        <h1 class="page-title mt-3 max-w-4xl text-[clamp(42px,6vw,76px)] font-black leading-none">
          LH 캘린더
        </h1>
        <p class="muted mt-3 text-sm font-bold leading-7 text-neutral-500">
          LH 공고 일정을 월간 캘린더에서 한눈에 확인합니다.
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
      <div class="overflow-x-auto">
        <div class="min-w-[720px]">
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
          class="calendar-day min-h-32 bg-white p-2.5"
          :class="{
            'muted bg-[#f7f4ef] text-neutral-400': !day.inMonth,
            'relative z-[1] ring-2 ring-[#b4212a] ring-inset': day.isToday,
          }"
        >
          <strong
            class="grid h-7 w-7 place-items-center text-sm font-black"
            :class="day.isToday ? 'bg-[#b4212a] text-white' : ''"
          >{{ day.day }}</strong>
          <div class="calendar-events mt-3 grid gap-1">
            <RouterLink
              v-for="event in day.events.slice(0, 3)"
              :key="`${event.type}-${event.notice.rentalNoticeId}`"
              data-testid="calendar-event"
              class="calendar-event block min-w-0 truncate border-l-[3px] px-2 py-1 text-xs font-black leading-4 transition hover:bg-white"
              :class="eventToneClass(event.tone)"
              :to="`/rentals/${event.notice.rentalNoticeId}`"
            >
              {{ event.notice.title }}
            </RouterLink>
            <button
              v-if="day.events.length > 3"
              type="button"
              data-testid="calendar-more"
              class="mt-1 min-h-7 text-left text-xs font-black text-neutral-500 hover:text-[#b4212a]"
              @click="openDayModal(day)"
            >
              +{{ day.events.length - 3 }}개 더 보기
            </button>
          </div>
        </article>
      </div>
        </div>
      </div>
    </section>

    <div
      v-if="selectedDay"
      class="fixed inset-0 z-50 grid place-items-center bg-black/35 px-4"
      data-testid="calendar-day-modal"
      @click.self="closeDayModal"
    >
      <section class="w-full max-w-2xl border border-neutral-200 bg-white shadow-2xl">
        <header class="flex items-start justify-between gap-4 border-b border-neutral-200 p-5">
          <div>
            <p class="text-xs font-black uppercase tracking-[0.2em] text-[#b4212a]">
              LH Schedule
            </p>
            <h2 class="mt-2 text-2xl font-black text-[#171717]">
              {{ selectedDay.key }} 일정
            </h2>
          </div>
          <button
            type="button"
            class="grid h-10 w-10 place-items-center border border-neutral-300 bg-white text-lg font-black hover:border-[#b4212a] hover:text-[#b4212a]"
            aria-label="일정 모달 닫기"
            @click="closeDayModal"
          >
            ×
          </button>
        </header>
        <div class="max-h-[60vh] overflow-y-auto p-5">
          <div class="grid gap-2">
            <RouterLink
              v-for="event in selectedDay.events"
              :key="`modal-${event.type}-${event.notice.rentalNoticeId}`"
              class="block min-w-0 truncate border-l-[3px] px-3 py-2 text-sm font-black leading-5 transition hover:bg-white"
              :class="eventToneClass(event.tone)"
              :to="`/rentals/${event.notice.rentalNoticeId}`"
              @click="closeDayModal"
            >
              {{ event.notice.title }}
            </RouterLink>
          </div>
        </div>
      </section>
    </div>
  </main>
</template>
