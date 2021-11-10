const Game = require('../db/game-model')


const games = []

const createNewGame = (player1, player2) => {
    removeGame(player1.id)
    removeGame(player2.id)
    let newGame = new Game(player1, player2)
    newGame.bindPossibleMoves()
    games.push(newGame)
    return newGame
}

const findGameBySocket = (socketID) =>{
    let index = games.findIndex((game) => game.id.includes(socketID))
    if(index>-1)return games[index]
}

const findGameByPlayerID = (playerID) =>{
    let index = games.findIndex((game) => game.id.includes(playerID))
    if(index>-1)return games[index]
}

const removeGame = (playerID) =>{
    let index = games.findIndex((game) => game.id.includes(playerID))
    if (index !== -1) {
        console.log('Game found by userID')
        games.splice(index, 1)[0]
    }
}

module.exports  = {
    createNewGame,
    findGameBySocket,
    findGameByPlayerID,
    removeGame
} 