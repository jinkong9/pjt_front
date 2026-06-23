import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

import AiChatWidget from './AiChatWidget.vue'
import { askAiChat } from '@/shared/api/aiChatApi'

vi.mock('@/shared/api/aiChatApi', () => ({
  askAiChat: vi.fn(),
}))

describe('AiChatWidget', () => {
  it('keeps user messages readable and lets the message area fill the panel', async () => {
    askAiChat.mockResolvedValue({ answer: '답변입니다.', indexedDocumentCount: 8 })
    const wrapper = mount(AiChatWidget)

    await wrapper.get('[data-testid="ai-chat-toggle"]').trigger('click')
    await wrapper.get('[data-testid="ai-chat-input"]').setValue('테스트 질문')
    await wrapper.get('[data-testid="ai-chat-form"]').trigger('submit')
    await flushPromises()

    const messages = wrapper.get('[data-testid="ai-chat-messages"]')
    expect(messages.classes()).toContain('min-h-0')
    expect(messages.classes()).toContain('!h-auto')

    const userMessageClasses = wrapper.get('[data-testid="ai-chat-message-user"]').classes()
    expect(userMessageClasses).toContain('!bg-[#b4212a]')
    expect(userMessageClasses).toContain('!text-white')
    expect(userMessageClasses).not.toContain('bg-white')
  })
})
