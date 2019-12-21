module.exports = class SpotifyAPI {
  constructor(requestModule) {
    this.request = requestModule;
    //run token refresh check on creation, and then set as this.accessToken
    //instead of calling playlist all the time, just set the last stored one to session
    // only store the one found when first visiting index, and only perform a new lookup if...when?
  }

  userQuery(body){
    var self = this;
    return new Promise(function(resolve, reject) {
      var access_token = body.access_token;
      var refresh_token = body.refresh_token;
      var options = {
        url: "https://api.spotify.com/v1/me",
        headers: { Authorization: "Bearer " + access_token },
        json: true
      };
      self.request.get(options, function(error, response, body) {
       resolve(body);
      });
    });
  }

  uploadTracks(tracks,playlistID){
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
          // console.log(response);
          if (error) {
            reject(error);
          }
          if(body.error){
            console.log(body.error);
            console.log(playlistID)
          }
          resolve(response);
        });
    });
  }

  grabPlaylistTracksFromSpotify(user,playlistID,entries,callback = false) {
    var self = this;
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
        // console.log(entries)
        callback()
      }

    });
  }

  refreshAccessToken(refreshToken,clientID,clientSecret){
    var self = this;
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
    var self = this;
    return new Promise(function(resolve, reject) {
      var options = {
        url: "https://api.spotify.com/v1/searchq=test&type=album",
        headers: { Authorization: "Bearer " + accessToken },
        json: true
      };
      self.request.get(options, function(error, response, body) {
        if (body.error && body.error.status == 401) {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }

  createPlaylist(accessToken){
    var self = this;
    return new Promise(function(resolve, reject) {
      var authOptions = {
        url: "https://api.spotify.com/v1/users/" + userID + "/playlists",
        headers: { Authorization: "Bearer " + accessToken },
        json: { name: playlistName }
      };
      self.request.post(authOptions, function(error, response, body) {
        if(error){
          reject(error);
        } else {
          resolve(body);
          console.log(body)
        }
      })
    });
  }

};
