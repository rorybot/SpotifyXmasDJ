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
const redirectString = (req,callback) => req.protocol + "://" + req.headers.host + '/callback';

function getNewAuthToken(userID, refreshToken) {
  console.log("Getting a new token for: " + userID);
  console.log("Using thisrefreshToken;", refreshToken)
  return new Promise(function(resolve, reject) {
    spotifyAPI
      .refreshAccessToken(refreshToken, client_id, client_secret)
      .then(function(newToken) {
        dbModel.uploadNewTokenToDB(newToken, userID);
        resolve(newToken);
      })
      .catch(
        x => reject(x)
      );
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
        let package =  {id: userID, auth_token: accessToken, unique_id: uniqueID }
	      
	if (valid) {
          console.log("VALID! No need for new token" + accessToken)
          resolve(package);
        } else {
          getNewAuthToken(userID, refreshToken).then(function(newToken) {
            console.log("New token received from spotify", newToken)
	    package.auth_token = newToken;
            resolve(package)
	  }).catch( x => {console.log(x);reject(x);})
        }
      });
    });
  });


exports.authTokenCheck = (req,res,next) => {
  console.log("Need to authenticated",req.cookies.authenticated)
  if(!req.cookies.authenticated) return next()
  const userID = req.cookies.authenticated;
  validate(userID)
    .then( returnedUser => {req.user = returnedUser;return next() })
    .catch(
      x => {
        if(x.error == 'invalid_grant'){ console.log('error:', x); return  res.redirect(`https://accounts.spotify.com/authorize?client_id=${client_id}&response_type=code&redirect_uri=${redirectString(req,'/callback')}&scope=user-read-private%20user-read-email%20playlist-read-private%20playlist-modify-public%20playlist-read-collaborative%20playlist-modify-private%20user-library-modify%20user-library-read%20user-top-read`)};
        return next()
      }
    )
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
