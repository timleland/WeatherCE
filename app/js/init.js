var _baseUrl = 'https://weatherapi.dev/';
//var _baseUrl = 'https://weather.timleland.com/';
var _extensionType = 'Chrome'; //Chrome //Opera //Firefox

if(typeof platform !== 'undefined' && (platform.name == 'Chrome' || platform.name == 'Opera' || platform.name == 'Firefox')){
    _extensionType = platform.name;
}

var _apiUrl = _baseUrl + 'api/v1/';
var APP = {};

APP.common = function () {

    return {
        init: function () {
        }
    };
}();
