const gmail = require('../gmail')
const fs = require('fs')
const multer  = require('multer')
const createDir = require('../helpers/createDir')
const rootPath = './google-photos'
const storageOptions = multer.diskStorage({
    destination: function(req, file, callback) {
        const name = file.originalname.split('###')
        createDir(`${rootPath}/${name[0]}`)
        callback(null, `${rootPath}/${name[0]}`)
    },

    filename: function(req, file, callback) {
        const name = file.originalname.split('###')
        callback(null, name[1])
    }
})
const upload = multer({storage : storageOptions})
function base64_encode(file) {
    // read binary data
    const bitmap = fs.readFileSync(file);
    // convert binary data to base64 encoded string
    return new Buffer(bitmap).toString('base64');
}

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

    router.get('/api/uploads/:folder/:name', async (req, res) => {
        const { folder, name } = req.params
        const file = `./output/${folder}/${name}`;
        var base64str = base64_encode(file);
        res.send(JSON.stringify({ file: base64str })); // Set disposition and send it.
    })

    router.post('/api/uploads', upload.array('image'), async (req, res) => {
        console.log(req.files)
        // const { image, directory, filePath } = req.body
        // createDir(`./google-photos/${directory}`)
        // await base64ToImage(
        //     `data:image/jpeg;base64, ${base64_encode(image)}`,
        //     `./google-photos/${directory}/`,
        //     {fileName: filePath, type: 'jpg'}
        // )
        res.status(200)
        res.send(JSON.stringify({message: 'ok'}))
    })
    return router
}