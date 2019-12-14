// (function(exports) {

module.exports = class Mixer {
  constructor() {
    this.xmasSongs = [];
    this.regularSongs = [];
    var self = this;
  }

  helloWorld() {
    return "Hello world!";
  }
  shuffle(array) {
    var currentIndex = array.length,
      temporaryValue,
      randomIndex;
    while (0 !== currentIndex) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
    return array;
  }

  addSong(destination, song) {
    var destinations = { xmas: this.xmasSongs, regular: this.regularSongs };

    for (var key in destinations) {
      if (destination == key) {
        destinations[key].push(song);
      }
    }
  }

  getSongs(databaseConnection, table) {
    var self = this;
    databaseConnection.query(
      "SELECT * FROM " + table,
      (error, songs, fields) => {
        if (error) {
          throw error;
        }
        songs.forEach(function(value) {
          self.addSong("xmas", JSON.stringify(value));
          console.log(self.xmasSongs);
        });
      }
    );
  }
};

//Ranomdise them:
// - Create one long list
// - Shuffle it
