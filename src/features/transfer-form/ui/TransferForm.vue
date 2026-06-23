<script setup>
import { computed, reactive, ref, watch } from 'vue'

const props = defineProps({
  initialTransfer: {
    type: Object,
    default: null,
  },
  submitLabel: {
    type: String,
    default: '등록하기',
  },
  submitting: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['submit'])

const form = reactive({
  title: '',
  content: '',
  status: '양도가능',
  address: '',
  detailAddress: '',
  floor: '',
  exclusiveArea: '',
  depositAmount: '',
  monthlyRentAmount: '',
  maintenanceFee: '',
  transferFee: '',
  contractEndDate: '',
  moveInDate: '',
  contactPhone: '',
  imageUrls: [],
})

const images = ref([])
const imagePreviews = computed(() => images.value.map((image) => URL.createObjectURL(image)))

watch(
  () => props.initialTransfer,
  (transfer) => {
    if (!transfer) return

    Object.assign(form, {
      title: transfer.title ?? '',
      content: transfer.content ?? '',
      status: transfer.status ?? '양도가능',
      address: transfer.address ?? '',
      detailAddress: transfer.detailAddress ?? '',
      floor: transfer.floor ?? '',
      exclusiveArea: transfer.exclusiveArea ?? '',
      depositAmount: transfer.depositAmount ?? '',
      monthlyRentAmount: transfer.monthlyRentAmount ?? '',
      maintenanceFee: transfer.maintenanceFee ?? '',
      transferFee: transfer.transferFee ?? '',
      contractEndDate: transfer.contractEndDate ?? '',
      moveInDate: transfer.moveInDate ?? '',
      contactPhone: transfer.contactPhone ?? '',
      imageUrls: [...(transfer.imageUrls ?? [])],
    })
  },
  { immediate: true },
)

function onImageChange(event) {
  images.value = Array.from(event.target.files ?? [])
}

function removeExistingImage(index) {
  form.imageUrls.splice(index, 1)
}

function submitForm() {
  emit('submit', {
    fields: { ...form, imageUrls: [...form.imageUrls] },
    images: images.value,
  })
}
</script>

<template>
  <form class="transfer-form grid gap-5" @submit.prevent="submitForm">
    <section class="panel form-section grid gap-5 border border-neutral-200 bg-white p-6">
      <div>
        <p class="eyebrow m-0 text-xs font-black uppercase tracking-[0.28em] text-[#b4212a]">Basic</p>
        <h2 class="mt-2 text-[34px] font-black text-[#171717]">기본 정보</h2>
      </div>
      <div class="form-grid grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label class="form-field wide col-span-2 grid gap-2 text-sm font-black">
          <span>제목</span>
          <input
            v-model="form.title"
            class="min-h-12 w-full border border-neutral-200 bg-white px-3 text-[15px] font-extrabold outline-0"
            required
            placeholder="예: 관악구 봉천동 역세권 원룸 양도합니다"
          />
        </label>
        <label class="form-field grid gap-2 text-sm font-black">
          <span>상태</span>
          <select
            v-model="form.status"
            class="min-h-12 w-full border border-neutral-200 bg-white px-3 text-[15px] font-extrabold outline-0"
            required
          >
            <option value="양도가능">양도가능</option>
            <option value="협의중">협의중</option>
            <option value="완료">완료</option>
          </select>
        </label>
        <label class="form-field wide col-span-2 grid gap-2 text-sm font-black">
          <span>상세 설명</span>
          <textarea
            v-model="form.content"
            class="min-h-36 w-full resize-y border border-neutral-200 bg-white px-3 py-3 text-[15px] font-extrabold outline-0"
            required
            placeholder="방 상태, 옵션, 양도 사유를 적어주세요."
          />
        </label>
      </div>
    </section>

    <section class="panel form-section grid gap-5 border border-neutral-200 bg-white p-6">
      <div>
        <p class="eyebrow m-0 text-xs font-black uppercase tracking-[0.28em] text-[#b4212a]">Images</p>
        <h2 class="mt-2 text-[34px] font-black text-[#171717]">사진</h2>
        <p class="muted mt-2 text-sm font-bold leading-7 text-neutral-500">
          방 구조와 컨디션이 잘 보이는 사진을 올려주세요.
        </p>
      </div>
      <label
        class="image-drop grid cursor-pointer place-items-center border border-dashed border-neutral-300 bg-[#f7f4ef] p-8 text-center"
      >
        <span>이미지 선택</span>
        <strong>JPG, PNG 파일 업로드</strong>
        <input type="file" accept="image/*" multiple @change="onImageChange" />
      </label>

      <div
        v-if="form.imageUrls.length || imagePreviews.length"
        class="image-preview-grid grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3"
      >
        <figure
          v-for="(imageUrl, index) in form.imageUrls"
          :key="imageUrl"
          class="image-preview relative overflow-hidden border border-neutral-200 bg-white"
        >
          <img class="h-36 w-full object-cover" :src="imageUrl" alt="기존 양도글 이미지" />
          <button
            type="button"
            class="image-remove absolute right-2 top-2 min-h-8 border border-[#b4212a] bg-white px-3 text-xs font-black text-[#b4212a]"
            @click="removeExistingImage(index)"
          >
            삭제
          </button>
        </figure>
        <figure
          v-for="imageUrl in imagePreviews"
          :key="imageUrl"
          class="image-preview overflow-hidden border border-neutral-200 bg-white"
        >
          <img class="h-36 w-full object-cover" :src="imageUrl" alt="새 양도글 이미지 미리보기" />
          <figcaption class="p-2 text-xs font-black text-neutral-500">새 이미지</figcaption>
        </figure>
      </div>
    </section>

    <section class="panel form-section grid gap-5 border border-neutral-200 bg-white p-6">
      <div>
        <p class="eyebrow m-0 text-xs font-black uppercase tracking-[0.28em] text-[#b4212a]">Location</p>
        <h2 class="mt-2 text-[34px] font-black text-[#171717]">위치 정보</h2>
      </div>
      <div class="form-grid grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label class="form-field grid gap-2 text-sm font-black">
          <span>주소</span>
          <input v-model="form.address" class="min-h-12 w-full border border-neutral-200 bg-white px-3 text-[15px] font-extrabold outline-0" required placeholder="서울 관악구 봉천동" />
        </label>
        <label class="form-field grid gap-2 text-sm font-black">
          <span>상세 주소</span>
          <input v-model="form.detailAddress" class="min-h-12 w-full border border-neutral-200 bg-white px-3 text-[15px] font-extrabold outline-0" required placeholder="역세권 원룸" />
        </label>
        <label class="form-field grid gap-2 text-sm font-black">
          <span>층수</span>
          <input v-model="form.floor" class="min-h-12 w-full border border-neutral-200 bg-white px-3 text-[15px] font-extrabold outline-0" placeholder="5층" />
        </label>
        <label class="form-field grid gap-2 text-sm font-black">
          <span>전용면적</span>
          <input v-model="form.exclusiveArea" class="min-h-12 w-full border border-neutral-200 bg-white px-3 text-[15px] font-extrabold outline-0" type="number" min="0" step="0.1" placeholder="23.4" />
        </label>
      </div>
    </section>

    <section class="panel form-section grid gap-5 border border-neutral-200 bg-white p-6">
      <div>
        <p class="eyebrow m-0 text-xs font-black uppercase tracking-[0.28em] text-[#b4212a]">Terms</p>
        <h2 class="mt-2 text-[34px] font-black text-[#171717]">금액과 일정</h2>
      </div>
      <div class="form-grid grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label class="form-field grid gap-2 text-sm font-black">
          <span>보증금</span>
          <input v-model="form.depositAmount" class="min-h-12 w-full border border-neutral-200 bg-white px-3 text-[15px] font-extrabold outline-0" type="number" min="0" required placeholder="1000" />
        </label>
        <label class="form-field grid gap-2 text-sm font-black">
          <span>월세</span>
          <input v-model="form.monthlyRentAmount" class="min-h-12 w-full border border-neutral-200 bg-white px-3 text-[15px] font-extrabold outline-0" type="number" min="0" required placeholder="62" />
        </label>
        <label class="form-field grid gap-2 text-sm font-black">
          <span>관리비</span>
          <input v-model="form.maintenanceFee" class="min-h-12 w-full border border-neutral-200 bg-white px-3 text-[15px] font-extrabold outline-0" type="number" min="0" required placeholder="8" />
        </label>
        <label class="form-field grid gap-2 text-sm font-black">
          <span>양도비</span>
          <input v-model="form.transferFee" class="min-h-12 w-full border border-neutral-200 bg-white px-3 text-[15px] font-extrabold outline-0" type="number" min="0" required placeholder="30" />
        </label>
        <label class="form-field grid gap-2 text-sm font-black">
          <span>입주 가능일</span>
          <input v-model="form.moveInDate" class="min-h-12 w-full border border-neutral-200 bg-white px-3 text-[15px] font-extrabold outline-0" type="date" required />
        </label>
        <label class="form-field grid gap-2 text-sm font-black">
          <span>계약 종료일</span>
          <input v-model="form.contractEndDate" class="min-h-12 w-full border border-neutral-200 bg-white px-3 text-[15px] font-extrabold outline-0" type="date" required />
        </label>
      </div>
    </section>

    <section class="panel form-section grid gap-5 border border-neutral-200 bg-white p-6">
      <div>
        <p class="eyebrow m-0 text-xs font-black uppercase tracking-[0.28em] text-[#b4212a]">Contact</p>
        <h2 class="mt-2 text-[34px] font-black text-[#171717]">연락 정보</h2>
      </div>
      <div class="form-grid grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label class="form-field grid gap-2 text-sm font-black">
          <span>연락처</span>
          <input v-model="form.contactPhone" class="min-h-12 w-full border border-neutral-200 bg-white px-3 text-[15px] font-extrabold outline-0" required placeholder="010-0000-0000" />
        </label>
      </div>
    </section>

    <div class="form-actions flex justify-end">
      <button
        type="submit"
        class="button primary inline-flex min-h-11 items-center justify-center border border-[#b4212a] bg-[#b4212a] px-[18px] font-black text-white disabled:opacity-60"
        :disabled="submitting"
      >
        {{ submitting ? '저장 중' : submitLabel }}
      </button>
    </div>
  </form>
</template>
