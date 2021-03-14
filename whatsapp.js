
const base64ToImage = require('base64-to-image')
const qrcode = require('qrcode-terminal')
const createDir = require('./helpers/createDir')
const fs = require('fs')
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

module.exports = () => {
    

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
                console.log(media.data.slice(1,7))
                await base64ToImage(
                    `data:image/jpeg;base64, ${media.data}`,
                    `wphotos/`,
                    {fileName: `image-${msg.timestamp}`, type: 'jpeg'}
                )
            } catch(e) {
                console.log(e)
            }
            
        }
    })
    
    client.initialize()
}
