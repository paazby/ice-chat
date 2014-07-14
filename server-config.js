var express = require('express');
var partials = require('express-partials');
var util = require('./lib/utility');
var passport = require('./lib/auth').passport;
var iceAuthenticated = require('./lib/icebreaker-auth').iceAuthenticated;

var handler = require('./lib/request-handler');

var app = express();

app.configure(function() {
  app.use(partials());
  app.use(express.static(__dirname + '/public'));
  app.use(express.bodyParser());
  app.use(passport.initialize());
});


// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  However, since this example does not
//   have a database of user records, the complete Facebook profile is serialized
//   and deserialized.



app.get('/auth/facebook',
  passport.authenticate('facebook'),
  function(req, res){
    // The request will be redirected to Facebook for authentication, so this
    // function will not be called.
});

app.get('/auth/facebook/callback', 
  passport.authenticate('facebook', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect('/');
  });


app.get('/',  handler.renderIndex);
app.get('/matches', ensureAuthenticated, handler.serveMatches);
app.post('/matches', ensureAuthenticated, handler.postMatches);


app.get('/logout', handler.logoutUser);

app.get('/signup', handler.signupUserForm);
app.post('/signup', handler.signupUser);

app.get('/*', handler.navToLink);



module.exports = app;
