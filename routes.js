const dotenv = require('dotenv');
let result = dotenv.config({ path: __dirname + '/secrets.env' });
const express = require("express");
const router = express.Router();
const server = express();
const path = require("path");
const mysql = require("mysql");
const url = require("url");
const session = require("express-session");
const options = {
  user: process.env.DBUSER,
  password: process.env.DBPASSWORD,
  database: "spotify_xmas_dj"
};
const connection = mysql.createConnection(options);
const port = process.env.PORT || 4000;
const _ = require("lodash");
const client_id = process.env.SPOTIFY_XMAS_ID; // Your client id
const client_secret = process.env.SPOTIFY_XMAS_SECRET; // Your secret
// var stateKey = 'spotify_auth_state';
const mustache = require("mustache");
const fs = require("fs");
const request = require("request");
// var redirect = "https://5890b41e.ngrok.io/callback";
let redirect = "/callback";
var template = fs.readFileSync(__dirname + "/public/template/index.html", "utf8");
const Mixer = require("./src/models/Mixer.js");
const mixer = new Mixer();
const DBModel = require("./src/models/DBModel.js");
const dbModel = new DBModel();
const SpotifyAPI = require("./src/models/spotifyAPI.js");
const spotifyAPI = new SpotifyAPI(request);
const indexController = require('./src/controllers/indexController');
const authController = require('./src/controllers/authController');
const playlistController = require('./src/controllers/playlistController');
const {authTokenCheck} = require('./src/handlers/authTokenCheck')

connection.connect(err => {
  if (err) {
    console.error("Error connecting to db");
    throw err;
  }
});



var view = {
  auth_url:
    "https://accounts.spotify.com/authorize?client_id=" +
    client_id +
    "&response_type=code&redirect_uri=" +
    redirect +
    "&scope=user-read-private%20user-read-email%20playlist-read-private%20playlist-modify-public%20playlist-read-collaborative%20playlist-modify-private%20user-library-modify%20user-library-read%20user-top-read"
};

function testTokenForRefresh(userID) {
  return new Promise(function(resolve, reject) {
    // console.log(Object.getOwnPropertyNames(DBModel.prototype))
    dbModel.userQuery(userID).then(function(usersDBObject) {
      if (!usersDBObject) {
        reject(false);
      }
      accessToken = usersDBObject[0].auth_token;
      userID = usersDBObject[0].id;
      uniqueID = usersDBObject[0].unique_id;
      refreshToken = usersDBObject[0].refresh_token;

      spotifyAPI.testTokenValidity(accessToken).then(function(valid) {
        if (valid) {
          console.log("VALID!" + accessToken)
          resolve({ id: userID, auth_token: accessToken, unique_id: uniqueID });
        } else {
          getNewAuthToken(userID, refreshToken).then(function() {
            resolve({
              id: userID,
              auth_token: getNewAuthToken(),
              unique_id: uniqueID
            });
          });
        }
      });
    });
  });
}




router.get('/', authTokenCheck,indexController.getIndexFile);
router.get('/#choosePlaylists', authTokenCheck,indexController.getIndexFile);
router.get('/spotifyAuth', authController.spotifyUserPermissionAuthentication);
router.get('/callback', authController.callback);
// router.get('/#choosePlaylists', indexController.populatePlaylistForm);

router.post("/submitPlaylists", authTokenCheck,playlistController.createPlaylist)

router.get("/mix", (req, res) => {
  console.log("Got to mix")
  // Cookie for user needs to be encrypted form of username, which then stored alongisde name in database, and used for comparison when used in queries like this
  if (req.query.mixed && req.query.mixed == req.cookies.authenticated) {
    res.redirect("/#Mix");
  } else {
    res.redirect("/");
  }
});


router.post("/createPlaylist", authTokenCheck, (req, res) => {
  const userID = req.cookies.authenticated;
  const playlistName = req.body.playlistName;
  const user = req.user;
  // console.log(req.body)
  // testTokenForRefresh(userID).then(function(user) {
  const accessToken = user.auth_token;
  spotifyAPI.createPlaylist(accessToken,playlistName,userID).then(function(playlistData) {
    const spotifyPlaylistID = playlistData.id;
    const newPlaylistURL = playlistData.external_urls.spotify;
    view.newPlaylistURL = newPlaylistURL;

    dbModel.updateMixedPlaylistURL(newPlaylistURL,userID);
    dbModel.selectMixedPlaylistMeta(userID).then(function(playlistMeta) {
      console.log("playlistMeta",playlistMeta)
      dbModel
        .selectMixedPlaylistTracks(playlistMeta[0].playlist_id)
        .then(function(tracks) {
          console.log("Necessary:", tracks, spotifyPlaylistID)
          spotifyAPI.uploadTracks(tracks, spotifyPlaylistID,accessToken);
        });
    });
  });

  res.redirect("/#playlistCreated");
  // });
});


module.exports = router;
