var path = require('path');
var nunjucks = require('nunjucks');
var express = require('express');
var app = express();
const fetch = require('node-fetch');
const zlib = require('zlib');

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

app.get('/', function(req, res) {
    res.render('index.html');
});

app.get('/room/:roomId', function(req, res) {
    res.render('room.html', {
        roomId: req.params.roomId
    });
});

var state = new Map();
var timestamp = new Map();
var names = new Map();

function has(room) {
    return state.has(room);
}

function initialize(room) {
    state.set(room, {
        'videoId': '',
        'playerState': 0,
        'playbackRate': 1.0,
        'currentTime': 0.0,
        'queue': [],
    });
    timestamp.set(room, new Date());
    names.set(room, new Map());
}

function clear(room) {
    state.delete(room);
    timestamp.delete(room);
    names.delete(room);
}

function getAdjustedState(room) {
    const snapshot = state.get(room);
    if (snapshot.playerState != 1) return snapshot;
    const offset = snapshot.playbackRate * ((new Date()).getTime() -
        timestamp.get(room).getTime()) / 1000.0;
    return {
        'videoId': snapshot.videoId,
        'playerState': snapshot.playerState,
        'playbackRate': snapshot.playbackRate,
        'currentTime': snapshot.currentTime + offset,
        'queue': snapshot.queue,
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
    var room;
    var heartbeat;
    socket.on('join', function(msg) {
        console.log(socket.id + ' join:');
        console.log(msg);
        room = msg;
        if (!has(room)) initialize(room);
        socket.join(room);
        socket.emit('stateUpdate', getAdjustedState(room));
        var roomNames = names.get(room);
        roomNames.set(socket.id, 'Anonymous');
        io.to(room).emit('namesUpdate', getValues(roomNames));
        heartbeat = setInterval(() => {
            socket.emit('stateUpdate', getAdjustedState(room));
        }, 5000);
    });
    socket.on('disconnect', () => {
        console.log(socket.id + ' disconnect');
        clearInterval(heartbeat);
        if (!has(room)) return;
        var roomNames = names.get(room);
        roomNames.delete(socket.id);
        if (roomNames.size == 0) {
            clear(room);
        } else {
            io.to(room).emit('namesUpdate', getValues(names.get(room)));
        }
    });
    socket.on('stateUpdate', function(msg) {
        console.log(socket.id + ' stateUpdate:');
        console.log(msg);
        // Clean the input player state.
        switch (msg.playerState)
        {
            case -1:
            case 1:
            case 3:
                // Set buffering and unstarted to play.
                msg.playerState = 1;
                break;
            case 2:
                break;
            case 0:
            case 5:
            default:
                return;
        }
        state.set(room, msg);
        timestamp.set(room, new Date());
        socket.to(room).emit('stateUpdate', state.get(room));
    });
    socket.on('nameUpdate', function(msg) {
        console.log(socket.id + ' nameUpdate: ' + msg);
        var roomNames = names.get(room);
        roomNames.set(socket.id, msg);
        io.to(room).emit('namesUpdate', getValues(roomNames));
    });
    socket.on('titleQuery', function(msg) {
        console.log(socket.id + ' titleQuery: ' + msg);
        fetch("https://youtube.com/get_video_info?video_id=" + msg)
            .then(function (response) {
                return response.blob();
            }).then(function (blob) {
                return blob.text();
            }).then(function (text) {
                const params = new URLSearchParams(text);
                const json = JSON.parse(params.get("player_response"));
                socket.emit('titleResult', {
                    'videoId': msg,
                    'videoTitle': json["videoDetails"]["title"],
                });
            }).catch(function (error) { console.log(error); });
    });
});

http.listen(PORT, function() {
    console.log(`Listening on ${ PORT }`);
});
