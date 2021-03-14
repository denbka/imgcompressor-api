const base64ToImage = require('base64-to-image')
const fs = require('fs')
const util = require('util')
const readline = require('readline')
const {google} = require('googleapis')
const moment = require('moment')
const createDir = require('./helpers/createDir')

const SCOPES = ['https://www.googleapis.com/auth/gmail.modify']

const TOKEN_PATH = 'token.json'

const rf = util.promisify(fs.readFile)

function getMessages() {
    return new Promise((res, rej) => {
        rf('credentials.json').then(async content => {
                const auth = await authorize(JSON.parse(content))
                const paths = await listMessages(auth)
                res(paths)
        })
    })
}

module.exports = {
    getMessages
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials) {
    return new Promise((res, rej) => {
        const {client_secret, client_id, redirect_uris} = credentials.web
        const oAuth2Client = new google.auth.OAuth2(
            client_id, client_secret, redirect_uris[0])

        // Check if we have previously stored a token.
        rf(TOKEN_PATH).then(token => {
            oAuth2Client.setCredentials(JSON.parse(token))
            res(oAuth2Client)
        })
    })
   
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  })
  console.log('Authorize this app by visiting this url:', authUrl)
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close()
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err)
      oAuth2Client.setCredentials(token)
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err)
        console.log('Token stored to', TOKEN_PATH)
      })
      callback(oAuth2Client)
    })
  })
}

function listMessages(auth) {
  const gmail = google.gmail({version: 'v1', auth})
  const userId = 'me'  
  return new Promise((resolve, reject) => {
    gmail.users.messages.list({userId}, (err, messages) => {
      messages.data.messages.map(({ id }) => {
        gmail.users.messages.get({userId, id}, async (error, { data }) => {
          await data.payload.parts.map(async part => {
            if (part && part.body.attachmentId) {
              const dir = await getDir(gmail, {
                userId,
                id
              })
              createDir(`./output/${dir}`)
              await pushImg(gmail, {
                userId,
                id,
                part
              }, dir)
              resolve(getPaths())
            }
          })
        })
      })
    })
  })
}

const getDir = (gmail, data) => {
  return new Promise((resolve, reject) => {
    gmail.users.messages.get({userId: data.userId, id: data.id, format: 'metadata', metadataHeaders: 'From'}, (error, metaData) => {
      if (metaData.data.payload.headers) {
        const sendDate = moment(Number(metaData.data.internalDate)).format("MM.DD.YYYY-hh:mm")
        resolve(`${metaData.data.payload.headers[0].value.split('<')[0].trim()} ${sendDate}`)
      }
    })
  })
  
}

const pushImg = (gmail, data, dirName) => {
  return new Promise(async (resolve, reject) => {
    gmail.users.messages.attachments.get({id: data.part.body.attachmentId, messageId: data.id, userId: data.userId}, async (err, attachment) => {
      if (attachment.data.data) {
        console.log(attachment.data.data)
        await base64ToImage(
          `data:image/jpeg;base64, ${attachment.data.data}`,
          `./output/${dirName}/`,
          {fileName: `${data.part.filename}`, type: 'jpeg'}
        )
        resolve(data.part.fileName)
      }
    })
  })
}

const getPaths = () => {
  const paths = {}
  const rootDir = './output'
  fs.readdirSync(rootDir).map(directory => {
    paths[directory] = []
    fs.readdirSync(`${rootDir}/${directory}`).map(img => {
      paths[directory].push(img)
    })
  })
  return paths
}