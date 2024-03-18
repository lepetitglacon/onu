<script setup>
import {reactive, ref} from "vue";
import { io } from "socket.io-client";
import bg from "./assets/background.png";
import Card from "./components/Card.vue";

const gallery = Object.values(import.meta.glob('@assets/cards/*.{png,jpg,jpeg,PNG,JPEG}', { eager: true, as: 'url' }))

const state = reactive({
  connected: false,
  players: [],
  cards: []
});

// "undefined" means the URL will be computed from the `window.location` object
const URL = "http://localhost:3333";
const socket = io(URL);
console.log('connecting to ' + URL)

socket.on("connect", () => {
  state.connected = true;
});
socket.on("disconnect", () => {
  state.connected = false;
});
socket.on("player-add", (socket) => {
  console.log(socket)
  state.players.push(socket);
});
socket.on("player-remove", (socket) => {
  console.log(socket)
  state.players.filter((el) => el !== socket);
});
socket.on("starting-cards", (cards) => {
  state.cards = cards;
});

const handleStart = () => {
  console.log('sending admin start')
  socket.emit("admin-start");
}
</script>

<template>
    <img :src="bg" id="background-image">

    <div id="main-hand">
      <h2>Cards</h2>
      <div v-if="state.cards.length > 0" class="hand-container">
        <div v-for="card in state.cards" >
          <Card :gallery="gallery" :card="card" />
        </div>
      </div>
    </div>

    <div id="center">
      <div>
        <p>ONU</p>
      </div>
      <div>
        <p>Carte en cours</p>
      </div>
      <div>
        <p>Pioche</p>
      </div>
    </div>

    <button @click="handleStart">Lancer</button>
</template>

<style scoped>


#main-hand {
  position: absolute;
  left: 50%;
  bottom: 0;
  background-color: #0d5e09;
}

#center {
  position: absolute;
  top: 50%;
  left: 50%;
  background-color: #0c139a;
}

.hand-container {
  display: flex;
}
</style>
