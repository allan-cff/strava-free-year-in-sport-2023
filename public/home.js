let url = new URL(location.href);
if(url.searchParams.has('access')){
    fetch(`/stats?access=${url.searchParams.get('access')}`, {
        method: 'GET'
    }).then(response => {
        if(response.status === 200){
            response.json().then(res => {
                localStorage.setItem('recap', JSON.stringify(res));    
                document.querySelector('.pseudo').innerHTML = res.athlete.firstname + ' ' + res.athlete.lastname
                document.querySelector('#profil-picture').setAttribute('src', res.athlete.image);
            });
        } else {
            window.location = 'login.html';
        }
    })
} else {
    window.location = 'login.html';
}