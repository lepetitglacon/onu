export class Player {

    constructor({socket, game}) {

        this.id = socket.id
        this.socket = socket
        this.game = game
        this.name = 'name'

        this.needToAct = false

        this.cards = []


        this.bind()
    }

    hasCard(cardId) {
        return this.cards.find((card) => card.id == cardId)
    }
    getCard(cardId) {
        let card = this.hasCard(cardId)
        if (card) {
            this.cards.filter(cardToFilter => cardToFilter.id != card.id)
        }
        return card
    }

    removeCard(cardId) {
        this.cards = this.cards.filter(cardToFilter => cardToFilter.id != cardId)
    }

    bind() {
        this.socket.on('admin-start', () => {
            this.game.emit('admin-start')
        })
        this.socket.on('player-turn', (e) => {
            this.game.emit('player-turn', e)
        })
    }

}