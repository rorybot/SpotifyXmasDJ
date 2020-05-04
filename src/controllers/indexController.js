const mustache = require("mustache");
const fs = require("fs");
var template = fs.readFileSync(__dirname + "/../../public/template/index.html", "utf8");
const client_id = process.env.SPOTIFY_XMAS_ID; // Your client id
var redirect = "https://5890b41e.ngrok.io/callback";
var view = {
  auth_url:
    "https://accounts.spotify.com/authorize?client_id=" +
    client_id +
    "&response_type=code&redirect_uri=" +
    redirect +
    "&scope=user-read-private%20user-read-email%20playlist-read-private%20playlist-modify-public%20playlist-read-collaborative%20playlist-modify-private%20user-library-modify%20user-library-read%20user-top-read"
};


exports.getIndexFile = (req,res) => {
  console.log("LOL")
  if (!req.cookies.authenticated) {
    res.send(mustache.to_html(template, view));
  } else {
    console.log("Authenticated");
    //Move this responsibiltiy to a view-adjacent js file
    //Need to send a reauthentication link if missing
    var playlistArray = [];
    //check if token needs refreshing
    testTokenForRefresh(req.cookies.authenticated).then(function(user) {
      // console.log(user)
        //returns a user item if valid and refreshed; pass to spotify, get playlists, add to rendering template
        // view.display_on_auth = "display:none";
        view.auth_url = "#choosePlaylists";
        getPlaylistsFromURL(user, playlistArray, function() {
          res.send(mustache.to_html(template, view));
        });
    }).catch(function(){
        //renders page without filtering any user details through// cookie doesn't match existing DB user
        res.send(mustache.to_html(template, view));
    });
  }
}
