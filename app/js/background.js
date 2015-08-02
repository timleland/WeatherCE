chrome.alarms.onAlarm.addListener(function(alarm) {
    if (alarm.name == 'updateTemp') {
        var coords = {};
        coords.latitude = localStorage.getItem('latitude');
        coords.longitude = localStorage.getItem('longitude');
        if (coords.latitude && coords.longitude) {
            getForecast(coords, true);
        }
    };
});



window.onload = function() {
    chrome.alarms.clear('updateTemp');
    chrome.alarms.create('updateTemp', {
        periodInMinutes: 60
    });

    installUpdate();
};
