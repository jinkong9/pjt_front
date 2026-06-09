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
  <form class="transfer-form" @submit.prevent="submitForm">
    <section class="panel form-section">
      <div>
        <p class="eyebrow">Basic</p>
        <h2>기본 정보</h2>
      </div>
      <div class="form-grid">
        <label class="form-field wide">
          <span>제목</span>
          <input v-model="form.title" required placeholder="예: 관악구 봉천동 역세권 원룸 양도합니다" />
        </label>
        <label class="form-field">
          <span>상태</span>
          <select v-model="form.status" required>
            <option value="양도가능">양도가능</option>
            <option value="협의중">협의중</option>
            <option value="완료">완료</option>
          </select>
        </label>
        <label class="form-field wide">
          <span>상세 설명</span>
          <textarea v-model="form.content" required placeholder="방 상태, 옵션, 양도 사유를 적어주세요." />
        </label>
      </div>
    </section>

    <section class="panel form-section">
      <div>
        <p class="eyebrow">Images</p>
        <h2>사진</h2>
        <p class="muted">방 구조와 컨디션이 잘 보이는 사진을 올려주세요.</p>
      </div>
      <label class="image-drop">
        <span>이미지 선택</span>
        <strong>JPG, PNG 파일 업로드</strong>
        <input type="file" accept="image/*" multiple @change="onImageChange" />
      </label>

      <div v-if="form.imageUrls.length || imagePreviews.length" class="image-preview-grid">
        <figure v-for="(imageUrl, index) in form.imageUrls" :key="imageUrl" class="image-preview">
          <img :src="imageUrl" alt="기존 양도글 이미지" />
          <button type="button" class="image-remove" @click="removeExistingImage(index)">삭제</button>
        </figure>
        <figure v-for="imageUrl in imagePreviews" :key="imageUrl" class="image-preview">
          <img :src="imageUrl" alt="새 양도글 이미지 미리보기" />
          <figcaption>새 이미지</figcaption>
        </figure>
      </div>
    </section>

    <section class="panel form-section">
      <div>
        <p class="eyebrow">Location</p>
        <h2>위치 정보</h2>
      </div>
      <div class="form-grid">
        <label class="form-field">
          <span>주소</span>
          <input v-model="form.address" required placeholder="서울 관악구 봉천동" />
        </label>
        <label class="form-field">
          <span>상세 주소</span>
          <input v-model="form.detailAddress" required placeholder="역세권 원룸" />
        </label>
        <label class="form-field">
          <span>층수</span>
          <input v-model="form.floor" placeholder="5층" />
        </label>
        <label class="form-field">
          <span>전용면적</span>
          <input v-model="form.exclusiveArea" type="number" min="0" step="0.1" placeholder="23.4" />
        </label>
      </div>
    </section>

    <section class="panel form-section">
      <div>
        <p class="eyebrow">Terms</p>
        <h2>금액과 일정</h2>
      </div>
      <div class="form-grid">
        <label class="form-field">
          <span>보증금</span>
          <input v-model="form.depositAmount" type="number" min="0" required placeholder="1000" />
        </label>
        <label class="form-field">
          <span>월세</span>
          <input v-model="form.monthlyRentAmount" type="number" min="0" required placeholder="62" />
        </label>
        <label class="form-field">
          <span>관리비</span>
          <input v-model="form.maintenanceFee" type="number" min="0" required placeholder="8" />
        </label>
        <label class="form-field">
          <span>양도비</span>
          <input v-model="form.transferFee" type="number" min="0" required placeholder="30" />
        </label>
        <label class="form-field">
          <span>입주 가능일</span>
          <input v-model="form.moveInDate" type="date" required />
        </label>
        <label class="form-field">
          <span>계약 종료일</span>
          <input v-model="form.contractEndDate" type="date" required />
        </label>
      </div>
    </section>

    <section class="panel form-section">
      <div>
        <p class="eyebrow">Contact</p>
        <h2>연락 정보</h2>
      </div>
      <div class="form-grid">
        <label class="form-field">
          <span>연락처</span>
          <input v-model="form.contactPhone" required placeholder="010-0000-0000" />
        </label>
      </div>
    </section>

    <div class="form-actions">
      <button type="submit" class="button primary" :disabled="submitting">
        {{ submitting ? '저장 중' : submitLabel }}
      </button>
    </div>
  </form>
</template>
