const cors = require('cors')
const http = require('http')
const express = require('express')
const { removeUser, recordUserSocket, getUsersInRoom, findUserBySocket, findUserByUsername } = require('./real-time-data/online-users')
const {createNewGame, removeGame, findGameByPlayerID} = require('./real-time-data/online-games')
const usersRouter = require('./routers/usersRouter')
const { executeMove, pickAPiece } = require('./real-time-data/game-logics')
require('./db/mongoose')


const app = express()
app.use(cors())
app.use(express.json());

const port = process.env.PORT || 3001

app.use(usersRouter)

const server = http.createServer(app)

const io = require("socket.io")(server, {
    cors: {
      origin: "*",
      methods: ["*"],
      allowedHeaders: ["*"],
      credentials: true
    }
  });

io.on('connection', (socket) => {
    console.log('New WebSocket connected:', socket.id)

    socket.on('auth', (token) => {
        console.log(`Auth socket ${socket.id}`)
        recordUserSocket(token, socket.id)
        socket.join('Main')
        io.to('Main').emit('usersData', {
            users: getUsersInRoom('Main')
        })
    }) 

    socket.on('gameInvite', (username) =>{
        
        let player1 = findUserBySocket(socket.id)
        let player2 = findUserByUsername(username)

        console.log(player2.username, ' is being invited by ', player1.username)
        socket.to(player2.socketID).emit('gameInvite', player1.username)
    })

    socket.on('gameAccept', (username) =>{
        
        let player1 = findUserByUsername(username)
        let player2 = findUserBySocket(socket.id)

        console.log(player2.username, ' accepted invite from ', player1.username)

        let gameData = createNewGame(player1, player2)
        io.to(player1.socketID).emit('gameData', gameData)
        io.to(player2.socketID).emit('gameData', gameData)
    })

    socket.on('gameReplay', () =>{
        let player = findUserBySocket(socket.id)
        let gameData = findGameByPlayerID(player.id)

        if(gameData){
            if(!gameData.askedReplay.includes(player.username))
            gameData.askedReplay.push(player.username)

            if(gameData.askedReplay.length > 1){
                let newGame = createNewGame(gameData.player1, gameData.player2)
                io.to(gameData.player1.socketID).emit('gameData', newGame)
                io.to(gameData.player2.socketID).emit('gameData', newGame)
            }
        }
        io.to('Main').emit('usersData', {
            users: getUsersInRoom('Main')
        })
    })

    socket.on('leaveGame', () =>{
        let player = findUserBySocket(socket.id)
        let gameData = findGameByPlayerID(player.id)

        io.to(gameData.player1.socketID).emit('leaveGame', {})
        io.to(gameData.player2.socketID).emit('leaveGame', {})

        removeGame(player.id)
        io.to('Main').emit('usersData', {
            users: getUsersInRoom('Main')
        })
    })

    socket.on('pickingPiece', (coords) =>{
        let player = findUserBySocket(socket.id)
        let gameData = findGameByPlayerID(player.id)
        pickAPiece(gameData, coords)
        io.to(gameData.player1.socketID).emit('gameData', gameData)
        io.to(gameData.player2.socketID).emit('gameData', gameData)
    })

    socket.on('moveData', (moveData) =>{
        let player = findUserBySocket(socket.id)
        let gameData = findGameByPlayerID(player.id)
        executeMove(gameData, moveData)
        io.to(gameData.player1.socketID).emit('gameData', gameData)
        io.to(gameData.player2.socketID).emit('gameData', gameData)
    })

    socket.on('logout', () => {
        removeUser(socket.id)
        io.to('Main').emit('usersData', {
            users: getUsersInRoom('Main')
        })
        console.log('User logged out:',socket.id)
    }) 
 
    socket.on('disconnect', () => {
        removeUser(socket.id)
        io.to('Main').emit('usersData', {
            users: getUsersInRoom('Main')
        })
        console.log('WebSocket disconnected:',socket.id)
    })
})
  


server.listen(port, () => {
    console.log(`Server is up on port ${port}!`)
})