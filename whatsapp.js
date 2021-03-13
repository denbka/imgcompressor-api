


module.exports = () => {
    const qrcode = require('qrcode-terminal')
    const fs = require('fs')
    const SESSION_FILE_PATH = './wapp-session.json'
    let sessionData
    if(fs.existsSync(SESSION_FILE_PATH)) {
        sessionData = require(SESSION_FILE_PATH)
    }
    const { Client } = require('whatsapp-web.js')
    const client = new Client()

    client.on('qr', (qr) => {
        // Generate and scan this code with your phone
        qrcode.generate(qr, {small: true})
        console.log('QR RECEIVED', qr)
    })

    // client.on('authenticated', (session) => {
    //     sessionData = session
    //     fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function (err) {
    //         if (err) {
    //             console.error(err)
    //         }
    //     })
    // })
    
    client.on('ready', () => {
        console.log('Client is ready!')
    })
    
    client.on('message', msg => {
        console.log(msg, msg.body)
        if (msg.body === '!ваня') {
            client.sendMessage(msg.from, 'лох')
        }
        if (msg.body === '!ваня reply') {
            msg.reply('лох')
        }
    })
    
    client.initialize()
}
