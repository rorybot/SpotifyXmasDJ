const dotenv = require('dotenv');
const result = dotenv.config({ path: __dirname + '/secrets.env' });
const express = require("express");
const router = express.Router();
const server = express();
const routes = require(__dirname + '/routes');
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const port = process.env.PORT || 4000;
const _ = require("lodash");

server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: true }));

server.use(cookieParser());

server.use('/', routes);
server.use(express.static("public/template"));

server.listen(port, () => {
  var naughty_or_nice = ["Naughty", "Nice"];
  console.log(
    `Ho ho ho! Father Christmas has you on his list of ${_.sample(
      naughty_or_nice
    )} Kids, for using ${port}`
  );
});
