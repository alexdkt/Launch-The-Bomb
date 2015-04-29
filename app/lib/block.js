var platino = require('co.lanica.platino');
var ALmixer = platino.require('co.lanica.almixer');


module.exports = function(args){

	var initPosition = {x:0,y:0};
	var block = null;					// Block sprite
	
	// Block childs :
	
	var eye = null;
	var pupil = null;
	var mouth = null;
	var explosionBlockParticle = null;
	
	// Flags: 
	
	var marginEye = 0;                  // Movement margin of pupil. Is calculated later. 
	var bombHasExploded = false;        // Flag to stop moving eyes and scaling mouths. 
	
	// Create the block:
	
	block = platino.createSpriteSheet({
		asset:Alloy.CFG.mainTexture,
		frame:0,
		anchorPoint: {
				x: 0.5,
				y: 0.5
		},
		z:1
	});
	
	block.selectFrame('block01');
	
	// Eye:
	
	eye = platino.createSpriteSheet({
		asset:Alloy.CFG.mainTexture
	});
	
	eye.selectFrame('eye'); 
	
	eye.center = {x:block.width*0.5, y:block.height*0.5 - eye.height*0.5};
	
	block.addChildNode(eye);
	
	// Mouth :
	
	mouth = platino.createSpriteSheet({
		asset:Alloy.CFG.mainTexture
	});
	
	mouth.selectFrame('mouth01'); 

	mouth.center = {x:block.width*0.5, y:block.height*0.5 + mouth.height};
	
	mouth.scaleFromCenter( 0.3, 0.3, mouth.width*0.5,  mouth.height*0.5 );

	block.addChildNode(mouth);
	
	// Pupil :
	
	pupil = platino.createSpriteSheet({
		asset:Alloy.CFG.mainTexture,
		followParentAlpha : false
	});
	
	pupil.selectFrame('pupil'); 
	
	pupil.center = {x:eye.width*0.5, y:eye.height*0.5};
	
	eye.addChildNode(pupil);
	
	// Just an approximation of pupil movement margin : 
	
	marginEye = (eye.width/Alloy.Globals.params.gameScreenWidth)*0.7;
	
	// Block explosion :
	
	explosionBlockParticle =  platino.createParticles({image:'graphics/blockExplosion.pex'});
	explosionBlockParticle.move(-explosionBlockParticle.width*0.5, explosionBlockParticle.height*0.5);
	explosionBlockParticle.stop();
	
	block.addChildNode(explosionBlockParticle);
	
	/*
	 * BLOCK METHODS:
	 */
	
	block.setInitPosition = function(pos){
		
		initPosition = {x:pos.x,y:pos.y};
		block.move(pos.x,pos.y);
		
	};
	
	// Reset to initial state :
	
	block.resetInitialState = function(pos){
	
		block.angle=0;
		block.move(initPosition.x || pos.x,initPosition.y || pos.y);
		block.selectFrame('block01');
		bombHasExploded = false;
		
		pupil.center = {x:eye.width*0.5, y:eye.height*0.5};
		
		pupil.show();
		
		eye.selectFrame('eye');
		mouth.selectFrame('mouth01'); 
		
		mouth.scaleFromCenter(0.3,0.3, mouth.width*0.5,  mouth.height*0.5 );
		
		
	};
	
	// The block is broken :
	
	block.setStateBroken = function(){
		
		bombHasExploded = true;
		explosionBlockParticle.restart();
		block.selectFrame('block02');
		mouth.scale(1);
		mouth.selectFrame('mouth02'); 
		eye.selectFrame('eyeDied');
		pupil.hide();
		
	};
	
	// The block is outside shock wave range :
	
	block.setStateHappy = function(){
		
		bombHasExploded = true;
		eye.selectFrame('eyeHappy');
		mouth.scale(1);
		mouth.selectFrame('mouth03');
		pupil.hide();
		
	};
	
	
	
	block.changeFaceExpression = function(e){

		// PosPupilX & posPupilY: Calculate relative position of center of pupil, so its child of eye and block. 
		
		var posPupilX = block.x + eye.center.x;
		var posPupilY = block.y + eye.center.y;
		
		// directionX/Y = Center position of pupil + (diff between bomb and pupil)* margin of pupil movement
		
		var directionX = eye.width*0.5 + (e.x - posPupilX)*marginEye;
		var directionY = eye.height*0.5 + (e.y - posPupilY)*marginEye;
		
		pupil.center = {x:directionX,y:directionY};
		
		// The following only works if the bomb is ready :
		
		if(bombHasExploded){return;};
		
		var distX = e.x - posPupilX;
		var distY = e.y - posPupilY;
	
		var distance = (Math.sqrt((distX*distX) + (distY*distY))); 
		
		var scaleMouth = (1/(distance))*150;

		mouth.scale(scaleMouth);
		
		
	};
	
	
	return block;
	
};

