import express from 'express'
import {Server} from "socket.io"

import HTTP from 'http'
import {Game} from "./Game.js";
HTTP.createServer(express)

const vuePort = 5173
const wsPort = 3333
const app = express()
const port = 3000


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

const io = new Server({
    cors: {
        origin: "http://localhost:" + vuePort
    }
});
io.listen(wsPort);

const game = new Game({
    io: io
})

io.on("connection", (socket) => {
    console.log(socket.id + " connected")
    game.addPlayer(socket)

    socket.on("disconnect", (reason) => {
        console.log(socket.id + " disconnected")
        game.removePlayer(socket)
    });
});

app.get('/', (req, res) => {
    res.send('Hello World!')
})
