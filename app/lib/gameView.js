module.exports = function(win,firstScene){
	
	var platino = require('co.lanica.platino');								// Import Platino module 
	var ALmixer = platino.require('co.lanica.almixer');						// Import ALmixer module 
	
	ALmixer.Init(0,0,0);													// Init Almixer with default values ( playback_frequency, num_sources, refresh_rate )

	/*
	 * CREATE GAME INSTANCE
	 * Only one GameView instance is allowed in your app. This is required for every Platino app. All Scene instances are added to the GameView to be displayed.
	 */
	
	var game = platino.createGameView({
		fps:60,                                                 // Game frame rate. Set 30fps for Iphone4, iPad1 and old android devices
		debug:false,                                            // Enable debug logs
		usePerspective:true,                                    // Sets/gets viewpoint type of the GameView (perspective or orthogonal).
		enableOnDrawFrameEvent: true,                           // Disable / enable 'enterframe' event
		enableOnLoadSpriteEvent:false,                          // Enable/Disable onloadsprite event
		enableOnLoadTextureEvent:false,                         // Enable/Disable onloadtexture event
		textureFilter : platino.OPENGL_LINEAR,                  // update game view texture settings for smooth rendering
		TARGET_SCREEN : {width:2048, height:1536},              // set screen size for the game (in this case, iPad resolution)
		touchScaleX:1,                                          // TouchScaleX. Property to detect touches correctly on different resolutions (updateScreenSize) 
		touchScaleY:1,                                          // TouchScaleY. Property to detect touches correctly on different resolutions (updateScreenSize) 
		setupSpriteSize : function(sprite) {                    // Adjust the size of sprite for different resolutions
			var width = sprite.width / game.screenScale;
			var height = sprite.height / game.screenScale;
			sprite.width = (width < 1) ? 1 : width;
			sprite.height = (height < 1) ? 1 : height;
		},
		getTiScale : function(x, y) {                           // Convenience function to convert Titanium coordinate from a Platino coordinate
			return {x: (x / game.touchScaleX),y: (y / game.touchScaleY)};
		},
		locationInView : function(_e) {                         // Converts screen touch event coordinates to Platino GameView coordinates
			var e = { type:_e.type, x:_e.x, y:_e.y, source:_e.source };
			var x = e.x * game.touchScaleX;
			var y = e.y * game.touchScaleY;
			e.x = x;
			e.y = y;
			return e;
		},
		cpY : function(y) {										// Calculate a position regarding the game.screen height. Useful to convert y-coordinates between Platino and Chipmunk
			return (game.screen.height - y);
		},
		cpX : function(x) {										// Calculate a position regarding the game.screen width
			return (game.screen.width - x);
		},
		cpAngle : function(angle) {								// Useful function to convert from Chipmunk2D angles to Platino sprite angles
			return -(angle) * (180/Math.PI);
		}
	
	});
	
	Alloy.Globals.params.fps = game.fps;
	
	game.color(1, 1, 1);                                    	 // set initial background color to white
	
	
	/*
	 * GAME EVENT HANDLING
	 */
	
	
	game.addEventListener('onload', onGameActivated);
	game.addEventListener('onsurfacechanged',onSurfaceChanged);
	game.addEventListener('onfps', showFPS);
	

	
	function updateScreenSize() {
	 	
		// Your game screen size is set here if you did not specifiy game width and height using screen property.
		// Note: game.size.width and height may be changed due to the parent layout so check them here.
		
		var screenScale = game.size.height / game.TARGET_SCREEN.height;
		   
		Ti.API.info("view size: " + game.size.width + "x" + game.size.height);
		Ti.API.info("game screen size: " + game.screen.width + "x" + game.screen.height);
		 
		game.screen = {width:game.size.width / screenScale, height:game.size.height / screenScale};
		    
		    
		if(OS_ANDROID){
		
			game.touchScaleX = game.screen.width  / Titanium.Platform.displayCaps.platformWidth;
			game.touchScaleY = game.screen.height / Titanium.Platform.displayCaps.platformHeight;
			
		}else{
			
			game.touchScaleX = game.screen.width  / game.size.width;
			game.touchScaleY = game.screen.height / game.size.height;
			
		};
	
		game.screenScale = game.screen.height / game.TARGET_SCREEN.height;
		
		game.STAGE_START = { x:0, y:0 };
		game.STAGE_END   = { x:game.TARGET_SCREEN.width, y:game.screen.height };
	
		
		Alloy.Globals.params.gameScreenWidth = game.screen.width;
		Alloy.Globals.params.gameScreenHeight = game.screen.height;
		
	};
	
		
	/*
	 * GAME EVENT HANDLING
	 */
		
		
	function onGameActivated(e){
	 
	 	Ti.API.info('Game Onload');
		updateScreenSize();                                 // Set game screen size
		
		var MainScene  = require(firstScene);   			// Import the MainScene module into the current scope
		game.currentScene = new MainScene(win, game);       // Set MainScene as the current scene
		
		game.pushScene(game.currentScene);                  // Pushes the specified Scene instance into the scene stack (places it at the very top). The scene (now at the top) will then become the currently shown (active) scene.
		game.start();                                       // Starts the game
		
		
	};
	
	function onSurfaceChanged(e){
		
	
		if(OS_ANDROID){
		
			win.getActivity().setRequestedOrientation(Ti.Android.SCREEN_ORIENTATION_LANDSCAPE);		// Helps Android force to landscape
		
		};
		
	};
	
	function showFPS(e){
		
		Ti.API.info(e.fps.toFixed(2) + " fps");
		
	};
	
	platino.addEventListener('onlowmemory', function(e) {
	
		Ti.API.warn("Low Memory");
			
	});
	
	
	/*
	 * APP EVENT HANDLING
	 */
	
	
	win.addEventListener('android:back', androidBackButtonPressed);           // Show exit dialog when Android back button is pressed
	win.addEventListener('open', setupApplicationLifeCycleHandlers);          // Event handlers (pause, resume & onuserleavehint)
	win.addEventListener('close', closeWindow);                               // Listener when ApplicationWindow is closed
	
	
	var closing = false;                                                      // closing is a flag that ensures closing event is executed only once (Android)
	
	function androidBackButtonPressed(e){
		
		if (closing) return;
		
		closing = true;
		
		var dlg = Ti.UI.createAlertDialog({ message : 'Exit?', buttonNames : ['OK','Cancel']});
		
		dlg.addEventListener("click", function(e) {
					
			if (e.index === 0) {
							
				game.currentScene = null;
				game.cleanupGarbage();
			
				win.remove(game);
				
				dlg.hide();
				win.close();
			 
			} else {
				closing = false;
			};
		            
		});
		
		dlg.show();
		 	
	};
		    
	function closeWindow(){
		
		Ti.API.info("ApplicationWindow is closed");
		
		game= null;
		win = null;
	
	};
	
	
	/* You should copy all the event handlers below into your app. 
	 * It makes sure that when an app is paused, the audio pauses, and when resumed, audio is resumed.
	 * Additionally, when Android exits an app, it calls ALmixer_Quit() which is necessary to make sure
	 * the audio system is properly cleaned up, or there could be problems on the next launch.
	 */
	
	/// @param the_window This variable is required for only Android. It should be you main application window.
	
	
	function setupApplicationLifeCycleHandlers()
	{
		var application_reference = (OS_ANDROID) ? win.getActivity() : Titanium.App;
	
	
		application_reference.addEventListener('pause', 
			function()
			{
				Ti.API.info("pause called");
	 			ALmixer.BeginInterruption();
			}
		);
		
		// onuserleavehint was introduced in Ti 3.2.0.GA to better handle Android events.
		// You need 3.2.0.GA for this to have any effect, but it is safe to run this on older versions because it will be a no-op.
		
		application_reference.addEventListener('onuserleavehint', 
			function()
			{
				Ti.API.info("onuserleavehint called");
	 			ALmixer.BeginInterruption();
			}
		);
	
	
		// I think this is triggered when resuming Titanium phone call interruptions.	
		application_reference.addEventListener('resume', 
			function()
			{
				Ti.API.info("resume called");
				ALmixer.EndInterruption();
			}
		);
	
		// I think this is triggered for resuming all other paused events.
		application_reference.addEventListener('resumed', 
			function()
			{
				Ti.API.info("resumed called");
				ALmixer.EndInterruption();
			}
		);
	};
	



	return game;
};