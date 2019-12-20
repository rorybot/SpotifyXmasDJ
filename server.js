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


function getPlaylistsFromURL(supplied_options,playlistArray,callback=false) {
  request.get(supplied_options, function(error, response, body) {
    body.items.forEach(function(playlist) {
      playlistArray.push({
        url: `${playlist.external_urls.spotify} `,
        name: `${playlist.name} `,
        id: `${playlist.id}`
      });
    });
    view.playlistList = "";
    if (body.next) {
      supplied_options.url = body.next;
      getPlaylistsFromURL(supplied_options,playlistArray,callback);
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
    testTokenForRefresh(req.cookies.authenticated).then(function(user) {
      if(user){
        access_token = user.auth_token;
        user_id = user.id;
        var options = {
          url: "https://api.spotify.com/v1/users/" + user_id + "/playlists",
          headers: { Authorization: "Bearer " + access_token },
          json: true
        };
        view.display_on_auth = "display:none";
        getPlaylistsFromURL(options,playlistArray, function(){
          res.send(mustache.to_html(template, view));
        });
      } else {
        res.send(mustache.to_html(template, view));
      }
    });
  } else {
    res.send(mustache.to_html(template, view));
  }
});

function getNewAuthToken(userID, refreshToken) {
  // return new Promise(function(resolve, reject) {
    console.log("I've been supplied: " + userID);
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
            spotifyAPI.refreshAccessToken(refreshToken,client_id,client_secret).then(function(newToken){
              uploadNewTokenToDB(newToken,userID);
              // Which is..... resolves into that user thing -- this all needs to be promissary
              return new Promise(function(resolve, reject) {
                connection.query(
                  "UPDATE users SET auth_token = ? WHERE id = ?",
                  [newToken, userID],
                  (error, users, fields) => {
                    if (error) {
                      reject(error);
                    }
                    resolve(newToken);
                  }
                );
              });
            })
          // );
        // }
      // }
    // );
  // });
}

server.use(express.static("public/template"));

function user_query(userID = false, callback) {
  connection.query(
    "SELECT * FROM users WHERE id = ?",
    [userID],
    (error, users, fields) => {
      if (error) {
        throw error;
      }
      if(users.length > 0){
        callback(users);
      } else {
        callback(false);
      }
    }
  );
}

function testTokenForRefresh(userID) {
  return new Promise(function(resolve, reject) {
    user_query(userID, function(usersDBObject) {
      if(!usersDBObject){
        return resolve(false);
      }
      accessToken = usersDBObject[0].auth_token;
      userID = usersDBObject[0].id;
      uniqueID = usersDBObject[0].unique_id;
      refreshToken = usersDBObject[0].refresh_token;

      var spotifyAPI = new SpotifyAPI(request);
      spotifyAPI.testTokenValidity(accessToken).then(function(valid){
        if(valid){
          resolve({ id: userID, auth_token: accessToken, unique_id: uniqueID });
        } else {
          resolve({id: userID, auth_token: getNewAuthToken(userID,refreshToken), unique_id: uniqueID});
        }
      })
    });
  });
}

server.post("/submitPlaylists", (req, res) => {
  testTokenForRefresh(req.cookies.authenticated).then(function(user) {
    var playlistsToUse = req.body.playlistsToUse;
    if(typeof playlistsToUse === 'string'){
      playlistsToUse = [playlistsToUse];
    }
    var playlistNo = 0
    var entries = [];
    var spotifyAPI = new SpotifyAPI(request);

    playlistsToUse.forEach(function(playlistID) {
      spotifyAPI.grabPlaylistTracks(user, playlistID,entries, function(){
        playlistNo++;
        if(playlistNo == playlistsToUse.length){
          connection.query(
            "INSERT INTO ?? (user_id,track_id,popularity) VALUES ?",
            ["xmas_music",entries],
            (error, users, fields) => {
              if (error) {
                console.error("An error in query");
                throw error;
              }
              console.log("Successful entry");
              mixMusic(user.id)
            }
          );
        }
      });
    });
  });

  res.redirect("/#contact");
});

server.get('/newPlaylistPage', (req,res) => {

})


function mixMusic(userID){
  var mixer = new Mixer();
  var dbModel = new DBModel();
  var promises = [
    mixer.getSongs(connection, "xmas_music"),
    mixer.getSongs(connection, "regular_music")
  ];
  Promise.all(promises).then(function(argument) {
    var allMusicArray = argument;
    if(promises.length > 1){
      for (i = 0; i < argument.length - 1; i++) {
        allMusicArray = argument[i].concat(argument[i + 1]);
      }
    }
    var mixedArray = mixer.shuffle(allMusicArray);
    testTokenForRefresh(userID).then(function(user){
      dbModel.createPlaylistMeta(user.id).then(function(last_entry) {
        var newMixedPlaylist = dbModel.insertMixedPlaylist(last_entry.insertId, mixedArray);
      });
    })
  });
}

server.get("/grab_playlist", (req, res) => {});



server.post("/createPlaylist", (req,res)=>{
  userID = req.cookies.authenticated;
  playlistName = req.body.playlistName;
  // console.log(req.body)
  testTokenForRefresh(userID).then(function(user){
    accessToken = user.auth_token;

    spotifyAPI = new SpotifyAPI(request);
    spotifyAPI.createPlaylist(accessToken).then(function(playlistData){
      var playlistID = playlistData.id;
      var newPlaylistURL = playlistData.external_urls.spotify
      var dbModel = new DBModel();
      view.newPlaylistURL = newPlaylistURL;
      connection.query(
        "UPDATE mixed_playlist_meta SET playlist_url = ? WHERE user = ?",
        [newPlaylistURL,userID],
        (error, users, fields) => {
          if (error) {
            console.error("An error in query");
            throw error;
          }
          console.log("Successful entry");
        }
      );

      dbModel.selectMixedPlaylistMeta(userID).then(function(playlist_meta) {
        dbModel
          .selectMixedPlaylistTracks(playlist_meta[0].playlist_id)
          .then(
            // function(tracks) {

          // }
          spotifyAPI.uploadTracks(tracks)

          );
      });


    })


      res.redirect('/#playlistCreated')

  })

})


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
      var access_token = body.access_token;
      var refresh_token = body.refresh_token;
      var options = {
        url: "https://api.spotify.com/v1/me",
        headers: { Authorization: "Bearer " + access_token },
        json: true
      };
      function userQuery(callback) {
        request.get(options, function(error, response, body) {
          callback(body.id, body.email);
        });
      }
      function storeUserData(user_id, user_email) {
        connection.query(
          "INSERT INTO users (id,email,auth_token,refresh_token) VALUES (?,?,?,?)",
          [user_id, user_email, access_token, refresh_token],
          (error, users, fields) => {
            if (error) {
              console.error("An error in query");
              throw error;
            }
            console.log(user_id);
            res.cookie("authenticated", user_id, { maxAge: 31536000000 });
            res.redirect("/#work");
            console.log("Successful entry");
          }
        );
      }
      userQuery(storeUserData);
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
