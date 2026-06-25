<script setup>
import { computed, nextTick, ref } from 'vue'
import { useMutation } from '@tanstack/vue-query'
import { askAiChat } from '@/shared/api/aiChatApi'

const props = defineProps({
  context: {
    type: String,
    default: '',
  },
})

const isOpen = ref(false)
const draft = ref('')
const isSending = ref(false)
const messages = ref([
  {
    id: 1,
    role: 'assistant',
    text: '안녕하세요. HappyHome AI 상담봇입니다. 지금 보고 있는 위치를 기준으로 질문해 주세요.',
    meta: 'RAG 기반 답변',
  },
])
const messageList = ref(null)
const chatMutation = useMutation({
  mutationFn: (question) => askAiChat(question),
})

const quickQuestions = ['이 지역 실거래가 알려줘', '이 지역 생활 편의성 어때?']
const contextPrefix = computed(() => props.context.trim())

function toggleChat() {
  isOpen.value = !isOpen.value
}

function closeChat() {
  isOpen.value = false
}

async function scrollToBottom() {
  await nextTick()
  if (messageList.value) {
    messageList.value.scrollTop = messageList.value.scrollHeight
  }
}

async function sendMessage(question = draft.value) {
  const trimmed = question.trim()
  if (!trimmed || isSending.value) return

  messages.value.push({
    id: Date.now(),
    role: 'user',
    text: trimmed,
  })
  draft.value = ''
  isSending.value = true
  await scrollToBottom()

  try {
    const contextualQuestion = contextPrefix.value
      ? `${contextPrefix.value}\n\n사용자 질문: ${trimmed}`
      : trimmed
    const response = await chatMutation.mutateAsync(contextualQuestion)
    messages.value.push({
      id: Date.now() + 1,
      role: 'assistant',
      text: response.answer || '답변을 가져오지 못했어요. 질문을 조금 다르게 입력해 주세요.',
      meta: `참고 문서 ${response.indexedDocumentCount.toLocaleString()}개`,
    })
  } catch {
    messages.value.push({
      id: Date.now() + 1,
      role: 'assistant',
      text: '지금 AI 서버와 연결이 원활하지 않아요. 백엔드 실행 상태를 확인한 뒤 다시 시도해 주세요.',
      meta: '연결 실패',
      isError: true,
    })
  } finally {
    isSending.value = false
    await scrollToBottom()
  }
}
</script>

<template>
  <section
    class="ai-chat-widget fixed bottom-6 right-6 z-[70] grid justify-items-end gap-4"
    :class="{ open: isOpen }"
    aria-label="AI 챗봇"
  >
    <transition name="ai-chat-panel">
      <article
        v-if="isOpen"
        class="ai-chat-panel grid !h-[min(640px,calc(100vh_-_120px))] !w-[min(420px,calc(100vw_-_32px))] grid-rows-[auto_minmax(0,1fr)_auto_auto] overflow-hidden border border-neutral-200 bg-white shadow-[0_24px_70px_rgba(23,23,23,0.24)]"
      >
        <header
          class="ai-chat-header flex items-center justify-between gap-4 bg-[#b4212a] p-4 text-white"
        >
          <div class="ai-chat-title flex items-center gap-3">
            <span
              class="ai-chat-avatar grid h-11 w-11 place-items-center rounded-2xl border border-white/35 bg-white/15"
              aria-hidden="true"
            >
              <span class="h-5 w-5 rounded-full border-2 border-white"></span>
            </span>
            <div>
              <strong class="block font-black">HappyHome AI</strong>
            </div>
          </div>
          <button
            class="ai-chat-close inline-flex min-h-9 w-9 items-center justify-center border border-white/40 bg-white/10 text-xl font-black text-white"
            type="button"
            aria-label="챗봇 닫기"
            @click="closeChat"
          >
            x
          </button>
        </header>

        <div
          ref="messageList"
          data-testid="ai-chat-messages"
          class="ai-chat-messages !grid !h-auto min-h-0 content-start gap-3 overflow-y-auto bg-[#f7f4ef] p-4"
        >
          <div
            v-for="message in messages"
            :key="message.id"
            :data-testid="`ai-chat-message-${message.role}`"
            class="ai-chat-message max-w-[86%] border p-3 text-sm font-bold leading-6"
            :class="[
              message.role === 'user'
                ? 'user justify-self-end border-[#b4212a] !bg-[#b4212a] !text-white'
                : 'assistant justify-self-start border-neutral-200 !bg-white !text-[#171717]',
              { 'error border-red-200 !bg-red-50 !text-red-700': message.isError },
            ]"
          >
            <p>{{ message.text }}</p>
            <small v-if="message.meta" class="mt-2 block text-[11px] font-black opacity-70">{{
              message.meta
            }}</small>
          </div>

          <div
            v-if="isSending"
            class="ai-chat-message assistant typing flex w-fit gap-1 border border-neutral-200 bg-white p-3"
          >
            <span class="h-2 w-2 animate-bounce rounded-full bg-neutral-400"></span>
            <span
              class="h-2 w-2 animate-bounce rounded-full bg-neutral-400 [animation-delay:0.12s]"
            ></span>
            <span
              class="h-2 w-2 animate-bounce rounded-full bg-neutral-400 [animation-delay:0.24s]"
            ></span>
          </div>
        </div>

        <div class="ai-chat-prompts flex flex-wrap gap-2 border-t border-neutral-200 bg-white p-3">
          <button
            v-for="question in quickQuestions"
            :key="question"
            type="button"
            class="min-h-8 border border-neutral-200 bg-white px-3 text-xs font-black text-[#171717] disabled:opacity-50"
            :disabled="isSending"
            @click="sendMessage(question)"
          >
            {{ question }}
          </button>
        </div>

        <form
          data-testid="ai-chat-form"
          class="ai-chat-form grid grid-cols-[1fr_auto] gap-2 border-t border-neutral-200 bg-white p-3"
          @submit.prevent="sendMessage()"
        >
          <textarea
            v-model="draft"
            data-testid="ai-chat-input"
            class="min-h-11 resize-none border border-neutral-200 bg-white px-3 py-2 text-sm font-bold outline-0"
            rows="1"
            placeholder="궁금한 내용을 입력하세요"
            :disabled="isSending"
            @keydown.enter.exact.prevent="sendMessage()"
          ></textarea>
          <button
            type="submit"
            class="inline-flex min-h-11 items-center justify-center border border-[#b4212a] bg-[#b4212a] px-4 text-sm font-black text-white disabled:opacity-50"
            :disabled="isSending || !draft.trim()"
          >
            전송
          </button>
        </form>
      </article>
    </transition>

    <button
      data-testid="ai-chat-toggle"
      class="ai-chat-fab flex min-h-[72px] items-center gap-3 rounded-full border border-[#b4212a] bg-[#b4212a] px-5 font-black text-white shadow-[0_18px_40px_rgba(180,33,42,0.28)]"
      type="button"
      :aria-expanded="isOpen"
      aria-label="AI 챗봇 열기"
      @click="toggleChat"
    >
      <span
        class="ai-chat-fab-face relative grid h-10 w-10 place-items-center rounded-2xl border-2 border-white"
        aria-hidden="true"
      >
        <span class="h-2 w-2 rounded-full bg-white shadow-[14px_0_0_#fff]"></span>
      </span>
      <strong>AI</strong>
    </button>
  </section>
</template>

<style scoped>
.ai-chat-panel-enter-active,
.ai-chat-panel-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.ai-chat-panel-enter-from,
.ai-chat-panel-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
</style>
