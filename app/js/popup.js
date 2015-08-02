var weatherIcons = {
    'clear-day': '<i class="wi wi-day-sunny"></i>',
    'clear-night': '<i class="wi wi-night-clear"></i>',
    'rain': '<i class="wi wi-showers"></i>',
    'snow': '<i class="wi wi-snow"></i>',
    'sleet': '<i class="wi wi-sleet"></i>',
    'wind': '<i class="wi wi-windy"></i>',
    'fog': '<i class="wi wi-fog"></i>',
    'cloudy': '<i class="wi wi-cloudy"></i>',
    'partly-cloudy-day': '<i class="wi wi-day-cloudy"></i>',
    'partly-cloudy-night': '<i class="wi wi-night-cloudy"></i>',
    'hail': '<i class="wi wi-hail"></i>',
    'thunderstorm': '<i class="wi wi-thunderstorm"></i>',
    'tornado': '<i class="wi wi-tornado"></i>'
};

var apikeys = [];

var getWeatherRetry = 0;

var roundTwoDecimals = function(number) {
    return parseFloat(number).toFixed(2)
};

var getLocation = function() {
    var zipcode = localStorage.getItem('zipcode');
    var savedCoords = {};
    savedCoords.latitude = localStorage.getItem('latitude');
    savedCoords.longitude = localStorage.getItem('longitude');

    if (zipcode) {
        getLocationFromZipcode(zipcode);
    } else if (savedCoords.latitude && savedCoords.longitude) {
        getForecast(savedCoords, false)
        getCityState(savedCoords);
    } else {
        navigator.geolocation.getCurrentPosition(function(location) {
            processCoordinates(location.coords);
        });
    }
};

var getLocationFromZipcode = function(zipcode) {
    var locationUrl = 'http://maps.googleapis.com/maps/api/geocode/json?address=postal_code:' + zipcode;
    $.get(locationUrl, function(data) {
        var coords = {};
        if (data.status != 'ZERO_RESULTS') {
            coords.latitude = data.results[0].geometry.location.lat;
            coords.longitude = data.results[0].geometry.location.lng;
            processCoordinates(coords);
        } else {
            clearLocationData();
            $('.zipcode').val('Location not found!');
            getLocation();
        }
    });
};

var processCoordinates = function(coords) {
    localStorage.setItem('latitude', coords.latitude);
    localStorage.setItem('longitude', coords.longitude);
    //Removed to reduce api calls
    getForecast(coords, false);
    getCityState(coords);
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
        $('.current .location').text(city + (state ? ', ' + state : ''))
    });
};

var getForecast = function(coords, fromBackground) {
    var randomApiKey = apikeys[Math.floor(Math.random() * apikeys.length)]
    var weatherUrl = 'https://api.forecast.io/forecast/' + randomApiKey + '/' + coords.latitude + ',' + coords.longitude;

    $.get(weatherUrl, function(data) {
        console.log(data);
        if (!fromBackground) {
            displayForcast(data.daily);
            displayCurrent(data.currently);
            displayHourly(data.hourly);
            displayAlerts(data.alerts);
        }

        updateBadge(data.currently.temperature);
    }).fail(function() {
        _gaq.push(['_trackEvent', 'Key Failed', randomApiKey]);
        if (getWeatherRetry < 3) {
            getWeatherRetry++;
            setTimeout(function() {
                getLocation();
            }, 1000);
        } else {
            _gaq.push(['_trackEvent', 'Failed Multiple Times', 'Last Key: ' + randomApiKey]);
            alert('Something went wrong. Please try again.')
        }
    });
};

var updateBadge = function(temp) {
    chrome.browserAction.setBadgeText({
        text: convertTemp(temp).toString() //+ '°'
    });
};

var displayForcast = function(daily) {
    for (i = 1; i <= 5; i++) {
        var daySection = $('#day' + i);
        daySection.find('.dow').text(moment.unix(daily.data[i].time).format('ddd'));
        daySection.find('.high').html(convertTemp(daily.data[i].temperatureMax) + '&deg;');
        daySection.find('.low').html(convertTemp(daily.data[i].temperatureMin) + '&deg;');
        daySection.find('.icon').html(weatherIcons[daily.data[i].icon]);
        daySection.find('.rainChance').html(Math.round((daily.data[i].precipProbability * 100)) + '%');
    }
};

var displayHourly = function(hourly) {
    $('#hourlySummary').text(hourly.summary);
    var timeScale = localStorage.getItem('timeScale');
    var timeFormat = (timeScale == '24h' ? 'HH' : 'hA');

    for (i = 1; i <= 8; i++) {
        var hourSection = $('#hour' + i);
        hourSection.find('.time').text(moment.unix(hourly.data[i].time).format(timeFormat));
        hourSection.find('.temp').html(convertTemp(hourly.data[i].temperature) + '&#176;');
        hourSection.find('.icon').html(weatherIcons[hourly.data[i].icon]);
        hourSection.find('.rainChance').html(Math.round((hourly.data[i].precipProbability * 100)) + '%');
    }
};

var displayCurrent = function(currently) {
    var currentSection = $('.current');
    currentSection.find('.summary').text(currently.summary);
    currentSection.find('.right .currentIcon').html(weatherIcons[currently.icon]);
    currentSection.find('.temperature').html(convertTemp(currently.temperature) + '&#176;');
};

var displayAlerts = function(alerts) {
    if (alerts) {
        $('#alerts').html('');
        alerts.forEach(function(alert) {
            $('#alerts').append('<li><a target="_blank" href="' + alert.uri + '">' + alert.title + '</a></li>')
        });
    }
};

var saveZipCode = function(zipcode) {
    if (zipcode == '') {
        clearLocationData();
    } else {
        localStorage.setItem('zipcode', zipcode);
    }
    getLocation();
};

var clearLocationData = function() {
    localStorage.removeItem('zipcode');
    localStorage.removeItem('latitude');
    localStorage.removeItem('longitude');
    $('.location').html('<i class="fa fa-refresh fa-spin"></i>')
};

var bindActions = function() {
    //Set hidden zipcode value
    $('.zipcode').val(localStorage.getItem('zipcode'));

    $('.location').click(function() {
        $(this).hide();
        $('.zipcode').show().select();
    });

    $('.zipcode').keydown(function(e) {
        if (e.keyCode == 13) {
            var zipcode = $(this).val();
            saveZipCode(zipcode);
            $(this).hide();
            $('.location').show();
        }
    });

    $('#zipcodeLink').click(function() {
        $('.location').click();
    });

    $('#tempScale').click(function() {
        var tempScale = localStorage.getItem('tempScale');
        if (tempScale == 'Celsius') {
            localStorage.setItem('tempScale', 'Fahrenheit');
        } else {
            localStorage.setItem('tempScale', 'Celsius');
        }
        updateSettingsText();
        //Refresh temp
        getLocation();
    });

    $('#timeScale').click(function() {
        var timeScale = localStorage.getItem('timeScale');
        if (timeScale == '24h') {
            localStorage.setItem('timeScale', '12h');
        } else {
            localStorage.setItem('timeScale', '24h');
        }
        updateSettingsText();
        //Refresh temp
        getLocation();
    });

    $('.summary, .currentIcon, .temperature, .hourly, .forecast').click(function(){
        var latitude = localStorage.getItem('latitude');
        var longitude = localStorage.getItem('longitude');
        window.open('http://forecast.io/#/f/' + latitude + ',' + longitude);
    });
};

var updateSettingsText = function() {
    var tempScale = localStorage.getItem('tempScale');
    if (tempScale == 'Celsius') {
        $('#tempScale').text('Use Fahrenheit');
    } else {
        $('#tempScale').text('Use Celsius');
    }

    var timeScale = localStorage.getItem('timeScale');
    if (timeScale == '24h') {
        $('#timeScale').text('Use 12h Time');
    } else {
        $('#timeScale').text('Use 24h Time');
    }
};

var convertTemp = function(tempValue) {
    var tempScale = localStorage.getItem('tempScale');
    if (tempScale == 'Celsius') {
        tempValue = (tempValue - 32) * (5 / 9);
    }

    return Math.round(tempValue);
};

var installUpdate = function() {
    chrome.runtime.onInstalled.addListener(function(details) {
        if (details.reason == "install") {
             window.open('http://timleland.com/weather-chrome-extension/');
        } else if (details.reason == "update") {
            var thisVersion = chrome.runtime.getManifest().version;
            console.log("Updated from " + details.previousVersion + " to " + thisVersion + "!");
        }
    });
};

window.onload = function() {
    _gaq.push(['_trackEvent', 'Extension Opened', 'clicked']);

    updateSettingsText();
    getLocation();
    bindActions();
};
