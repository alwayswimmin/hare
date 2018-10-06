var app = require('express')();
const PORT = process.env.PORT || 5000;
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});

var videoId = new Array();
var state = new Array();
var videoTime = new Array();
var timeStamp = new Array();

function calculateTime(room) {
	var d = new Date();
	var offset = state[room] == 1 ? (d.getTime() - timeStamp[room]) / 1000.0 : 0.0;
	console.log('offset ' + offset);
	return videoTime[room] + offset;
}

io.on('connection', function(socket){
  console.log(socket.id);
	var room = "";
	var threshold = 0.5;
	socket.on('join', function(msg){
		socket.leave(room);
		room = msg;
		socket.join(msg);
		socket.emit('id', {'videoId': videoId[room], 'videoTime': calculateTime(room)});
		if(state[room] == 1) {
			// socket.emit('play', calculateTime(room));
		} else {
			socket.emit('pause', calculateTime(room));
		}
	});
	socket.on('id', function(msg){
		videoId[room] = msg;
		console.log('play at ' + videoTime[room]);
		socket.broadcast.to(room).emit('id', {'videoId': videoId[room], 'videoTime': videoTime[room]});
	});
	socket.on('play', function(msg){
		if(state[room] != 1 || Math.abs(videoTime[room] - msg) > threshold) {
			var d = new Date();
			timeStamp[room] = d.getTime();
			videoTime[room] = msg;
			state[room] = 1;
			console.log('play at ' + videoTime[room]);
			socket.broadcast.to(room).emit('play', videoTime[room]);
		}
	});
	socket.on('pause', function(msg){
		if(state[room] != 2 || Math.abs(videoTime[room] - msg) > threshold) {
			var d = new Date();
			timeStamp[room] = d.getTime();
			videoTime[room] = msg;
			state[room] = 2;
			console.log('pause at ' + videoTime[room]);
			socket.broadcast.to(room).emit('pause', videoTime[room]);
		}
	});
	socket.on('move', function(msg){
		if(Math.abs(videoTime[room] - msg) > threshold) {
			var d = new Date();
			timeStamp[room] = d.getTime();
			videoTime[room] = msg;
			console.log('move to ' + videoTime[room]);
			socket.broadcast.to(room).emit('move', videoTime[room]);
		}
	});
});

http.listen(PORT, function(){
	console.log(`Listening on ${ PORT }`);
});
