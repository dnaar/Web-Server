const express = require('express');
const app = express();

app.listen(80);
app.use(express.static('MyWebApp'));

// UDP Listener
const dgram = require('dgram');
const socket = dgram.createSocket('udp4');
var _message;

socket.bind(10840);

// Message receive
socket.on('message', (msg, rinfo) => {
    _message = msg.toString();
    console.log(_message);
});

// Response handler
app.get('/loc', function (req, res){
    res.end(JSON.stringify(_message));
})
