const mysql = require("mysql");
const options = {
  user: "root",
  password: "",
  database: "spotify_xmas_dj"
};
const connection = mysql.createConnection(options);

module.exports = class DBModel {
  constructor() {}

  userQuery(userID = false){
    return new Promise(function(resolve, reject) {
      connection.query(
        "SELECT * FROM users WHERE id = ?",
        [userID],
        (error, users, fields) => {
          if (error) {
            throw error;
          }
          if(users.length > 0){
            resolve(users);
          } else {
            resolve(false);
          }
        }
      );
    });
  }

  uploadNewTokenToDB(newToken,userID){
    connection.query(
      "UPDATE users SET auth_token = ? WHERE id = ?",
      [newToken, userID],
      (error, users, fields) => {
        if (error) {
          console.log(error);
        }
      }
    );
  }

  storeUserData(userID, userEmail){
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

  selectMixedPlaylistMeta(user){
    return new Promise(function(resolve, reject) {
      connection.query(
        "SELECT * FROM mixed_playlist_meta WHERE user = ?",
        [user],
        (error, playlist_meta, fields) => {
          if (error) {
            reject(error);
          }

          resolve((playlist_meta));
        }
      );
    })
  }

  selectMixedPlaylistTracks(meta_id){
    return new Promise(function(resolve, reject) {
      connection.query(
        "SELECT * FROM mixed_playlist WHERE playlist_id = ?",
        [meta_id],
        (error, playlist_tracks, fields) => {
          if (error) {
            reject(error);
          }

          resolve((playlist_tracks));
        }
      );
    });
  }

  updateMixedPlaylistURL(newPlaylistURL, userID){
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
  }
  insertMusicIntoXmasMusicTable(entries,callback=false){
    connection.query(
      "INSERT INTO ?? (user_id,track_id,popularity) VALUES ?",
      ["xmas_music", entries],
      (error, users, fields) => {
        if (error) {
          console.error("An error in query");
          throw error;
        }
        console.log("Successful entry");
        callback()
      }
    );
  }
};
