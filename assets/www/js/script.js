(function (window, $) {

function refresh() {
 $('ul').listview('refresh');
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
});


})(window, jQuery);
