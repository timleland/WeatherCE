window.addEventListener('error', function (e, url) {
    var eleArray = ['IMG', 'SCRIPT', 'LINK'];

    var ele = e.target;
    if(eleArray.indexOf(ele.tagName) != -1){
        var url = ele.tagName == 'LINK' ? ele.href: ele.src;
        console.log('Failed to load:' + url);
        document.body.innerHTML = '<div class="failedToLoad"><h2>Whoops!</h2><p>Please verify you are connected to the internet' +
        ' and can browse to <a href="https://weather.timleland.com/" target="_blank">weather.timleland.com</a></p>' +
        '<p>Please email this issue to weather@timleland.com</p>' +
        '<p>Failed to load: ' + url + '</p></div>';
    }
}, true);
