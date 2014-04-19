// All Tomorrow's Parties -- client

// pin to current location 
var longitude, latitude;
var getLocation = function (location) {
  longitude = location.coords.latitude;
  latitude = location.coords.longitude;
};
navigator.geolocation.getCurrentPosition(getLocation);

Template.page.events({
  'click .current-location': function (event, template) {
       event.preventDefault();
       map.setCenter(new google.maps.LatLng( longitude, latitude ));
       map.setZoom(16);
       openCreateDialog(longitude, latitude);
   }
});
// @krazyeom Apr/19/2014

Meteor.subscribe("directory");
Meteor.subscribe("parties",function(){

  // If no party selected, or if the selected party was deleted, select one.
  Meteor.startup(function () {
    GoogleMaps.init(
      {
          'sensor': true, //optional
          'language': 'ko' //optional
      }, 
      function(){
        var mapOptions = {
          zoom: 11,
          mapTypeId: google.maps.MapTypeId.ROADMAP
        };

        map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions); 
        map.setCenter(new google.maps.LatLng( 37.566535, 126.977969 ));
        map.set("disableDoubleClickZoom", true);

        google.maps.event.addListener(map, "dblclick", function(e){
          if(! Meteor.userId())
            return;
          openCreateDialog(e.latLng.k,e.latLng.A);
        });

        Parties.find().fetch().forEach(Template.map.rendered);
      }
    );
  });

});



///////////////////////////////////////////////////////////////////////////////
// Party details sidebar

Template.details.party = function () {
  return Parties.findOne(Session.get("selected"));
};

Template.details.anyParties = function () {
  return Parties.find().count() > 0;
};

Template.details.creatorName = function () {
  var owner = Meteor.users.findOne(this.owner);
  if (owner._id === Meteor.userId())
    return "me";
  return displayName(owner);
};

Template.details.canRemove = function () {
  return this.owner === Meteor.userId() && attending(this) === 0;
};

Template.details.canFinish = function () {
  return this.owner === Meteor.userId() && attending(this) !== 0;
};

Template.details.maybeChosen = function (what) {
  var myRsvp = _.find(this.rsvps, function (r) {
    return r.user === Meteor.userId();
  }) || {};

  return what == myRsvp.rsvp ? "chosen btn-inverse" : "";
};

Template.details.events({
  'click .rsvp_yes': function () {
    Meteor.call("rsvp", Session.get("selected"), "yes");
    return false;
  },
  'click .rsvp_maybe': function () {
    Meteor.call("rsvp", Session.get("selected"), "maybe");
    return false;
  },
  'click .rsvp_no': function () {
    Meteor.call("rsvp", Session.get("selected"), "no");
    return false;
  },
  'click .invite': function () {
    openInviteDialog();
    return false;
  },
  'click .remove': function () {
    Parties.remove(this._id);
    var marker = google.markers[this._id];
    Template.map.destroyed(marker);
    return false;
  }
});

///////////////////////////////////////////////////////////////////////////////
// Party attendance widget

Template.attendance.rsvpName = function () {
  var user = Meteor.users.findOne(this.user);
  return displayName(user);
};

Template.attendance.outstandingInvitations = function () {
  var party = Parties.findOne(this._id);
  return Meteor.users.find({$and: [
    {_id: {$in: party.invited}}, // they're invited
    {_id: {$nin: _.pluck(party.rsvps, 'user')}} // but haven't RSVP'd
  ]});
};

Template.attendance.invitationName = function () {
  return displayName(this);
};

Template.attendance.rsvpIs = function (what) {
  return this.rsvp === what;
};

Template.attendance.nobody = function () {
  return ! this.public && (this.rsvps.length + this.invited.length === 0);
};

Template.attendance.canInvite = function () {
  return ! this.public && this.owner === Meteor.userId();
};

///////////////////////////////////////////////////////////////////////////////
// Map display

// Use jquery to get the position clicked relative to the map element.
var coordsRelativeToElement = function (element, event) {
  var offset = $(element).offset();
  var x = event.pageX - offset.left;
  var y = event.pageY - offset.top;
  return { x: x, y: y };
};

Template.map.rendered = function(party){
  if(typeof google == 'undefined') return;
  var marker = new google.maps.Marker({
    position: new google.maps.LatLng(party.x, party.y),
    map: map,
    animation: google.maps.Animation.DROP,
    title: party._id
  });

  google.maps.event.addListener(marker, "click", function(e){
    Session.set("selected", marker.title);
  });
  if(!google.markers) google.markers = [];
  google.markers[party._id] = marker;
};

Template.map.destroyed = function (marker) {
  marker.setMap(null);
};

///////////////////////////////////////////////////////////////////////////////
// Create Party dialog

var openCreateDialog = function (x, y) {
  Session.set("createCoords", {x: x, y: y});
  Session.set("createError", null);
  Session.set("showCreateDialog", true);
  jQuery('#createDialog').modal('show');
};

Template.page.showCreateDialog = function () {
  return Session.get("showCreateDialog");
};

Template.createDialog.events({
  'click .save': function (event, template) {
    var title = template.find(".title").value;
    var description = template.find(".description").value;
    var public = ! template.find(".private").checked;
    var coords = Session.get("createCoords");

    if (title.length && description.length) {
      var party = {
        title: title,
        description: description,
        x: coords.x,
        y: coords.y,
        public: public
      };
      var id = createParty(party);

      Session.set("selected", id);
      if (! public && Meteor.users.find().count() > 1)
        openInviteDialog();
      party._id = id;
      Template.map.rendered(party);
      Session.set("showCreateDialog", false);
    } else {
      Session.set("createError",
                  "It needs a title and a description, or why bother?");
    }
  },

  'click .cancel': function () {
    Session.set("showCreateDialog", false);
    jQuery('#createDialog').modal('hide');
  }
});

Template.createDialog.error = function () {
  return Session.get("createError");
};

///////////////////////////////////////////////////////////////////////////////
// Invite dialog

var openInviteDialog = function () {
  Session.set("showInviteDialog", true);
};

Template.page.showInviteDialog = function () {
  return Session.get("showInviteDialog");
};

Template.inviteDialog.events({
  'click .invite': function (event, template) {
    Meteor.call('invite', Session.get("selected"), this._id);
  },
  'click .done': function (event, template) {
    Session.set("showInviteDialog", false);
    return false;
  }
});

Template.inviteDialog.uninvited = function () {
  var party = Parties.findOne(Session.get("selected"));
  if (! party)
    return []; // party hasn't loaded yet
  return Meteor.users.find({$nor: [{_id: {$in: party.invited}},
                                   {_id: party.owner}]});
};

Template.inviteDialog.displayName = function () {
  return displayName(this);
};
