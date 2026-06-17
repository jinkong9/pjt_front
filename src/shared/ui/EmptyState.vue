<script setup>
defineProps({
  message: {
    type: String,
    default: '표시할 데이터가 없습니다.',
  },
})
</script>

<template>
  <p class="panel muted border border-neutral-200 bg-white p-6 text-sm font-bold text-neutral-500">
    {{ message }}
  </p>
</template>
