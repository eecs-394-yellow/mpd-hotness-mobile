describe('Hello, world!', function() {
	
  function greetings() {
	return 'welcome';
  }
  
  beforeEach(function() {
    loadFixtures('index.html');
  });

  describe('Greetings', function() {
    it('should be welcoming', function() {
      expect(greetings()).toEqual('welcome');
    });
  });

});
