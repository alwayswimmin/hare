var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});

var videoId = new Array();
var state = new Array();
var timeStamp = new Array();

io.on('connection', function(socket){
	var room = "";
	var threshold = 0.5;
	socket.on('join', function(msg){
		socket.leave(room);
		room = msg;
		socket.join(msg);
		socket.emit('id', videoId[room]);
		if(state[room] == 1) {
			socket.emit('play', timeStamp[room]);
		} else {
			socket.emit('pause', timeStamp[room]);
		}
	});
	socket.on('id', function(msg){
		videoId[room] = msg;
		console.log('play at ' + timeStamp[room]);
		socket.broadcast.to(room).emit('id', videoId[room]);
	});
	socket.on('play', function(msg){
		if(state[room] != 1 || Math.abs(timeStamp[room] - msg) > threshold) {
			timeStamp[room] = msg;
			state[room] = 1;
			console.log('play at ' + timeStamp[room]);
			socket.broadcast.to(room).emit('play', timeStamp[room]);
		}
	});
	socket.on('pause', function(msg){
		if(state[room] != 2 || Math.abs(timeStamp[room] - msg) > threshold) {
			timeStamp[room] = msg;
			state[room] = 2;
			console.log('pause at ' + timeStamp[room]);
			socket.broadcast.to(room).emit('pause', timeStamp[room]);
		}
	});
	socket.on('move', function(msg){
		if(Math.abs(timeStamp[room] - msg) > threshold) {
			timeStamp[room] = msg;
			console.log('move to ' + timeStamp[room]);
			socket.broadcast.to(room).emit('move', timeStamp[room]);
		}
	});
});

http.listen(3000, function(){
	console.log('listening on *:3000');
});
