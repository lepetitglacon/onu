export class Card {

    static COLORS = {
        ROUGE: 'r',
        VERT: 'v',
        BLEU: 'b',
        JAUNE: 'j',
        BLACK: 'black',
    }

    constructor() {
        this.id = 0
        this.title = ""
        this.description = ""
        this.imageUrl = ""
        this.points = 0

        this.color = null
    }


    toString() {
        return this.title
    }
}