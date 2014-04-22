// All Tomorrow's Parties -- server

Meteor.publish("directory", function () {
  return Meteor.users.find({}, {fields: {emails: 1, profile: 1}});
});

Meteor.publish("parties", function () {
  return Parties.find(
    {$or: [{"public": true}, {invited: this.userId}, {owner: this.userId}]});
});

Meteor.publish("activeParties", function () {
	var now = new Date().getTime();
	return Parties.find(
    		{expires: { $gt: now}},
    		{$or: [{"public": true}, {invited: this.userId}, {owner: this.userId}]}
	);
});

Meteor.publish("comments", function() {
	return Comments.find();
});