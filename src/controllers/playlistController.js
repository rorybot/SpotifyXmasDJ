const request = require("request");
const SpotifyAPI = require("../models/spotifyAPI.js");
const spotifyAPI = new SpotifyAPI(request);
const DBModel = require("../models/DBModel.js");
const dbModel = new DBModel();
const Mixer = require("../models/Mixer.js");
const mixer = new Mixer();

exports.createPlaylist = async (req, res) => {
  console.log(1);
  const user = req.user;
  console.log(user);
  let playlistsToUse = req.body.playlistsToUse;
  if (typeof playlistsToUse === "string") {
    playlistsToUse = [playlistsToUse];
  }
  let playlistNo = 0;
  let entries = [];

  const allPromises = playlistsToUse.map(playlistID =>
    spotifyAPI.grabPlaylistTracks(user, playlistID, entries)
  );
  await Promise.all(allPromises)
    .then(playlistTracksMetaArray => {
      playlistTracksMetaArray.forEach(playlistSet => {
        dbModel.insertMusicIntoXmasMusicTable(playlistSet, () => {
          mixMusic(user.id);
        });
      });
  });
            res.redirect("/mix?mixed=" + user.id);

};



function mixMusic(userID) {
  var promises = [
    mixer.getSongs(connection, "xmas_music")
    // mixer.getSongs(connection, "regular_music")
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
