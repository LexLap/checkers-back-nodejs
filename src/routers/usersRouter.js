const express = require('express')
const User = require('../db/user-model')
const router = new express.Router()
const { addUser, removeUser } = require('../real-time-data/online-users')

router.post('/subscribe', async (req, res) => {

    let email = {email: req.body.email}
    if(await User.findOne(email)){
        res.status(400).send("EMAIL_EXISTS")
    }else
        try {
            const user = new User(req.body)
            await user.save()
            const token = await user.generateAuthToken()
            addUser({
                username: user.email, 
                id: user._id,
                token
            })
            res.status(201).send({
                token,
                user: { username: user.email, id: user._id }
            })
        } catch (e) {
            res.status(400).send(e)
        }

})

router.post('/login', async (req, res) => {

    try{
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        addUser({
            username: user.email, 
            id: user._id,
            token,
            score: user.score,
            room: 'Main'
        })

        res.send({
            token,
            user: { username: user.email, id: user._id, score: user.score }
        })
    } catch (e) {
        res.status(400).send(e.message)
    }
})

router.post("/logout", async (req, res) => {
    removeUser(req.body.token)
    res.send();
}) 

module.exports = router 