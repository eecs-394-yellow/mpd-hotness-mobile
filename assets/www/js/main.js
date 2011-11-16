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
  maximumRatingAge: 60, // minutes
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
 * 
 * Returns a jqXHR object
 */
WUR.submitRating = function() {
  var placeName = $('#places-menu').val(),
    rating = $('#rating').val();

  return $.ajax({
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
      $.mobile.changePage($('#home'));
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
WUR.getRatings = function() {
  return $.ajax({
    dataType: 'jsonp',
    url: "http://mpd-hotness.nfshost.com/list_places.php",
    data: {
      lat: WUR.currentCoordinates.latitude,
      lon: WUR.currentCoordinates.longitude,
      max_age_minutes: WUR.maximumRatingAge
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
WUR.getPlaces = function(radius) {
  return searchGooglePlaces({
    location: WUR.currentLatLng,
    radius: radius,
    types: WUR.destinationTypes
  })
    .done(function(results, status) {
      WUR.places = results;
    })
    .fail(function(results, status) {
      if (status != google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
        console.log('Error: Failed to search Google Places');
      }
    });
}


/**
 * Updates the user's current geolocation
 * and calls the given callback on success
 * 
 * Returns a jQuery Promise
 */
WUR.updateGeolocation = function() {
  return getCurrentPosition({
    enableHighAccuracy: true,
    maximumAge: WUR.geolocationRefreshInterval
  })
    .done(function(position) {
      var coords = WUR.currentCoordinates = position.coords,
        lat = coords.latitude,
        lon = coords.longitude;
      WUR.currentLatLng = new google.maps.LatLng(lat, lon);
    })
    .fail(function() {
      console.log('Error: Failed to detect geolocation');
    });
}


/**
 * Refreshes the places menu on the rating page
 * based on the user's current geolocation
 */
WUR.refreshPlacesMenu = function() {
  var $placesMenu = $('#places-menu').selectmenu('disable');
  WUR.updateGeolocation()
    .done(function() {
      WUR.getPlaces(WUR.nearbyRadius)
        .done(function(places) {
          if (status === google.maps.places.PlacesServiceStatus.OK) {
            $placesMenu
              .jqotesub(WUR.templates.menuOption, places)
              .selectmenu('refresh')
              .selectmenu('enable');
          }
          else {
            alert("Hey, you're not in a bar! You should get out more often!");
          }
        });
    });
}


/**
 * Refreshes the list of hotspots on the hotspots page
 */
WUR.refreshHotspotList = function() {
  WUR.updateGeolocation()
    .done(function() {

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
          for (i = places.length-1; i >= 0; i--) {
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

  $('#rating')
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

  $('#hotspots').one('pagebeforeshow', function() {
    WUR.refreshHotspotList();
  });
  
  $('#map_canvas').css({height:screen.height}); 
  $('#map_canvas').gmap({'center': '59.3426606750, 18.0736160278'});


});


})(window, jQuery);
