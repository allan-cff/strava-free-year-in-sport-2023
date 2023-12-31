function getRecap(access){ // TODO : récupérer dans l'URL
    fetch(`/stats?access=${access}`, {
        method: 'GET'
    }).then(response => {
        if(response.status === 200){
            response.json().then(res => {
                console.log(res);
                localStorage.setItem('recap', JSON.stringify(res));                          
            });
        }
    })
}

function prepareRecap(token){
    fetch(`/process?token=${token}`, {
        method: 'GET'
    }).then(response => {
        if(response.status === 200){
            console.log("Préparation du récap en cours");
        }
    })
}

function getAuthorizationCode(){
    fetch(`/authorization?redirect_uri=${location.href}`, {
        method: 'GET'
    }).then(response => {
        if(response.status === 200){
            response.json().then(async res => {
                console.log(res.url)
                //TODO : AFFICHER BOUTON CONNEXION STRAVA
            });
        }
    })
}

async function getUserToken(code){
    let response = await fetch(`/token?code=${code}`, {
        method: 'GET'
    })
    if(response.status === 200){
        let res = await response.json()
        return res;
    }
}

async function refreshUserToken(token){
    let response = await fetch(`/refresh?token=${token}`, {
        method: 'GET'
    })
    if(response.status === 200){
        let res = await response.json()
        return res;
    }
}

async function getUserProfile(token){
    const response = await fetch(`/profile?token=${token}`, {
        method: 'GET'
    });
    if(response.status === 200){
        const res = await response.json()
        //TODO : AFFICHER PROFIL + BOUTON LISTE ATTENTE CHARGEMENT DONNEES
        return res;
    }
}

let url = new URL(location.href);
if('token' in localStorage){
    getUserProfile(localStorage.getItem('token')).then(result => {
        if('token' in result){
            localStorage.setItem('token', result.token);
        }
        console.log(result);
    })
} else {
    if(url.searchParams.has('code') && url.searchParams.has('scope')){
        let code = url.searchParams.get('code');
        getUserToken(code).then(res => {
            console.log(res)
            localStorage.setItem('token', res.token);
            getUserProfile(res.token).then(result => {
                console.log(result);
            })
        })
    } else {
        getAuthorizationCode()
    }
}