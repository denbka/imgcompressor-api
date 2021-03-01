const express = require('express')
const { Router } = require('express')
const app = express()
const router = Router()
const httpServer = require('http').Server(app)
const io = require('socket.io')(httpServer)
const cors = require('cors')

//315977636767-6kcgnkbudnvm6ohfb51oulrhftnlcsd9.apps.googleusercontent.com
//I0iO3Cy2jE3MlWaNOcPAlaFn
// app.use(cors)
app.all('/*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    next();
});
app.use('/', require('./routes/messageRouter')(router))
// io.on("connection", socket => {
//     console.log('a user is connected');
//     socket.on('test', (msg) => {
//         console.log('message: ' + msg);
//     })
// })
httpServer.listen(8000, () => {
    console.log('app listen')
})
