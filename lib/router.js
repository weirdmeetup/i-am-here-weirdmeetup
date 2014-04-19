Router.configure({
layoutTemplate: 'page'
// loadingTemplate: 'loading',
// waitOn: function() { return Meteor.subscribe('posts'); }
});


Router.map(function(){
	this.route('page', {path: '/'});
	// this.route('pageTest', {path: '/test'});
	this.route('page', 
	{ 
		path: '/meetups/:_id',
		// waitOn: function() {
		// 	return selectParty(this.params._id, this.params.x, this.params.y);
		// },
		data: function() { 
			// return selectParty(this.params._id); 
			return Template.map.selectParty(this.params._id, this.params.x, this.params.y);
		}
	});
});