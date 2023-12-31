async function getUserToken(code){
    let response = await fetch(`/token?code=${code}`, {
        method: 'GET'
    })
    if(response.status === 200){
        let res = await response.json()
        return res;
    }
}

function prepareRecap(token){
    fetch(`/process?token=${token}`, {
        method: 'GET'
    }).then(response => {
        if(response.status === 200){
            response.json().then(res => {
                if('access' in res){
                    window.location = `/home.html?access=${res.access}`;
                }
            })
        } else if(response.status === 429){
            document.querySelector('.presentation p').innerHTML = "Désolé, nous avons atteint la limite de requêtes autorisées par Strava par créneau de 15min.<br>Vous êtes en file d'attente.<br>Nous continuerons à préparer votre récap dès que possible."
        }
    })
}

async function getUserProfile(token){
    const response = await fetch(`/profile?token=${token}`, {
        method: 'GET'
    });
    if(response.status === 200){
        const res = await response.json()
        return res;
    } else {
        localStorage.removeItem('token');
        window.location = 'login.html'
    }
}

document.querySelector('#btn').addEventListener('click', () => {
    prepareRecap(localStorage.getItem('token'));
    document.querySelector('#btn').style.display = 'none';
    document.querySelector('.presentation p').innerHTML = 'Préparation de votre Year In Sport en cours<br>Plus que quelques secondes...'
})

let url = new URL(location.href);
if('token' in localStorage){
    getUserProfile(localStorage.getItem('token'))
    .then(result => {
        if('token' in result){
            localStorage.setItem('token', result.token);
        }
        console.log(result);
    })
    .catch(e => {
        localStorage.removeItem('token');
        window.location = 'login.html';
    })
} else {
    if(url.searchParams.has('code') && url.searchParams.has('scope')){
        let code = url.searchParams.get('code');
        getUserToken(code)
        .then(res => {
            console.log(res)
            localStorage.setItem('token', res.token);
            getUserProfile(res.token).then(result => {
                console.log(result);
            })
        })
    } else {
        window.location = 'login.html';
    }
}