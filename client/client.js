// All Tomorrow's Parties -- client

var googleMapMarkers = [];

Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};


Meteor.subscribe("directory");
Meteor.subscribe("activeParties");
Meteor.subscribe("comments");

///////////////////////////////////////////////////////////////////////////////
// Current Location

Template.location.setCurrentCoords = function(location){
  var currentLatitude  = location.coords.latitude;
  var currentLongitude = location.coords.longitude;
  Session.set("currentCoords", {x: currentLatitude, y: currentLongitude});
};

Template.location.setMapToCurrentCoords = function(zoom){
  if(typeof zoom == 'undefined') zoom = 16;
  var coords = Session.get("currentCoords");
  map.setCenter(new google.maps.LatLng( coords.x, coords.y ));
  map.setZoom(zoom);
};

Template.location.openCreateCurrentCoordsDialog = function(){
  var coords = Session.get("currentCoords");
  openCreateDialog(coords.x, coords.y);
};

Template.location.clickedCurrentLocation = function(location){
  Template.location.setCurrentCoords(location);
  Template.location.setMapToCurrentCoords();
  Template.location.openCreateCurrentCoordsDialog();
};

Template.location.clickedMoveCurrentLocation = function(location){
  Template.location.setCurrentCoords(location);
  Template.location.setMapToCurrentCoords();
};

Template.location.initCurrentLocation = function(location){
  Template.location.setCurrentCoords(location);
  Template.location.setMapToCurrentCoords(11);
};

Template.page.events({
  'click .current-location': function (event, template) {
    event.preventDefault();

    if ( !Meteor.userId() ) {
      /* TODO: Alert with error: need to be logged in */
        return;
    }

    navigator.geolocation.getCurrentPosition(Template.location.clickedCurrentLocation, openDisallowedDialog);

  },
  'click .move-current-location': function (event, template) {
    event.preventDefault();

    if ( !Meteor.userId() ) {
      /* TODO: Alert with error: need to be logged in */
        return;
    }

    navigator.geolocation.getCurrentPosition(Template.location.clickedMoveCurrentLocation, openDisallowedDialog);
  }
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

Template.details.text = function () {
  return document.URL;
};

Template.details.dateTimeText = function(date) {
  return date ? new Date(date).toLocaleString() : "Unknown";
};

Template.details.legibleDateTimeText = function(date) {
  return date ? moment(date).fromNow() : "Unknown";
}

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
    window.history.pushState(null, null, '/');
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

var GoogleMapsInit = function(callback, self){

  var mapOptions = {
    zoom: 11,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };

  // set init position
  var latitude = 37.566535;
  var longitude = 126.977969;

  map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);

  map.setCenter(new google.maps.LatLng( latitude, longitude ));
  map.set("disableDoubleClickZoom", true);

  google.maps.event.addListener(map, "dblclick", function(e){
    if(! Meteor.userId())
      return;
    openCreateDialog(e.latLng.k,e.latLng.A);
  });

  if(Session.get("onAfterAction")){
    Template.location.setMapToCurrentCoords();
  }else{
    // if api load current position, the map will update the location
    navigator.geolocation.getCurrentPosition(Template.location.initCurrentLocation);
  }
  GoogleMaps.MarkerHandler.setMap(map);
  Session.set("googleMapsReady", true);

  callback(self);
};

var setMapAutorun = function(self){
  self.handle = Deps.autorun(function () {
    var selected = Session.get("selected");
    var selectedParty = selected && Parties.findOne(selected);

    if ( selectedParty ) {
      console.log( 'map.rendered(): selectedParty:' + selectedParty.title);

      /* TODO: Highlight the pushpin for the selected party */
    }

    /* refresh the map */
    GoogleMaps.MarkerHandler.setParties(Parties.find());
  });
};

Template.map.rendered = function(){
  /* reloaded by Meteor. Restart with googleMapsReady not set */
  var self = this;
  Session.set("googleMapsReady", false);
  GoogleMaps.init(
    {
        'sensor': true, //optional
        'language': 'ko' //optional
    }, function(){
      GoogleMapsInit(setMapAutorun, self);
    }
  );
};
 
Template.map.destroyed = function () {
   this.handle && this.handle.stop();
};

Template.map.selectParty = function(_PartyId, _x, _y){
    longitude = _x;
    latitude = _y;
    Session.set("selected", _PartyId);
}

///////////////////////////////////////////////////////////////////////////////
// Create Party dialog

var openCreateDialog = function (x, y) {
  Session.set("createCoords", {x: x, y: y});
  Session.set("createError", null);
  Session.set("showCreateDialog", true);
};

Template.page.showCreateDialog = function () {
  if(Session.get("showCreateDialog")) jQuery("body").addClass("modal-open");
  else jQuery("body").removeClass("modal-open");
  return Session.get("showCreateDialog");
};

Template.createDialog.events({
  'click .save': function (event, template) {
    var title = template.find(".title").value;
    var description = template.find(".description").value;
    var public = ! template.find(".private").checked;
    var coords = Session.get("createCoords");

    if ( !Meteor.userId() ) {
      Session.set("createError", "You need to be logged in");
      return;
    }

    if (title.length && description.length) {
      var party = {
        title: title,
        description: description,
        x: coords.x,
        y: coords.y,
        public: public
      };
      var id = createParty(party);

      /* FIXME: we are selecting partyId but not updating url. */
      Session.set("selected", id);
      if (! public && Meteor.users.find().count() > 1)
        openInviteDialog();
      party._id = id;

      Session.set("showCreateDialog", false);
    } else {
      Session.set("createError",
                  "It needs a title and a description, or why bother?");
    }
  },

  'click .cancel': function () {
    Session.set("showCreateDialog", false);
  }
});

Template.createDialog.error = function () {
  if(Session.get("showCreateDialog")) jQuery("body").addClass("modal-open");
  else jQuery("body").removeClass("modal-open");
  return Session.get("createError");
};

///////////////////////////////////////////////////////////////////////////////
// Invite dialog

var openInviteDialog = function () {
  if(Session.get("showInviteDialog")) jQuery("body").addClass("modal-open");
  else jQuery("body").removeClass("modal-open");
  Session.set("showInviteDialog", true);
};

Template.page.showInviteDialog = function () {
  if(Session.get("showInviteDialog")) jQuery("body").addClass("modal-open");
  else jQuery("body").removeClass("modal-open");
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

Template.page.helpers({
  currenturl: function(){
    return document.URL;
  }
});


///////////////////////////////////////////////////////////////////////////////
// Location API Disallowed dialog

var openDisallowedDialog = function () {
  if(Session.get("showDisallowedDialog")) jQuery("body").addClass("modal-open");
  else jQuery("body").removeClass("modal-open");
  Session.set("showDisallowedDialog", true);
};

Template.page.showDisallowedDialog = function () {
  if(Session.get("showDisallowedDialog")) jQuery("body").addClass("modal-open");
  else jQuery("body").removeClass("modal-open");
  return Session.get("showDisallowedDialog");
};

Template.disallowedDialog.events({
  'click .cancel': function (event, template) {
    Session.set("showDisallowedDialog", false);
    return false;
  }
});


////////////////////////////////////////////////
/// Comments

var showCommentError = function(message) {
  /* Error message to display in commentform template */
  // console.log( 'error:comment: ' + message)
  Session.set( 'errorComment', message);
};

var clearCommentError = function() {
  /* clear commentform error message */
  showCommentError(null);
};

Template.comments.helpers ( {
  comments: function() {
    /* retrieve comments for the party */
    return Comments.find( {partyId: this._id} );
  }
});

Template.comments.events ({
  'click .comment': function (event, template) {
    /* User clicks 'comment' button and we verify input and relation to party before adding to the collection: comments */

    /* requirement: user logged in, comment body is not empty, partyId valid */
    if ( !Meteor.userId() ) {
      showCommentError( 'BUG: User not logged in');
      return;
    }

    var body = template.find(".comment-body").value;
    var partyId = this._id;
    if ( !body.length) {
      showCommentError('Entered comment is empty');
      return;
    }

    if ( !partyId.length ) {
      showCommentError('BUG: Commenting to an unknown party');
      return;
    }

    var commentEntry = {
        body: body,
        partyId: partyId
    };

    // console.log( 'Adding comment: body:' + body + ',partyId:' + partyId);
    addComment(commentEntry);

    /* clear the form & error message */
    template.find(".comment-body").value = '';
    clearCommentError();
  }
});


Template.comment.helpers ( {
  submittedText: function() {
    /* convert 'submitted' field to readable text */
    return new Date(this.submitted).toLocaleString();
  }
});

Template.commentform.error = function () {
  /* present error message in the browser whenever this session key value is changed */
  return Session.get('errorComment');
};
