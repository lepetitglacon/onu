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
import {Card} from "./Card.js";

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
        this.currentPlayerIndex = 0
        this.turns = 0

        this.toDraw = 0

        this.initialDeck = []
        this.cards = []
        this.pile = []

        this.init()
        this.bind()
    }

    async playTurn(e) {
        console.log('tour : ' + this.turns)

        // Controles du jeu (replissage de deck...)
        if (this.cards.length <= 1) {
            // TODO remplir les cartes + shuffle
        }

        // premier tour on tire les cartes au hasard
        if (this.turns === 0) {
            this.shuffle(this.cards) // Shuffle le deck
            this.distributeCards() // Donner 7 cartes à chaques joueurs

            this.pile.push(this.draw()) // met la première carte en jeu

            for (const [id, player] of this.players) {
                player.socket.emit('starting-cards', player.cards)
            }

            this.turns++
            this.getNextPlayerFollowingOrder()
            console.log('en attente de move du joueur : ', this.currentPlayerId)

            this.sendPlayerInfo()
            this.sendGameInfo()
            return
        }

        if (e.player.id !== this.currentPlayerId) {
            console.log("Ce n'est pas à ce joueur de jouer")
            return
        }

        const player = this.players.get(this.currentPlayerId)
        console.log('---- ', player.id, ' played')

        switch (e.action) {
            case ACTIONS.PLAY: {

                let card = player.getCard(e.card.id)

                if (card) {
                    console.log(player.id, 'playing card', card)
                    let originalCard = undefined
                    try {
                        console.log(this.initialDeck)
                        originalCard = this.initialDeck.find(cardToFind => {
                            console.log(card.id === cardToFind.id, card.id, cardToFind.id);
                            return card.id === cardToFind.id;
                        })
                    } catch (e) {
                        console.error("Can't find card in initial deck", card.id)
                        return;
                    }
                    console.log(originalCard)
                    if (this.canPlayCardOnCurrentCard(originalCard)) {
                        console.log('la carte peut etre jouée')

                        // logic des cartes
                        if (card.title === 'stop') {
                            console.log("Bloqué")
                            this.getNextPlayerFollowingOrder()
                        }

                        if (card.title === 'inverse') {
                            console.log("Changement de sens")
                            this.clockwise = false
                        }

                        if (card.title === '+2' || card.title === '+4') {
                            const nextPlayerId = this.getNextPlayerFollowingOrder(false)
                            const nextPlayer = this.players.get(nextPlayerId)
                            const numberToDraw = card.title === '+2' ? 2 : 4
                            this.toDraw += numberToDraw
                            console.log(`Ouch ${card.title} pour le joueur ${nextPlayerId}`)
                        } else {
                            if (this.toDraw > 0) {
                                for (let i = 0; i < this.toDraw; i++) {
                                    player.cards.push(this.draw())
                                }
                                this.toDraw = 0
                            }
                        }

                        if (card.title === 'color') {
                            console.log("Changement de couleur")
                        }

                        player.removeCard(card.id)
                        this.pile.push(card)
                    } else {
                        console.log('la carte ne peut pas etre jouée')
                        return
                    }
                } else {
                    console.error("La carte n'a pas été trouvé dans les cartes du joueur")
                    return;
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
            this.emit('game.win', {player: player})
        }

        player.socket.emit('starting-cards', player.cards)

        this.getNextPlayerFollowingOrder()
        console.log('en attente de move du joueur : ', this.currentPlayerId)
        this.sendPlayerInfo()
        this.sendGameInfo()

        // await Utils.sleep(1000)
        this.turns++
        // this.playTurn()
    }

    canPlayCardOnCurrentCard(card) {
        const currentCard = this.getCurrentPileCard()

        return card.title === currentCard.title ||
            card.color === currentCard.color ||
            card.color === Card.COLORS.BLACK ||
            currentCard.color === Card.COLORS.BLACK;

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
        const newArray = [...array]
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
        infos.pile = {
            length: this.pile.length,
            lastCard: this.getCurrentPileCard()
        }
        infos.draw = {
            length: this.cards.length,
            max: this.initialDeck.length
        }
        infos.currentPlayer = this.currentPlayerId
        infos.currentPlayer = this.currentPlayerId
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

    getNextPlayerFollowingOrder(change = true) {
        const playerIds = Array.from(this.players.keys())
        let nextPlayer = null
        let nextIndex = null
        if (this.clockwise) {
            if (this.currentPlayerIndex >= playerIds.length - 1) {
                nextPlayer = playerIds[0]
                nextIndex = 0
            } else {
                nextPlayer = playerIds[this.currentPlayerIndex + 1]
                nextIndex = this.currentPlayerIndex + 1
            }
        } else {
            if (this.currentPlayerIndex === 0) {
                nextPlayer = playerIds[playerIds.length - 1]
                nextIndex = playerIds.length - 1
            } else {
                nextPlayer = playerIds[this.currentPlayerIndex - 1]
                nextIndex = this.currentPlayerIndex - 1
            }
        }
        if (change) {
            this.currentPlayerIndex = nextIndex
            this.currentPlayerId = nextPlayer
        }
        return nextPlayer
    }

    start() {
        this.started = true
        this.playTurn()
    }

    init() {
        this.fillInitialCards()
        this.cards = [...this.initialDeck]
        this.cards = this.shuffle(this.cards)
    }

    fillInitialCards() {
        for (const card of this.cardFactory.createCardsFromData()) {
            this.initialDeck.push(card)
        }
    }

    bind() {
        // own events
        this.on('player-add', (e) => {
            this.sendPlayerInfo()
        })
        this.on('game.win', (e) => {
            this.server.to("room1").emit('game-end', e)
        })

        // socket events
        this.server.on('chat', (e) => {

        })
        this.on('admin-start', (e) => {
            console.log('game started')
            this.start()
        })
        this.on('player-turn', (e) => {
            this.playTurn(e)
        })
    }
}