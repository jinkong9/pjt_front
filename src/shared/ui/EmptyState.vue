<script setup>
defineProps({
  message: {
    type: String,
    default: '표시할 데이터가 없습니다.',
  },
})
</script>

<template>
  <p class="panel muted">{{ message }}</p>
</template>

