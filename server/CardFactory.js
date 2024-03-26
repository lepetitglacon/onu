import {Card} from "./Card.js";
import cardsData from '../data/cards.json' assert { type: "json" };

export class CardFactory {

    constructor() {
        this.idCounter = 0
    }

    createCardsFromData() {
        const cards = []
        for (const cardData of cardsData) {
            const card = this.createCard(cardData)
            cards.push(...card)
        }
        return cards
    }

    createCard(cardData) {
        const cards = []

        if (cardData.colored) {
            for (const color of Object.values(Card.COLORS)) {
                if (color === Card.COLORS.BLACK) { continue }

                for (let i = 0; i < cardData.number; i++) {
                    const card = new Card()

                    this.fillInfoFromData(card, cardData)
                    card.color = color
                    card.imageUrl = card.title + color + '.png'
                    cards.push(card)
                }
            }
        } else {
            for (const color of Object.values(Card.COLORS)) {
                if (color === Card.COLORS.BLACK) { continue }
                const card = new Card()
                card.color = Card.COLORS.BLACK
                this.fillInfoFromData(card, cardData)
                cards.push(card)
            }
        }

        return cards
    }

    fillInfoFromData(card, cardData) {
        console.log(this.idCounter)
        card.id = this.idCounter++

        card.title = cardData.title
        card.description = cardData.description
        card.imageUrl = cardData.imageUrl
        card.points = cardData.points
    }
}