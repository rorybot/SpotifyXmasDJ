(function(exports) {
  function Mixer() {
    this.xmasSongs = [];
    this.regularSongs = [];
  }

  Mixer.prototype.shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
    while (0 !== currentIndex) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
    return array;
  }

  Mixer.prototype.addSong(destination, song){
    destinations = {"xmas": this.xmasSongs, "regular":this.regularSongs};

    for each (var key in destinations){
      if(destination == key){
        destinations[key].push(song)
      }
    }
  }

  exports.Mixer = Mixer;
})(this);


//Have list of xmas songs
//Have list of non xmas songs
//Ranomdise them:
// - Create one long list
// - Shuffle it
