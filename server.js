const express = require('express');
const server = express();
const port = process.env.PORT || 4000;
var _ = require('lodash');


server.get("/json", (req, res) => {
   res.json({ message: "Hello world" });
});

// server.get("/", (req, res) => {
//    res.sendFile(__dirname + '/client/public/index.html');
// });


//
// server.get('/spotify_auth', (req, res) => res.send({ username: process.env.XMAS_SPOTIFY_ID }));

server.get('/express_backend', (req, res) => {
  res.send({ express: 'YOUR EXPRESS BACKEND IS CONNECTED TO REACT!!' });
});


server.listen(port, () => {
    var naughty_or_nice = ['Naughty','Nice'];
    console.log(`Ho ho ho! Father Christmas has you on his list of ${_.sample(naughty_or_nice)} Kids, for using ${port}`);
});
