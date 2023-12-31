const recap = JSON.parse(localStorage.getItem('recap'));
const fastest = recap.bestActivities.fastest;
const sports = Object.keys(fastest);
const parser = new DOMParser();

document.querySelector('.sport-1 .speed .nombre-vitesse').innerHTML = (fastest[sports[0]].average_speed*60*60/1000).toFixed(1)
document.querySelector('.sport-1 .activity-description .nom-sortie').innerHTML = fastest[sports[0]].name
const startDate = new Date(fastest[sports[0]].start_date)
document.querySelector('.sport-1 .activity-description .date').innerHTML = startDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
document.querySelector('.sport-1 .activity-description .heure').innerHTML = startDate.toLocaleTimeString();
fetch(sportIcons[sports[0]])
.then(response => response.text())
.then((data) => {
    const doc = parser.parseFromString(data, 'text/html');
    const doc1 = parser.parseFromString(data, 'text/html');
    const element = doc.body.firstChild;
    const element1 = doc1.body.firstChild;
    document.querySelector('.sport-1 .activity-description svg').replaceWith(element);
    document.querySelector('.average .sport-1-average .stats-average svg').replaceWith(element1);
    document.querySelector('.sport-1 .activity-description svg').style.fill = 'white';
    document.querySelector('.average .sport-1-average .stats-average svg').style.fill = 'white';

})
document.querySelector('.average .sport-1-average .number-md').innerHTML = (recap.totals2023[sports[0]].distance/recap.totals2023[sports[0]].count/1000).toFixed(2)

document.querySelector('.sport-2 .speed .nombre-vitesse').innerHTML = (fastest[sports[1]].average_speed*60*60/1000).toFixed(1)
document.querySelector('.sport-2 .activity-description .nom-sortie').innerHTML = fastest[sports[1]].name
const startDate2 = new Date(fastest[sports[1]].start_date)
document.querySelector('.sport-2 .activity-description .date').innerHTML = startDate2.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
document.querySelector('.sport-2 .activity-description .heure').innerHTML = startDate2.toLocaleTimeString();
fetch(sportIcons[sports[1]])
.then(response => response.text())
.then((data) => {
    const doc = parser.parseFromString(data, 'text/html');
    const doc1 = parser.parseFromString(data, 'text/html');
    const element = doc.body.firstChild;
    const element1 = doc1.body.firstChild;
    document.querySelector('.sport-2 .activity-description svg').replaceWith(element);
    document.querySelector('.average .sport-2-average .stats-average svg').replaceWith(element1);
    document.querySelector('.sport-2 .activity-description svg').style.fill = 'white';
    document.querySelector('.average .sport-2-average .stats-average svg').style.fill = 'white';
})
document.querySelector('.average .sport-2-average .number-md').innerHTML = (recap.totals2023[sports[1]].distance/recap.totals2023[sports[1]].count/1000).toFixed(2)



