const recap = JSON.parse(localStorage.getItem('recap'));

document.querySelector('#profil-picture').setAttribute('src', recap.athlete.image);
document.querySelector('#pseudo').innerHTML = recap.athlete.firstname + ' ' + recap.athlete.lastname;
document.querySelector('#total-hours .number-md').innerHTML = recap.totals2023.total.hours.toFixed(0);
document.querySelector('#total-distance .number-md').innerHTML = (recap.totals2023.total.distance/1000).toFixed(0);
document.querySelector('#total-elevation .number-md').innerHTML = recap.totals2023.total.climb.toFixed(0);
document.querySelector('#active-days .number-md').innerHTML = recap.daysActive.reduce((sum, current) => sum + current.length, 0);


const sportsDuration = recap.sportsDuration;
const orderedSports = Object.keys(sportsDuration).sort((a,b) => sportsDuration[b] - sportsDuration[a]);
const parser = new DOMParser();
fetch(sportIcons[orderedSports[0]])
.then(response => response.text())
.then((data) => {
    const doc = parser.parseFromString(data, 'text/html');
    const element = doc.body.firstChild;
    document.querySelector(`#top-sport svg`).replaceWith(element);
    document.querySelector(`#top-sport svg`).style.fill = 'white';
})