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
  currentLatLon: null, // LatLon object
  templates: {}
};


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
 * Retrieves the list of nearby places
 * and calls the given callback on success
 */
WUR.getPlaces = function(callback) {
  $.ajax({
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
      console.log('Error: Failed to retrieve hotspots');
    });
}


/**
 * Updates the user's current geolocation
 * and calls the given callback on success
 */
WUR.updateGeolocation = function(callback) {
  navigator.geolocation.getCurrentPosition(
    function(position) {
      var coords = WUR.currentCoordinates = position.coords;
      $('.your-location').text(coords.latitude + ', ' + coords.longitude);
      if (typeof(callback) === 'function') {
        callback.call(this, position);
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
  WUR.updateGeolocation(function() {
    WUR.getPlaces(function(places) {
      $('#places-menu')
        .jqotesub(WUR.templates.menuOption, places)
        .selectmenu('refresh');
    });
  });
}


/**
 * Refreshes the list of hotspots on the hotspots page
 */
WUR.refreshHotspotList = function() {
  WUR.updateGeolocation(function() {
    WUR.getPlaces(function(places) {
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

  $('#rating-page')
    .bind('pagebeforeshow', function() {
      // Refresh the rating page every time it is shown
      WUR.refreshPlacesMenu();
    })
    .bind('pageinit', function() {
      $('#rating').bind('change', function() {
        var hotness = $(this).val();
        $('#hotness-scale').text( WUR.hotnessScale[hotness-1] );
      });
    });

  $('#hotspots-list-page').one('pagebeforeshow', function() {
    WUR.refreshHotspotList();
  });

});


})(window, jQuery);