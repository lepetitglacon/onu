<script setup>
import { ref } from 'vue'
import {useGallery} from "../composables/useGallery.js";

const gallery = useGallery()

const props = defineProps({
  card: {},
})

const clicked = ref(false)
</script>

<template>
  <img :src="gallery[gallery.indexOf('/src/assets/cards/' + card.imageUrl)]" :data-id="card.id">
</template>

<style scoped>

</style>
