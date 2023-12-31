const recap = JSON.parse(localStorage.getItem('recap'));
const longest = recap.bestActivities.longest;
const parser = new DOMParser();

document.querySelector('#longest-activity #distance .number-xxl').innerHTML = (longest.distance/1000).toFixed(1)
fetch(sportIcons[longest.sport_type])
.then(response => response.text())
.then((data) => {
    const doc = parser.parseFromString(data, 'text/html');
    const element = doc.body.firstChild;
    document.querySelector('#longest-activity #average svg').replaceWith(element);
    document.querySelector('#longest-activity #average svg').style.fill = 'white';

})
const average = recap.totals2023[longest.sport_type].distance/recap.totals2023[longest.sport_type].count;
document.querySelector('#longest-activity #average .number-sm').innerHTML = ((longest.distance/average)*100).toFixed(0).toString(10);
const startDate = new Date(longest.start_date)
document.querySelector('#longest-activity #activity #schedules #date').innerHTML = startDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
document.querySelector('#longest-activity #activity #schedules #hour').innerHTML = startDate.toLocaleTimeString();
document.querySelector('#longest-activity #activity #name').innerHTML = longest.name;

if('photos' in longest && longest.photos.count > 0){
    document.querySelector('#longest-activity #map').insertAdjacentHTML('beforeend', `<img src="${longest.photos.primary.urls[600]}">`)
}

//TODO : si pas de photos trouver comment afficher la carte