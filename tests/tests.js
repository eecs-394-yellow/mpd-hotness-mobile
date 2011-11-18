describe('WhereUR App', function() {

  describe('sanityCheck', function() {
  
	function onePlusOne() {
		var i = 1;
		return (i + i);
	}
	
	beforeEach(function() {
		loadFixtures('index.html');
	});
	
    it('should always fail this test', function() {
		expect(onePlusOne()).not.toEqual(5);
    });
	it('should always pass this test', function() {
		expect(onePlusOne()).toEqual(2);
	});
  });
  
  describe('testFixtureLoad', function() {
	beforeEach(function() {
		loadFixtures('index.html');
	});
	
	it('should load the HTML from a fixture path', function() {
		expect($('#home')).toExist();
	});
	it('can access the WUR global object', function() {
		expect(WUR).not.toBeNull();
	});
  });
  
  describe('getPlacesMethod', function() {
    beforeEach(function() {
		loadFixtures('index.html');
	});
	
	it('should clear the page on a request with no places returned', function() {
		WUR.fakeGetPlacesEmpty = function(callback) {
			$.mockjax({
				contentType: 'text/json',
				url: "http://mpd-hotness.nfshost.com/list_places.php",
				response: function() {
					this.responseText = {
						places: []
					}
					callback.call(this, this.responseText.places);
				}
			})
		}
		
		WUR.fakeGetPlacesEmpty(function(places) {
			$('#places-menu')
				.jqotesub(WUR.templates.menuOption, places)
				.selectmenu('refresh');
		});
			
		expect($('#hotspots-list')).toBeEmpty();
	});
	/* TEST IN DEVELOPMENT
	it('should populate the page with several places when a successful request is returned', function() {
		var fakeValidPlaces = [
			{
				place_id: 'test1',
				rating: 1,
				lat: 81,
				lon: 18
			},
			{
				place_id: 'test2',
				rating: 5,
				lat: 82,
				lon: 28
			},
			{
				place_id: 'test3',
				rating: 3.5,
				lat: 83,
				lon: 38
			}
		];
		
		WUR.fakeGetPlacesSuccess = function(callback) {
			$.mockjax({
				contentType: 'text/json',
				url: "http://mpd-hotness.nfshost.com/list_places.php",
				response: function() {
					this.responseText = {
						places: fakeValidPlaces
					}
					callback.call(this, this.responseText.places);
				}
			})	
		}
		
		WUR.fakeGetPlacesSuccess(function(places) {
			$('#places-menu')
				.jqotesub(WUR.templates.menuOption, places)
				.selectmenu('refresh');
		});
		
		expect($('#hotspots-list))
	});
	*/
	
  });
});