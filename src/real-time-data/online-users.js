const users = []

const addUser = ({ username, id, token, score, room }) => {

    const user = { username, id, token, score, room }
    const existingUser = users.find((user) => user.username === username)
    if(existingUser) throw new Error("User already logged in!")
    users.push(user)
}

const findUserBySocket = (socketID)=>{
    let index = users.findIndex((user) => user.socketID === socketID)
    if(index>-1)return users[index]
}
const findUserByUsername = (username)=>{
    let index = users.findIndex((user) => user.username === username)
    if(index>-1)return users[index]
}
const findUserByID= (id)=>{
    let index = users.findIndex((user) => user.id === id)
    if(index>-1)return users[index]
}

const updateUserScoreOnine = (id, score) =>{
    let index = users.findIndex((user) => user.id === id)
    users[index].score = score
}


const removeUser = (socketID) => {
    let index = users.findIndex((user) => user.socketID === socketID)
    if (index !== -1) console.log('Found bysocketID')
        else index = users.findIndex((user) => user.token === socketID)
    if (index !== -1) {
        users.splice(index, 1)[0]
    }
}

const recordUserSocket = (token, socketID) => {
    const userIndex = users.findIndex((user) => user.token === token)
    users[userIndex].socketID = socketID
}

const getUsersInRoom = (room) => {
    return users.filter((user) => user.room === room)
}

const getUsersList = ()=>{
    return users
}
 
module.exports = {
    addUser,
    removeUser,
    recordUserSocket,
    getUsersInRoom,
    getUsersList,
    findUserBySocket,
    findUserByUsername,
    updateUserScoreOnine
}