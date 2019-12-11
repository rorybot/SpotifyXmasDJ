const express = require('express');
const server = express();
const port = process.env.PORT || 4000;
var _ = require('lodash');
var client_id =  process.env.SPOTIFY_XMAS_ID; // Your client id
var client_secret = process.env.SPOTIFY_XMAS_SECRET; // Your secret
var stateKey = 'spotify_auth_state';
var mustache = require('mustache');

server.get('/spotify_backend', (req, res) => {
  res.send({
    client_id: client_id,
    client_secret: client_secret
  });
});

server.get("/", (req, res) => {
   res.sendFile(__dirname + '/public/index.html');
});

var view = {
  title: "Joe",
  calc: function () {
    return 2 + 4;
  }
};

var output = mustache.render("{{title}} spends {{calc}}", view);
var template = "{{title}} spends {{calc}}";



server.get("/mustache", (req, res) => {
      res.send(mustache.to_html(template, view));
});


server.listen(port, () => {
    var naughty_or_nice = ['Naughty','Nice'];
    console.log(`Ho ho ho! Father Christmas has you on his list of ${_.sample(naughty_or_nice)} Kids, for using ${port}`);
});
