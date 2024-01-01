if (window.screen.width > 640) {
    if(window.location.pathname === '/index.html' || window.location.pathname === '/'){
        document.querySelector('#bad-device').style.display = 'flex';
        document.querySelector('.presentation').style.display = 'none';
        document.querySelector('header').style.display = 'none';
        document.querySelector('body').style.backgroundImage = 'none';
    } else {
        window.location = '/index.html';
    }
}

if(!('recap' in localStorage) && window.location.pathname !== '/index.html' && window.location.pathname !== '/' && window.location.pathname !== '/home.html'){
    window.location = '/index.html';
}