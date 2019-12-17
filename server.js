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
var _ = require("lodash");
const client_id = process.env.SPOTIFY_XMAS_ID; // Your client id
const client_secret = process.env.SPOTIFY_XMAS_SECRET; // Your secret
// var stateKey = 'spotify_auth_state';
var mustache = require("mustache");
var fs = require("fs");
var querystring = require("querystring");
var request = require("request");
var redirect = "https://5890b41e.ngrok.io/callback";
var template = fs.readFileSync("./public/template/index.html", "utf8");
var Mixer = require("./src/models/Mixer.js");
var DBModel = require("./src/models/DBModel.js");

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

server.get("/", (req, res) => {
  if (req.cookies.authenticated) {
    console.log("Authenticated");
    view.display_on_auth = "display:none";
    //Move this responsibiltiy to a view-adjacent js file
    //Need to send a reauthentication link if missing
    var playlistArray = [];
    testTokenForRefresh(req.cookies.authenticated).then(function(user) {
      access_token = user.auth_token;
      user_id = user.id;
      var options = {
        url: "https://api.spotify.com/v1/users/" + user_id + "/playlists",
        headers: { Authorization: "Bearer " + access_token },
        json: true
      };
      getPlaylistsFromURL(options);
    });

    function getPlaylistsFromURL(supplied_options) {
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
          getPlaylistsFromURL(supplied_options);
        } else {
          //
          playlistArray.forEach(function(playlist) {
            view.playlistList += `<option value='${playlist.id}' >${
              playlist.name
            }</option>`;
          });
          res.send(mustache.to_html(template, view));
        }
      });
    }
    // res.send(mustache.to_html(template, view));
  } else {
    res.send(mustache.to_html(template, view));
  }
});

function getNewAuthToken(user, callback) {
  return new Promise(function(resolve, reject) {
    console.log("I've been supplied: " + user);
    connection.query(
      "SELECT * FROM users WHERE id = ?",
      [user],
      (error, users, fields) => {
        if (error) {
          console.log(error);
          reject(error);
        } else {
          user_id = user;
          refresh_token = users.refresh_token;

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
                  console.log(body.access_token);
                  var access_token = body.access_token;
                  callback(access_token, user_id);
                  // console.log(body);
                }
              }
            )
          );
        }
      }
    );
  });
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
      console.log("User is: " + users + "got from: " + userID);
      callback(users);
    }
  );
}

function testTokenForRefresh(userID) {
  return new Promise(function(resolve, reject) {
    user_query(userID, function(usersDBObject) {
      access_token = usersDBObject[0].auth_token;
      user_id = usersDBObject[0].id;
      unique_id = usersDBObject[0].unique_id;
      var options = {
        url: "https://api.spotify.com/v1/searchq=test&type=album",
        headers: { Authorization: "Bearer " + access_token },
        json: true
      };
      request.get(options, function(error, response, body) {
        if (body.error && body.error.message == "The access token expired") {
          getNewAuthToken(user_id, function(new_token, user_id) {
            var last_query = connection.query(
              "UPDATE users SET auth_token = ? WHERE id = ?",
              [new_token, user_id],
              (error, users, fields) => {
                if (error) {
                  console.log(error);
                  reject(error);
                  // throw error;
                }
                // console.log(fields)
                resolve({ id: user_id, auth_token: new_token });
              }
            );
          });
        } else {
          console.log(usersDBObject)
          resolve({ id: user_id, auth_token: access_token, unique_id: unique_id });
        }
      });
    });
  });
}

server.post("/submitPlaylists", (req, res) => {
  testTokenForRefresh(req.cookies.authenticated).then(function(user) {
    req.body.playlistsToUse.forEach(function(playlistID) {
      return grabPlaylistFromSpotify(user, "xmas_music", playlistID);
    });
  });

  function grabPlaylistFromSpotify(user, table, playlistID) {
    access_token = user.auth_token;
    // console.log('auth is:' + auth_token);
    var options = {
      url: "https://api.spotify.com/v1/playlists/" + playlistID + "/tracks",
      headers: { Authorization: "Bearer " + access_token },
      json: true
    };
    request.get(options, function(error, response, body) {
      console.log(response);
      for (i = 0; i < body.items.length; i++) {
        connection.query(
          "INSERT INTO ?? (track_id,popularity,user_id) VALUES (?,?,?)",
          [
            table,
            body.items[i].track.id,
            body.items[i].track.popularity,
            user.id
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
    });
  }

  res.redirect("/#contact");
});

server.get("/grab_playlist", (req, res) => {});

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

// server.get("/refresh_token", function(req, res) {

// res.redirect('/');
// });

server.listen(port, () => {
  var naughty_or_nice = ["Naughty", "Nice"];
  console.log(
    `Ho ho ho! Father Christmas has you on his list of ${_.sample(
      naughty_or_nice
    )} Kids, for using ${port}`
  );
});
