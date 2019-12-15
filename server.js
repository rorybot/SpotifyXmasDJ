const express = require("express");
const server = express();
const mysql = require("mysql");
const options = {
  user: "root",
  password: "",
  database: "spotify_xmas_dj"
};
const connection = mysql.createConnection(options);
const port = process.env.PORT || 4000;
var _ = require("lodash");
const client_id = process.env.SPOTIFY_XMAS_ID; // Your client id
const client_secret = process.env.SPOTIFY_XMAS_SECRET; // Your secret
// var stateKey = 'spotify_auth_state';
var mustache = require("mustache");
var fs = require("fs");
var querystring = require("querystring");
var request = require("request");
var redirect = "https://5890b41e.ngrok.io/callback";
var view = {
  auth_url:
    "https://accounts.spotify.com/authorize?client_id=" +
    client_id +
    "&response_type=code&redirect_uri=" +
    redirect +
    "&scope=user-read-private%20user-read-email%20playlist-read-private%20playlist-modify-public%20playlist-read-collaborative%20playlist-modify-private%20user-library-modify%20user-library-read%20user-top-read"
};
var template = fs.readFileSync("./public/index.html", "utf8");
var Mixer = require("./src/models/Mixer.js");
var DBModel = require("./src/models/DBModel.js");

connection.connect(err => {
  if (err) {
    console.error("Error connecting to db");
    throw err;
  }
});

server.get("/", (req, res) => {
  res.send(mustache.to_html(template, view));
});

server.get("/spotify_backend", (req, res) => {
  res.send({
    client_id: client_id,
    client_secret: client_secret
  });
});

function user_query(callback) {
  connection.query("SELECT * FROM users", (error, users, fields) => {
    if (error) {
      throw error;
    }
    callback(users[0]);
  });
}
server.get("/grab_playlist", (req, res) => {
  user_query(function(auth_token) {
    access_token = auth_token.auth_token;
    // console.log('auth is:' + auth_token);
    var options = {
      url:
        "https://api.spotify.com/v1/playlists/" +
        req.query.playlistID +
        "/tracks",
      headers: { Authorization: "Bearer " + access_token },
      json: true
    };
    request.get(options, function(error, response, body) {
      console.log(response);
      for (i = 0; i < body.items.length; i++) {
        connection.query(
          "INSERT INTO ?? (track_id,popularity) VALUES (?,?)",
          [
            req.query.table,
            body.items[i].track.id,
            body.items[i].track.popularity
          ],
          (error, users, fields) => {
            if (error) {
              console.error("An error in query");
              throw error;
            }
            console.log("Successful entry");
          }
        );
      }
      res.redirect("/#");
    });
  });
});

server.get("/create_playlist", (req, res) => {
  user_query(function(auth_token) {
    access_token = auth_token.auth_token;
    var authOptions = {
      url: "https://api.spotify.com/v1/users/" + auth_token.id + "/playlists",
      headers: { Authorization: "Bearer " + access_token },
      json: { name: "bob" }
    };
    request.post(authOptions, function(error, response, body) {
      console.log(body.id);
      //store id to table
    });
  });
  res.redirect("/#");
});

server.get("/populate_playlist", (req, res) => {
  //must be done 100 at a time

  function uploadChunkToSpotify(chunk) {
    return new Promise(function(resolve, reject) {
      user_query(function(auth_token) {
        access_token = auth_token.auth_token;
        var playlistID = "5nDj9vDRfOksHzrRlQFoYi";
        var authOptions = {
          url: "https://api.spotify.com/v1/playlists/" + playlistID + "/tracks",
          headers: { Authorization: "Bearer " + access_token },
          json: {
            uris: chunk
          }
        };

        request.post(authOptions, function(error, response, body) {
          console.log(response);
          if (error) {
            console.log(error);
            reject(error);
          }

          resolve(response);
        });
      });
    });
  }

  // **select playlist ID from meta table that matches current user name
  // select first playlist ID from meta table
  var dbModel = new DBModel();
  dbModel.selectMixedPlaylistMeta("tenure").then(function(playlist_meta) {
    dbModel
      .selectMixedPlaylistTracks(playlist_meta[0].playlist_id)
      .then(function(tracks) {
        var trackNo = 1;
        var loopNo = 1;
        var uploadBuffer = [];
        tracks.forEach(function(track) {
          track = "spotify:track:" + track.track;
          uploadBuffer.push(track);
          if (
            trackNo / 100 == loopNo ||
            (tracks.length < 100 && trackNo == tracks.length)
          ) {
            uploadChunkToSpotify(uploadBuffer).then(function(response) {
              res.send(uploadBuffer);
              uploadBuffer = [];
            });
          } else {
          }
          trackNo++;
          loopNo++;
        });
      });
  });
});

server.get("/shuffle", (req, res) => {
  var mixer = new Mixer();
  var dbModel = new DBModel();
  var promises = [
    mixer.getSongs(connection, "xmas_music"),
    mixer.getSongs(connection, "regular_music")
  ];

  Promise.all(promises).then(function(argument) {
    for (i = 0; i < argument.length - 1; i++) {
      var allMusicArray = argument[i].concat(argument[i + 1]);
    }
    var mixedArray = mixer.shuffle(allMusicArray);

    user_query(function(auth_token) {
      dbModel.createPlaylistMeta(auth_token.id).then(function(last_entry) {
        dbModel.insertMixedPlaylist(last_entry.insertId, mixedArray);
      });
    });
  });
  res.send("Shuffled");
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
            console.log("Successful entry");
          }
        );
      }
      userQuery(storeUserData);
      res.redirect("/#");
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

server.get("/refresh_token", function(req, res) {
  function getNewAuthToken(callback) {
    return new Promise(function(resolve, reject) {
      connection.query("SELECT * FROM users", (error, users, fields) => {
        if (error) {
          console.log(error);
          reject(error);
        } else {
          user_id = users[0].id;
          refresh_token = users[0].refresh_token;

          resolve(
            request.post(
              {
                url: "https://accounts.spotify.com/api/token",
                headers: {
                  Authorization:
                    "Basic " +
                    new Buffer(client_id + ":" + client_secret).toString(
                      "base64"
                    )
                },
                form: {
                  grant_type: "refresh_token",
                  refresh_token: users[0].refresh_token
                },
                json: true
              },
              function(error, response, body) {
                if (!error && response.statusCode === 200) {
                  console.log("BARG2000!");
                  var access_token = body.access_token;
                  callback(access_token, user_id);
                  console.log(body);
                }
              }
            )
          );
        }
      });
    });
  }

  getNewAuthToken(function(new_token, user_id) {
    connection.query(
      "UPDATE users SET auth_token = ? WHERE id = ?",
      [new_token, user_id],
      (error, users, fields) => {
        if (error) {
          throw error;
        }
        console.log(users);
      }
    );
  });

  res.redirect("/#");
});

server.listen(port, () => {
  var naughty_or_nice = ["Naughty", "Nice"];
  console.log(
    `Ho ho ho! Father Christmas has you on his list of ${_.sample(
      naughty_or_nice
    )} Kids, for using ${port}`
  );
});
