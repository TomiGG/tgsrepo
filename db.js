var mysql = require("mysql");
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'test',
  database : 'globalchat'
});

connection.connect(function(err){
  if(err){
    throw err;
  }else{
    console.log("Datenbankverbindung erfolgreich ...");
  }
});

module.exports = connection;
