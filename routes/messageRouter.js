const gmail = require('../gmail')

module.exports = router => {
    router.get('/api/messages', async (req, res) => {
        try {
            const response = await gmail.getMessages()
            console.log(response)
            res.status(200)
            res.send(JSON.stringify({message: 'success'}))
        } catch(error) {
            console.log(error)
            res.status(400)
            res.send(JSON.stringify(error))
        }
    })

    return router
}