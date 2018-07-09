var express = require("express");
var app = express();
var server = require("http").createServer(app);

server.listen(process.env.PORT || 3000);

console.log("Server running ...");

app.get("/", function(request, response){
  response.sendFile(__dirname + "/umgezogen.html");
});
