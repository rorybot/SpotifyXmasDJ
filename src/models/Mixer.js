// (function(exports) {

module.exports = class Mixer {
  constructor() {
    this.xmasSongs = [];
    this.regularSongs = [];
    var self = this;
    // console.log('new')
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
    // console.log( this.xmasSongs)
    // console.log(array)
    // console.log(array)
    return array;
  }

  addSong(destination, song) {
    var destinations = { 'xmas': this.xmasSongs, 'regular': this.regularSongs };

    for (var key in destinations) {
      if (destination == key) {
        destinations[key].push(song);
      }
    }
  }

  getSongs(databaseConnection, table, callback = false) {
    var self = this;
          return new Promise(function(resolve, reject) {
    databaseConnection.query(
      "SELECT * FROM " + table,
      (error, songs, fields) => {
        if(error) {
          reject(error)
          throw error;
        }
        var i=0;

        songs.forEach(function(value) {
          i++;
          if(table == 'xmas_music'){
            self.addSong("xmas", value);
            if(i == songs.length){
              // console.log(self.xmasSongs.length)
              return resolve(self.xmasSongs)
              // return resolve(self)
            }
          } else if (table == 'regular_music'){
            // console.log(self.regularSongs.length)
            self.addSong("regular", value);
            if(i == songs.length){
              // console.log(self.regularSongs.length)
              return resolve(self.regularSongs)
              // return resolve(self)
            }
          }
        })



      }



    );
        });
  }

};

//Ranomdise them:
// - Create one long list
// - Shuffle it
