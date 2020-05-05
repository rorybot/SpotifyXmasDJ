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

  const allPromises = playlistsToUse.map(playlistID =>
    spotifyAPI.grabPlaylistTracks(user, playlistID, [])
  );
  //Add to promise list: delete tracks before adding more
  const promiseResults = await Promise.all(allPromises);
  let nextPromises = dbModel.wipeExistingTracks(user.id);
  nextPromises += promiseResults.map(playlistSet =>
    dbModel
      .insertMusicIntoXmasMusicTable(playlistSet)
      .catch(err => err.forEach(el => console.log(el)))
  );
  Promise.all(nextPromises).then(x => {
    mixMusic(user.id);
    res.redirect("/mix?mixed=" + user.id);
  });
};

function mixMusic(userID) {
  mixer
    .getSongs(connection, "xmas_music", userID)
    .then(function(promiseResult) {
      let mixedArray = mixer.shuffle(promiseResult);
      dbModel.createPlaylistMeta(userID).then(function(last_entry) {
        console.log(mixedArray.length);
        var newMixedPlaylist = dbModel.insertMixedPlaylist(
          last_entry.insertId,
          mixedArray
        );
      });
    });
}
