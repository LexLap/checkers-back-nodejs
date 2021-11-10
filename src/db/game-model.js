const getBoardBlueprint = require('./board-blueprint')
const Tile = require('../db/tile-model')

const { getPossibleMoves, getPossibleJumps, scoreAdjust } = require('../real-time-data/game-logics')

class Game{

    constructor(player1, player2){
        
        this.player1 = player1
        this.player2 = player2
        this.id = player1.id+player2.id
        this.stateIsOn = true
        this.playerTurn = player1.username
        this.turnsCount = 0
        this.boardData = getBoardBlueprint()
        this.isAnyJumper = false
        this.winner = undefined
        this.askedReplay = []
        getBoardBlueprint().map((row, coordX) =>{
            row.map((title, coordY) =>{
                this.boardData[coordX][coordY] = new Tile(title)
            })
        })
    }

    bindPossibleJumps = () =>{
        this.isAnyJumper = false
        this.boardData.map((row, coordX) =>{
            row.map((tile, coordY) =>{
                tile.possibleJumps = getPossibleJumps(this, coordX, coordY)
            })
        })
    }

    bindPossibleMoves = () =>{
        
        this.boardData.map((row, coordX) =>{
            row.map((tile, coordY) =>{
                if(!this.isAnyJumper)
                    tile.possibleMoves = getPossibleMoves(this, coordX, coordY)
                else tile.possibleMoves = []
            })
        })
    } 

    bindGameState = async () =>{
        let movesLeft
        this.boardData.map((row, coordX) =>{
            row.map((tile, coordY) =>{
                if((tile.possibleMoves+tile.possibleJumps).length > 0) movesLeft = true
            })
        })

        // End-game
        if(!movesLeft){
            this.winner = this.player1.username === this.playerTurn ? this.player2 : this.player1
            this.loser = this.winner === this.player1 ? this.player2 : this.player1
            await scoreAdjust(this)
        }
    }

}

module.exports = Game
