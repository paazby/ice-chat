var express = require('express');
var partials = require('express-partials');
var util = require('./lib/utility');
var passport = require('./lib/auth').passport;
var iceAuthenticated = require('./lib/icebreaker-auth').iceAuthenticated;
var serverUtil = require ('./lib/server-utils.js');
var jwt = require('jwt-simple');
var JWT_SECRET = require('./lib/internal-files').JWT_SECRET;
var makeUrlSuffix = require('./lib/makeUrlSuffix');

var handler = require('./lib/request-handler');

var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.configure(function() {
  app.use(partials());
  app.use(express.static(__dirname + '/public'));
  app.use(express.bodyParser());
  app.use(passport.initialize());
});


// Passport session setup.

app.get('/auth/facebook',
  passport.authenticate('facebook'),
  function(req, res){
    // The request will be redirected to Facebook for authentication, so this
    // function will not be called.
});

// https://github.com/jaredhanson/passport-http-bearer ({session:false}) example
app.get('/auth/facebook/callback', 
  passport.authenticate('facebook', { session: false, failureRedirect: '/' }),
  function(req, res) {
    var urlSuffix = makeUrlSuffix.makeUrlSuffix(req);
    res.redirect('/linden/passman/dustytoken/'+urlSuffix);
  });


app.get('/',  handler.renderIndex);
app.get('/allcandidates', iceAuthenticated, handler.serveCandidates);
app.get('/matches', iceAuthenticated, handler.serveMatches);
app.post('/matches', iceAuthenticated, handler.postMatches);



app.get('/*', serverUtil.send404);

// app.get('/', function(req, res){
//   res.sendfile('index.html');
// });

io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
  socket.on('chat message', function(msg){
    io.to(msg.receiver).emit('chat message', {msg: msg.message /*, sender: msg.sender*/});
    // socket.broadcast.emit('chat message', msg);
  });

  socket.on('join', function (data) {
    socket.join(data.user); // We are using room of socket io
  });

});


// http.listen(3000, function(){
//   console.log('listening on *:3000');
// });

module.exports.app = app;
module.exports.http = http;

