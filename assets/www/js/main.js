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
  nearbyRadius: 1000, // meters
  destinationTypes: ['bar'], // Types of Google Places (see http://goo.gl/ChNhe)
  places: [],
  markers: [],
  server: "http://mpd-hotness.nfshost.com",
  map: null,
  $map: null
};

/**
 * Used to sort hotspots by distance, ascending
 */
WUR.compareDistance = function(a, b) {
  return a.distance - b.distance;
}

/**
 * Used to sort hotspots by rating, descending
 */
WUR.compareRating = function(a, b) {
  return b.rating - a.rating;
}

/**
 * Submits the rating form via AJAX
 * 
 * Returns a jqXHR object
 */
WUR.submitRating = function() {
  var placeName = $('#places-menu').val(),
    rating = $('#rating-slider').val();

  return $.ajax({
    dataType: 'jsonp',
    url: WUR.server + "/rate_place.php",
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
    url: WUR.server + "/list_places.php",
    data: {
      lat: WUR.currentCoordinates.latitude,
      lon: WUR.currentCoordinates.longitude,
      max_age_minutes: WUR.maximumRatingAge,
      version: 2
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
    .fail(function(results, status) {
      if (status != google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
        console.log('Error: Failed to search Google Places');
      }
    });
}

/** 
 * Retrieves fresh rating details for a given place, updates the place object, 
 * and calls WUR.loadDetailPage to display the new results.
 */
WUR.refreshDetails = function(place) {
  $.ajax({
    dataType: 'jsonp',
    url: WUR.server + "/place_details.php",
    data: {
      place_id: place.id
    }
  }).done(function(detailResult) {
      place.rating = detailResult.rating;
      place.rating_count = detailResult.rating_count;
      WUR.loadDetailPage(place);
  })
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
        .done(function(places, status) {
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
          for (var i=0; i < places.length; i++) {
            var place = places[i];
            place.distance = google.maps.geometry.spherical
              .computeDistanceBetween(place.geometry.location, WUR.currentLatLng);
            if (place.distance > WUR.searchRadius){
              places.splice(i, 1);
              i--;
              continue;
            }
            
            var rating = ratings[place.id];
            if(rating != null) {
                place.rating = rating.rating;
                place.rating_count = rating.rating_count;
            }
            else {
                place.rating = null;
                place.rating_count = 0;
            }

            place.index = i;
          }

          // Cache the combined results
          WUR.places = places;
          WUR.renderSortedHotspots('distance');
        });
    });
}

/**
 * Sorts the hotspots cached in WUR.places
 * and renders them on the hotspots-list page
 */
WUR.renderSortedHotspots = function(sortBy) {
  // We clone WUR.places instead of sorting it directly.
  // This is necessary to maintain the mapping
  // between each place's "index" property and its index
  // in the WUR.places array.
  var sortedPlaces = WUR.places.slice(0);
  if (sortBy === 'distance') {
    sortedPlaces.sort(WUR.compareDistance);
  }
  else {
    sortedPlaces.sort(WUR.compareRating);
  }

  $('#hotspots-list')
    .jqotesub(WUR.templates.listItem, sortedPlaces)
    .listview('refresh');
}

/**
 * Initializes a Google Map displaying the given destinations
 * and the user's current location
 */
WUR.loadMapPage = function(places) {
  if (WUR.map == null) {
    // Initialize map
    var mapOptions = {
      center: WUR.currentLatLng,
      mapTypeControl: false,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      panControl: false,
      streetViewControl: false,
      zoom: 15
    };
    WUR.$map = $('#map-canvas');
    WUR.map = new google.maps.Map(WUR.$map[0], mapOptions);
    WUR.destinationMarker = {
      image: new google.maps.MarkerImage('img/bar-marker.png',
        // Image dimensions
        new google.maps.Size(32, 37),
        // The origin for this image
        new google.maps.Point(0,0),
        // The anchor for this image (e.g. the base of a pin)
        new google.maps.Point(16, 35)
      ),
      hotspot: {
        coord: [3, 3, 28, 28],
        type: 'rect'
      }
    };
    WUR.currentPosMarker = {
      image: new google.maps.MarkerImage('img/blue-dot.png',
        // Image dimensions
        new google.maps.Size(19, 32),
        // The origin for this image
        new google.maps.Point(0, 0),
        // The anchor for this image (e.g. the base of a pin)
        new google.maps.Point(9, 31)
      ),
      hotspot: {
        coord: [0, 12, 0, 6, 6, 0, 18, 6, 18, 12, 9, 31],
        type: 'poly'
      }
    };
    WUR.infoWindow = new google.maps.InfoWindow();
  }
  else {
    // Clear existing map markers
    var markers = WUR.markers,
      numMarkers = markers.length;
    for (var i=0; i < numMarkers; i++) {
      markers[i].setMap(null);
    }
    WUR.markers = [];
  }

  // Add specified places to the map
  var numPlaces = places.length,
    bounds = new google.maps.LatLngBounds();
  for (var j=0; j < numPlaces; j++) {
    var placeLatLng = places[j].geometry.location,
      marker = new google.maps.Marker({
        position: placeLatLng,
        map: WUR.map,
        icon: WUR.destinationMarker.image,
        shape: WUR.destinationMarker.hotspot,
        place: places[j]
      });
    WUR.markers.push(marker);
    bounds.extend(placeLatLng);
    google.maps.event.addListener(marker, 'click', function() {
      WUR.infoWindow.setContent(this.place.name + ' : ' + ((this.place.rating == null) ? '0' : parseFloat(this.place.rating).toFixed(1)) + '/5.0 Rating');
      WUR.infoWindow.open(WUR.map, this);
    });
  }

  // Add a marker for the user's current location
  WUR.markers.push(new google.maps.Marker({
    position: WUR.currentLatLng,
    map: WUR.map,
    icon: WUR.currentPosMarker.image,
    shape: WUR.currentPosMarker.hotspot
  }));
  bounds.extend(WUR.currentLatLng); 

  // Position the map so that all places are visible
  setTimeout( function() { WUR.map.fitBounds( bounds ); }, 1 );
}

/**
 * Updates the detail page with data for the given hotspot
 */
WUR.loadDetailPage = function(place) {
  var $page = $('#detail'),
    $content = $page.find('.ui-content');
  if ($content.length === 0) {
    $content = $page.find(":jqmData(role='content')");
  }

  $content
    .jqotesub(WUR.templates.detailPage, place)
    .trigger('create');

  $('#refresh-details-button')
    .unbind('.WUR')
    .bind('click.WUR', function() {
      WUR.refreshDetails(place);
    });
}

WUR.clearRatings = function() {
  $.ajax({
    dataType: 'jsonp',
    url: WUR.server + "/clear_ratings.php"
  })
    .done(function() {
      WUR.refreshHotspotList();
    });
}

/**
 * Resizes the map on the map page to fill the viewport
 */
WUR.resizeMap = function() {
  if (WUR.map !== null) {
    var viewportHeight = $.mobile.pageContainer.height(),
      headerHeight = $('#map').find('.ui-header').outerHeight(),
      footerHeight = $('#map').find('.ui-footer').outerHeight();
    WUR.$map.css('min-height', viewportHeight - headerHeight - footerHeight);
    if (WUR.map !== undefined) {
      google.maps.event.trigger(WUR.map, 'resize');
    }
  }
}

$(document)

  // Disable jQuery Mobile page transitions
  .bind('mobileinit', function(){
    $.mobile.defaultPageTransition = 'none';
  })

  .ready(function() {

  // Load jQote2 templates
  WUR.templates.listItem = $.jqotec('#hotspot-list-item');
  WUR.templates.menuOption = $.jqotec('#places-menu-option');
  WUR.templates.detailPage = $.jqotec('#detail-page-content');

  /**
   * RATING PAGE
   */

  $('#rating')
    .bind('pagebeforeshow', function() {
      // Refresh the rating page every time it is shown
      WUR.refreshPlacesMenu();
    })
    .bind('pageinit', function() {
      var $hotnessScale = $('#hotness-scale');
      $('#rating-slider').bind('change', function() {
        var hotness = 'hotness-' + $(this).val();
        $hotnessScale.attr('class', hotness);
      });
    });

  $('#submit-hotspot-button').click(function() {
    WUR.submitRating();
    return false; // Prevent default form behavior
  });

  /**
   * HOTSPOT-LIST PAGE
   */

  $('#sort-distance, #sort-rating').change(function() {
    WUR.renderSortedHotspots( $(this).val() );
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

  $('#hotspots').bind('pagebeforeshow', function() {
    WUR.refreshHotspotList();
  });

  /**
   * MAP PAGE
   */

  $('#map').bind('pageshow', function() {
    WUR.resizeMap();
  });

  $(window).bind('throttledresize', function() {
    WUR.resizeMap();
  });

  /**
   * DYNAMIC PAGE LOADING
   */

  $(document).bind('pagebeforechange', function(event, data) {
    if (typeof data.toPage === 'string') {
      var match = /(map|detail)(?:\?p=([0-9]+))?$/.exec(data.toPage);
      if (match !== null) {
        var destinationPage;

        // The dynamic map and detail pages are dependent on data
        // that is loaded only when the hotspot-list page is visited.
        // If we have not yet visited the hotspot-list page,
        // we redirect to the home page.
        if (WUR.places.length === 0) {
          destinationPage = 'home';
        }
        else {
          destinationPage = match[1];

          switch ( destinationPage ) {
            case 'map':
              if (match[2] === undefined) {
                // Load map of all hotspots
                WUR.loadMapPage(WUR.places);
              }
              else {
                // Load map of individual hotspot
                var i = parseInt(match[2]);
                WUR.loadMapPage(WUR.places.slice(i, i+1));
              }
              break;

            case 'detail':
              if (match[2] !== undefined) {
                WUR.loadDetailPage(WUR.places[match[2]]);
              }
              else {
                destinationPage = 'home';
              }
              break;

            default:
              // Invalid URL hash
              destinationPage = 'home';
              break;
          }
        }

        $.mobile.changePage($('#' + destinationPage), {
          dataUrl: data.toPage
        });

        // Cancel the default jQuery Mobile page-loading operations
        event.preventDefault();
      }
    }
  });
});

})(window, jQuery);
