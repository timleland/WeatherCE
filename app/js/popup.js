APP.POPUP = function() {
    var appId;
    var register = function() {
        $.ajax({
            url: apiurl + 'register',
            type: 'POST',
            data: {
                app_id: appId
            },
            success: function(data) {
                getCurrentLocation();
            }
        });
    };

    var getCurrentLocation = function() {
        navigator.geolocation.getCurrentPosition(function(location) {
            getCityState(location.coords);
        });
    };

    var getCityState = function(coords) {
        var locationUrl = 'http://maps.googleapis.com/maps/api/geocode/json?sensor=true&latlng=' + coords.latitude + ',' + coords.longitude;
        $.get(locationUrl, function(data) {
            var state, city;
            //http://stackoverflow.com/questions/6797569/get-city-name-using-geolocation
            //http://www.raymondcamden.com/2013/03/05/Simple-Reverse-Geocoding-Example
            var result = data.results[0];
            for (var i = 0, len = result.address_components.length; i < len; i++) {
                var ac = result.address_components[i];
                if (ac.types.indexOf("locality") >= 0) city = ac.long_name;
                if (ac.types.indexOf("administrative_area_level_1") >= 0) state = ac.short_name;
            }
             var locationName = (city ? city : '') + (city && state ? ', ' : '') + (state ? state : '');
             updateCurrentLocation(coords, locationName);
        });
    };

    var updateCurrentLocation = function(coords, locationName) {
        $.ajax({
            url: apiurl + 'location',
            type: 'POST',
            data: {
                latitude: coords.latitude,
                longitude: coords.longitude,
                type: 'geo',
                app_id: appId,
                location_name: locationName
            },
            success: function(data) {
                getWeather();
            }
        });
    };


    var getWeather = function() {
        $('#weather_embed').attr('src', apiurl + 'embed/' + appId + '/sort/0');
    };

    var getAppId = function() {
        chrome.storage.sync.get('appId', function(items) {
            appId = items.appId;
            if (appId) {
                getWeather();
            } else {
                appId = APP.COMMON.getRandomToken();
                chrome.storage.sync.set({
                    appId: appId
                }, function() {
                    register();
                });
            }
        });
    };


    var installUpdate = function() {
        // chrome.runtime.onInstalled.addListener(function(details) {
        //     if (details.reason == "install") {
        //         getLocation();
        //         window.open('http://timleland.com/weather-chrome-extension/');
        //     } else if (details.reason == "update") {
        //         getLocation();
        //         //window.open('http://timleland.com/weather-chrome-extension/#update');
        //         var thisVersion = chrome.runtime.getManifest().version;
        //         console.log("Updated from " + details.previousVersion + " to " + thisVersion + "!");
        //     }
        // });
    };

    window.onload = function() {
        getAppId();
    };

    return {

    };
}();
