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
	  pile: {},
	  draw: {},
		currentPLayer: '',
		winner: ''
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
	  state.pile = infos.pile
	  state.draw = infos.draw
	  state.currentPLayer = infos.currentPlayer
	});
	socket.on("game.win", (infos) => {
	  state.winner = infos.player
	});

</script>

<template>
    <img :src="bg" id="background-image">

	<div id="player-info">
		<p>{{socket.id}}</p>
		<p v-if="state.winner">{{ state.winner.title }}</p>
	</div>

    <div id="center-container">
	    <div id="center">

			<div>
				<h1>ONU</h1>
				<div><button>ONU</button></div>
			</div>

			<div>
				<p>Pile</p>
				<p>({{state.pile.length}})</p>
				<Card v-if="state.pile.lastCard"
				  :card="state.pile.lastCard"
				/>
			</div>

			<div>
				<p>Pioche</p>
				<p>{{ state.draw.length }}/{{ state.draw.max }}</p>
				<Card
					@click="handlePiocheClick"
					:card="{imageUrl: 'back.png'}"
				/>
			</div>
	    </div>
    </div>

    <div id="players-container">
      <h2>Players</h2>
      <div v-for="player in state.players.filter(p => p.id !== socket.id)" :key="player.id" :class="`player-${state.players.filter(p => p.id !== socket.id).indexOf(player)}`">
			<p class="player-id">{{ player.id }}</p>
			<p class="player-name">{{ player.title }}</p>

			<CardContainer
				class="deck"
			  v-if="player.id !== socket.id"
			  :cards="player.cards"
			  :fill="true"
			  :back="true"
			/>

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
#center-container {
	position: absolute;
	display: flex;
	justify-content: center;
	align-items: center;

	width: 100vw;
	height: 100vh;

	z-index: 150;
}
#center {
	display: flex;
	justify-content: space-around;
	width: 50vw;
}
#hand {
	z-index: 150000;
}
#players-container {
	position: relative;

	display: flex;

	width: 100vw;
	height: 100vh;
}
.player-0 {
	position: absolute;
	top: 50%;
}
.player-0 > .deck {
	transform: rotate(90deg);
}
.player-1 {
	position: absolute;
	top: 0;
	right: 50%;
}
.player-1 > .deck {
	transform: rotate(180deg);
}
.player-2 {
	position: absolute;
	top: 50%;
	right: 0;
}
.player-2 > .deck {
	transform: rotate(-90deg);
}


#player-info {

}
</style>
