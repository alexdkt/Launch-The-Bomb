var platino = require('co.lanica.platino');
var ALmixer = platino.require('co.lanica.almixer');

var music_Sound = null;
var launch_Sound = null;
var explosion_Sound = null;
var scream_Sounds = [];
var indexScreamSound = 0;


exports.loadSounds = function(){
	
	// Load all sounds in cache :
	music_Sound = ALmixer.LoadAll('sounds/music.mp3');
	launch_Sound = ALmixer.LoadAll('sounds/launchBomb.mp3');
	explosion_Sound = ALmixer.LoadAll('sounds/explosion.mp3');
	scream_Sounds[0] = ALmixer.LoadAll('sounds/scream1.mp3');
	scream_Sounds[1] = ALmixer.LoadAll('sounds/scream2.mp3');
	scream_Sounds[2] = ALmixer.LoadAll('sounds/scream3.mp3');
	scream_Sounds[3] = ALmixer.LoadAll('sounds/scream3.mp3');
	
};

exports.playMusic = function(){
	ALmixer.PlayChannel(music_Sound, -1);
};

exports.explosion = function(){
	ALmixer.PlayChannel(explosion_Sound);
};

exports.launch = function(){
	ALmixer.PlayChannel(launch_Sound);
};

exports.scream = function(){
		
	ALmixer.PlayChannel(scream_Sounds[indexScreamSound]);
	
	(indexScreamSound === (scream_Sounds.length - 1)) ? indexScreamSound = 0 : indexScreamSound ++;
	
};

/*
exports.playSound = function(sound){

	ALmixer.PlayChannel(sound);
};

exports.playMusic = function(music){
	
	ALmixer.PlayChannel(music,-1);
};

exports.stopMusic = function(sound){
	ALmixer.HaltChannel(0);
};
*/

