<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { fetchTransferDetail, updateTransfer } from '@/entities/transfer/api/transferApi'
import TransferForm from '@/features/transfer-form/ui/TransferForm.vue'
import LoadingState from '@/shared/ui/LoadingState.vue'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const submitting = ref(false)
const post = ref(null)

async function loadTransfer() {
  loading.value = true
  try {
    post.value = await fetchTransferDetail(route.params.transferId)
    document.title = `${post.value.title} 수정 | SSAFY Home`
  } finally {
    loading.value = false
  }
}

async function submitTransfer({ fields, images }) {
  submitting.value = true
  try {
    const updated = await updateTransfer(route.params.transferId, {
      ...post.value,
      ...fields,
    }, images)
    router.push(`/transfers/${updated.transferId}`)
  } finally {
    submitting.value = false
  }
}

onMounted(loadTransfer)
</script>

<template>
  <main class="shell page-shell">
    <RouterLink class="text-link" :to="`/transfers/${route.params.transferId}`">← 상세로</RouterLink>
    <LoadingState v-if="loading" />
    <template v-else-if="post">
      <div class="section-head">
        <div>
          <p class="eyebrow">Edit Transfer</p>
          <h1 class="page-title">양도글 수정</h1>
          <p class="muted">{{ post.title }}</p>
        </div>
      </div>

      <TransferForm
        :initial-transfer="post"
        submit-label="수정하기"
        :submitting="submitting"
        @submit="submitTransfer"
      />
    </template>
  </main>
</template>
