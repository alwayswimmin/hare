var path = require('path');
var nunjucks = require('nunjucks');
var express = require('express');
var app = express();

const PORT = process.env.PORT || 5000;
var http = require('http').Server(app);
var io = require('socket.io')(http);

/* eslint-disable func-names */

'use strict';

nunjucks.configure(path.join(__dirname, 'views'), {
    autoescape: true,
    express: app,
    watch: true
});

// app

app.get('/room/:roomId', function(req, res) {
    res.render('index.html', {
        roomId: req.params.roomId
    });
});

var state = new Array();

io.on('connection', function(socket) {
    console.log(socket.id);
    socket.on('join', function(msg) {
        console.log(socket.id + ' join:');
        console.log(msg);
        room = msg;
        socket.join(room);
        socket.emit('stateUpdate', state[room]);
    });
    socket.on('stateUpdate', function(msg) {
        console.log(socket.id + ' stateUpdate:');
        console.log(msg);
        state[room] = msg;
        socket.to(room).emit('stateUpdate', state[room]);
    });
});

http.listen(PORT, function() {
    console.log(`Listening on ${ PORT }`);
});
