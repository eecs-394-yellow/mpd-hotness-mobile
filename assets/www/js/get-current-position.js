/*!
 * searchGooglePlaces( options )
 *
 * Provides the user's current GPS position, providing a jQuery Deferred object
 * for attaching multiple callbacks and synchronizing with other operations.
 *   
 * Requires:
 * - jQuery >= 1.5
 * - HTML5 Geolocation support
 * 
 * By Ethan Romba
 * Inspired by Glenn Baker & Zach Leatherman
 * https://gist.github.com/828536
 * http://www.zachleat.com/web/deferred-geolocation/
 */
var getCurrentPosition = (function(window, $) {

	return function ( options ) {

		var	deferred = $.Deferred();

    navigator.geolocation.getCurrentPosition(deferred.resolve, deferred.reject, options);
	
		return deferred.promise();

	};
	
}(window, jQuery));
