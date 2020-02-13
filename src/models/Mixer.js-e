// (function(exports) {

module.exports = class Mixer {
  constructor() {
    this.xmasSongs = [];
    this.regularSongs = [];
    var self = this;
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

  getSongs(databaseConnection, table, user_id, callback = false) {
    var self = this;

    return new Promise(function(resolve, reject) {
      databaseConnection.query(
        "SELECT * FROM " + table + " WHERE user_id = ?",
        [user_id],
        (error, songs, fields) => {
          if (error) {

            reject(error);
            throw error;
          }

          var i = 0;
          if(songs.length == 0){
             resolve(self.regularSongs);
          };
          songs.forEach(function(value) {
            i++;
              self.addSong("xmas", value);
              if (i == songs.length) {
                 resolve(self.xmasSongs);
              }
          });
        }
      );
    });
  }
};
