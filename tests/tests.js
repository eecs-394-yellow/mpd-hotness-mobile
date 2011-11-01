describe('WhereUR App', function() {
	
  function onePlusOne() {
    var i = 1;
	return (i + i);
  }
  
  beforeEach(function() {
    loadFixtures('index.html');
  });

  describe('sanityCheck', function() {
    it('should always fail this test', function() {
      expect(onePlusOne()).not.toEqual(5);
    });
	it('should always pass this test', function() {
	  expect(onePlusOne()).toEqual(2);
	});
  });
  
  //describe('mainSelectorDialog', function
  //

});