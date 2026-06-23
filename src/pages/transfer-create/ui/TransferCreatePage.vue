<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { createTransfer } from '@/entities/transfer/api/transferApi'
import TransferForm from '@/features/transfer-form/ui/TransferForm.vue'

const router = useRouter()
const submitting = ref(false)

async function submitTransfer({ fields, images }) {
  submitting.value = true
  try {
    const created = await createTransfer(fields, images)
    router.push(`/transfers/${created.transferId}`)
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  document.title = '양도글 작성 | HOME FIT'
})
</script>

<template>
  <main class="shell page-shell mx-auto w-[min(1480px,calc(100%_-_48px))] py-28">
    <RouterLink class="text-link text-sm font-black text-[#b4212a]" to="/transfers">← 목록으로</RouterLink>
    <div class="section-head mb-8 mt-6 flex items-end justify-between gap-6">
      <div>
        <p class="eyebrow m-0 text-xs font-black uppercase tracking-[0.28em] text-[#b4212a]">
          New Transfer
        </p>
        <h1 class="page-title mt-3 max-w-4xl text-[clamp(42px,6vw,76px)] font-black leading-none">
          양도글 작성
        </h1>
        <p class="muted mt-3 text-sm font-bold leading-7 text-neutral-500">
          계약 조건과 입주 가능일을 정확하게 입력해주세요.
        </p>
      </div>
    </div>

    <TransferForm submit-label="등록하기" :submitting="submitting" @submit="submitTransfer" />
  </main>
</template>
