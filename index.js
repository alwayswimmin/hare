var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var id = "";
var isPlaying = true;
var timeStamp = 0.0;
var threshold = 0.5;

app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
	// socket.emit('id', id);
	var room = "";
	socket.on('onLoad', function(){
		socket.emit('id', id);
		if(isPlaying) {
			socket.emit('play', timeStamp);
		} else {
			socket.emit('pause', timeStamp);
		}
	});
	socket.on('join', function(msg){
		socket.leave(room);
		room = msg;
		socket.join(msg);
	});
	socket.on('id', function(msg){
		id = msg;
		console.log('play at ' + timeStamp);
		socket.broadcast.to(room).emit('id', id);
	});
	socket.on('play', function(msg){
		if(!isPlaying || Math.abs(timeStamp - msg) > threshold) {
			timeStamp = msg;
			isPlaying = true;
			console.log('play at ' + timeStamp);
			socket.broadcast.to(room).emit('play', timeStamp);
		}
	});
	socket.on('pause', function(msg){
		if(isPlaying || Math.abs(timeStamp - msg) > threshold) {
			timeStamp = msg;
			isPlaying = false;
			console.log('pause at ' + timeStamp);
			socket.broadcast.to(room).emit('pause', timeStamp);
		}
	});
	socket.on('move', function(msg){
		if(Math.abs(timeStamp - msg) > threshold) {
			timeStamp = msg;
			console.log('move to ' + timeStamp);
			socket.broadcast.to(room).emit('move', timeStamp);
		}
	});
});

http.listen(3000, function(){
	console.log('listening on *:3000');
});
