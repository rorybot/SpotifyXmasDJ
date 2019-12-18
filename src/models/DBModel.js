const mysql = require("mysql");
const options = {
  user: "root",
  password: "",
  database: "spotify_xmas_dj"
};
const connection = mysql.createConnection(options);

module.exports = class DBModel {
  constructor() {}

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
};
