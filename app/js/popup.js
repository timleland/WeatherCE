APP.popup = function() {
    var _appId,
        _retryRegistration = 0;
    var register = function(coords, locationName) {
        $.ajax({
            url: _apiUrl + 'register',
            type: 'POST',
            data: {
                temp_scale: localStorage.getItem('tempScale'),
                time_format: localStorage.getItem('timeScale'),
                latitude: coords.latitude,
                longitude: coords.longitude,
                type: 'geo',
                location_name: locationName,
                extension_type: _extensionType
            },
            success: function(data) {
                _appId = data.app_id;
                storeAppId();
            }
        });
    };

    var storeAppId = function(){
        if (_extensionType == 'Firefox') {
            chrome.storage.local.set({ appId: _appId }, storeAppIdComplete);
        } else {
            chrome.storage.sync.set({ appId: _appId }, storeAppIdComplete);
        }
    };

    var storeAppIdComplete = function(){
        uninstallLink();
        updateBadge(true);
        getWeatherEmbed();
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
            var locationName = 'Unknown location: Set manually';
            if(result && result.address_components){
                for (var i = 0, len = result.address_components.length; i < len; i++) {
                    var ac = result.address_components[i];
                    if (ac.types.indexOf('locality') >= 0) city = ac.long_name;
                    if (ac.types.indexOf('administrative_area_level_1') >= 0) state = ac.short_name;
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

    var updateBadge = function(fromBackground) {
        $.ajax({
            url: _apiUrl + 'badge/' + _appId,
            type: 'GET',
            success: function(data) {
                if (data.icon) {
                    chrome.browserAction.setBadgeText({
                        text: data.temperature
                    });

                    chrome.browserAction.setIcon({
                        path: { '38': 'img/badge/' + (data.lightBadge ? 'light/' : '') + data.icon }
                    });
                } else {
                    var ctx = document.createElement('canvas').getContext('2d');
                    ctx.font = 'bold 18px Arial';
                    ctx.fillStyle = data.lightBadge ? 'rgba(255, 255, 255, 1)' : 'rgba(0, 0, 0, 0.8)';
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
        chrome.notifications.create(null, {
            'type': 'basic',
            'iconUrl': chrome.extension.getURL(alert.image),
            'title': alert.title,
            'message': alert.description
        }, function(notificationId){
            chrome.notifications.onClicked.addListener(function(notificationIdClicked) {
                if(notificationIdClicked === notificationId){
                    chrome.tabs.create({
                        url: alert.uri
                    });

                  chrome.notifications.clear(notificationId);
              }
            });
        });
    };

    var updateCurrentLocation = function(coords, locationName) {
        $.ajax({
            url: _apiUrl + 'location',
            type: 'POST',
            data: {
                latitude: coords.latitude,
                longitude: coords.longitude,
                type: 'geo',
                app_id: _appId,
                location_name: locationName,
                extension_type: _extensionType
            },
            success: function(data) {
                //Current location should be updated. User will have to refresh to see changes
            }
        });
    };


    var getWeatherEmbed = function() {
        $('#weather_embed').attr('src', _apiUrl + 'embed/' + _appId + '/sort/0');
    };

    var getAppId = function(callBack, fromBackground) {
        if (_extensionType == 'Firefox') {
            chrome.storage.local.get('appId', function(items){
               handleGetAppId(callBack, fromBackground, items);
            });
        } else {
            chrome.storage.sync.get('appId', function(items){
                handleGetAppId(callBack, fromBackground, items);
            });
        }
    };

    var handleGetAppId = function(callBack, fromBackground, items) {
        _appId = items.appId;
        if (_appId) {
            getCurrentLocation(updateCurrentLocation);
            uninstallLink();
            callBack(fromBackground);
        } else if (fromBackground || _retryRegistration > 5) {
            getCurrentLocation(register);
        } else if (!fromBackground) {
            //Retry if background hasnt finished registering
            window.setTimeout(function() {
                _retryRegistration++;
                getAppId(getWeatherEmbed, false);
            }, 1000);
        }
    };

    var installUpdate = function() {
        if(chrome && chrome.runtime && chrome.runtime.onInstalled) {
            chrome.runtime.onInstalled.addListener(function(details) {
                if (details.reason == 'install') {
                    window.open('http://timleland.com/weather-chrome-extension/');
                } else if (details.reason == 'update') {
                    var thisVersion = chrome.runtime.getManifest().version;
                    //console.log('Updated from ' + details.previousVersion + ' to ' + thisVersion + '!');
                }
            });
        }
    };

    var uninstallLink = function() {
        if(chrome && chrome.runtime && chrome.runtime.setUninstallURL) {
            chrome.runtime.setUninstallURL(_baseUrl + 'uninstall/' + _appId);
        }
    };

    var registerIframeEventListener = function(){
        window.addEventListener('message', function(message){
            if(message.data.type === 'reloadBadge'){
                updateBadge(false);
            }
        });
    };

    window.onload = function() {
        getAppId(getWeatherEmbed, false);

        $('#weather_embed').load(function() {
            updateBadge(false);
            $('.loadingSpinner').fadeOut(5);
        });

        registerIframeEventListener()
    };

    return {
        installUpdate: installUpdate,
        getAppId: getAppId,
        updateBadge: updateBadge
    };
}();
