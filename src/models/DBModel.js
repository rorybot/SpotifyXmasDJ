const mysql = require("mysql");
const options = {
  user: process.env.DBUSER,
  password: process.env.DBPASSWORD,
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
const bunyan = require('bunyan');
const log = bunyan.createLogger({
    name: 'devLog',
    streams: [{
        path:  __dirname + '/../logs/dev.log',
        // `type: 'file'` is implied
    }]
});

module.exports = class DBModel {
  constructor() {}

  userQuery(userID = false) {
      console.log(process.env.DBUSER)
    return new Promise(function(resolve, reject) {
      connection.query(
        "SELECT * FROM users WHERE id = ?",
        [userID],
        (error, users, fields) => {
          if (error) {
            throw error;
          }
          if (users.length > 0) {
            resolve(users);
          } else {
            resolve(false);
          }
        }
      );
    });
  }

  uploadNewTokenToDB(newToken, userID) {
    connection.query(
      "UPDATE users SET auth_token = ? WHERE id = ?",
      [newToken, userID],
      (error, users, fields) => {
        if (error) {
          log.info(error);
        }
      }
    );
  }

  storeUserData(userID, userEmail, access_token, refresh_token) {
    this.checkDuplicate(userID).then(function(userCheck) {
      if (userCheck.length > 0) {
        connection.query(
          "UPDATE users SET ? WHERE id = ?",
          [{id: userID,email: userEmail,auth_token: access_token,refresh_token},userID],
          (error, users, fields) => {
            if (error) {
              console.error("An error in query");
              throw error;
            }
            log.info("Successful entry");
          }
        )
      } else {
        connection.query(
          "INSERT INTO users (id,email,auth_token,refresh_token) VALUES (?,?,?,?)",
          [userID, userEmail, access_token, refresh_token],
          (error, users, fields) => {
            if (error) {
              console.error("An error in query");
              throw error;
            }
            log.info("Successful entry");
          }
        );
      }
    });
  }

  checkDuplicate(userID) {
    return new Promise(function(resolve, reject) {
      connection.query(
        "SELECT * FROM users WHERE id = ?",
        [userID],
        (error, users, fields) => {
          if (error) {
            log.info(error);
          } else {
            resolve(users);
          }
        }
      );
    });
  }



  createPlaylistMeta(user) {

          return new Promise(function(resolve, reject) {

        connection.query(
          "INSERT INTO mixed_playlist_meta (name,user) VALUES (?,?)",
          ["Test", user],
          (error, playlists, fields) => {
            if (error) {
              reject(error);
            }
            resolve(playlists);
          }
        );

    });
  }

  insertMixedPlaylist(playlistID, allMusicArray) {
    allMusicArray.forEach(function(song) {
      connection.query(
        "INSERT INTO mixed_playlist (track,popularity,playlist_id) VALUES (?,?,?)",
        [song.track_id, song.popularity, playlistID],
        (error, new_playlist, fields) => {
          if (error) {
            throw error;
          }
          return JSON.stringify(new_playlist);
        }
      );
    });
  }

  selectMixedPlaylistMeta(user) {
    return new Promise(function(resolve, reject) {
      connection.query(
        "SELECT * FROM mixed_playlist_meta as _mpm INNER JOIN mixed_playlist as _mp ON _mp.playlist_id = _mpm.playlist_id WHERE user = ? AND track IS NOT NULL ",
        [user],
        (error, playlist_meta, fields) => {
          if (error) {
            reject(error);
          }
          resolve(playlist_meta);
        }
      );
    });
  }

  selectMixedPlaylistTracks(meta_id) {
    return new Promise(function(resolve, reject) {
      connection.query(
        "SELECT * FROM mixed_playlist WHERE playlist_id = ?",
        [meta_id],
        (error, playlist_tracks, fields) => {
          if (error) {
            reject(error);
          }

          resolve(playlist_tracks);
        }
      );
    });
  }

  updateMixedPlaylistURL(newPlaylistURL, userID) {
    connection.query(
      "UPDATE mixed_playlist_meta SET playlist_url = ? WHERE user = ?",
      [newPlaylistURL, userID],
      (error, users, fields) => {
        if (error) {
          console.error("An error in query");
          throw error;
        }
        log.info("Successful entry");
      }
    );
  }

  checkUserHasMusic(userID) {
    return new Promise(function(resolve, reject) {
      connection.query(
        "DELETE FROM mixed_playlist_meta WHERE user = ?",
        [userID],
        (error, music, fields) => {
          if (error) {
            log.info(error);
          } else {
            resolve(music);
          }
        }
      );
      connection.query(
        "DELETE FROM xmas_music WHERE user_id = ?",
        [userID],
        (error, music, fields) => {
          if (error) {
            log.info(error);
          } else {
            resolve(music);
          }
        }
      );
    });
  }

  insertMusicIntoXmasMusicTable(entries, callback = false) {
    if(entries.length < 1){
      log.info("Nothing to store:", entries)
      return;
    }
    console.log("Inserting")
    return new Promise(function(resolve, reject) {
      connection.query(
        "INSERT INTO ?? (user_id,track_id,popularity) VALUES ?",
        ["xmas_music", entries],
        (error, users, fields) => {
          error ? reject(error) : resolve(users)
        }
      );
    });
  }

  wipeExistingTracks(userID){
    console.log('deleting')
    return new Promise(function(resolve, reject) {
      connection.query(
        "DELETE FROM xmas_music WHERE user_id = ?",
        [userID],
        (error,users,fields) => {
          error ? reject(error) : resolve(users)
        }
      )
    });
  }
};
