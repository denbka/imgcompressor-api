var base64ToImage = require('base64-to-image');
const fs = require('fs');
const util = require('util')
const readline = require('readline');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/gmail.modify'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';
// Load client secrets from a local file.

const rf = util.promisify(fs.readFile)

function getMessages() {
    return new Promise((res, rej) => {
        rf('credentials.json').then(async content => {
            // authorize(JSON.parse(content), listLabels);
                const auth = await authorize(JSON.parse(content));
                await listMessages(auth)
                res()
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
        const {client_secret, client_id, redirect_uris} = credentials.web;
        const oAuth2Client = new google.auth.OAuth2(
            client_id, client_secret, redirect_uris[0]);

        // Check if we have previously stored a token.
        rf(TOKEN_PATH).then(token => {
            oAuth2Client.setCredentials(JSON.parse(token));
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
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

function listMessages(auth) {
  const gmail = google.gmail({version: 'v1', auth})
  const userId = 'me'  
  gmail.users.messages.list({userId}, (err, messages) => {
    messages.data.messages.map(({ id }) => {
      gmail.users.messages.get({userId, id}, (error, { data }) => {
        data.payload.parts.map(part => {
          if (part && part.body.attachmentId) {
            try {
              createDir(`./output/${id.slice(1, 16)}`)
            } catch(error) {
              return
            }
            gmail.users.messages.attachments.get({id: part.body.attachmentId, messageId: id, userId}, (err, attachment) => {
              if (attachment.data.data) {
                base64ToImage(
                  `data:image/jpeg;base64, ${attachment.data.data}`,
                  `./output/${id.slice(1, 16)}/`,
                  {fileName: `img-${part.body.attachmentId.slice(1, 36)}`, type: 'jpeg'}
                )
              }
            })
          }
        })
      })
    })
  })
}

const createDir = (dirName) => {
  if (!fs.existsSync(dirName)) {
    fs.mkdirSync(dirName)
  } else {
    throw new Error('exist')
  }
}
