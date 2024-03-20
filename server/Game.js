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
import {ACTIONS} from "./Actions.js";

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
        this.cards = []
        this.pile = []

        this.init()
        this.bind()
    }

    async playTurn(e) {
        console.log('tour : ' + this.turns)

        // premier tour on tire les cartes au hasard
        if (this.turns === 0) {
            this.shuffle(this.initialDeck) // Shuffle le deck
            this.distributeCards() // Donner 7 cartes à chaques joueurs

            this.pile.push(this.draw())

            this.sendGameInfo()

            for (const [id, player] of this.players) {
                player.socket.emit('starting-cards', player.cards)

                const otherPlayersCardNumber = []
                for (const [_id, _player] of this.players) {
                    if (id !== _id) {
                        otherPlayersCardNumber[_id] = _player.cards.length
                    }
                }
                this.sendPlayerInfo()
            }

        } else {

            const player = this.players.get(e.player.id)

            switch (e.action) {
                case ACTIONS.PLAY: {

                    let card = player.getCard(e.card.id)
                    console.log(e.card.id)
                    console.log(card)
                    if (card) {
                        console.log(player.id, 'playing card', card)
                        let originalCard = this.initialDeck.get(card.id)
                        if (this.canPlayCardOnCurrentCard(originalCard)) {
                            console.log('la carte peut etre jouée')
                            player.removeCard(card.id)
                            this.pile.push(card)
                        } else {
                            console.log('la carte ne peut pas etre jouée')
                            return
                        }
                    }
                    break;
                }
                case ACTIONS.DRAW: {
                    console.log('joueur', player.id, 'pioche')
                    player.cards.push(this.draw())

                    break;
                }
                case ACTIONS.ONU: {
                    break;
                }
                case ACTIONS.COUNTER_ONU: {
                    break;
                }
                default: {
                    console.error('action non reconnue')
                    return
                }
            }

            // win condition
            if (player.cards.length === 0) {
                return player
            }

            this.sendGameInfo()
            this.sendPlayerInfo()
            player.socket.emit('starting-cards', player.cards)

        }

        this.getNextPlayerFollowingOrder()
        console.log('en attente de move du joueur : ', this.currentPlayerId)

        // await Utils.sleep(1000)
        this.turns++
        // this.playTurn()
    }

    canPlayCardOnCurrentCard(card) {
        const currentCard = this.getCurrentPileCard()

        return card.title === currentCard.title ||
            card.color === currentCard.color;

    }

    draw(numberOfCards = 1) {
        const card = this.cards.pop()
        return card
    }

    distributeCards() {
        const cardsToDistributes = this.players.size * 7
        let player = null
        for (let i = 1; i < cardsToDistributes + 1; i++) {
            player = this.players.get(this.getNextPlayerFollowingOrder())
            player.cards.push(this.cards[this.cards.length - i])
        }
    }

    getCurrentPileCard() {
        return this.pile[this.pile.length - 1]
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

    sendGameInfo() {
        const infos = {}
        infos.pile = this.pile
        infos.lastPileCard = this.getCurrentPileCard()
        this.server.to("room1").emit('game-info', infos)
    }

    sendPlayerInfo() {
        let players = []
        for (const [id, player] of this.players) {
            players.push({
                id: id,
                name: player.name,
                cards: player.cards.length
            })
        }
        this.server.to("room1").emit('players', players)
    }

    removePlayer(playerSocket) {
        if (this.players.has(playerSocket.id)) {
            this.players.delete(playerSocket.id)
        }
        this.sendPlayerInfo()
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
            this.sendPlayerInfo()
        })

        // socket events
        this.server.on('chat', (e) => {

        })
        this.on('admin-start', (e) => {
            console.log('game started')
            this.start()
        })
        this.on('player-turn', (e) => {
            if (e.player.id === this.currentPlayerId) {
                this.playTurn(e)
            }
        })
    }
}