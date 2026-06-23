<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useMemberStore } from '@/entities/member/model/member'
import {
  createTransferComment,
  deleteTransfer,
  deleteTransferComment,
  toggleFavoriteTransfer,
  updateTransferComment,
} from '@/entities/transfer/api/transferApi'
import { transferKeys, transferQueryOptions } from '@/entities/transfer/model/transferQueries'
import { formatManwonToKoreanMoney } from '@/shared/lib/formatMoney'
import LoadingState from '@/shared/ui/LoadingState.vue'

const route = useRoute()
const router = useRouter()
const memberStore = useMemberStore()
const queryClient = useQueryClient()
const failedImages = ref(new Set())
const favorite = ref(false)
const commentContent = ref('')
const commentLoading = ref(false)
const commentError = ref('')
const editingCommentId = ref(null)
const editingContent = ref('')
const transferId = computed(() => route.params.transferId)
const detailQuery = useQuery(computed(() => transferQueryOptions.detail(transferId.value)))
const commentsQuery = useQuery(computed(() => transferQueryOptions.comments(transferId.value)))
const post = computed(() => detailQuery.data.value)
const comments = computed(() => commentsQuery.data.value ?? [])
const loading = computed(() => detailQuery.isPending.value || commentsQuery.isPending.value)

const deleteTransferMutation = useMutation({
  mutationFn: () => deleteTransfer(transferId.value),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: transferKeys.all }),
})
const favoriteMutation = useMutation({
  mutationFn: () => toggleFavoriteTransfer(transferId.value),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: transferKeys.all }),
})
const createCommentMutation = useMutation({
  mutationFn: (content) => createTransferComment(transferId.value, content),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: transferKeys.comments(transferId.value) }),
})
const updateCommentMutation = useMutation({
  mutationFn: ({ commentId, content }) => updateTransferComment(commentId, content),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: transferKeys.comments(transferId.value) }),
})
const deleteCommentMutation = useMutation({
  mutationFn: (commentId) => deleteTransferComment(commentId),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: transferKeys.comments(transferId.value) }),
})

const currentUserId = computed(() => memberStore.current?.userId ?? '')

function formatMoney(value) {
  return formatManwonToKoreanMoney(value)
}

function markFailedImage(imageUrl) {
  failedImages.value = new Set([...failedImages.value, imageUrl])
}

function isOwnComment(comment) {
  return Boolean(currentUserId.value) && comment.writerId === currentUserId.value
}

function formatDate(value) {
  if (!value) return ''
  return String(value).replace('T', ' ').slice(0, 16)
}

onMounted(() => {
  document.title = '양도 상세 | HOME FIT'
})

watch(post, (nextPost) => {
  if (nextPost?.title) document.title = `${nextPost.title} | HOME FIT`
})

async function removeTransfer() {
  if (!window.confirm('양도글을 삭제할까요?')) return
  await deleteTransferMutation.mutateAsync()
  router.push('/transfers')
}

async function toggleFavorite() {
  const result = await favoriteMutation.mutateAsync()
  favorite.value = Boolean(result.favorite)
}

async function submitComment() {
  const content = commentContent.value.trim()
  if (!content || commentLoading.value) return

  commentLoading.value = true
  commentError.value = ''
  try {
    await createCommentMutation.mutateAsync(content)
    commentContent.value = ''
  } catch {
    commentError.value = '댓글을 등록하지 못했습니다.'
  } finally {
    commentLoading.value = false
  }
}

function startEdit(comment) {
  editingCommentId.value = comment.commentId
  editingContent.value = comment.content
}

function cancelEdit() {
  editingCommentId.value = null
  editingContent.value = ''
}

async function saveComment(comment) {
  const content = editingContent.value.trim()
  if (!content || commentLoading.value) return

  commentLoading.value = true
  commentError.value = ''
  try {
    await updateCommentMutation.mutateAsync({ commentId: comment.commentId, content })
    cancelEdit()
  } catch {
    commentError.value = '댓글을 수정하지 못했습니다.'
  } finally {
    commentLoading.value = false
  }
}

async function removeComment(comment) {
  if (commentLoading.value) return

  commentLoading.value = true
  commentError.value = ''
  try {
    await deleteCommentMutation.mutateAsync(comment.commentId)
    if (editingCommentId.value === comment.commentId) {
      cancelEdit()
    }
  } catch {
    commentError.value = '댓글을 삭제하지 못했습니다.'
  } finally {
    commentLoading.value = false
  }
}
</script>

<template>
  <main class="shell page-shell mx-auto w-[min(1480px,calc(100%_-_48px))] py-24">
    <LoadingState v-if="loading" />
    <template v-else-if="post">
      <RouterLink class="text-link text-sm font-black text-[#b4212a]" to="/transfers">목록으로</RouterLink>
      <div class="section-head mb-7 mt-5 flex flex-wrap items-start justify-between gap-5">
        <div>
          <p class="eyebrow m-0 text-xs font-black uppercase tracking-[0.28em] text-[#b4212a]">
            Transfer Detail
          </p>
          <h1 class="page-title mt-3 max-w-4xl text-[clamp(30px,4vw,46px)] font-black leading-tight">
            {{ post.title }}
          </h1>
          <p class="muted mt-3 text-sm font-bold leading-7 text-neutral-500">
            {{ post.address }} {{ post.detailAddress }} · {{ post.status }}
          </p>
        </div>
        <div class="detail-actions flex flex-wrap gap-2">
          <button
            type="button"
            data-testid="transfer-detail-favorite"
            class="button danger inline-flex min-h-11 items-center justify-center border border-[#b4212a] bg-white px-[18px] font-black text-[#b4212a]"
            @click="toggleFavorite"
          >
            {{ favorite ? '관심 해제' : '관심' }}
          </button>
          <RouterLink
            class="button inline-flex min-h-11 items-center justify-center border border-[#171717] bg-[#171717] px-[18px] font-black text-white"
            :to="`/transfers/${post.transferId}/edit`"
          >
            수정
          </RouterLink>
          <button
            type="button"
            class="button danger inline-flex min-h-11 items-center justify-center border border-[#b4212a] bg-white px-[18px] font-black text-[#b4212a]"
            @click="removeTransfer"
          >
            삭제
          </button>
          <a
            class="button primary inline-flex min-h-11 items-center justify-center border border-[#b4212a] bg-[#b4212a] px-[18px] font-black text-white"
            :href="`tel:${post.contactPhone}`"
          >
            연락하기
          </a>
        </div>
      </div>

      <section
        v-if="post.imageUrls?.length"
        data-testid="transfer-detail-gallery"
        class="transfer-detail-gallery mb-8 grid gap-4"
      >
        <div
          data-testid="transfer-detail-hero-image"
          class="grid aspect-[16/9] h-auto max-h-[560px] w-full place-items-center overflow-hidden border border-neutral-200 bg-[#f7f4ef] text-xs font-black tracking-[0.16em] text-neutral-400"
        >
          <img
            v-if="!failedImages.has(post.imageUrls[0])"
            class="!h-full w-full object-cover"
            :src="post.imageUrls[0]"
            :alt="post.title"
            @error="markFailedImage(post.imageUrls[0])"
          />
          <span v-else>NO IMAGE</span>
        </div>
        <div v-if="post.imageUrls.length > 1" class="transfer-gallery-thumbs grid grid-cols-2 gap-4 lg:grid-cols-1">
          <div
            v-for="imageUrl in post.imageUrls.slice(1)"
            :key="imageUrl"
            class="grid h-[140px] place-items-center border border-neutral-200 bg-[#f7f4ef] text-xs font-black tracking-[0.16em] text-neutral-400"
          >
            <img
              v-if="!failedImages.has(imageUrl)"
              class="h-full w-full object-cover"
              :src="imageUrl"
              :alt="post.title"
              @error="markFailedImage(imageUrl)"
            />
            <span v-else>NO IMAGE</span>
          </div>
        </div>
      </section>

      <section data-testid="transfer-detail-panels" class="split transfer-detail-layout mt-0 grid gap-5 lg:grid-cols-2">
        <article class="panel border border-neutral-200 bg-white p-6">
          <h2 class="text-2xl font-black text-[#171717]">양도 조건</h2>
          <dl class="detail-grid mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div class="border-b border-neutral-100 pb-3"><dt class="block text-xs font-black text-neutral-500">보증금</dt><dd class="mt-1 block font-black">{{ formatMoney(post.depositAmount) }}</dd></div>
            <div class="border-b border-neutral-100 pb-3"><dt class="block text-xs font-black text-neutral-500">월세</dt><dd class="mt-1 block font-black">{{ formatMoney(post.monthlyRentAmount) }}</dd></div>
            <div class="border-b border-neutral-100 pb-3"><dt class="block text-xs font-black text-neutral-500">관리비</dt><dd class="mt-1 block font-black">{{ formatMoney(post.maintenanceFee) }}</dd></div>
            <div class="border-b border-neutral-100 pb-3"><dt class="block text-xs font-black text-neutral-500">양도비</dt><dd class="mt-1 block font-black">{{ formatMoney(post.transferFee) }}</dd></div>
            <div class="border-b border-neutral-100 pb-3"><dt class="block text-xs font-black text-neutral-500">전용면적</dt><dd class="mt-1 block font-black">{{ post.exclusiveArea || '-' }}㎡</dd></div>
            <div class="border-b border-neutral-100 pb-3"><dt class="block text-xs font-black text-neutral-500">층수</dt><dd class="mt-1 block font-black">{{ post.floor || '-' }}</dd></div>
            <div class="border-b border-neutral-100 pb-3"><dt class="block text-xs font-black text-neutral-500">입주 가능일</dt><dd class="mt-1 block font-black">{{ post.moveInDate || '-' }}</dd></div>
            <div class="border-b border-neutral-100 pb-3"><dt class="block text-xs font-black text-neutral-500">계약 종료일</dt><dd class="mt-1 block font-black">{{ post.contractEndDate || '-' }}</dd></div>
          </dl>
        </article>

        <article class="panel border border-neutral-200 bg-white p-6">
          <h2 class="text-2xl font-black text-[#171717]">상세 설명</h2>
          <p class="notice-body mt-5 whitespace-pre-wrap text-base font-bold leading-8 text-neutral-700">
            {{ post.content }}
          </p>
          <div class="contact-box mt-6 border border-neutral-200 bg-[#f7f4ef] p-5">
            <span class="text-xs font-black uppercase tracking-[0.14em] text-neutral-500">연락처</span>
            <strong class="mt-2 block text-2xl font-black">{{ post.contactPhone || '-' }}</strong>
          </div>
        </article>
      </section>

      <section class="panel mt-6 border border-neutral-200 bg-white p-6" data-testid="transfer-comments">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p class="eyebrow m-0 text-xs font-black uppercase tracking-[0.24em] text-[#b4212a]">Comments</p>
            <h2 class="mt-2 text-2xl font-black text-[#171717]">댓글 {{ comments.length }}</h2>
          </div>
          <RouterLink v-if="!memberStore.isLoggedIn" class="text-link text-sm font-black text-[#b4212a]" to="/login">
            로그인 후 댓글 작성
          </RouterLink>
        </div>

        <form
          v-if="memberStore.isLoggedIn"
          class="mt-5 grid gap-3"
          data-testid="transfer-comment-submit"
          @submit.prevent="submitComment"
        >
          <textarea
            v-model="commentContent"
            data-testid="transfer-comment-input"
            class="min-h-24 resize-y border border-neutral-300 bg-white p-4 text-sm font-bold leading-6 outline-none focus:border-[#b4212a]"
            placeholder="댓글을 입력하세요."
          />
          <div class="flex flex-wrap items-center justify-between gap-3">
            <p class="text-sm font-bold text-[#b4212a]">{{ commentError }}</p>
            <button
              type="submit"
              class="button primary inline-flex min-h-11 items-center justify-center border border-[#b4212a] bg-[#b4212a] px-[18px] font-black text-white disabled:opacity-50"
              :disabled="commentLoading || !commentContent.trim()"
            >
              등록
            </button>
          </div>
        </form>

        <ul class="mt-6 divide-y divide-neutral-100">
          <li v-for="comment in comments" :key="comment.commentId" class="py-5">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <strong class="block text-sm font-black text-[#171717]">{{ comment.writerId }}</strong>
                <span class="mt-1 block text-xs font-bold text-neutral-500">{{ formatDate(comment.createdAt) }}</span>
              </div>
              <div v-if="isOwnComment(comment)" class="flex gap-2">
                <button
                  type="button"
                  :data-testid="`transfer-comment-edit-${comment.commentId}`"
                  class="text-sm font-black text-[#171717]"
                  @click="startEdit(comment)"
                >
                  수정
                </button>
                <button
                  type="button"
                  :data-testid="`transfer-comment-delete-${comment.commentId}`"
                  class="text-sm font-black text-[#b4212a]"
                  @click="removeComment(comment)"
                >
                  삭제
                </button>
              </div>
            </div>

            <form
              v-if="editingCommentId === comment.commentId"
              class="mt-4 grid gap-3"
              :data-testid="`transfer-comment-save-${comment.commentId}`"
              @submit.prevent="saveComment(comment)"
            >
              <textarea
                v-model="editingContent"
                :data-testid="`transfer-comment-edit-input-${comment.commentId}`"
                class="min-h-20 resize-y border border-neutral-300 bg-white p-4 text-sm font-bold leading-6 outline-none focus:border-[#b4212a]"
              />
              <div class="flex justify-end gap-2">
                <button type="button" class="px-4 text-sm font-black text-neutral-500" @click="cancelEdit">취소</button>
                <button
                  type="submit"
                  class="button inline-flex min-h-10 items-center justify-center border border-[#171717] bg-[#171717] px-4 text-sm font-black text-white disabled:opacity-50"
                  :disabled="commentLoading || !editingContent.trim()"
                >
                  저장
                </button>
              </div>
            </form>
            <p v-else class="mt-4 whitespace-pre-wrap text-sm font-bold leading-7 text-neutral-700">
              {{ comment.content }}
            </p>
          </li>
        </ul>
        <p v-if="!comments.length" class="mt-6 border-t border-neutral-100 pt-6 text-sm font-bold text-neutral-500">
          아직 등록된 댓글이 없습니다.
        </p>
      </section>
    </template>
  </main>
</template>
