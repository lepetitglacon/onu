<script setup>
import { ref } from 'vue'

const props = defineProps({
  gallery: {},
  card: {}
})

const clicked = ref(false)
</script>

<template>
  <img :src="gallery[gallery.indexOf('/src/assets/cards/' + card.imageUrl)]" class="card">
</template>

<style scoped>
img {
  max-width: 150px;
}
</style>
