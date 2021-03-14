
const base64ToImage = require('base64-to-image')
const qrcode = require('qrcode-terminal')
const createDir = require('./helpers/createDir')
const fs = require('fs')
const qs = require('querystring')
const SESSION_FILE_PATH = './wapp-session.json'
let sessionData
if(fs.existsSync(SESSION_FILE_PATH)) {
    sessionData = require(SESSION_FILE_PATH)
}
const { Client } = require('whatsapp-web.js')
const client = new Client({
    // puppeteer: { headless: false },
    session: sessionData
})

module.exports = (io) => {
    

    client.on('qr', (qr) => {
        
        console.log('QR RECEIVED', qr)
    })

    client.on('authenticated', (session) => {
        console.log(session)
        sessionData = session
        fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function (err) {
            if (err) {
                console.error(err)
            }
        })
    })
    
    client.on('ready', async () => {
        console.log('Client is ready!')
    })
    
    client.on('message', async msg => {
        console.log(msg.body.slice(0, 1) != '!')
        if (msg.body.length >= 0 && msg.body.slice(0, 1) != '!') {
            client.sendMessage(msg.from, 'привет чел, доступные команды: !ваня, !погода')
        }
        if (msg.body === '!погода') {
            client.sendMessage(msg.from, 'ПОГОДА СЕДНЯ ОТЛИЧНАЯ САМОЕ ВРЕМЯ ЗАВЕСТИ ДЕВУШКУ И ПОГУЛЯТЬ')
        }
        if (msg.body === '!ваня') {
            client.sendMessage(msg.from, 'лох')
        }
        if (msg.body === '!ваня reply') {
            msg.reply('лох')
        }

        if(msg.hasMedia) {
            try {
                const media = await msg.downloadMedia()
                const directory = msg.to.split('@')[0]
                createDir(`wphotos/${directory}/`)
                await base64ToImage(
                    `data:image/jpeg;base64, ${media.data}`,
                    `wphotos/${directory}/`,
                    {fileName: `image-${msg.timestamp}`, type: 'jpeg'}
                )
                io.emit('getImageFromWatsapp', {file: media.data, fileName: `image-${msg.timestamp}`, directory})
            } catch(e) {
                console.log(e)
            }
            
        }
    })

    io.on('connection', socket => {
        console.log('a user connected')
        socket.on('setImageFromWatsapp', async ({ data, directory, fileName }) => {
            console.log(data, directory, fileName)
            createDir(`wphotos-rendered/${directory}/`)
            await base64ToImage(
                data,
                `wphotos-rendered/${directory}/`,
                {fileName, type: 'jpeg'}
            )
        })
    })
    
    client.initialize()
}
