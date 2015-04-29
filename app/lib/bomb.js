var platino = require('co.lanica.platino');
var ALmixer = platino.require('co.lanica.almixer');


module.exports = function(args){
		
	var initCenter = {x:0,y:0};                             // Save bomb initial position
	var constant = 0.005*Alloy.Globals.params.gravity;      // Constant for missile trajectory prediction 
	
	var bomb = null;                                        // Bomb sprite
	
	// Bomb childs:
	
	var spark = null;
	var timerBombBackground = null;
	var timerBombBar = null;
	var explosionBombParticle = null;
	var pointsTrajectory = [];
	
	// Bomb Timer:
	
	var timerTr = platino.createTransform({duration:2000,width:0});
	
	// Create the bomb:
	
	bomb = platino.createSpriteSheet({
		asset:Alloy.CFG.mainTexture,
		frame:0,
		anchorPoint: {
				x: 0.5,
				y: 0.5
		},
		z:2
	});
	
	bomb.selectFrame('bomb01');

	bomb.setInitPosition = function(center){
		
		bomb.center = center;
		initCenter = center;
		
	};
	
	// Create the spark:
	
	var spark = platino.createSpriteSheet({
		asset:Alloy.CFG.mainTexture,
	});
		
	spark.selectFrame('spark01');
	spark.move(bomb.width*0.5 - spark.width*0.5,-spark.height);
	
	bomb.addChildNode(spark);
	
	// Create the timers: 
	
	var timerBombBackground = platino.createSpriteSheet({
		asset:Alloy.CFG.mainTexture,
		z:0,
	
	});
	
	timerBombBackground.selectFrame('timerBomb');
	timerBombBackground.y = bomb.height*1.1;
	timerBombBackground.color(1,0,0);
	
	bomb.addChildNode(timerBombBackground);
	
	var timerBombBar = platino.createSpriteSheet({
		asset:Alloy.CFG.mainTexture,
		z:1,
	
	});
	
	timerBombBar.selectFrame('timerBomb');
	timerBombBar.y = bomb.height*1.1;
	timerBombBar.color(0.5,1,0);
	
	timerBombBar.initWidth = timerBombBar.width; // For refresh purposes
	
	
	
	bomb.addChildNode(timerBombBar);
	
	//Create the explosion :
	
	explosionBombParticle =  platino.createParticles({image:'graphics/bombExplosion.pex'});
	explosionBombParticle.move(-explosionBombParticle.width*0.5, explosionBombParticle.height*0.5);
	explosionBombParticle.stop();
	
	bomb.addChildNode(explosionBombParticle);
	
	// Create the trajectory points: 
	
	var samples = 9; //NUMBER OF POINTS
			
	for (var i = 0; i < samples; i++) {
	
		var point = platino.createSpriteSheet({asset:Alloy.CFG.mainTexture,z:1,followParentColor:false,followParentAlpha:false});
		
		point.selectFrame('point');
					
		point.center = {x:bomb.width*0.5,y:bomb.height*0.5};
				
		bomb.addChildNode(point);
		
		pointsTrajectory.push(point);	 
	
	};
	   
	// FADE OUT OF LAST POINTS
	   
	pointsTrajectory[8].alpha=0.6;
	pointsTrajectory[7].alpha=0.7;
	pointsTrajectory[6].alpha=0.8;
	pointsTrajectory[5].alpha=0.9;
	
	
	/*
	 * BOMB METHODS:
	 */
	
	bomb.startAnimation = function(){
		
		bomb.animate(bomb.frame,4,40,-1);
		spark.animate(spark.frame,4,40,-1);
		
	};
	
	// Refresh bomb :
	
	bomb.resetInitialState = function(center){
		
		bomb.angle=0;
		bomb.center = initCenter || center;
		timerBombBar.width = timerBombBar.initWidth;
		bomb.show();
		
		// Example use of underscore:
		
		_.each(pointsTrajectory, function(point) {
			point.show();
		});	
		
		
	};
	
	// Bomb countdown :
	
	bomb.checkTimer = function(){
		
		if(timerBombBar.width<1){
			
			return true;
			
		};
	};
	
	// Bomb launch:
	
	bomb.startTimer = function(){
		
		timerBombBar.transform(timerTr); 
	};
	
	// Bomb explosion :
	
	bomb.explode = function(){
		
		explosionBombParticle.restart();
		bomb.hide();
		
	};

	// Draw missile trajectory:
	
	bomb.moveTrajectory = function(touch){
		
		
		for (var i = 1; i <  pointsTrajectory.length; i++) {
		
			pointsTrajectory[i].center = {x:pointsTrajectory[0].center.x + touch.x*i,y:pointsTrajectory[0].center.y + touch.y*i - constant * i * i};
			
		};
		
	};
	
	// Reset missile trajectory:
	
	bomb.resetShot = function(){
	
		var i = pointsTrajectory.length;
		
		while(i--){
			pointsTrajectory[i].center = {x:bomb.width*0.5,y:bomb.height*0.5};
			pointsTrajectory[i].hide();
		};
	
		
	};

	
	return bomb;
	
};

