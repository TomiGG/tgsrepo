var express = require("express");
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var exphbs = require('express-handlebars');
var expressValidator = require('express-validator');
var flash = require('connect-flash');
var bcrypt = require('bcryptjs');
var app = express();
var server = require("http").createServer(app);
var io = require("socket.io").listen(server);
const db = require('./db.js');
users = [];
connections = [];

//authentication packages

var session = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

//routes

var routes = require('./routes/index');
var users = require('./routes/users');

// View Engine
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', exphbs({defaultLayout:'layout'}));
app.set('view engine', 'handlebars');

// BodyParser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(expressValidator());
app.use(cookieParser());

// Set Static Folder
app.use(express.static(path.join(__dirname, 'public')));

// Express Session
app.use(session({
    secret: 'dfasfajt65ghjd3sjhfghsafxcvsaj2nf4q94hkjb',
    resave: false,
    saveUninitialized: false,
    //cookie: { secure: true }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(function(req, res, next){
  res.locals.isAuthenticated = req.isAuthenticated();
  next();
});

app.use(function(req, res, next){
  res.locals.user = req.user;
  next();
});

app.use('/', routes);
app.use('/users', users);

passport.use(new LocalStrategy(
  function(username, password, done) {
    db.query('SELECT hash, username from user WHERE username=?',  [username], function(err, results, fields){
      if(err){done(err)};
      if(results.length === 0){
        done(null, false);
      }
      const hash = results[0].hash.toString();
      bcrypt.compare(password, hash, function(err, response){
        if (response === true){
          const user_username = results[0].username;
          return done(null, {user_username: results[0].username});
        }else{
          return done(null, false);
        }
      });
    })
  }
));

passport.serializeUser(function(user_username, done) {
  done(null, user_username);
});

passport.deserializeUser(function(user_username, done) {
  done(null, user_username);
});

server.listen(process.env.PORT || 80);

console.log("Server running ...");

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

  socket.on("send message", function(data, data2, data3){
    socket.broadcast.emit("new message", {msg: data}, data2, data3);
    db.query("INSERT INTO messages (user, message, marks) VALUES ('" +data2+ "', '" +data+ "', 0);", function(err){
      if(err){
        throw err;
        console.log(err);
      }else{
        console.log("Nachricht erfolgreich eingefügt!!!");
      }
    });
  });


  //Load messages first

  socket.on("load messages first", function(data, data2, user){
    db.query("SELECT * FROM (SELECT * FROM messages ORDER BY id DESC LIMIT "+data+" OFFSET "+data2+") sub ORDER BY id DESC;", function(err, results){
      if (err){
        throw err;
      }else{
        console.log("Letzten Nachrichten erfolgreich geladen.");
        socket.emit("set loaded messages", results);
      }
    });
  });

  //GET MARKS OF USER

  socket.on("get marks of user", function(user){
    db.query("SELECT * FROM marks WHERE user='"+user+"'", function(err, results){
      if(err){
        throw err;
      }else{
        socket.emit("set marks for user", results)
      }
    })
  });

  //Load messages

  socket.on("load messages", function(data, data2, user){
    db.query("SELECT * FROM (SELECT * FROM messages ORDER BY id DESC LIMIT "+data+" OFFSET "+data2+") sub ORDER BY id DESC;", function(err, results){
      if (err){
        throw err;
      }else{
        socket.emit("set loaded messages", results);
      }
    });
    db.query("SELECT * FROM marks WHERE user='"+user+"'", function(err, results){
      if(err){
        throw err;
      }else{
        socket.emit("set marks for user", results)
      }
    })
  });

  //Get ammount of messages

  socket.on("get all messages", function(){
    db.query("SELECT * FROM messages;", function(err, result){
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

  socket.on("mark message", function(id, user, newValue){
    db.query("UPDATE messages SET marks = marks+1 WHERE id =" + id);
    db.query("INSERT INTO marks VALUES('"+user+"', "+id+")");
    socket.broadcast.emit('message mark changed', id, newValue);
  });

  socket.on("remove mark from message", function(id, user, newValue){
    db.query("UPDATE messages SET marks = marks-1 WHERE id =" + id);
    db.query("DELETE FROM marks WHERE marked='"+id+"' AND user='"+user+"'");
    socket.broadcast.emit('message mark changed', id, newValue);
  });

});
