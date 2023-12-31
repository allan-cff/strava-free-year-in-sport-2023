function getAuthorizationCode(){
    fetch(`/authorization?redirect_uri=${location.origin}`, {
        method: 'GET'
    }).then(response => {
        if(response.status === 200){
            response.json().then(async res => {
                document.querySelector('#accountAuthButton').setAttribute('href', res.url);
            });
        }
    })
}

document.querySelector('#conditions').addEventListener('click', () => {
    document.querySelector('#accountAuthButton').style.visibility = "visible"
})

if('token' in localStorage){
    window.location = 'index.html'
} else {
    getAuthorizationCode()
}