const express = require("express");
const server = express();
const path = require("path");
const mysql = require("mysql");
const url = require("url");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
server.use(cookieParser());
let secureEnv = require('secure-env');
global.env = secureEnv({secret:'h9uE7FdTGr7PV'});
const options = {
  user: global.env.DBUSER,
  password: global.env.DBPASSWORD,
  database: "spotify_xmas_dj"
};
// const connection = mysql.createConnection(options);
function handleDisconnect() {
  connection = mysql.createConnection(options); // Recreate the connection, since
                                                  // the old one cannot be reused.

  connection.connect(function(err) {              // The server is either down
    if(err) {                                     // or restarting (takes a while sometimes).
      console.log('error when connecting to db:', err);
      setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
    }                                     // to avoid a hot loop, and to allow our node script to
  });                                     // process asynchronous requests in the meantime.
                                          // If you're also serving http, display a 503 error.
  connection.on('error', function(err) {
    console.log('db error', err);
    if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
      handleDisconnect();                         // lost due to either server restart, or a
    } else {                                      // connnection idle timeout (the wait_timeout
      throw err;                                  // server variable configures this)
    }
  });
}
handleDisconnect();

const port = process.env.PORT || 4000;
const _ = require("lodash");
var client_id = process.env.SPOTIFY_XMAS_ID; // Your client id
var client_secret = process.env.SPOTIFY_XMAS_SECRET; // Your secret
// var stateKey = 'spotify_auth_state';
const mustache = require("mustache");
const fs = require("fs");
var querystring = require("querystring");
const request = require("request");
var redirect = "https://xmasdj.rorybot.com/callback";
var template = fs.readFileSync(
  __dirname + "/../public/template/index.html",
  "utf8"
);
const Mixer = require(__dirname + "/models/Mixer.js");
const mixer = new Mixer();
const DBModel = require(__dirname + "/models/DBModel.js");
const dbModel = new DBModel();
const SpotifyAPI = require(__dirname + "/models/spotifyAPI.js");
const spotifyAPI = new SpotifyAPI(request);
const bunyan = require('bunyan');
const log = bunyan.createLogger({
    name: 'devLog',
    streams: [{
        path: __dirname + '/logs/dev.log',
    }]
});

server.use("/assets", express.static(__dirname + "/../public/template/assets"));
server.use("/images", express.static(__dirname + "/../public/template/images"));

server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: true }));

function getAppCredentials() {
  return new Promise(function(resolve, reject) {
    connection.query(
      "SELECT * FROM spotify_api_access",
      (error, credentials, fields) => {
        if (error) {
          throw error;
        }
        resolve(credentials);
      }
    );
  });
}

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
    // log.info(Object.getOwnPropertyNames(DBModel.prototype))
    dbModel.userQuery(userID).then(function(usersDBObject) {
      if (usersDBObject == false) {
        reject(false);
      } else {
        log.info(usersDBObject + "is status of dbojects");
        accessToken = usersDBObject[0].auth_token;
        userID = usersDBObject[0].id;
        uniqueID = usersDBObject[0].unique_id;
        refreshToken = usersDBObject[0].refresh_token;

        spotifyAPI.testTokenValidity(accessToken).then(function(valid) {
          if (valid) {
            log.info("VALID!" + accessToken);
            resolve({
              id: userID,
              auth_token: accessToken,
              unique_id: uniqueID
            });
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
      }
    });
  });
}

function getPlaylistsFromURL(
  user,
  playlistArray,
  callback = false,
  newURL = false
) {
  var options = {
    url: "https://api.spotify.com/v1/users/" + user.id + "/playlists",
    headers: { Authorization: "Bearer " + user.auth_token },
    json: true
  };
  if (newURL) {
    options.url = newURL;
  }
  request.get(options, function(error, response, body) {
    if(body && body.items){
      body.items.forEach(function(playlist) {
        playlistArray.push({
          url: `${playlist.external_urls.spotify} `,
          name: `${playlist.name} `,
          id: `${playlist.id}`
        });
      });
    }
    view.playlistList = "";
    if (body && body.next) {
      getPlaylistsFromURL(user, playlistArray, callback, body.next);
    } else {

      playlistArray.forEach(function(playlist) {
        view.playlistList += `<option value='${playlist.id}' >${
          playlist.name
        }</option>`;
      });
      callback();
    }
  });
}

server.get("/", (req, res) => {
  if (!req.cookies.authenticated) {
    getAppCredentials().then(function(credentials) {
      client_id = credentials[0].appID; // Your client id
      client_secret = credentials[0].appSecret; // Your secret
      var view = {
        auth_url:
          "https://accounts.spotify.com/authorize?client_id=" +
          client_id +
          "&response_type=code&redirect_uri=" +
          redirect +
          "&scope=user-read-private%20user-read-email%20playlist-read-private%20playlist-modify-public%20playlist-read-collaborative%20playlist-modify-private%20user-library-modify%20user-library-read%20user-top-read"
      };
      res.send(mustache.to_html(template, view));
    });
  } else {
    log.info("Authenticated");
    //Move this responsibiltiy to a view-adjacent js file
    //Need to send a reauthentication link if missing
    var playlistArray = [];
    //check if token needs refreshing
    testTokenForRefresh(req.cookies.authenticated)
      .then(function(user) {
        // log.info(user)
        //returns a user item if valid and refreshed; pass to spotify, get playlists, add to rendering template
        view.display_on_auth = "display:none";
        getPlaylistsFromURL(user, playlistArray, function() {
          res.send(mustache.to_html(template, view));
        });
      })
      .catch(function() {
        //renders page without filtering any user details through// cookie doesn't match existing DB user
        res.send(mustache.to_html(template, view));
      });
  }
});

function getNewAuthToken(userID, refreshToken) {
  log.info("I've been supplied: " + userID);
  return new Promise(function(resolve, reject) {
    spotifyAPI
      .refreshAccessToken(refreshToken, client_id, client_secret)
      .then(function(newToken) {
                      log.info("I've got" + newToken)
        dbModel.uploadNewTokenToDB(newToken, userID);
        resolve(newToken);
      }).catch(function(err){
        log.info(err)
      });
  });
}

server.post("/submitPlaylists", (req, res) => {
  testTokenForRefresh(req.cookies.authenticated).then(function(user) {
    log.info(user);
    var playlistsToUse = req.body.playlistsToUse;
    if (typeof playlistsToUse === "string") {
      playlistsToUse = [playlistsToUse];
    }
    var playlistNo = 0;
    var entries = [];

      playlistsToUse.forEach(function(playlistID) {
        spotifyAPI.grabPlaylistTracks(user, playlistID, entries, function() {
          playlistNo++;
          if (playlistNo == playlistsToUse.length) {
            dbModel.checkUserHasMusic(user.id).then(function(){
              dbModel.insertMusicIntoXmasMusicTable(user,entries, function() {
                mixMusic(user.id);
                res.redirect("/mix?mixed=" + user.id);
              });
            })
          }
        });
      });
  });
});

server.get("/mix", (req, res) => {
  // Cookie for user needs to be encrypted form of username, which then stored alongisde name in database, and used for comparison when used in queries like this
  if (req.query.mixed && req.query.mixed == req.cookies.authenticated) {
    res.redirect("/#Mix");
  } else {
    res.redirect("/");
  }
});

function mixMusic(userID) {
    mixer.getSongs(connection, "xmas_music", userID).then(function(allMusicArray) {

    var mixedArray = mixer.shuffle(allMusicArray);
    testTokenForRefresh(userID).then(function(user) {
      dbModel.createPlaylistMeta(user.id).then(function(last_entry) {
        var newMixedPlaylist = dbModel.insertMixedPlaylist(
          last_entry.insertId,
          mixedArray
        );
      });
    });
  });
}

server.post("/createPlaylist", (req, res) => {
  userID = req.cookies.authenticated;
  playlistName = req.body.playlistName;
  // log.info(req.body)
  testTokenForRefresh(userID).then(function(user) {
    accessToken = user.auth_token;
    spotifyAPI.createPlaylist(accessToken).then(function(playlistData) {
      var spotifyPlaylistID = playlistData.id;
      var newPlaylistURL = "https://open.spotify.com/embed/playlist/" + playlistData.id;
      view.newPlaylistURL = newPlaylistURL;

      dbModel.updateMixedPlaylistURL(newPlaylistURL, userID);
      dbModel.selectMixedPlaylistMeta(userID).then(function(playlistMeta) {
        dbModel
          .selectMixedPlaylistTracks(playlistMeta[0].playlist_id)
          .then(function(tracks) {
            spotifyAPI.uploadTracks(tracks, spotifyPlaylistID,accessToken);
          });
      });
    });

    res.redirect("/#playlistCreated");
  });
});

server.get("/callback", function(req, res) {
  var code = req.query.code || null;
  var state = req.query.state || null;
  var authOptions = {
    url: "https://accounts.spotify.com/api/token",
    form: {
      code: code,
      redirect_uri: redirect,
      grant_type: "authorization_code"
    },
    headers: {
      Authorization:
        "Basic " +
        new Buffer(client_id + ":" + client_secret).toString("base64")
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      console.log(response)
      spotifyAPI.userQuery(body).then(function(returnedUserData) {
        log.info(returnedUserData);
        dbModel.storeUserData(
          returnedUserData.id,
          returnedUserData.email,
          body.access_token,
          body.refresh_token
        );
        res.cookie("authenticated", returnedUserData.id, {
          maxAge: 31536000000
        });
        res.redirect("/#work");
      });
    } else {
      res.redirect(
        "/#" +
          querystring.stringify({
            error: "invalid_token"
          })
      );
    }
  });
});

server.listen(port, () => {
  var naughty_or_nice = ["Naughty", "Nice"];
  log.info(
    `Ho ho ho! Father Christmas has you on his list of ${_.sample(
      naughty_or_nice
    )} Kids, for using ${port}`
  );
});
