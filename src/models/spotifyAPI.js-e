module.exports = class SpotifyAPI {
  constructor(requestModule) {
    this.request = requestModule;
    var self = this;
    //run token refresh check on creation, and then set as this.accessToken
    //instead of calling playlist all the time, just set the last stored one to session
    // only store the one found when first visiting index, and only perform a new lookup if...when?
  }

  uploadTracks(tracks){
    var self = this;
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
        self.uploadChunkToSpotify(uploadBuffer,playlistID,accessToken).then(function(response) {
          // res.send(uploadBuffer);
          uploadBuffer = [];
        });
      } else {
      }
      trackNo++;
      loopNo++;
    });
  }

  uploadChunkToSpotify(chunk, playlistID, access_token) {
    var self = this;
    return new Promise(function(resolve, reject) {
        var authOptions = {
          url: "https://api.spotify.com/v1/playlists/" + playlistID + "/tracks",
          headers: { Authorization: "Bearer " + access_token },
          json: {
            uris: chunk
          }
        };
        self.request.post(authOptions, function(error, response, body) {
          console.log(response);
          if (error) {
            console.log(error);
            reject(error);
          }
          resolve(response);
        });
    });
  }

  grabPlaylistTracksFromSpotify(user,playlistID,entries,callback = false) {
    access_token = user.auth_token;
    // console.log('auth is:' + auth_token);
    var options = {
      url: "https://api.spotify.com/v1/playlists/" + playlistID + "/tracks",
      headers: { Authorization: "Bearer " + access_token },
      json: true
    };
    self.request.get(options, function(error, response, body) {
      // console.log(response);
      console.log(body.items.length)
      for (var i = 0; i < body.items.length; i++) {
        var entry = [user.id];
        entry.push(body.items[i].track.id);
        entry.push(body.items[i].track.popularity);
        entries.push(entry);
      }

      if(response){
        console.log(entries)
        callback()
      }

    });
  }

  refreshAccessToken(refreshToken,clientID,clientSecret){
    return new Promise(function(resolve, reject) {
      self.request.post(
        {
          url: "https://accounts.spotify.com/api/token",
          headers: {
            Authorization:
              "Basic " +
              new Buffer(clientID + ":" + clientSecret).toString(
                "base64"
              )
          },
          form: {
            grant_type: "refresh_token",
            refresh_token: refreshToken
          },
          json: true
        },
        function(error, response, body) {
          if (!error && response.statusCode === 200) {
            console.log(body.access_token);
            var new_access_token = body.access_token;
            resolve(new_access_token);
          } else {
            reject(error);
          }
        }
      )
    });
  }

  testTokenValidity(accessToken){
    return new Promise(function(resolve, reject) {
      var options = {
        url: "https://api.spotify.com/v1/searchq=test&type=album",
        headers: { Authorization: "Bearer " + accessToken },
        json: true
      };
      request.get(options, function(error, response, body) {
        if (body.error && body.error.message == "The access token expired") {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }

  createPlaylist(accessToken){
    new Promise(function(resolve, reject) {
      var authOptions = {
        url: "https://api.spotify.com/v1/users/" + userID + "/playlists",
        headers: { Authorization: "Bearer " + accessToken },
        json: { name: playlistName }
      };
      request.post(authOptions, function(error, response, body) {
        if(error){
          reject(error);
        } else {
          resolve(body);
        }
      })
    });
  }

};
