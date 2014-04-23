var root = this;

root.GoogleMaps = root.GoogleMaps || {}

var MarkerHandler = function(){};
MarkerHandler.map = null;
MarkerHandler.markers = {};
MarkerHandler.markerClickCallback = function(){};

MarkerHandler.setMap = function(map){
  this.map = map;
};

MarkerHandler.setParties = function(parties){
  var self = this;
  if(self.map == null){
    throw Error("set the target map first");
  }
  if(parties){
    parties.forEach(function(party){
      if(!self.markers[party._id]){
        var newMarker = self.createMarker(party);
        self.markers[party._id] = newMarker;
      }
      self.markers[party._id].exist = true;
    });
  }
  var newList = {};
  _.each(self.markers, function(marker){
    if(!marker.exist){
      marker.setMap(null);
    }else{
      delete marker.exist;
      newList[marker.partyId] = marker;
    }
  });
  self.markers = newList;
};

MarkerHandler.createMarker = function(party){
  var marker = new google.maps.Marker({
    position: new google.maps.LatLng(party.x, party.y),
    map: this.map,
    animation: google.maps.Animation.DROP,
    title: party.title,
    partyId: party._id
  });

  google.maps.event.addListener(marker, "click", function(e){
    var tempLocation = "/meetups/" +  marker.partyId + "," +marker.position.k + "," + marker.position.A;
    window.history.pushState(null, null, tempLocation);
    Session.set("selected", marker.partyId);
  });

  return marker;
};

GoogleMaps.MarkerHandler = MarkerHandler;