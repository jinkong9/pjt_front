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
  document.title = '양도글 작성 | SSAFY Home'
})
</script>

<template>
  <main class="shell page-shell">
    <RouterLink class="text-link" to="/transfers">← 목록으로</RouterLink>
    <div class="section-head">
      <div>
        <p class="eyebrow">New Transfer</p>
        <h1 class="page-title">양도글 작성</h1>
        <p class="muted">계약 조건과 입주 가능일을 정확하게 입력해주세요.</p>
      </div>
    </div>

    <TransferForm submit-label="등록하기" :submitting="submitting" @submit="submitTransfer" />
  </main>
</template>
