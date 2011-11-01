<<<<<<< HEAD
$(document).ready(function(){
=======
(function (window, $) {

var noteTemplate,
	currentPosition = null,
	currentLatLon = null;

function submitNote() {
    var noteAuthor = $('#author-field').val(),
		noteLocation = $('#location-field').val(),
		noteText = $('#note-text-field').val();
    
    if (currentPosition === null) {
    	console.log("Error: Current GPS position could not be obtained before submitting form");
    	return;
    }

    $.ajax({
      dataType: 'jsonp',
      url: "http://geonotes.nfshost.com/add_note.php",
      data: {
        device_id: 1, // PhoneGap API method: device.uuid
        user_name: noteAuthor,
        location_text: noteLocation,
        note: noteText,
        lat: currentPosition.latitude,
        lon: currentPosition.longitude
      }
    }).done(function() {
      clearForm();
      refreshList();
    });
}

function logGPSError() {
	console.log('Error polling GPS coordinates');
}

function refreshList() {
  $.ajax({
    dataType: 'jsonp',
    url: "http://geonotes.nfshost.com/list.php"
  }).done(function( notes ) {
    var numNotes = notes.length;
    $('.notes .note').addClass('old');
    for (var i=0; i < numNotes; i++)
      {
        // Add each note to the page
        var note = notes[i],
          $existingNote = $('.note-' + note.note_id);
        if ($existingNote.length === 0)
          {
            addNoteToList(note);
          }
        else
          {
            $existingNote.removeClass('old');
          }
      }
      $('.notes .old').fadeOut(function() {
        $(this).remove();
      });
  });
}

function addNoteToList(note) {
  // Render a note and add it to the page
	noteLatLon = new LatLon(note.lat, note.lon);
	if (currentLatLon !== null) {
		note.distance = currentLatLon.distanceTo(noteLatLon);
	}
	else {
		note.distance = '';
	}
  var $note = $( $.jqote(noteTemplate, note) ).hide();
  $('.notes').prepend($note);
  $note.animate({
    height: 'show'
  }, 500, 'swing', function() {
    $(this).animate({
      opacity: 1
    }, 500, 'swing');
  });  
  $note.data('latLon', noteLatLon);
}

function clearForm() {
  // Clear any text in the write-note form fields
  $('.write-note textarea').each(function() {
    $(this).val('');
  });
}

function clearNotes() {
  // Delete all notes in the database
  $.ajax({
    url: "http://geonotes.nfshost.com/clear.php"
  });

  // Remove the notes on the page
  $('.notes .note').fadeOut(function() {
    $(this).remove();
  });
}

function updateCurrentPosition(position) {
	// Update the latitude and longitude in the write-note form
	currentPosition = position.coords;
	var lat = currentPosition.latitude,
		lon = currentPosition.longitude;
	$('.current-gps-coordinates span').text(lat + ', ' + lon);
>>>>>>> 9a52fdd6bea4777ed70428fed274aeb65948a931
	
	// The select element to be replaced:
	var select = $('select.makeMeFancy');

<<<<<<< HEAD
	var selectBoxContainer = $('<div>',{
		width		: select.outerWidth(),
		className	: 'tzSelect',
		html		: '<div class="selectBox"></div>'
	});
=======
  noteTemplate = $.jqotec('#note-template');
  
  refreshList();

  $('#note-submit-button').click(function() {
    submitNote();
    return false; //Turn off the default form behavior
  });
  
  $('#list-refresh-button').click(function() {
    refreshList();
  });

  $('#clear-notes-button').click(function() {
    clearNotes();
  });
  
  // Update the current position when the page first loads
  // and whenever the device's GPS location changes in the future
  navigator.geolocation.getCurrentPosition(function(position) {
	  	updateCurrentPosition(position);
		navigator.geolocation.watchPosition(updateCurrentPosition, logGPSError, { enableHighAccuracy: true, maximumAge: 2000 });
	  }, logGPSError, { enableHighAccuracy: true });

});
>>>>>>> 9a52fdd6bea4777ed70428fed274aeb65948a931

	var dropDown = $('<ul>',{className:'dropDown'});
	var selectBox = selectBoxContainer.find('.selectBox');
	
	// Looping though the options of the original select element
	
	select.find('option').each(function(i){
		var option = $(this);
		
		if(i==select.attr('selectedIndex')){
			selectBox.html(option.text());
		}
		
		// As of jQuery 1.4.3 we can access HTML5 
		// data attributes with the data() method.
		
		if(option.data('skip')){
			return true;
		}
		
		// Creating a dropdown item according to the
		// data-icon and data-html-text HTML5 attributes:
		
		var li = $('<li>',{
			html:	'<img src="'+option.data('icon')+'" /><span>'+
					option.data('html-text')+'</span>'
		});
				
		li.click(function(){
			
			selectBox.html(option.text());
			dropDown.trigger('hide');
			
			// When a click occurs, we are also reflecting
			// the change on the original select element:
			select.val(option.val());
			
			return false;
		});
		
		dropDown.append(li);
	});
	
	selectBoxContainer.append(dropDown.hide());
	select.hide().after(selectBoxContainer);
	
	// Binding custom show and hide events on the dropDown:
	
	dropDown.bind('show',function(){
		
		if(dropDown.is(':animated')){
			return false;
		}
		
		selectBox.addClass('expanded');
		dropDown.slideDown();
		
	}).bind('hide',function(){
		
		if(dropDown.is(':animated')){
			return false;
		}
		
		selectBox.removeClass('expanded');
		dropDown.slideUp();
		
	}).bind('toggle',function(){
		if(selectBox.hasClass('expanded')){
			dropDown.trigger('hide');
		}
		else dropDown.trigger('show');
	});
	
	selectBox.click(function(){
		dropDown.trigger('toggle');
		return false;
	});

	// If we click anywhere on the page, while the
	// dropdown is shown, it is going to be hidden:
	
	$(document).click(function(){
		dropDown.trigger('hide');
	});
});
