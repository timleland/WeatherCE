if (_extensionType != 'Firefox') {
    var _AnalyticsCode = 'UA-64420395-1';

    var _gaq = _gaq || [];
    _gaq.push(['_setAccount', _AnalyticsCode]);
    _gaq.push(['_trackPageview']);

    (function() {
        var ga = document.createElement('script');
        ga.type = 'text/javascript';
        ga.async = true;
        ga.src = 'https://ssl.google-analytics.com/ga.js';
        var s = document.getElementsByTagName('script')[0];
        s.parentNode.insertBefore(ga, s);

        // Track basic JavaScript errors
        window.addEventListener('error', function(e) {
            _gaq.push([
                '_trackEvent',
                'JavaScript Error',
                e.message,
                e.filename + ':  ' + e.lineno
            ]);
        });

        // Track AJAX errors (jQuery API)
        $(document).ajaxError(function(e, request, settings, thrownError) {
            _gaq.push([
                '_trackEvent',
                'Ajax error',
                settings.url,
                request.statusText + ' - ' + thrownError + ' Response Code: ' + request.status
            ]);
        });
    })();

    function trackLinkClick(e) {
        _gaq.push(['_trackEvent', e.target.id, 'clicked']);
    }

    document.addEventListener('DOMContentLoaded', function() {
        var links = document.querySelectorAll('a');
        for (var i = 0; i < links.length; i++) {
            links[i].addEventListener('click', trackLinkClick);
        }
    });
}
