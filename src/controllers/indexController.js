const request = require("request");
const mustache = require("mustache");
const fs = require("fs");
const template = fs.readFileSync(__dirname + "/../../public/template/index.html", "utf8");

let redirect = "http://localhost:4000/callback";
let view = {};


exports.getIndexFile = (req,res) => {
  console.log("LOL")
  if (!req.cookies.authenticated) {
    view.auth_url = '/spotifyAuth';
    res.send(mustache.to_html(template, view));
  } else {
    console.log("Authenticated");
    //Move this responsibiltiy to a view-adjacent js file
    //Need to send a reauthentication link if missing
    var playlistArray = [];
    //check if token needs refreshing


    // testTokenForRefresh(req.cookies.authenticated).then(function(user) {
      // console.log(user)
        //returns a user item if valid and refreshed; pass to spotify, get playlists, add to rendering template
        // view.display_on_auth = "display:none";
        view.auth_url = "#choosePlaylists";
        getPlaylistsFromURL(req.user, playlistArray, function() {
          console.log(req)
          res.send(mustache.to_html(template, view));
        });
    // }).catch(function(){
        //renders page without filtering any user details through// cookie doesn't match existing DB user
        // res.send(mustache.to_html(template, view));
    // });


  }
}

function getPlaylistsFromURL(user,playlistArray,callback = false,newURL=false) {
  console.log(2)
  var options = {
    url: "https://api.spotify.com/v1/users/" + user.id + "/playlists",
    headers: { Authorization: "Bearer " + user.auth_token },
    json: true
  };
  if(newURL){
    options.url = newURL;
  }
  request.get(options, function(error, response, body) {
    if(body.error){ console.log(body.error); return calback()}
      console.log('called')
    body.items.forEach(function(playlist) {
      playlistArray.push({
        url: `${playlist.external_urls.spotify} `,
        name: `${playlist.name} `,
        id: `${playlist.id}`
      });
    });
    view.playlistList = "";
    if (body.next) {
      getPlaylistsFromURL(user, playlistArray, callback,body.next);
    } else {
      //
      playlistArray.forEach(function(playlist) {
        view.playlistList += `<option value='${playlist.id}' >${
          playlist.name
        }</option>`;
      });
      callback();
    }
  });
}

// function testTokenForRefresh(userID) {
//
// }
