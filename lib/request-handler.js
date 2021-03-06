var request = require('request');
var util = require('../lib/utility');
var serverUtil = require('../lib/server-utils');

var passport = require('passport')
var FacebookStrategy = require('passport-facebook').Strategy;

var db = require('../app/config');
var User = require('../app/models/user');
var Match = require('../app/models/match');
var Users = require('../app/collections/users');
var Matches = require('../app/collections/matches');
var url = require('url');



exports.renderIndex = function(req, res) {
  console.log('render index triggered');
  res.status(200).sendfile(process.cwd() + '/public/static/index.html');
};

// we need to search the matches table for all matches where 
// the current user equals the user_0_id or the current user id 
// equals the user_1_id and count equals 2
exports.serveMatches = function(req, res){
  var url_parts = url.parse(req.url, true);
  var query = url_parts.query;
  var user = req.mydata.user;

  // check that the request provided a valid api key
  console.log('server matches triggered'); 
  Matches
    .query({where: {user_0_id: user.attributes.fb_id}, 
      orWhere: {user_1_id: user.attributes.fb_id},
      andWhere:{count: 2}})
      .fetch()
      .then(function(matches){
        if(!matches){
          serverUtil.sendResponse(res, 'No matches', 204);
        } else {
          serverUtil.sendResponse(res, matches, 200);
        }
      })
      .catch(function(err){
        console.log('Error(postMatches): ', err);
      });
};

exports.postMatches = function(request, response) {
  // query the database to see if the current user matches either user_0
  // or user_1 field of our database. If the we get a result back then 
  // we know that we have a match. We can check the count and if the 
  // update the count. If the count is already 2 then something has
  // gone wrong.
  // where am I going to get the current user id? 
  //  
  // TODO: we may have to look up the targets facebook id
  console.log('post matches triggered');

  var url_parts = url.parse(request.url, true);
  var query = url_parts.query;

  console.lo


  // Sort the ids so that we always know when we query that if there
  // is a match the smaller id is always in user_0_id and the larger
  // id is in user_1_id
  var alreadyInOrder = request.mydata.user.attributes.fb_id < query.target_id;
  var low_id = alreadyInOrder ? request.mydata.user.attributes.fb_id : query.target_id;
  var high_id = alreadyInOrder ? query.target_id : request.mydata.user.attributes.fb_id;
  
  console.log('QUERY', query, alreadyInOrder, low_id, high_id, typeof query.target_id);
  
  new Match()
    .query({where:{user_0_id:low_id}, 
      andWhere:{user_1_id: high_id}})
     .fetch()
     .then(function(found) {
      if (found) {
        if(found.attributes.count === 1){
        found.set({
            count:2
          });

          found.save()
          .then(function(update){
            console.log('updated', update);
            serverUtil.sendResponse(response, update, 200);
          })
          .catch(function(err){
            serverUtil.sendResponse(response, 'Error', 403);
            console.log('err', err);
          })
        } else if(found.attributes.count === 2 ) {
          serverUtil.sendResponse(response, 'Error', 403);
          console.log('Error: count already 2, increment attempted');
        }
      } else { //not found case
      
        var match = new Match({
          user_0_id: low_id,
          user_1_id: high_id,
          count: 1
        });

        match.save().then(function(newMatch) {
          Matches.add(newMatch);
          serverUtil.sendResponse(response, newMatch,200);
        });
      }//
  });
};


// serveCandidates returns all users of the opposite gender
// the icebreaker authentication middleware retrieves the
// user from the database and attaches the user to the 
// request namespaces under mydata
// 

exports.serveCandidates = function(request, response){
  console.log('serveCandidates triggered');
  // code here
  var user = request.mydata.user;
  console.log('is_male', typeof user.attributes.is_male,user.attributes.is_male);

  // if the user is male we return female candidates and vice versa
  var oppositeGender = user.attributes.is_male ? 0 : 1;
  console.log('oppositeGender', oppositeGender);
  Users
    .query('where','is_male',oppositeGender)
    .fetch()
    .then(function(candidates){
      if(!candidates){
        serverUtil.sendResponse(response, 'No matches', 204);
      } else {
        serverUtil.sendResponse(response, candidates, 200);
      }
    })
    .catch(function(err){
      serverUtil.send404(request, response);
      console.log(err);
    });
};
