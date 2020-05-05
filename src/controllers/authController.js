const client_id = process.env.SPOTIFY_XMAS_ID; // Your client id
const client_secret = process.env.SPOTIFY_XMAS_SECRET; // Your secret
const request = require("request");
const SpotifyAPI = require("../models/spotifyAPI.js");
const spotifyAPI = new SpotifyAPI(request);
const DBModel = require("../models/DBModel.js");
const dbModel = new DBModel();
const querystring = require("querystring");
const redirectString = (req,callback) => req.protocol + "://" + req.headers.host + '/callback';

exports.spotifyUserPermissionAuthentication = (req,res) => {
  if(req.cookies.authenticated) return res.send('/#choosePlaylists');
  res.redirect(`https://accounts.spotify.com/authorize?client_id=${client_id}&response_type=code&redirect_uri=${redirectString(req,'/callback')}&scope=user-read-private%20user-read-email%20playlist-read-private%20playlist-modify-public%20playlist-read-collaborative%20playlist-modify-private%20user-library-modify%20user-library-read%20user-top-read`)
}


exports.callback = (req, res) => {
  var code = req.query.code || null;
  var state = req.query.state || null;
  var authOptions = {
    url: "https://accounts.spotify.com/api/token",
    form: {
      code: code,
      redirect_uri: redirectString(req,'/callback'),
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
       spotifyAPI.userQuery(body).then(function(returnedUserData) {
        dbModel.storeUserData(
          returnedUserData.id,
          returnedUserData.email,
          body.access_token,
          body.refresh_token
        );
        let cookie = req.cookies.authenticated;
        const oneDayFromMS = 86400000
        res.cookie('authenticated', returnedUserData.id, { expires: new Date(Date.now() + (oneDayFromMS*30)), rolling: true, saveUninitialized: true });
        res.redirect('/#choosePlaylists')
      });
    } else {
      console.log(response)
      res.redirect(
        "/#" +
          querystring.stringify({
            error: "invalid_token"
          })
      );
    }
  });
};
