const mysql = require("mysql");
const options = {
  user: "root",
  password: "",
  database: "spotify_xmas_dj"
};
const connection = mysql.createConnection(options);

module.exports = class DBInsertion {
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
    console.log(allMusicArray);
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
};
