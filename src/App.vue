<script setup>
	import {reactive, ref} from "vue";
	import { io } from "socket.io-client";
	import bg from "./assets/background.png";
	import Card from "./components/Card.vue";
	import CardContainer from "./components/CardContainer.vue";

	import 'bootstrap/dist/css/bootstrap.css'

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

	<div class="bite">
		<div class="row">
			<div class="col-2">
				<p>ONU</p>
			</div>
			<div class="col-8">
				<div v-if="state.players[1]" id="player-1" class="deck-container">
					<p class="player-id">{{ state.players[1].id }}</p>
					<p class="player-name">{{ state.players[1].title }}</p>

					<CardContainer
						class="deck"
						v-if="state.players[1].id !== socket.id"
						:cards="state.players[1].cards"
						:fill="true"
						:back="true"
					/>
				</div>
			</div>
			<div class="col-2"></div>
		</div>
		<div class="row">
			<div class="col-2">
				<div v-if="state.players[0]" id="player-0" class="deck-container">
					<p class="player-id">{{ state.players[0].id }}</p>
					<p class="player-name">{{ state.players[0].title }}</p>

					<CardContainer
						class="deck"
						v-if="state.players[0].id !== socket.id"
						:cards="state.players[0].cards"
						:fill="true"
						:back="true"
					/>
				</div>
			</div>
			<div class="col-8">
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
			<div class="col-2">
				<div v-if="state.players[2]" id="player-2" class="deck-container">
					<p class="player-id">{{ state.players[2].id }}</p>
					<p class="player-name">{{ state.players[2].title }}</p>

					<CardContainer
						class="deck"
						v-if="state.players[2].id !== socket.id"
						:cards="state.players[2].cards"
						:fill="true"
						:back="true"
					/>
				</div>
			</div>
		</div>
		<div class="row">
			<div class="col-2"></div>
			<div class="col-8">
				<div class="deck-container">

					<div><p v-if="state.currentPLayer === socket.id" class="text-center">À vous de jouer</p></div>

					<template v-if="state.cards.length > 0">
						<CardContainer :cards="state.cards" :click-function="handleCardClick" class="deck player-hand"/>
					</template>

				</div>
			</div>
			<div class="col-2"></div>
		</div>
	</div>


    <img :src="bg" id="background-image">

<!--	<div id="player-info">-->
<!--		<p>{{socket.id}}</p>-->
<!--		<p v-if="state.winner">{{ state.winner.title }}</p>-->
<!--	</div>-->

<!--    <div id="center-container">-->

<!--    </div>-->

<!--    <div id="players-container">-->
<!--      <h2>Players</h2>-->
<!--      <div v-for="player in state.players.filter(p => p.id !== socket.id)" :key="player.id" :class="`player-${state.players.filter(p => p.id !== socket.id).indexOf(player)}`">-->
<!--			<p class="player-id">{{ player.id }}</p>-->
<!--			<p class="player-name">{{ player.title }}</p>-->

<!--			<CardContainer-->
<!--				class="deck"-->
<!--			  v-if="player.id !== socket.id"-->
<!--			  :cards="player.cards"-->
<!--			  :fill="true"-->
<!--			  :back="true"-->
<!--			/>-->

<!--      </div>-->
<!--    </div>-->



    <button @click="handleStart">Lancer</button>
</template>

<style>
.bite {
	display: flex;
	flex-direction: column;
	height: 100vh;
}
.bite > .row:nth-child(1) {
	height: 33%;
}
.bite > .row:nth-child(2) {
	height: 66%;
}
.bite > .row:nth-child(3) {
	height: 33%;
}
#center {
	display: flex;
	justify-content: space-around;
	width: 50vw;
}
.deck-container {
	position: relative;
	width: 100%;
	height: 100%;
}
.deck-container .text-center {
	animation: wowEffect 1.5s infinite linear;
	font-size: 50px;
}
.deck {
	display: flex;
	position: absolute;
	justify-content: flex-end;
}
.player-hand {
	left: 50%;
	transform: translateX(-50%);
}
.bite img {
	position: relative;
	max-width: 150px;
	transform-origin: bottom center;
}

#player-1 > .deck {
	top: 0;
	left: 50%;
	transform: translateX(-50%) rotate(180deg);
}
#player-2 > .deck {
	right: 0;
	top: 50%;
	transform: translateX(41%) translateY(-50%) rotate(270deg);
}
#player-0 > .deck {
	left: 0;
	top: 50%;
	transform: translateX(-41%) translateY(-50%) rotate(90deg);
}
#player-info {

}

@keyframes wowEffect {
	0% {
		transform:scale(1) rotate(0);
	}
	50% {transform:scale(1.5) rotate(150deg);}
	100% {transform:scale(1) rotate(0);}

}
</style>
