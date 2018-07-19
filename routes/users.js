var express = require('express');
var mysql = require("mysql");
var router = express.Router();
var bcrypt = require('bcryptjs');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
const db = require('../db.js');

// Register
router.get('/register', function (req, res) {
	res.render('register');
});

// Login
router.get('/login', function (req, res) {
	res.render('login');
});

// Logout
router.get('/logout', function (req, res) {
	req.logout();
	req.session.destroy();
	res.redirect('/users/login');
});

//-----------------------------------------------------------------------------------------------------------

// Register User
router.post('/register', function (req, res) {
	var username = req.body.username;
	var password = req.body.password;
	var password2 = req.body.password2;

	//Validation
	req.checkBody('username', 'Username erforderlich!').notEmpty();
	req.checkBody('password', 'Passwort erforderlich!').notEmpty();
	req.checkBody('password2', 'Passwörter stimmen nicht überein!').equals(req.body.password);

	var errors = req.validationErrors();

	if(errors){
		console.log('Errors');
		res.render('register',{
			errors:errors
		})
	}else{
		console.log('No Errors');

		var salt = bcrypt.genSaltSync(10);
		var hash = bcrypt.hashSync(password, salt);

		db.query("INSERT INTO user (username, hash) VALUES ('" +username+ "', '" +hash+ "');", function(err){
      if(err){
        throw err;
      }else{
        console.log("User erfolgreich eingefügt!!!");
      }
    });

		//req.flash('success_msg','Erfolgreich registriert, bitte einloggen!');
		res.redirect('/users/login');

	}
});

//-----------------------------------------------------------------------------------------------------------

router.post('/login', passport.authenticate(
	'local', {
		successRedirect: '/',
		failureRedirect: '/users/login'
	}));

module.exports = router;
