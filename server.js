const express = require('express');
const server = express();
var _ = require('lodash');


server.get("/json", (req, res) => {
   res.json({ message: "Hello world" });
});

server.get("/", (req, res) => {
   res.sendFile(__dirname + '/index.html');
});

server.get("/app", (req, res) => {
   res.sendFile(__dirname + '/app/app.js');
});


const port = 4000;

server.listen(port, () => {

    var naughty_or_nice = ['Naughty','Nice'];
    console.log(`Ho ho ho! Father Christmas has you on his list of ${_.sample(naughty_or_nice)} Kids, for using ${port}`);
});
