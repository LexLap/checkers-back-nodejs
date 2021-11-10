const Tile = require('../db/tile-model')
const User = require('../db/user-model')
const {updateUserScoreOnine} = require('../real-time-data/online-users')

const findMiddleTile = (oldCoordX, oldCoordY, newCoordX, newCoordY) =>{
    middleTileX = oldCoordX-((oldCoordX-newCoordX)/2)
    middleTileY = oldCoordY-((oldCoordY-newCoordY)/2)
    return '' + middleTileX + middleTileY
}

const removePossibleJumps = (gameData) =>{
    gameData.boardData.map((row, coordX) =>{
        row.map((tile, coordY) =>{
            tile.possibleMoves = []
            tile.possibleJumps = []
        })
    })
}


const getPossibleJumps = (gameData, oldCoordX, oldCoordY) => {
    let possibleJumps = []
    let playerTurn = gameData.turnsCount % 2 == 0?'w':'b'

    if(gameData.boardData[oldCoordX][oldCoordY].title[0] === playerTurn 
        // && gameData.boardData[oldCoordX][oldCoordY].title[0] === 
        ){
        gameData.boardData.map((row, newCoordX) =>{
            row.map((tile, newCoordY) =>{
                if(tile.title[0]==='e') 
                    if((Math.abs(oldCoordX-newCoordX) == 2 ) && (Math.abs(oldCoordY-newCoordY) == 2))
                    {   
                        let middleTile = findMiddleTile(oldCoordX, oldCoordY, newCoordX, newCoordY)
                        
                        if(gameData.boardData[middleTile[0]][middleTile[1]].title[0] === (playerTurn == "w"?"b":"w")) 
                        {
                            if(
                                gameData.boardData[oldCoordX][oldCoordY].title[1] === 'r'
                             || gameData.currentPieceCoord === oldCoordX + oldCoordY
                            ) {
                                possibleJumps.push(''+newCoordX+newCoordY)
                                gameData.boardData[oldCoordX][oldCoordY].highlighted = true
                            }
                            if((gameData.boardData[oldCoordX][oldCoordY].title[0] === "w") && (oldCoordX - newCoordX === 2))
                                {
                                    possibleJumps.push(''+newCoordX+newCoordY)
                                    gameData.boardData[oldCoordX][oldCoordY].highlighted = true
                                }
                            if((gameData.boardData[oldCoordX][oldCoordY].title[0] === "b") && (newCoordX - oldCoordX === 2))
                                {
                                    possibleJumps.push(''+newCoordX+newCoordY)
                                    gameData.boardData[oldCoordX][oldCoordY].highlighted = true
                                }
                        }
                    }
            })
        })
    }
    if (possibleJumps > 0) gameData.isAnyJumper = true
    return possibleJumps
}

const getPossibleMoves = (gameData, oldCoordX, oldCoordY) => {
    let possibleMoves = []
    let playerTurn = gameData.turnsCount % 2 == 0?'w':'b'

    if(gameData.boardData[oldCoordX][oldCoordY].possibleJumps.length === 0)
        if(gameData.boardData[oldCoordX][oldCoordY].title[0] === playerTurn){
            gameData.boardData.map((row, newCoordX) =>{
                row.map((tile, newCoordY) =>{
                    if(tile.title[0]==='e') 
                        if(Math.abs(oldCoordX - newCoordX) == 1 && Math.abs(oldCoordY - newCoordY) == 1)
                            if(gameData.boardData[oldCoordX][oldCoordY].title[1] === 'r')
                                possibleMoves.push(''+newCoordX+newCoordY)
                            else if((playerTurn == 'w') && (oldCoordX - newCoordX == 1))
                                possibleMoves.push(''+newCoordX+newCoordY)
                            else if((playerTurn == 'b') && (newCoordX - oldCoordX == 1))
                                possibleMoves.push(''+newCoordX+newCoordY)
                })
            })
        }
    return possibleMoves
}


const executeMove = (gameData, moveData) =>{
    const oldCoordX = moveData.oldCoords[0]
    const oldCoordY = moveData.oldCoords[1]
    const newCoordX = moveData.newCoords[0]
    const newCoordY = moveData.newCoords[1]
    if(gameData.boardData[oldCoordX][oldCoordY].possibleMoves.includes(moveData.newCoords)||
       gameData.boardData[oldCoordX][oldCoordY].possibleJumps.includes(moveData.newCoords))
       {

        gameData.boardData[newCoordX][newCoordY] = gameData.boardData[oldCoordX][oldCoordY]
        gameData.boardData[oldCoordX][oldCoordY] = new Tile('et')

        // If jumping
        if(Math.abs(oldCoordX-newCoordX)>1){
            let middleTile = findMiddleTile(oldCoordX, oldCoordY, newCoordX, newCoordY)
            gameData.boardData[middleTile[0]][middleTile[1]] = new Tile('et')
            pickAPiece(gameData, newCoordX+newCoordY)
            removePossibleJumps(gameData)
            gameData.boardData[newCoordX][newCoordY].possibleJumps = getPossibleJumps(gameData, newCoordX, newCoordY)
        }
        // If became royal
        if(gameData.boardData[newCoordX][newCoordY].title[0]==='w' && newCoordX === '0')
            gameData.boardData[newCoordX][newCoordY].title = 'wr'
        if(gameData.boardData[newCoordX][newCoordY].title[0]==='b' && newCoordX === '7')
            gameData.boardData[newCoordX][newCoordY].title = 'br'
    }

// Under construction
// ##################
// gameData.boardData[newCoordX][newCoordY].possibleJumps = getPossibleJumps(gameData, newCoordX, newCoordY)

    disableHighlight(gameData)
    if(gameData.boardData[newCoordX][newCoordY].possibleJumps.length == 0){
        gameData.turnsCount += 1
        gameData.playerTurn = gameData.playerTurn === gameData.player1.username ? gameData.player2.username : gameData.player1.username
        gameData.bindPossibleJumps()
        gameData.bindPossibleMoves()
        gameData.bindGameState()
    }else{
      pickAPiece(gameData, newCoordX+newCoordY)  
    }
// ##################
// Under construction

}

const pickAPiece = (gameData, coords) =>{
    disableHighlight(gameData)
    if(gameData?.currentPieceCoord != coords){
        for (let tile of gameData.boardData[coords[0]][coords[1]].possibleMoves)    
            gameData.boardData[tile[0]][tile[1]].highlighted = true
    }
    gameData.boardData[coords[0]][coords[1]].highlighted = true
    gameData.currentPieceCoord = coords
    for (let tile of gameData.boardData[coords[0]][coords[1]].possibleJumps)    
    gameData.boardData[tile[0]][tile[1]].highlighted = true


    
}

const disableHighlight = (gameData) =>{
    gameData?.boardData?.map((row) =>{
        row.map((tile) =>{
            tile.highlighted = false
        })
    })
}

const scoreAdjust = async (gameData) =>{

    const winnerScore = gameData.winner.score
    const loserScore = gameData.loser.score
    
    const increment = scoreIncrementFormula(winnerScore, loserScore)
    const newScore = winnerScore + increment
    const user = await User.findById(gameData.winner.id)

    await user.updateScore(Math.floor(newScore))
    updateUserScoreOnine(gameData.winner.id, Math.floor(newScore))
}

const scoreIncrementFormula = (score1, score2) =>{
    const greaterScore = score1>score2?score1:score2
    const lowerScore = score1<score2?score1:score2

    const splitter = (greaterScore+1)/(lowerScore+1)
    const increment = 5*splitter
    return increment
}   

module.exports = {
    getPossibleJumps,
    getPossibleMoves,
    executeMove,
    pickAPiece, 
    scoreAdjust
}