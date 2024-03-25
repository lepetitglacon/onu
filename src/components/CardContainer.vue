<script setup>
import { ref } from 'vue'
import Card from "./Card.vue";

const props = defineProps({
    cards: [],
	clickFunction: null,
	fill: false,
	back: false
})

const rotationOffset = 10
const getStyle = (i) => {
	return {
		left: `-${i * 50}px`,
		// top: `${-i * -i * Math.PI/2}px`,
		transform: `rotate(${i * Math.PI - rotationOffset}deg)`
	}
}

const clicked = ref(false)
</script>

<template>
	<div class="card-container">

		<template v-if="fill">

			<Card v-for="card in cards" :card="{imageUrl: 'back.png'}" :style="getStyle(card)"/>

		</template>
		<template v-else>

			<Card v-for="(card, index) in cards"
			      :key="card.id"
			      :card="card"
			      :style="getStyle(index)"
			      @click="clickFunction"
			>
				{{ card }}
			</Card>


		</template>




	</div>
</template>

<style scoped>

</style>
