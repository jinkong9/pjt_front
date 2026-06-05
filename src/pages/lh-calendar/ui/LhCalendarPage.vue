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
  <main class="shell page-shell">
    <div class="section-head">
      <div>
        <p class="eyebrow">LH Calendar</p>
        <h1 class="page-title">LH 캘린더</h1>
        <p class="muted">공고일, 접수 시작, 접수 마감, 마감일을 월간 일정으로 확인합니다.</p>
      </div>
      <div class="calendar-actions">
        <button type="button" class="button danger" @click="moveMonth(-1)">이전</button>
        <strong>{{ monthLabel }}</strong>
        <button type="button" class="button primary" @click="moveMonth(1)">다음</button>
      </div>
    </div>

    <LoadingState v-if="loading" />
    <section v-else class="panel calendar-panel">
      <div class="calendar-weekdays">
        <span>일</span>
        <span>월</span>
        <span>화</span>
        <span>수</span>
        <span>목</span>
        <span>금</span>
        <span>토</span>
      </div>
      <div class="calendar-grid">
        <article
          v-for="day in calendarDays"
          :key="day.key"
          class="calendar-day"
          :class="{ muted: !day.inMonth }"
        >
          <strong>{{ day.day }}</strong>
          <div class="calendar-events">
            <RouterLink
              v-for="event in day.events"
              :key="`${event.type}-${event.notice.rentalNoticeId}`"
              class="calendar-event"
              :to="`/rentals/${event.notice.rentalNoticeId}`"
            >
              <span>{{ event.type }}</span>
              {{ event.notice.title }}
            </RouterLink>
          </div>
        </article>
      </div>
    </section>
  </main>
</template>
