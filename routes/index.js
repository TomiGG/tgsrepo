var express = require('express');
var router = express.Router();

// Get Homepage
router.get('/', authenticationMiddleware(), function(req, res){
  console.log(req.isAuthenticated());
	res.render('index');
});

function authenticationMiddleware () {
  return (req, res, next) => {
    console.log(`req.session.passport.user: ${JSON.stringify(req.session.passport)}`);

      if (req.isAuthenticated()) return next();
      res.redirect('/users/login')
  }
}

module.exports = router;
