APP.BACKGROUND = function() {

    chrome.alarms.onAlarm.addListener(function(alarm) {
        if (alarm.name == 'updateTemp') {
            updateBadgeTemp();
        }
    });

    var updateBadgeTemp = function() {
        var coords = {};
        coords.latitude = localStorage.getItem('latitude');
        coords.longitude = localStorage.getItem('longitude');
        if (coords.latitude && coords.longitude) {
            getForecast(coords);
        }
    };

    return {
        init: function() {},
    };
}();

window.onload = function() {
    //Update on load
    // updateBadgeTemp();
    // chrome.alarms.clear('updateTemp');
    // chrome.alarms.create('updateTemp', {
    //     periodInMinutes: 60
    // });
    //
    // installUpdate();
};
