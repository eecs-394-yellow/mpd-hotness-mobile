/*!
 * searchGooglePlaces( request )
 *
 * Executes a search against Google Places, providing a jQuery Deferred object
 * for attaching multiple callbacks and synchronizing with other operations.
 *   
 * Requires:
 * - jQuery >= 1.5
 * - Google Maps JavaScript API V3 Places Library
 * 
 * By Ethan Romba
 * Inspired by Glenn Baker
 * https://gist.github.com/828536
 */
var searchGooglePlaces = (function(window, google, $) {

	var service = new google.maps.places.PlacesService($('<div></div>')[0]);

	return function ( request ) {

		var	deferred = $.Deferred();

    service.search(request, function (results, status) {

      switch (status) {
        case google.maps.places.PlacesServiceStatus.OK:
        case google.maps.places.PlacesServiceStatus.ZERO_RESULTS:
          deferred.resolve(results, status);
          break;
        default:
          deferred.reject(results, status);
          break;
      }

    });
	
		return deferred.promise();

	};
	
}(window, google, jQuery));
