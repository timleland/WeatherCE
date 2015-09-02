APP.background = function() {

    chrome.alarms.onAlarm.addListener(function(alarm) {
        if (alarm.name == 'updateBadge') {
            APP.popup.getAppId(APP.popup.updateBadge);
        }
    });

    window.onload = function() {
        APP.popup.getAppId(APP.popup.updateBadge, true);
        chrome.alarms.clear('updateBadge');
        chrome.alarms.create('updateBadge', {
            periodInMinutes: 30
        });

        APP.popup.installUpdate();
    };

    return {
        init: function() {},
    };
}();
