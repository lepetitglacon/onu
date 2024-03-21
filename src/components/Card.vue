<script setup>
import { ref } from 'vue'

const props = defineProps({
  gallery: {},
  card: {},
})

const clicked = ref(false)
</script>

<template>
  <img :src="gallery[gallery.indexOf('/src/assets/cards/' + card.imageUrl)]" :data-id="card.id">
</template>

<style scoped>
img {
	position: relative;
	left: -50px;
  max-width: 150px;
}
</style>
