import fs from "fs";
import { promises as fspromise } from "fs";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import EventEmitter from 'events'
import {Player} from "./Player.js";
import {CardFactory} from "./CardFactory.js";
import {Utils} from "./Utils.js";

export class Game extends EventEmitter {

    constructor({io}) {
        super();

        this.server = io
        this.admin = null
        this.players = new Map()

        this.cardFactory = new CardFactory()

        this.started = false
        this.clockwise = true
        this.currentPlayerId = null
        this.turns = 0

        this.initialDeck = new Map()

        this.init()
        this.bind()
    }

    async playTurn() {
        console.log('tour : ' + this.turns)


        // premier tour on tire les cartes au hasard
        if (this.turns === 0) {
            this.shuffle(this.initialDeck) // Shuffle le deck
            this.distributeCards() // Donner 7 cartes à chaques joueurs

            for (const [id, player] of this.players) {
                player.socket.emit('starting-cards', player.cards)
            }

        } else {

            // qui joue
            const player = this.players.get(this.getNextPlayerFollowingOrder())
            // get player action

            player.needToAct = true




            // win condition
            if (player.cards.length === 0) {
                return player
            }
        }

        await Utils.sleep(1000)
        this.turns++
        this.playTurn()
    }

    distributeCards() {
        const cardsToDistributes = this.players.size * 7
        let player = null
        for (let i = 1; i < cardsToDistributes + 1; i++) {
            player = this.players.get(this.getNextPlayerFollowingOrder())
            player.cards.push(this.cards[this.cards.length - i])
            console.log(player.id)
        }
    }

    // declare the function
    shuffle = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    };

    addPlayer(playerSocket) {
        const player = new Player({
            socket: playerSocket,
            game: this
        })

        this.players.set(player.id, player)
        playerSocket.join('room1')

        if (this.players.size === 1) {
            this.admin = player
        }

        this.emit('player-add', playerSocket)
    }

    removePlayer(playerSocket) {

        if (this.players.has(playerSocket.id)) {
            this.players.delete(playerSocket.id)
        }

        this.emit('player-remove', playerSocket)
    }

    getNextPlayerFollowingOrder() {
        const playerIds = Array.from(this.players.keys())
        let nextPlayer = null
        let currentPlayerIndex = playerIds.indexOf(this.currentPlayerId)
        if (this.clockwise) {
            if (playerIds[currentPlayerIndex + 1]) {
                nextPlayer = playerIds[currentPlayerIndex + 1]
            } else {
                nextPlayer = playerIds[0]
            }
        } else {
            if (playerIds[currentPlayerIndex - 1]) {
                nextPlayer = playerIds[currentPlayerIndex - 1]
            } else {
                nextPlayer = playerIds[playerIds.length - 1]
            }
        }
        this.currentPlayerId = nextPlayer
        return nextPlayer
    }

    start() {
        this.started = true
        this.playTurn()
    }

    init() {
        this.fillInitialCards()
        this.cards = this.shuffle(Array.from(this.initialDeck.values()))
    }

    fillInitialCards() {
        const cards = this.cardFactory.createCardsFromData()
        for (const card of cards) {
            this.initialDeck.set(card.id, card)
        }
    }

    bind() {
        // own events
        this.on('player-add', (e) => {
            console.log('Game "player-add" event')
            this.server.to("room1").emit('player-add', e.id)
        })

        // socket events
        this.server.on('chat', (e) => {

        })
        this.on('admin-start', (e) => {
            console.log('game started')
            this.start()
        })
    }
}