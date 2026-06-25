<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppNav from '@/widgets/app-nav/ui/AppNav.vue'

const route = useRoute()
const showGlobalNav = computed(() => route.name !== 'prices')
</script>

<template>
  <AppNav v-if="showGlobalNav" />
  <RouterView />
</template>
