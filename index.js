var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var id = "";
var is_playing = true;
var time_stamp = 0.0;

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  socket.on('id', function(msg){
    id = msg;
    console.log('play at ' + time_stamp);
    socket.broadcast.emit('id', id);
  });
  socket.on('play', function(msg){
    time_stamp = msg;
    is_playing = true;
    console.log('play at ' + time_stamp);
    socket.broadcast.emit('play', time_stamp);
  });
  socket.on('pause', function(msg){
    time_stamp = msg;
    is_playing = false;
    console.log('pause at ' + time_stamp);
    socket.broadcast.emit('pause', time_stamp);
  });
  socket.on('move', function(msg){
    time_stamp = msg;
    console.log('move to ' + time_stamp);
    socket.broadcast.emit('move', time_stamp);
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
