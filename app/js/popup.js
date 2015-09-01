APP.popup = function() {
    var _appId;
    var register = function(coords, locationName) {
        $.ajax({
            url: apiurl + 'register',
            type: 'POST',
            data: {
                temp_scale: localStorage.getItem('tempScale'),
                time_format: localStorage.getItem('timeScale'),
                latitude: coords.latitude,
                longitude: coords.longitude,
                type: 'geo',
                location_name: locationName
            },
            success: function(data) {
                _appId = data.app_id;
                chrome.storage.sync.set({
                    appId: _appId
                }, function() {
                    getWeather();
                });
            }
        });
    };

    var getCurrentLocation = function(callBack) {
        navigator.geolocation.getCurrentPosition(function(location) {
            debugger
            getCityState(location.coords, callBack);
        });
    };

    var getCityState = function(coords, callBack) {
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
            callBack(coords, locationName);
        });
    };

    var updateBadge = function(appId) {
        $.ajax({
            url: apiurl + 'badge/' + appId,
            type: 'GET',
            success: function(data) {
                chrome.browserAction.setBadgeText({
                    text: data.temperature //+ '°'
                });
                chrome.browserAction.setIcon({
                    path: 'img/badge/' + data.icon
                });

                // var options = {
                //     type: "basic",
                //     title: "Weather",
                //     message: "Current temperature " + data.temperature,
                //     iconUrl: 'img/badge/' + data.icon
                // };
                //
                // chrome.notifications.create('123', options);
            }
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
                app_id: _appId,
                location_name: locationName
            },
            success: function(data) {
                //Current location should be updated. User will have to refresh to see changes
            }
        });
    };


    var getWeather = function() {
        $('#weather_embed').attr('src', apiurl + 'embed/' + _appId + '/sort/0');
        updateBadge(_appId);
    };

    var getAppId = function(callBack) {
        chrome.storage.sync.get('appId', function(items) {
            _appId = items.appId;
            if (_appId) {
                callBack(_appId);
            } else {
                getCurrentLocation(register);
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
        getAppId(getWeather);
        getCurrentLocation(updateCurrentLocation);

        $('#weather_embed').load(function() {
            $('.loadingSpinner').fadeOut(200);
        });
    };

    return {
        installUpdate: installUpdate,
        getAppId: getAppId,
        updateBadge: updateBadge
    };
}();
