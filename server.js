var express = require("express");
var app = express();
var server = require("http").createServer(app);
var io = require("socket.io").listen(server);
var mysql = require("mysql");
users = [];
connections = [];

//create connection to database

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'test',
  database : 'globalchat'
});

//connect to database

connection.connect(function(err){
  if(err){
    throw err;
  }else{
    console.log("Datenbankverbindung erfolgreich ...");
  }
});

server.listen(process.env.PORT || 80);

console.log("Server running ...");

app.get("/", function(request, response){
  response.sendFile(__dirname + "/index.html");
});

io.sockets.on("connection", function(socket){
  connections.push(socket);
  console.log("Connected: %s sockets connected", connections.length);
  io.sockets.emit("csc", connections.length);
  //Disconnect

  socket.on("disconnect", function(data){
    connections.splice(connections.indexOf(socket), 1);
    console.log("Disconnected: %s sockets connected", connections.length);
    io.sockets.emit("csc", connections.length);
  });

  //Send Messages

  socket.on("send message", function(data){
    io.sockets.emit("new message", {msg: data});
    connection.query("INSERT INTO messages (message) VALUES ('" +data+ "');", function(err){
      if(err){
        throw err;
      }else{
        console.log("Nachricht erfolgreich eingefügt!!");
      }
    });
  });


  //Load messages

  socket.on("load messages", function(data, data2){
    console.log("DATA 2 " + data2);
    connection.query("SELECT * FROM (SELECT * FROM messages ORDER BY id DESC LIMIT "+data+" OFFSET "+data2+") sub ORDER BY id DESC;", function(err, results){
      if (err){
        throw err;
      }else{
        console.log("Letzten Nachrichten erfolgreich geladen.");
        console.log(results);
        socket.emit("set loaded messages", results);
      }
    });
  });

  //Get ammount of messages

  socket.on("get all messages", function(){
    connection.query("SELECT * FROM messages;", function(err, result){
      if (err){
        throw err;
      }else{
        socket.emit("set all messages", result.length);
      }
    });
  });

  //DELETE MESSAGE

  socket.on("delete message", function(data){
    io.sockets.emit("change deleted message", data);
  });

});
