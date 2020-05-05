const request = require("request");
const mustache = require("mustache");
const fs = require("fs");
const template = fs.readFileSync(
  __dirname + "/../../public/template/index.html",
  "utf8"
);
let view = {};

exports.getIndexFile = (req, res) => {
  if (!req.cookies.authenticated) {
    view.auth_url = "/spotifyAuth";
    res.send(mustache.to_html(template, view));
  } else {
    console.log("Authenticated");

    var playlistArray = [];

    view.auth_url = "#choosePlaylists";

    if(!req.user) return res.send(mustache.to_html(template, view));

    getPlaylistsFromURL(req.user).then(finalResult => {
      let final = finalResult.map(function(playlist) {
        return `<option value='${playlist.id}' >${playlist.name}</option>`;
      });
      view.playlistList = final.join("");
      res.send(mustache.to_html(template, view));
    });
  }
};

function getPlaylistsFromURL(user, newURL = false, playlistArray = []) {
  return new Promise(function(resolve, reject) {
    console.log("Go");

    var options = {
      url: "https://api.spotify.com/v1/users/" + user.id + "/playlists",
      headers: { Authorization: "Bearer " + user.auth_token },
      json: true
    };
    if (newURL) {
      options.url = newURL;
    }

    request.get(options, function(error, response, body) {
      if (body.error) {
        console.log(body.error);
        return "Error";
      }
      let listChunk = body.items.map(function(playlist) {
        return {
          url: `${playlist.external_urls.spotify} `,
          name: `${playlist.name} `,
          id: `${playlist.id}`
        };
      });
      playlistArray.push(listChunk);

      if (body.next) {
        resolve(getPlaylistsFromURL(user, body.next, playlistArray));
      } else {
        resolve(playlistArray.flat());
      }
    });
  });
}
