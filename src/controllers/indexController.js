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


function testTokenForRefresh(userID) {
  return new Promise(function(resolve, reject) {
    // console.log(Object.getOwnPropertyNames(DBModel.prototype))
    dbModel.userQuery(userID).then(function(usersDBObject) {
      if (!usersDBObject) {
        reject(false);
      }
      accessToken = usersDBObject[0].auth_token;
      userID = usersDBObject[0].id;
      uniqueID = usersDBObject[0].unique_id;
      refreshToken = usersDBObject[0].refresh_token;

      spotifyAPI.testTokenValidity(accessToken).then(function(valid) {
        if (valid) {
          console.log("VALID!" + accessToken)
          resolve({ id: userID, auth_token: accessToken, unique_id: uniqueID });
        } else {
          getNewAuthToken(userID, refreshToken).then(function() {
            resolve({
              id: userID,
              auth_token: getNewAuthToken(),
              unique_id: uniqueID
            });
          });
        }
      });
    });
  });
}
