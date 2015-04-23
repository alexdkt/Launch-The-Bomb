/*
 * World.js is a helper component to make it easy to create physic worlds with Chipmunk. 
 * ver: 0.1
 * Alejandro Rayón
 * More info about Chipmunk : http://docs.platino.io/#!/guide/chipmunk2d 
 * TODO: Support for all Chipmunk features
 */

// Import Chipmunk  

require('co.lanica.chipmunk2d');
var chipmunk = co_lanica_chipmunk2d;

// simple "shortcut" to the cpVect constructor

var v = chipmunk.cpv;

// Optional walls to delimit the contours of screen for physic bodies 
 
var arrayWalls = [];

// Create Space for physics simulation :

exports.create = function(args){
	
	var space = null;
	
	var args = args || {};
	
	// Make gravity Global, it maybe be needed in other components.
	 
	Alloy.Globals.params.gravity = args.gravity;
	
	// Create space : 
	
	space = chipmunk.cpSpaceNew();
	
	// Set params of space. Check http://chipmunk-physics.net/release/ChipmunkLatest-API-Reference/ for more info. 
	
	chipmunk.cpSpaceSetGravity(space, v(0, args.gravity || -2000));
	chipmunk.cpSpaceSetSleepTimeThreshold(space, args.timeThreshold || 0.5);
	chipmunk.cpSpaceSetCollisionSlop(space, args.collisionSlop || 0.5);
	chipmunk.cpSpaceSetDamping(space,args.damping || 1);

	//Check if borderWall is true and create left, right, floor and ground walls:
	 
	if(args.borderWall){
		
		var groundWallOffset = args.groundWallOffset || 0 ;
		var floorWallOffset = args.floorWallOffset || 0 ;
		var leftWallOffset = args.leftWallOffset || 0 ;
		var rightWallOffset = args.rightWallOffset || 0 ;
		
		var borderWallWidth = args.borderWallWidth || 0;
			
	
		/*
		 * Params:cpSegmentShapeNew(cpBody,cpVect a,cpVect b,cpFloat radius)
		 * cpBody is the body to attach the segment to,
		 * a and b are the endpoints,
		 * radius is the thickness of the segment.
		 *
		 *  In Chipmunk, these are the four corners of screen.
		 * 
		 *    (0, game.screen.height)|---------floor---------|  ( game.screen.width,  game.screen.height)
		 *                           |                       |
		 *                           |                       |
		 *                           |                       |
		 *                       left wall                right wall
		 *                           |                       |		 
		 *                           |                       |
		 *                           |                       |
		 *                      (0,0)|--------ground---------|	( game.screen.width,0)
		 * 
		 * 
		 * cpX(0) =  game.screen.width;
		 * cpY(0) =  game.screen.height; 
		 */
	
		var walls = [{start:{x:leftWallOffset,y:cpY(0)},end:{x:leftWallOffset,y:0}},                   // Left wall
		             {start:{x:cpX(rightWallOffset),y:cpY(0)},end:{x:cpX(rightWallOffset),y:0}},       // Right wall
		             {start:{x:0,y:cpY(floorWallOffset)},end:{x:cpX(0),y:cpY(floorWallOffset)}},       // Floor 
		             {start:{x:0,y:groundWallOffset},end:{x:cpX(0),y:groundWallOffset}}];              // Ground
		
		
		
		for(var i=0; i< walls.length; i++){
			
			var wall = chipmunk.cpSegmentShapeNew(space.staticBody, v(walls[i].start.x, walls[i].start.y), v(walls[i].end.x, walls[i].end.y), borderWallWidth);		
			
			// Elasticity of the shape. A value of 0.0 gives no bounce, while a value of 1.0 will give a “perfect” bounce
			
			chipmunk.cpShapeSetElasticity(wall, args.borderWallElasticity || 0.5);  
			
			// Friction coefficient, a value of 0.0 is frictionless          
			
			chipmunk.cpShapeSetFriction(wall, args.borderWallFriction || 1);        
			
			// Add this shape to space     
			
			chipmunk.cpSpaceAddShape(space, wall);             
					
			arrayWalls.push(wall);
				
		};	
		
	};	
	
	return space;
	
};

// Remove walls from space if needed :

function removeBorderWallsFromSpace(space){
	
	if(arrayWalls != null){
		
		for (var i = 0; i< arrayWalls.length; i++){
			
			chipmunk.cpSpaceRemoveShape(space, arrayWalls[i]);
			chipmunk.cpShapeFree(arrayWalls[i]);
			arrayWalls[i] = null;
		
		};
	    
		arrayWalls.length = 0;
		arrayWalls = null;
	};
		
};

//exports.removeBorderWallsFromSpace = removeBorderWallsFromSpace;

//Useful function to create dynamic box body:

exports.addDynamicBoxBody = function(args){
	

	var mass = args.mass || 1;
	
	// Create cpMomentForBox (Mass of the body, width, height);
	
	var moment = chipmunk.cpMomentForBox(mass, args.sprite.width, args.sprite.height);

	// Create body:
	
    var body = chipmunk.cpBodyNew(mass, moment);
	chipmunk.cpSpaceAddBody(args.space, body);
	chipmunk.cpBodySetPos(body, v(args.sprite.center.x, cpY(args.sprite.center.y)));
	
	// Create shape:
	
	var shape = chipmunk.cpBoxShapeNew (body, args.sprite.width, args.sprite.height);
	chipmunk.cpSpaceAddShape(args.space, shape);
	chipmunk.cpShapeSetElasticity(shape, args.elasticity || 0.5);
	chipmunk.cpShapeSetFriction(shape, args.friction || 0.5);
	
	// Create object with moment, body and shape instances to export them in return;
	
	var dynamicBody = {
		moment : moment,
		body:body,
		shape:shape
	};
	
	return dynamicBody;
	
};

//Useful function to create dynamic circle body:

exports.addDynamicCircleBody = function(args){
	
	var radius = args.sprite.width * 0.5 - 1;
	var mass = args.mass || 1;
	
	// Create cpMomentForCircle (mass of the body, inner diameter, outer diameter, offset)
	
	var moment = chipmunk.cpMomentForCircle(mass, 0, radius, v(0, 0));

	// Create body:
	
    var body = chipmunk.cpBodyNew(mass, moment);
	chipmunk.cpSpaceAddBody(args.space, body);
	chipmunk.cpBodySetPos(body, v(args.sprite.center.x, cpY(args.sprite.center.y)));
	
	// Create shape:
	
	var shape = chipmunk.cpCircleShapeNew(body, radius, v(0, 0));
	chipmunk.cpSpaceAddShape(args.space, shape);
	chipmunk.cpShapeSetElasticity(shape, args.elasticity || 0.5);
	chipmunk.cpShapeSetFriction(shape, args.friction || 0.5);
	
	// Create object with moment, body and shape instances to export them in return;
	
	var dynamicBody = {
		moment : moment,
		body:body,
		shape:shape
	};
	
	return dynamicBody;
};


// Destroy the space if needed :

exports.destroyWorld = function(space){
	
	removeBorderWallsFromSpace(space);
	
	chipmunk.cpSpaceFree(space);
	space = null;
	
};

// Disable collisions of a sprite removing the body and shape from space

exports.disableBodyCollision = function(space,body,shape){
	
	chipmunk.cpSpaceRemoveShape(space, shape);
	chipmunk.cpSpaceRemoveBody(space, body);
	
};

// Enable collisions of a sprite adding the body and shape to current space

exports.enableBodyCollision = function(space,body,shape){
	
	chipmunk.cpSpaceAddShape(space, shape);
	chipmunk.cpSpaceAddBody(space, body);
	
};

// Math functions
// TODO: Make a math module with this kind of stuff :


var cpY = function(y) {
		return (Alloy.Globals.params.gameScreenHeight - y);
};

var cpX = function(x) {
		return (Alloy.Globals.params.gameScreenWidth - x);
};

var cpAngle = function(angle) {
	return -(angle) * (180/Math.PI);
};