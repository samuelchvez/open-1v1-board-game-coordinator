var GLOBAL_IDS = [];

function randInt(minVal, maxVal) {
  return parseInt(Math.floor(minVal + Math.random()*(maxVal - minVal)));
}

function getID() {
  var newID;

  do{ newID = randInt(0, Number.MAX_SAFE_INTEGER); }
  while(newID in GLOBAL_IDS);

  return newID;
}

module.exports = {
  randInt: randInt,
  getID: getID
};