Router.configure({
layoutTemplate: 'page',
notFoundTemplate: 'notFound'

// loadingTemplate: 'loading',
// waitOn: function() { return Meteor.subscribe('posts'); }
});


Router.map(function(){
	this.route('page', {path: '/'});
	this.route('page', 
	{ 
		path: '/meetups/:_id,:_x,:_y',
		onAfterAction: function() {
			return Template.map.selectParty(this.params._id, this.params._x, this.params._y);
		}
	});
	this.route('notFound', {
	  path: '*'
	});
});