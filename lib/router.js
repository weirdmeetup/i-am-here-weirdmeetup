Router.configure({
	layoutTemplate: 'page',
	notFoundTemplate: 'notFound'

// loadingTemplate: 'loading',
// waitOn: function() { return Meteor.subscribe('posts'); }
});


Router.map(function(){
	this.route('mapPage', {path: '/'});
	this.route('mapPage', 
	{
		path: '/meetups/:_id,:_x,:_y',
		onAfterAction: function() {
		  Session.set("forcedLocation", true);
			return Template.map.selectParty(this.params._id, this.params._x, this.params._y);
		}
	});
	
	this.route('mapPage', 
	{ 
		path: '/current-location',
		onAfterAction: function() {
		  Session.set("clickedCurrentLocation", true);
		  return;
		}
	});
	
	this.route('mapPage', 
	{ 
		path: '/where-am-i',
		onAfterAction: function() {
		  Session.set("clickedMoveCurrentLocation", true);
		  return;
		}
	});

	this.route('myPage', {path: '/my'});

	this.route('notFound', {
	  path: '*'
	});

});