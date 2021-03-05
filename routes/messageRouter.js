const gmail = require('../gmail')

module.exports = router => {
    router.get('/api/messages', async (req, res) => {
        try {
            const data = await gmail.getMessages()
            res.status(200)
            res.send(JSON.stringify({data}))
        } catch(error) {
            console.log(error)
            res.status(400)
            res.send(JSON.stringify(error))
        }
    })

    return router
}