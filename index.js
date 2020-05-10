var app = require('express')();
const PORT = process.env.PORT || 5000;
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

var videoId = new Array();
var state = new Array();
var videoTime = new Array();
var timeStamp = new Array();
var playbackRate = new Array();

function calculateTime(room) {
    var d = new Date();
    var offset = state[room] == 1 ? (d.getTime() - timeStamp[room]) / 1000.0 : 0.0;
    console.log('offset ' + offset);
    return videoTime[room] + offset;
}

io.on('connection', function(socket) {
    console.log(socket.id);
    var room = "";
    var threshold = 0.5;
    socket.on('join', function(msg) {
        socket.leave(room);
        room = msg;
        socket.join(msg);
        socket.emit('id', {
            'socketId': socket.id,
            'videoId': videoId[room],
            'videoTime': calculateTime(room)
        });
        if (state[room] == 1) {
            // socket.emit('play', calculateTime(room));
        } else {
            socket.emit('pause', calculateTime(room));
        }
        if (playbackRate[room]) {
            socket.emit('rate', playbackRate[room]);
        }
    });
    socket.on('id', function(msg) {
        videoId[room] = msg;
        console.log('play at ' + videoTime[room]);
        socket.to(room).emit('id', {
            'socketId': socket.id,
            'videoId': videoId[room],
            'videoTime': videoTime[room]
        });
    });
    socket.on('play', function(msg) {
        if (state[room] != 1 || Math.abs(videoTime[room] - msg) > threshold) {
            var d = new Date();
            timeStamp[room] = d.getTime();
            videoTime[room] = msg;
            state[room] = 1;
            console.log(socket.id + 'play at ' + videoTime[room]);
            socket.to(room).emit('play', {
                'socketId': socket.id,
                'videoTime': videoTime[room]
            });
        }
    });
    socket.on('pause', function(msg) {
        if (state[room] != 2 || Math.abs(videoTime[room] - msg) > threshold) {
            var d = new Date();
            timeStamp[room] = d.getTime();
            videoTime[room] = msg;
            state[room] = 2;
            console.log(socket.id + 'pause at ' + videoTime[room]);
            socket.to(room).emit('pause', {
                'socketId': socket.id,
                'videoTime': videoTime[room]
            });
        }
    });
    socket.on('move', function(msg) {
        if (Math.abs(videoTime[room] - msg) > threshold) {
            var d = new Date();
            timeStamp[room] = d.getTime();
            videoTime[room] = msg;
            console.log(socket.id + 'move to ' + videoTime[room]);
            socket.to(room).emit('move', {
                'socketId': socket.id,
                'videoTime': videoTime[room]
            });
        }
    });
    socket.on('rate', function(msg) {
        playbackRate[room] = msg;
        console.log(socket.id + 'playback rate ' + playbackRate[room]);
        socket.to(room).emit('rate', {
            'socketId': socket.id,
            'playbackRate': playbackRate[room]
        });
    });
});

http.listen(PORT, function() {
    console.log(`Listening on ${ PORT }`);
});
