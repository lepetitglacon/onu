export class Player {

    constructor({socket, game}) {

        this.id = socket.id
        this.socket = socket
        this.game = game

        this.needToAct = false

        this.cards = []


        this.bind()
    }

    bind() {
        this.socket.on('admin-start', () => {
            this.game.emit('admin-start')
            console.log(this.id, 'admin start')
        })
    }

}