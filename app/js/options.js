APP.options = function() {

    var setPageUrl = function() {
        chrome.storage.sync.get('appId', function(items) {
            if (items.appId) {
                $('#options_embed').attr('src', _apiUrl + 'settings/' + items.appId);
            }
        });
    };

    window.onload = function() {
        setPageUrl();
        $('#options_embed').load(function() {
            $('.loadingSpinner').fadeOut(5);
        });
    };
}();
