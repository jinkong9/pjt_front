import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

import AiChatWidget from './AiChatWidget.vue'
import { askAiChat } from '@/shared/api/aiChatApi'

vi.mock('@/shared/api/aiChatApi', () => ({
  askAiChat: vi.fn(),
}))

describe('AiChatWidget', () => {
  it('keeps user messages readable and sends the current page context with questions', async () => {
    askAiChat.mockResolvedValue({ answer: '답변입니다.', indexedDocumentCount: 8 })
    const wrapper = mount(AiChatWidget, {
      props: {
        context: '현재 화면: 실거래 지도 상세보기\n지도 기준 위치: 서울특별시 강남구 역삼동',
      },
    })

    await wrapper.get('[data-testid="ai-chat-toggle"]').trigger('click')
    expect(wrapper.text()).toContain('이 지역 실거래가 알려줘')
    expect(wrapper.text()).not.toContain('강남구 최근 실거래가 알려줘')

    await wrapper.get('[data-testid="ai-chat-input"]').setValue('테스트 질문')
    await wrapper.get('[data-testid="ai-chat-form"]').trigger('submit')
    await flushPromises()

    expect(askAiChat).toHaveBeenCalledWith(
      expect.stringContaining('지도 기준 위치: 서울특별시 강남구 역삼동'),
    )
    expect(askAiChat).toHaveBeenCalledWith(expect.stringContaining('사용자 질문: 테스트 질문'))

    const messages = wrapper.get('[data-testid="ai-chat-messages"]')
    expect(messages.classes()).toContain('min-h-0')
    expect(messages.classes()).toContain('!h-auto')

    const userMessageClasses = wrapper.get('[data-testid="ai-chat-message-user"]').classes()
    expect(userMessageClasses).toContain('!bg-[#b4212a]')
    expect(userMessageClasses).toContain('!text-white')
    expect(userMessageClasses).not.toContain('bg-white')
  })
})
