// exports.authTokenCheck = (req,res,next) => {
//   console.log('bob')
//   next();
// };
const request = require("request");
const SpotifyAPI = require("../models/spotifyAPI.js");
const spotifyAPI = new SpotifyAPI(request);
const DBModel = require("../models/DBModel.js");
const dbModel = new DBModel();
const client_id = process.env.SPOTIFY_XMAS_ID; // Your client id
const client_secret = process.env.SPOTIFY_XMAS_SECRET; // Your secret

function getNewAuthToken(userID, refreshToken) {
  console.log("I've been supplied: " + userID);
  return new Promise(function(resolve, reject) {
    spotifyAPI
      .refreshAccessToken(refreshToken, client_id, client_secret)
      .then(function(newToken) {
        dbModel.uploadNewTokenToDB(newToken, userID);
        resolve(newToken);
      });
  });
}

const validate = (userID) => new Promise(function(resolve, reject) {
    dbModel.userQuery(userID).then(function(usersDBObject) {
      if (!usersDBObject) {
        reject(false);
      }
      let accessToken,userID,uniqueID,refreshToken;
      [accessToken,userID,uniqueID,refreshToken] = [usersDBObject[0].auth_token,
      usersDBObject[0].id,
      usersDBObject[0].unique_id,
      usersDBObject[0].refresh_token];

      spotifyAPI.testTokenValidity(accessToken).then(function(valid) {
        if (valid) {
          console.log("VALID!" + accessToken)
          resolve({ id: userID, auth_token: accessToken, unique_id: uniqueID });
        } else {
          getNewAuthToken(userID, refreshToken).then(function(newToken) {
            resolve({
              id: userID,
              auth_token: newToken,
              unique_id: uniqueID
            });
          });
        }
      });
    });
  });


exports.authTokenCheck = (req,res,next) => {
  userID = req.cookies.authenticated;
  if(!userID) return next()
  validate(userID)
    .then( returnedUser => {req.user = returnedUser;return next() })
    .catch(x =>{console.log('error:', x); return next()})
}

// = (fn) => {
//   return function(req, res, next) {
//     return authCheck(req).then((user) => {
//       req.user = user;
//       console.log(req);
//       next(      fn(req, res, next))
//     })
//   };
// };
