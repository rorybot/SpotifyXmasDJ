const express = require("express");
const server = express();
const path = require("path");
const mysql = require("mysql");
const url = require("url");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");

server.use(cookieParser());
const options = {
  user: "root",
  password: "",
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
var querystring = require("querystring");
const request = require("request");
var redirect = "https://5890b41e.ngrok.io/callback";
var template = fs.readFileSync("./public/template/index.html", "utf8");
const Mixer = require("./src/models/Mixer.js");
const DBModel = require("./src/models/DBModel.js");
var dbModel = new DBModel();
const SpotifyAPI = require("./src/models/spotifyAPI.js");

var view = {
  auth_url:
    "https://accounts.spotify.com/authorize?client_id=" +
    client_id +
    "&response_type=code&redirect_uri=" +
    redirect +
    "&scope=user-read-private%20user-read-email%20playlist-read-private%20playlist-modify-public%20playlist-read-collaborative%20playlist-modify-private%20user-library-modify%20user-library-read%20user-top-read"
};

connection.connect(err => {
  if (err) {
    console.error("Error connecting to db");
    throw err;
  }
});

server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: true }));

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

      var spotifyAPI = new SpotifyAPI(request);
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

function getPlaylistsFromURL(user,playlistArray,callback = false,newURL=false) {
  var options = {
    url: "https://api.spotify.com/v1/users/" + user.id + "/playlists",
    headers: { Authorization: "Bearer " + user.auth_token },
    json: true
  };
  if(newURL){
    options.url = newURL;
  }
  request.get(options, function(error, response, body) {
    body.items.forEach(function(playlist) {
      playlistArray.push({
        url: `${playlist.external_urls.spotify} `,
        name: `${playlist.name} `,
        id: `${playlist.id}`
      });
    });
    view.playlistList = "";
    if (body.next) {
      getPlaylistsFromURL(user, playlistArray, callback,body.next);
    } else {
      //
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
  if (req.cookies.authenticated) {
    console.log("Authenticated");
    //Move this responsibiltiy to a view-adjacent js file
    //Need to send a reauthentication link if missing
    var playlistArray = [];
    //check if token needs refreshing
    testTokenForRefresh(req.cookies.authenticated).then(function(user) {
      // console.log(user)
        //returns a user item if valid and refreshed; pass to spotify, get playlists, add to rendering template
        view.display_on_auth = "display:none";
        getPlaylistsFromURL(user, playlistArray, function() {
          res.send(mustache.to_html(template, view));
        });
    }).catch(function(){
        //renders page without filtering any user details through// cookie doesn't match existing DB user
        res.send(mustache.to_html(template, view));
    });
  } else {
    res.send(mustache.to_html(template, view));
  }
});

function getNewAuthToken(userID, refreshToken) {
  // return new Promise(function(resolve, reject) {
  console.log("I've been supplied: " + userID);
  return new Promise(function(resolve, reject) {
    // connection.query(
    // "SELECT * FROM users WHERE id = ?",
    // [userID],
    // (error, users, fields) => {
    // if (error) {
    //   console.log(error);
    //   reject(error);
    // } else {
    // refreshToken = users.refresh_token;
    // resolve(
    var spotifyAPI = new SpotifyAPI(request);
    spotifyAPI
      .refreshAccessToken(refreshToken, client_id, client_secret)
      .then(function(newToken) {
        dbModel.uploadNewTokenToDB(newToken, userID);
        resolve(newToken);
      });
  });
  // );
  // }
  // }
  // );
  // });
}

server.use(express.static("public/template"));

server.post("/submitPlaylists", (req, res) => {
  testTokenForRefresh(req.cookies.authenticated).then(function(user) {
    var playlistsToUse = req.body.playlistsToUse;
    if (typeof playlistsToUse === "string") {
      playlistsToUse = [playlistsToUse];
    }
    var playlistNo = 0;
    var entries = [];
    var spotifyAPI = new SpotifyAPI(request);

    playlistsToUse.forEach(function(playlistID) {
      spotifyAPI.grabPlaylistTracks(user, playlistID, entries, function() {
        playlistNo++;
        if (playlistNo == playlistsToUse.length) {
          connection.query(
            "INSERT INTO ?? (user_id,track_id,popularity) VALUES ?",
            ["xmas_music", entries],
            (error, users, fields) => {
              if (error) {
                console.error("An error in query");
                throw error;
              }
              console.log("Successful entry");
              mixMusic(user.id);
              res.redirect("/mix?mixed=" + user.id);
            }
          );
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
  var mixer = new Mixer();
  var promises = [
    mixer.getSongs(connection, "xmas_music"),
    mixer.getSongs(connection, "regular_music")
  ];
  Promise.all(promises).then(function(argument) {
    var allMusicArray = argument;
    if (promises.length > 1) {
      for (i = 0; i < argument.length - 1; i++) {
        allMusicArray = argument[i].concat(argument[i + 1]);
      }
    }
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

server.get("/grab_playlist", (req, res) => {});

server.post("/createPlaylist", (req, res) => {
  userID = req.cookies.authenticated;
  playlistName = req.body.playlistName;
  // console.log(req.body)
  testTokenForRefresh(userID).then(function(user) {
    accessToken = user.auth_token;

    spotifyAPI = new SpotifyAPI(request);
    spotifyAPI.createPlaylist(accessToken).then(function(playlistData) {
      var spotifyPlaylistID = playlistData.id;
      var newPlaylistURL = playlistData.external_urls.spotify;
      view.newPlaylistURL = newPlaylistURL;
      connection.query(
        "UPDATE mixed_playlist_meta SET playlist_url = ? WHERE user = ?",
        [newPlaylistURL, userID],
        (error, users, fields) => {
          if (error) {
            console.error("An error in query");
            throw error;
          }
          console.log("Successful entry");
        }
      );

      dbModel.selectMixedPlaylistMeta(userID).then(function(playlistMeta) {
        dbModel
          .selectMixedPlaylistTracks(playlistMeta[0].playlist_id)
          .then(function(tracks) {
            spotifyAPI.uploadTracks(tracks, spotifyPlaylistID);
          });
      });
    });

    res.redirect("/#playlistCreated");
  });
});

server.get("/callback", function(req, res) {
  var spotifyAPI = new SpotifyAPI(request);
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
      spotifyAPI.userQuery(body).then(function(returnedUserData) {
        dbModel.storeUserData(
          returnedUserData.userID,
          returnedUserData.userEmail
        );
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
  console.log(
    `Ho ho ho! Father Christmas has you on his list of ${_.sample(
      naughty_or_nice
    )} Kids, for using ${port}`
  );
});
