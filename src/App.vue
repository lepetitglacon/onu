<script setup>
import {reactive, ref} from "vue";
import { io } from "socket.io-client";
import bg from "./assets/background.png";
import Card from "./components/Card.vue";
import CardContainer from "./components/CardContainer.vue";


const state = reactive({
  connected: false,
  players: [],
  cards: [],
  pile: [],
	currentPLayer: ''
});

// "undefined" means the URL will be computed from the `window.location` object
const URL = "http://localhost:3333";
const socket = io(URL);
console.log('connecting to ' + URL)

const handleCardClick = (e) => {
  console.log(e)
  e.player = {
    id: socket.id,
  }
  e.card = {
    id: e.target.dataset.id
  }
  e.action = 'play'
  socket.emit("player-turn", e);
}
const handlePiocheClick = (e) => {
  e.player = {
    id: socket.id,
  }
  e.action = 'draw'
  socket.emit("player-turn", e);
}
const handleStart = () => {
  console.log('sending admin start')
  socket.emit("admin-start");
}

socket.on("connect", () => {
  state.connected = true;
});
socket.on("disconnect", () => {
  state.connected = false;
});
socket.on("starting-cards", (cards) => {
  state.cards = cards;
});
socket.on("players", (players) => {
  console.log("players", players)
  state.players = players
});
socket.on("player-remove", (socket) => {
  console.log(socket)
  state.players.filter((el) => el !== socket);
});
socket.on("game-info", (infos) => {
  console.log(infos)
  state.pile = infos.lastPileCard
  state.currentPLayer = infos.currentPlayer
});

</script>

<template>
    <img :src="bg" id="background-image">

    <div id="center">
	    <div><p>{{socket.id}}</p></div>
      <div>
        <p>ONU</p>
      </div>
      <div>
        <p>Pile</p>
        <Card v-if="state.pile"
              :card="state.pile"
        />
      </div>
      <div>
        <p>Pioche</p>
        <Card
	        @click="handlePiocheClick"
	        :card="{imageUrl: 'back.png'}"
        />
      </div>
    </div>

    <div>
      <h2>Players</h2>
      <div v-for="player in state.players" :key="player.id">
        <pre>{{ player.id }}</pre>

	      <CardContainer
		      v-if="player.id !== socket.id"
		      :cards="player.cards"
		      :fill="true"
		      :back="true"/>

      </div>
    </div>

	<div id="hand">
		<h2>Cards</h2>
		<div><p v-if="state.currentPLayer === socket.id">À vous de jouer</p></div>
		<div v-if="state.cards.length > 0" class="hand-container">
			<CardContainer :cards="state.cards" :click-function="handleCardClick"/>
		</div>
	</div>

    <button @click="handleStart">Lancer</button>
</template>

<style scoped>
#center {
	display: flex;
	flex-direction: column;
}
.card-container {

}
</style>
