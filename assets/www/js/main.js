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
function submitRating() {
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
      $.mobile.changePage($('#home-page')[0]);
    })
    .fail(function() {
      alert('Error: Failed to submit rating');
    });
}


/**
 * Retrieves the list of nearby places
 * and calls the given callback on success
 */
function getPlaces(callback) {
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
function updateGeolocation(callback) {
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
function refreshPlacesMenu() {
  updateGeolocation(function() {
    getPlaces(function(places) {
      $('#places-menu')
        .jqotesub(WUR.templates.menuOption, places)
        .selectmenu('refresh');
    });
  });
}


/**
 * Refreshes the list of hotspots on the hotspots page
 */
function refreshHotspotList() {
  updateGeolocation(function() {
    getPlaces(function(places) {
      $('#hotspots-list')
        .jqotesub(WUR.templates.listItem, places)
        .listview('refresh');
    });
  });
}


function clearRatings() {
  $.ajax({
    dataType: 'jsonp',
    url: "http://mpd-hotness.nfshost.com/clear_ratings.php"
  })
    .done(function() {
      refreshHotspotList();
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
    submitRating();
    return false; // Prevent default form behavior
  });
  
  $('#refresh-list-button').click(function() {
    refreshHotspotList();
  });

  $('#clear-ratings-button').click(function() {
    clearRatings();
  });

  $('#rating-page')
    .bind('pagebeforeshow', function() {
      // Refresh the rating page every time it is shown
      refreshPlacesMenu();
    })
    .bind('pageinit', function() {
      $('#rating').bind('change', function() {
        var hotness = $(this).val();
        $('#hotness-scale').text( WUR.hotnessScale[hotness-1] );
      });
    });

  $('#hotspots-list-page').one('pagebeforeshow', function() {
    refreshHotspotList();
  });

});


})(window, jQuery);
