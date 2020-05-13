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

var state = new Map();
var timestamp = new Map();
var names = new Map();

function getAdjustedState(room) {
    const snapshot = state.get(room);
    if (!snapshot || snapshot.playerState != 1) return snapshot;
    const offset = snapshot.playbackRate * ((new Date()).getTime() -
        timestamp.get(room).getTime()) / 1000.0;
    return {
        'videoId': snapshot.videoId,
        'playerState': snapshot.playerState,
        'playbackRate': snapshot.playbackRate,
        'currentTime': snapshot.currentTime + offset
    };
}

function getValues(map) {
    var array = new Array();
    for (let [key, value] of map) {
        array.push(value);
    }
    return array;
}

io.on('connection', function(socket) {
    console.log(socket.id);
    socket.on('join', function(msg) {
        console.log(socket.id + ' join:');
        console.log(msg);
        room = msg;
        socket.join(room);
        socket.emit('stateUpdate', getAdjustedState(room));
        var roomNames = names.get(room);
        if (!roomNames) {
            roomNames = new Map();
            names.set(room, roomNames);
        }
        roomNames.set(socket.id, 'Anonymous');
        io.to(room).emit('namesUpdate', getValues(roomNames));
    });
    socket.on('stateUpdate', function(msg) {
        console.log(socket.id + ' stateUpdate:');
        console.log(msg);
        state.set(room, msg);
        timestamp.set(room, new Date());
        socket.to(room).emit('stateUpdate', msg);
    });
    socket.on('nameUpdate', function(msg) {
        console.log(socket.id + ' nameUpdate: ' + msg);
        var roomNames = names.get(room);
        roomNames.set(socket.id, msg);
        io.to(room).emit('namesUpdate', getValues(roomNames));
    });
});

http.listen(PORT, function() {
    console.log(`Listening on ${ PORT }`);
});
