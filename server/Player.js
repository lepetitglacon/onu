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

    bind() {
        this.socket.on('admin-start', () => {
            this.game.emit('admin-start')
            console.log(this.id, 'admin start')
        })
        this.socket.on('player-turn', (e) => {
            console.log('player-turn', e)
            this.game.emit('player-turn', e)
        })
    }

}