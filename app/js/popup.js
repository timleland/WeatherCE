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
    } else {
        if (savedCoords.latitude && savedCoords.longitude) {
            getForecast(savedCoords, false)
            getCityState(savedCoords);
        }
        navigator.geolocation.getCurrentPosition(function(location) {
            processCoordinates(location.coords);
        });
    }
};

var getLocationFromZipcode = function(zipcode) {
    var locationUrl = 'http://maps.googleapis.com/maps/api/geocode/json?address=postal_code:' + zipcode;
    $.get(locationUrl, function(data) {
        var coords = {};
        if(data.status != 'ZERO_RESULTS'){
            coords.latitude = data.results[0].geometry.location.lat;
            coords.longitude = data.results[0].geometry.location.lng;
            processCoordinates(coords);
        }else{
            clearLocationData();
            $('.zipcode').val('Location not found!');
            getLocation();
        }
    });
};

var processCoordinates = function(coords) {
    localStorage.setItem('latitude', coords.latitude);
    localStorage.setItem('longitude', coords.longitude);
    getForecast(coords, false);
    getCityState(coords);
};

var getCityState = function(coords) {
    var locationUrl = 'http://maps.googleapis.com/maps/api/geocode/json?sensor=true&latlng=' + coords.latitude + ',' + coords.longitude;
    $.get(locationUrl, function(data) {
        var state, city;
        //http://www.raymondcamden.com/2013/03/05/Simple-Reverse-Geocoding-Example
        var result = data.results[0];
        for (var i = 0, len = result.address_components.length; i < len; i++) {
            var ac = result.address_components[i];
            if (ac.types.indexOf("locality") >= 0) city = ac.long_name;
            if (ac.types.indexOf("administrative_area_level_1") >= 0) state = ac.short_name;
        }
        //http://stackoverflow.com/questions/6797569/get-city-name-using-geolocation
        //var results = data.results;
        // for (var i=0; i<results[0].address_components.length; i++) {
        //     for (var b=0;b<results[0].address_components[i].types.length;b++) {
        //         if (results[0].address_components[i].types[b] == "locality") {
        //             city = results[0].address_components[i].short_name;
        //             break;
        //         }
        //     }
        // }
        //
        // for (var i=0; i<results[0].address_components.length; i++) {
        //     for (var b=0;b<results[0].address_components[i].types.length;b++) {
        //         if (results[0].address_components[i].types[b] == "administrative_area_level_1") {
        //             state = results[0].address_components[i].short_name;
        //             break;
        //         }
        //     }
        // }

        $('.current .location').text(city + ', ' + state)
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
            //displayCurrentOther(data);
        }

        updateBadge(data.currently.temperature);
    });
};

var updateBadge = function(temp) {
    chrome.browserAction.setBadgeText({
        text: convertTemp(temp).toString()
    });
    //+ '°'
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

    for (i = 1; i <= 8; i++) {
        var hourSection = $('#hour' + i);
        hourSection.find('.time').text(moment.unix(hourly.data[i].time).format('hA'));
        hourSection.find('.temp').html(convertTemp(hourly.data[i].temperature) + '&#176;');
        hourSection.find('.icon').html(weatherIcons[hourly.data[i].icon]);
        hourSection.find('.rainChance').html(Math.round((hourly.data[i].precipProbability * 100)) + '%');
    }
};

var displayCurrent = function(currently) {
    var currentSection = $('.current');
    currentSection.find('.summary').text(currently.summary);
    currentSection.find('.right .currentIcon').html(weatherIcons[currently.icon]);
    currentSection.find('.temperature').html(convertTemp(currently.temperature) + '&deg;');
};

var saveZipCode = function(zipcode) {
    if (zipcode == '') {
        clearLocationData();
    } else {
        localStorage.setItem('zipcode', zipcode);
    }
    getLocation();
};

var clearLocationData = function(){
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
        //Allow backspace and delete keys
        //if (e.keyCode == 8 || e.keyCode == 46) {
        //    return true;
        //}
        //If enter, then save zipcode and load location
        if (e.keyCode == 13) {
            var zipcode = $(this).val();
            //var isValidZip = /(^\d{5}$)|(^\d{5}-\d{4}$)/.test(zipcode);
            //if (isValidZip || zipcode == '') {
                saveZipCode(zipcode);
                $(this).hide();
                $('.location').show();
            //}
        }

        //var test = /[0-9]/; //regex
        //var value = String.fromCharCode(e.keyCode); //get the charcode and convert to char
        //if (!value.match(test)) {
            //return false; //dont display key if it is a number
        //}
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
        updateTempScaleText();
        //Refresh temp
        getLocation();
    });
};

var updateTempScaleText = function(){
    var tempScale = localStorage.getItem('tempScale');
    if (tempScale == 'Celsius') {
        $('#tempScale').text('Use Fahrenheit');
    } else {
        $('#tempScale').text('Use Celsius');
    }
};

var convertTemp = function(tempValue) {
    var tempScale = localStorage.getItem('tempScale');
    if (tempScale == 'Celsius') {
        tempValue = (tempValue - 32) * (5 / 9);
    }

    return Math.round(tempValue);
};

// var displayCurrentOther = function(data) {
//     var bearing = (data.currently.windBearing / 22.5) + .5;
//     var directions = ["N", "NE", "NE", "NE", "E", "SE", "SE", "SE", "S", "SW", "SW", "SW", "W", "NW", "NW", "NW"]
//     var windDirection = directions[Math.round(bearing % 16)];
//     var currentOther = $('.currentOther');
//     currentOther.find('.wind').html(Math.round(data.currently.windSpeed) + 'mph ' + windDirection);
//
//
//     currentOther.find('.rainChance').text((data.currently.precipProbability * 100) + '%');
// };

window.onload = function() {
    _gaq.push(['_trackEvent', 'Extension Opened', 'clicked']);

    updateTempScaleText();
    getLocation();
    bindActions();
};
