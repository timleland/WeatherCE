APP.popup = function() {
    var _appId,
        _retryRegistration = 0;
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
                uninstallLink();
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
            getCityState(location.coords, callBack);
        });
    };

    var getCityState = function(coords, callBack) {
        var locationUrl = 'https://maps.googleapis.com/maps/api/geocode/json?sensor=true&latlng=' + coords.latitude + ',' + coords.longitude;
        $.get(locationUrl, function(data) {
            var state, city;
            //http://stackoverflow.com/questions/6797569/get-city-name-using-geolocation
            //http://www.raymondcamden.com/2013/03/05/Simple-Reverse-Geocoding-Example
            var result = data.results[0];
            var locationName = 'Cannot find location...';
            if(result.address_components){
                for (var i = 0, len = result.address_components.length; i < len; i++) {
                    var ac = result.address_components[i];
                    if (ac.types.indexOf("locality") >= 0) city = ac.long_name;
                    if (ac.types.indexOf("administrative_area_level_1") >= 0) state = ac.short_name;
                }

                locationName = (city ? city : '') + (city && state ? ', ' : '') + (state ? state : '');
            }else{
                coords.latitude = 32.3000;
                coords.longitude = 64.7833;
            }

            callBack(coords, locationName);
        });
    };

    var isNewNotification = function(notification) {
        var notificationTracking = JSON.parse(localStorage.getItem('notificationTracking'));
        if (notificationTracking) {
            for (var i = 0; i < notificationTracking.length; i++) {
                if (notificationTracking[i].uri === notification.uri) {
                    return false;
                }
            }
        } else {
            notificationTracking = [];
        }

        notificationTracking.push(notification);
        localStorage.setItem('notificationTracking', JSON.stringify(notificationTracking));
        //Is new notification
        return true;
    };

    var updateBadge = function(appId, fromBackground) {
        $.ajax({
            url: apiurl + 'badge/' + appId,
            type: 'GET',
            success: function(data) {
                if (data.icon) {
                    chrome.browserAction.setBadgeText({
                        text: data.temperature
                    });
                    chrome.browserAction.setIcon({
                        path: { '38': 'img/badge/' + data.icon }
                    });
                } else {
                    var ctx = document.createElement('canvas').getContext('2d');
                    ctx.font = 'bold 18px Arial';
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                    ctx.textBaseline = 'top';
                    ctx.textAlign = 'center';
                    ctx.fillText(data.temperature, 9.5, 1, 19);
                    chrome.browserAction.setIcon({
                        imageData: ctx.getImageData(0, 0, 19, 19)
                    });

                    chrome.browserAction.setBadgeText({
                        text: ''
                    });
                }

                chrome.browserAction.setTitle({
                    title: data.summary ? data.summary : data.temperature
                });

                if (fromBackground) {
                    showAlertNotification(data.alerts);
                    displayNotification(data.precipAlert);
                }
            },
            error: function(){
                chrome.browserAction.setIcon({
                    path: 'img/icon48.png'
                });
            }
        });
    };

    var showAlertNotification = function(alerts) {
        alerts.forEach(function(alert) {
            if (isNewNotification(alert)) {
                //Alert original title is description text
                alert.description = alert.title;
                alert.title = 'Weather Alert';
                alert.image = 'img/alert.png';
                displayNotification(alert);
            }
        });
    };

    var displayNotification = function(alert) {
        if (!alert) {
            return false;
        }

        var options = {
            body: alert.description,
            icon: alert.image
        };

        var notice = new Notification(alert.title, options);

        notice.onclick = function() {
            chrome.tabs.create({
                url: alert.uri
            });
        };
        //Close after 60 secs
        setTimeout(function() {
            notice.close();
        }, 60000);
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
        setTimeout(function(){ updateBadge(_appId, false); }, 4000);
    };

    var getAppId = function(callBack, fromBackground) {
        chrome.storage.sync.get('appId', function(items) {
            _appId = items.appId;
            if (_appId) {
                uninstallLink();
                callBack(_appId, fromBackground);
            } else if (fromBackground || _retryRegistration > 5) {
                getCurrentLocation(register);
            } else if (!fromBackground) {
                //Retry if background hasnt finished registering
                window.setTimeout(function() {
                    _retryRegistration++;
                    getAppId(getWeather, false);
                }, 1000);
            }
        });
    };

    var installUpdate = function() {
        chrome.runtime.onInstalled.addListener(function(details) {
            if (details.reason == "install") {
                window.open('http://timleland.com/weather-chrome-extension/');
            } else if (details.reason == "update") {
                //window.open('http://timleland.com/weather-chrome-extension/');
                var thisVersion = chrome.runtime.getManifest().version;
                //console.log("Updated from " + details.previousVersion + " to " + thisVersion + "!");
            }
        });
    };

    var uninstallLink = function() {
        chrome.runtime.setUninstallURL(baseUrl + 'uninstall/' + _appId);
    };

    window.onload = function() {
        getAppId(getWeather, false);
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
