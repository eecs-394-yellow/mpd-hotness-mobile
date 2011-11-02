(function (window, $) {

function refresh() {
 $('ul').listview('refresh');
}



function populateNearbyPlaces() {
	
	var service;
	var geoLocation = new google.maps.LatLng(-33.8665433,151.1956316);

	var request = {
		location: geoLocation,
		radius: '200',
		types: ['store']
	};
	
	service = new google.maps.places.PlacesService();
	service.search (request, callback);
}

	function callback(results, status){
	if (status == google.maps.places.PlacesServiceStatus.OK) {
		for (var i = 0; i < results.length; i++) {
			var place = results[i];
			return place.name;
		}
	}


$(document).ready(function() {

  $('#slider').bind('change',function(event, data) {
    value = $(this).val();
    if (value==1) {
        $('#heat').text('Mild');
    }
    if( value==2) {
        $('#heat').text('Hot');
    }
    if (value==3) {
        $('#heat').text('Fire');
    }
    if (value==4) {
        $('#heat').text('Call the fire department!!!');
    }	
	if (value==5) {
        $('#heat').text('RAAAGE!!!');
    }
	});
	
	$('#refresh').click(function() {
    refresh();
  });
  
  $('#test').click(function() {
	var test = populateNearbyPlaces();
    alert(test);
  });
});


})(window, jQuery);
