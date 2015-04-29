/*
* MainScene. Launch the Bomb!
* Alejandro Rayón. 2015
* www.arei.es
* arayon@arei.es
*/

// Import required modules as statics variables (Outside MainScene function)
// Platino and Almixer modules should already be cached by Titanium (in index.js)
// so this may not cause load them again, just bring them into scope.
// TODO: Check this in terms of performance.

var platino = require('co.lanica.platino');

require('co.lanica.chipmunk2d');
var chipmunk = co_lanica_chipmunk2d;
var v = chipmunk.cpv;

// MainScene constructor :

function MainScene(window, game) {

	/*
	* VAR DEFINITIONS, DECLARATIONS AND ASSIGNMENTS :
	*/

	// Declare the scene:

	var self = platino.createScene();
	self.addEventListener('activated', onSceneActivated);

	// Scene background color to white :

	self.color(1, 1, 1);

	// Vars related to physics :

	var World = require('world');
	var TICKS_PER_SECOND = game.fps * 3;
	var space = null;
	var _accumulator = 0.0;
	var gravity = -2000;
	var constantGravity = 0.005 * gravity;
	// Constant for missile trajectory prediction (created in lib/bomb.js)

	// Vars related to sprites and physics, if applicable :

	var bomb_Sprite = null;
	// Sprite of bomb
	var bomb_Moment = null;
	// Moment attached to bomb sprite
	var bomb_Body = null;
	// Body attached to bomb sprite
	var bomb_Shape = null;
	// Shape attached to bomb sprite

	var blocks_Sprite = [];
	// Array that will contains the block sprites
	var blocks_Moment = [];
	// Array that will contains the moments attached to block sprites
	var blocks_Shape = [];
	// Array that will contains the shapes attached to block sprites
	var blocks_Body = [];
	// Array that will contains the bodies attached to block sprites

	var shadow = null;
	// Bomb shadow
	var background = null;
	// Background

	/*
	 * FLAGS
	 */

	var GROUND_LEVEL = 150;
	// Floor height (Used in space, shadow and blocks creation)
	var bombLaunched = false;
	// Detects if bomb was launched. Changes to true on TouchEnd and activate the enterframe
	var bombTouched = false;
	// Detects if bomb was touched. If false, touchMove will not register the movement.
	var bombExploded = false;
	// Detects if bomb has exploded

	/*
	 * SOUNDS
	 */

	var Sound = require('sound');

	/*
	 * OTHER
	 */

	var cpY = game.cpY;

	var cpX = game.cpX;

	var cpAngle = game.cpAngle;

	/*
	 * SCENE LISTENERS
	 */

	function onSceneActivated(e) {

		// When scene is activated, starts the creation of all objects

		Ti.API.info("Launch the Bomb! Main scene is activated");

		createWorld();
		createBackground();
		createBomb();
		createBlocks();

		Sound.loadSounds();

		game.addEventListener('touchstart', onTouchStartBomb);
		game.addEventListener('touchmove', onTouchMoveBomb);
		game.addEventListener('touchend', onTouchEndBomb);

		game.startCurrentScene();

		Sound.playMusic();
	};

	// createWorld()  > Create a new 'space' instance for physics support. Check lib/world.js for more info :

	function createWorld() {

		space = World.create({
			gravity : gravity,
			borderWall : true, // Border wall is used for fast testing purposes, creating four physic walls on screen borders.
			borderWallWidth : 1, // Width of border wall (Useful if slow devices don't detect collisions correctly)
			//leftOffset : ,					// Offset for left borderWall
			//rightOffset : ,					// Offset for right borderWall
			//floorOffset : ,					// Offset for floor borderWall
			groundWallOffset : GROUND_LEVEL,	// Offset for ground borderWall,
			//borderWallElasticity:0,			// Border wall elasticity
			//borderWallFriction:1,				// Border wall friction
			//SleepTimeThreshold:0.5,			// Elapsed time before a group of idle bodies is put to sleep (defaults to infinity which disables sleeping).
			//CollisionSlop: 0.5,				// Amount of encouraged penetration between colliding shapes.
			//damping: 1,						// Global viscous damping value to use for all rigid bodies in this space (default value is 1.0 which disables damping).
		});

	};

	// createBackground()  > Create background sprite :

	function createBackground() {

		// Use of game.screen.width and game.screen.height to fill the screen.
		// gamen.screen.width is the same than cpX(0) & game.screen.height is the same than cpY(0)

		background = platino.createSprite({
			image : 'graphics/background.png',
			width : cpX(0),
			height : cpY(0),
			z : 0
		});
		self.add(background);

	};

	// createBomb()  > Load 'lib/bomb.js' constructor to create a new bomb

	function createBomb() {

		var Bomb = require('bomb');

		bomb_Sprite = new Bomb();

		// Set initial position and save this coordinates in bomb.js for later refresh

		bomb_Sprite.setInitPosition({
			x : 300,
			y : cpY(400)
		});

		// Create a dynamic body with box shape.  Check world.js for more info.

		var dynamicBody = World.addDynamicCircleBody({
			space : space,
			sprite : bomb_Sprite,
			mass : 1,
			elasticity : 0,
			friction : 1
		});

		// dynamicBody returns an object with the shape, body and moment.
		// TODO: Check if is better sync sprites with bodies iterating directly this object instead using bomb_Moment, bomb_Body and bomb_Shape :

		bomb_Moment = dynamicBody.moment;
		bomb_Body = dynamicBody.body;
		bomb_Shape = dynamicBody.shape;

		// Add the bomb to scene and animate:

		self.add(bomb_Sprite);
		bomb_Sprite.startAnimation();

		// Create the shadow:

		shadow = platino.createSpriteSheet({
			asset : Alloy.CFG.mainTexture,
			frame : 4,
			z : 1
		});
		shadow.selectFrame('shadowBomb');

		shadow.move(bomb_Sprite.x, cpY(GROUND_LEVEL));
		self.add(shadow);

	};

	// createBlocks()  > Load 'lib/bomb.js' constructor to create a new block

	function createBlocks() {

		var Block = require('block');

		var numberOfBlocks = 6;

		for (var i = 0; i < numberOfBlocks; i++) {

			var blockSprite = new Block();

			// EASY WAY FOR STACKING BOXES, FOR MORE COMPLEX SITUATIONS O DIFFERENT SCREENS,
			// IS RECOMMENDED TO READ A JSON GENERATED WITH ANY TILE MAP GENERATOR.

			var initialPosition = {};

			if (i < 3) {

				initialPosition.x = game.screen.width - 300 - blockSprite.width * i;
				initialPosition.y = cpY(GROUND_LEVEL + blockSprite.height);

			} else if (i < 5) {

				initialPosition.x = game.screen.width - 300 - blockSprite.width * 0.5 - blockSprite.width * (i - 3);
				initialPosition.y = cpY(GROUND_LEVEL + blockSprite.height * 2);

			} else if (i === 5) {

				initialPosition.x = game.screen.width - 300 - blockSprite.width;
				initialPosition.y = cpY(GROUND_LEVEL + blockSprite.height * 3);

			}
			;

			// Set initial position and save this coordinates in block.js for later refresh

			blockSprite.setInitPosition(initialPosition);

			// Mass of the block:

			var mass = 0.5;

			// dynamicBody returns an object with the shape, body and moment.
			// TODO: Check if is better sync sprites with bodies iterating directly this object instead using new arrays :

			var dynamicBody = World.addDynamicBoxBody({
				space : space,
				sprite : blockSprite,
				mass : mass,
				elasticity : 0.5,
				friction : 1
			});

			// Add the block to scene:

			self.add(blockSprite);

			// Save sprites, moments, shapes and bodies for future synchronisation

			blocks_Sprite.push(blockSprite);
			blocks_Body.push(dynamicBody.body);
			blocks_Moment.push(dynamicBody.moment);
			blocks_Shape.push(dynamicBody.shape);

		};

	};

	// gameLoop(e) > All your game actions under a common timer (FPS).

	function gameLoop(e) {

		// bomb_Sprite synchronizes with bomb_Body :

		bomb_Sprite.center = {
			x : chipmunk.cpBodyGetPos(bomb_Body).x,
			y : cpY(chipmunk.cpBodyGetPos(bomb_Body).y)
		};

		// Move the shadow

		shadow.x = bomb_Sprite.x;
		shadow.scale(bomb_Sprite.y / shadow.y);

		// blocks_Sprite synchronizes with blocks_Body :
		// TODO: Check this using _underscore

		var i = blocks_Sprite.length;

		// Check http://docs.platino.io/#!/guide/chipmunk2d for more info:

		while (i--) {

			if (!chipmunk.cpBodyIsSleeping(blocks_Body[i])) {

				blocks_Sprite[i].center = {
					x : chipmunk.cpBodyGetPos(blocks_Body[i]).x,
					y : cpY(chipmunk.cpBodyGetPos(blocks_Body[i]).y)
				};
				blocks_Sprite[i].angle = cpAngle(chipmunk.cpBodyGetAngle(blocks_Body[i]));

			};

			blocks_Sprite[i].changeFaceExpression(bomb_Sprite.center);
		};

		// bomb countdown, when zero is reached, bomb explodes!

		//A) THE BOMB IS READY > (bombExploded === false)

		if (!bombExploded) {

			//B) THE BOMB EXPLODES > bomb_Sprite.checkTimer() returns true > Check lib/bomb.js

			if (bomb_Sprite.checkTimer()) {

				bombExploded = true;
				explode();

			};

			// C) THE BOMB HAS ALREADY EXPLODED > (bombExploded === true)

		} else {

			// After the explosion, we need to know when the blocks have stopped to reset the screen:

			var everythingStopped = true;

			var i = blocks_Sprite.length;

			while (i--) {

				var velocity = Math.floor(chipmunk.cpBodyGetVel(blocks_Body[i]).y);
				//Y VELOCITY OF THE BODY
				var velAbs = Math.abs(velocity);
				//ABSOLUTE VALUE OF THE BODY

				if (velAbs > 1) {
					everythingStopped = false;
					break;
				};

			};

			if (everythingStopped) {// ONLY IF ALL BLOCKS ARE STOPPED, WE RESET THE SCREEN

				resetScreen();
			};

		};

		//The following code corresponds to stepPhysics(e.delta). Check http://docs.platino.io/#!/guide/chipmunk2d for more info :

		var fixed_dt = 1.0 / TICKS_PER_SECOND;
		_accumulator += e.delta * 0.001;

		while (_accumulator > fixed_dt) {
			chipmunk.cpSpaceStep(space, fixed_dt);
			_accumulator -= fixed_dt;
		};

	};

	// explode() > Logic of explosion shock wave:

	function explode() {

		//TODO: REVIEW EXPLOSION SHOCK WAVE

		bomb_Sprite.explode();

		// Remove body and shape of the bomb avoiding collisions while the bomb is hidden :

		World.disableBodyCollision(space, bomb_Body, bomb_Shape);

		shadow.hide();

		var i = blocks_Sprite.length;

		// TODO: Review the following. Something is wrong:
		// TODO: Check doing this with _underscore

		while (i--) {

			// Calculate distance between bomb and blocks

			var distX = bomb_Sprite.center.x - blocks_Sprite[i].center.x;
			var distY = bomb_Sprite.center.y - blocks_Sprite[i].center.y;

			var distance = (Math.sqrt((distX * distX) + (distY * distY)));

			// Shock wave only affects if block is within a radius of four times the size of the bomb.

			if (distance < (bomb_Sprite.width * 4)) {

				// The direction and magnitude of shock wave is proportional to the distance and
				// relative positions between bomb and blocks.

				var magnitude = distance * 0.005;
				var directionX = (blocks_Sprite[i].x + distX) * magnitude;
				var directionY = (blocks_Sprite[i].y + distY) * magnitude;

				// A velocity is applied to the body. This simulation would be also possible using applyImpulse :

				chipmunk.cpBodySetVel(blocks_Body[i], v(directionX, directionY));

				// Change block frame and plays sound:

				blocks_Sprite[i].setStateBroken();
				Sound.scream();

			} else {

				// If block is outside shock wave range :

				blocks_Sprite[i].setStateHappy();

			};

		};

		// Play explosion sound:

		Sound.explosion();
	};

	// resetScreen() > Put all the sprites in their place of origin :

	function resetScreen() {

		// Remove listeners while resetting the screen :

		game.removeEventListener('enterframe', gameLoop);
		game.removeEventListener('touchstart', onTouchStartBomb);
		game.removeEventListener('touchmove', onTouchMoveBomb);
		game.removeEventListener('touchend', onTouchEndBomb);

		setTimeout(function() {

			// Reset all sprites :

			// Bomb :

			bomb_Sprite.resetInitialState();
			chipmunk.cpBodySetPos(bomb_Body, v(bomb_Sprite.center.x, cpY(bomb_Sprite.center.y)));
			World.enableBodyCollision(space, bomb_Body, bomb_Shape);

			// Shadow :

			shadow.x = bomb_Sprite.x;
			shadow.show();

			// Blocks :

			var i = blocks_Sprite.length;

			while (i--) {

				blocks_Sprite[i].resetInitialState();

				chipmunk.cpBodySetAngle(blocks_Body[i], 0);
				chipmunk.cpBodySetPos(blocks_Body[i], v(blocks_Sprite[i].center.x, cpY(blocks_Sprite[i].center.y)));

			};

			// Add listeners again:

			game.addEventListener('touchstart', onTouchStartBomb);
			game.addEventListener('touchmove', onTouchMoveBomb);
			game.addEventListener('touchend', onTouchEndBomb);

			// Reset flags:

			bombLaunched = false;
			bombExploded = false;

		}, 1500);

	};

	/*
	 * SCENE EVENT HANDLING
	 */

	function onTouchStartBomb(e) {

		// onTouchMoveBomb will work only if this flag (bombTouched) is true

		if (bomb_Sprite.contains(e.x * game.touchScaleX, e.y * game.touchScaleY) && !bombLaunched) {

			bombTouched = true;

		};

	};

	function onTouchMoveBomb(e) {

		if (bombTouched) {

			// Trajectory line simulation :

			var touch = {
				x : bomb_Sprite.center.x - e.x * game.touchScaleX,
				y : bomb_Sprite.center.y - e.y * game.touchScaleY
			};

			bomb_Sprite.moveTrajectory(touch);

		};

	};

	function onTouchEndBomb(e) {

		if (bombTouched) {

			bombTouched = false;

			bomb_Sprite.resetShot();

			// Check relative position between touch and bomb to calculate the velocity of the body

			var velX = -(bomb_Sprite.center.x - e.x * game.touchScaleX) * (-constantGravity);
			var velY = -(bomb_Sprite.center.y - e.y * game.touchScaleY) * (-constantGravity);

			if (!bombLaunched) {

				// Starts the game loop:

				bombLaunched = true;
				game.addEventListener('enterframe', gameLoop);

			};

			// Apply velocity to the body :

			chipmunk.cpBodySetVel(bomb_Body, v(-velX, velY));

			Sound.launch();

			bomb_Sprite.startTimer();

		};

	};

	return self;
};

module.exports = MainScene;

