(function (window, $) {


/**
 * Global Application Object
 * 
 * All global variables should be defined as members of this object
 */
window.WUR = {
  hotnessScale: [
    'Mild',
    'Hot',
    'Fire',
    'Call the fire department!!!',
    'RAAAGE!!!'
  ],
  geolocationRefreshInterval: 10000, // milliseconds
  currentCoordinates: null, // HTML5 Coordinates object
  currentLatLng: null, // Google Maps LatLng object
  templates: {},
  searchRadius: 5000, // meters
  nearbyRadius: 500, // meters
  destinationTypes: ['bar'] // Types of Google Places (see http://goo.gl/ChNhe)
};

/**
 * Used to sort Google-Places search results by distance, ascending
 */
WUR.compareDistance = function(a, b) {
  return a.distance - b.distance;
}


/**
 * Submits the rating form via AJAX
 */
WUR.submitRating = function() {
  var placeName = $('#places-menu').val(),
    rating = $('#rating').val();

  $.ajax({
    dataType: 'jsonp',
    url: "http://mpd-hotness.nfshost.com/rate_place.php",
    data: {
      place_id: placeName,
      lat: WUR.currentCoordinates.latitude,
      lon: WUR.currentCoordinates.longitude,
      rating: rating
    }
  })
    .done(function() {
      alert('Rating submitted successfully');
      $.mobile.changePage($('#home-page'));
    })
    .fail(function() {
      alert('Error: Failed to submit rating');
    });
}


/**
 * Retrieves the current average rating
 * for each location in the database
 * and calls the given callback on success
 * 
 * Returns a jqXHR object
 */
WUR.getRatings = function(callback) {
  return $.ajax({
    dataType: 'jsonp',
    url: "http://mpd-hotness.nfshost.com/list_places.php",
    data: {
      lat: WUR.currentCoordinates.latitude,
      lon: WUR.currentCoordinates.longitude
    }
  })
    .done(function(places) {
      if (typeof(callback) === 'function') {
        callback.call(this, places);
      }
    })
    .fail(function() {
      console.log('Error: Failed to retrieve destination ratings');
    });
}


/**
 * Retrieves the list of nearby places
 * using the Google Places API
 * and calls the given callback on success
 * 
 * Returns a jQuery Promise
 */
WUR.getPlaces = function(radius, callback) {
  return searchGooglePlaces({
    location: WUR.currentLatLng,
    radius: radius,
    types: WUR.destinationTypes
  })
    .done(function(results, status) {
      if (typeof(callback) === 'function') {
        callback.call(this, results, status);
      }
    })
    .fail(function(results, status) {
      if (status == google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
        alert("Hey, you're not in a bar! You should get out more!");
      }
      console.log('Error: Failed to search Google Places');
    });
}


/**
 * Updates the user's current geolocation
 * and calls the given callback on success
 */
WUR.updateGeolocation = function(callback) {
  navigator.geolocation.getCurrentPosition(
    function(position) {
      var coords = WUR.currentCoordinates = position.coords,
        lat = coords.latitude,
        lon = coords.longitude;
      WUR.currentLatLng = new google.maps.LatLng(lat, lon);
      if (typeof(callback) === 'function') {
        callback.call(this, lat, lon, position);
      }
    },
    function() {
      console.log('Error: Geolocation failed');
    },
    {
      enableHighAccuracy: true,
      maximumAge: WUR.geolocationRefreshInterval
    }
  );
}


/**
 * Refreshes the places menu on the rating page
 * based on the user's current geolocation
 */
WUR.refreshPlacesMenu = function() {
  var $placesMenu = $('#places-menu').selectmenu('disable');
  WUR.updateGeolocation(function() {
    WUR.getPlaces(WUR.nearbyRadius, function(places) {
      $placesMenu
        .jqotesub(WUR.templates.menuOption, places)
        .selectmenu('refresh')
        .selectmenu('enable');
    });
  });
}


/**
 * Refreshes the list of hotspots on the hotspots page
 */
WUR.refreshHotspotList = function() {
  WUR.updateGeolocation(function(lat, lon) {

    // Query Google Places and WhereUR database simultaneously
    $.when( WUR.getPlaces(WUR.searchRadius), WUR.getRatings() )
      .done(function(placesResult, ratingsResult) {

        var places = placesResult[0],
          ratings = ratingsResult[0];

        // Add distance and rating to each Google-Places result
        var numPlaces = places.length;
          numRatings = ratings.length;
        for (var i=0; i < numPlaces; i++) {
          var place = places[i],
            rating = null;
          for (var j=0; j < numRatings; j++) {
            if (place.id == ratings[j].place_id) {
              rating = ratings[j].rating;
              break;
            }
          }
          place.rating = rating;
          place.distance = google.maps.geometry.spherical
            .computeDistanceBetween(place.geometry.location, WUR.currentLatLng);
		}

        // Sort results by distance
        places.sort(WUR.compareDistance);
		
		// Remove results outside of radius
		for (var i = places.length-1; i >= 0; i--) {
		if (places[i].distance > WUR.searchRadius){
				places.splice(i,1);
			}
		}

        $('#hotspots-list')
          .jqotesub(WUR.templates.listItem, places)
          .listview('refresh');
    });
  });
}


WUR.clearRatings = function() {
  $.ajax({
    dataType: 'jsonp',
    url: "http://mpd-hotness.nfshost.com/clear_ratings.php"
  })
    .done(function() {
      WUR.refreshHotspotList();
    });
}


// Disable jQuery Mobile page transitions
$(document).bind('mobileinit', function(){
  $.mobile.defaultPageTransition = 'none';
});


$(document).ready(function() {

  WUR.templates.listItem = $.jqotec('#hotspot-list-item');
  WUR.templates.menuOption = $.jqotec('#places-menu-option');
  
  $('#submit-hotspot-button').click(function() {
    WUR.submitRating();
    return false; // Prevent default form behavior
  });
  
  $('#refresh-list-button').click(function() {
    WUR.refreshHotspotList();
  });

  $('#clear-ratings-button').click(function() {
    WUR.clearRatings();
  });
  
  $('#refresh-list-with-option-button').click(function() {
    var radius = $('#radius').val();
	WUR.searchRadius = (radius * 1609.344);
    WUR.refreshHotspotList();
  });

  $('#rating-page')
    .bind('pagebeforeshow', function() {
      // Refresh the rating page every time it is shown
      WUR.refreshPlacesMenu();
    })
    .bind('pageinit', function() {
      $('#rating').bind('change', function() {
        var hotness = 'hotness-' + $(this).val();
		$('#hotness-scale').attr('class', hotness);
      });
    });

  $('#hotspots-list-page').one('pagebeforeshow', function() {
    WUR.refreshHotspotList();
  });
  
  $('#map_canvas').css({height:screen.height}); 
  $('#map_canvas').gmap({'center': '59.3426606750, 18.0736160278'});


});


})(window, jQuery);
