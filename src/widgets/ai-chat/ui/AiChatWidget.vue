<script setup>
import { nextTick, ref } from 'vue'
import { askAiChat } from '@/shared/api/aiChatApi'

const isOpen = ref(false)
const draft = ref('')
const isSending = ref(false)
const messages = ref([
  {
    id: 1,
    role: 'assistant',
    text: '안녕하세요. HappyHome AI 상담봇입니다. 매물, 임대 공고, 지역 분석에 대해 물어보세요.',
    meta: 'RAG 기반 답변',
  },
])
const messageList = ref(null)

const quickQuestions = [
  '강남구 최근 실거래가 알려줘',
  '청년 임대 공고 찾아줘',
  '이 지역 생활 편의성 어때?',
]

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
    const response = await askAiChat(trimmed)
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
  <section class="ai-chat-widget" :class="{ open: isOpen }" aria-label="AI 챗봇">
    <transition name="ai-chat-panel">
      <article v-if="isOpen" class="ai-chat-panel">
        <header class="ai-chat-header">
          <div class="ai-chat-title">
            <span class="ai-chat-avatar" aria-hidden="true">
              <span></span>
            </span>
            <div>
              <strong>HappyHome AI</strong>
              <small>Spring AI RAG 상담봇</small>
            </div>
          </div>
          <button class="ai-chat-close" type="button" aria-label="챗봇 닫기" @click="closeChat">
            ×
          </button>
        </header>

        <div ref="messageList" class="ai-chat-messages">
          <div
            v-for="message in messages"
            :key="message.id"
            class="ai-chat-message"
            :class="[message.role, { error: message.isError }]"
          >
            <p>{{ message.text }}</p>
            <small v-if="message.meta">{{ message.meta }}</small>
          </div>

          <div v-if="isSending" class="ai-chat-message assistant typing">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>

        <div class="ai-chat-prompts">
          <button
            v-for="question in quickQuestions"
            :key="question"
            type="button"
            :disabled="isSending"
            @click="sendMessage(question)"
          >
            {{ question }}
          </button>
        </div>

        <form class="ai-chat-form" @submit.prevent="sendMessage()">
          <textarea
            v-model="draft"
            rows="1"
            placeholder="궁금한 내용을 입력하세요"
            :disabled="isSending"
            @keydown.enter.exact.prevent="sendMessage()"
          ></textarea>
          <button type="submit" :disabled="isSending || !draft.trim()">전송</button>
        </form>
      </article>
    </transition>

    <button
      class="ai-chat-fab"
      type="button"
      :aria-expanded="isOpen"
      aria-label="AI 챗봇 열기"
      @click="toggleChat"
    >
      <span class="ai-chat-fab-face" aria-hidden="true">
        <span></span>
      </span>
      <strong>AI</strong>
    </button>
  </section>
</template>
