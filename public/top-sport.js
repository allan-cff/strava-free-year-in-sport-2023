const recap = JSON.parse(localStorage.getItem('recap'));
const sportsDuration = recap.sportsDuration;
const orderedSports = Object.keys(sportsDuration).sort((a,b) => sportsDuration[b] - sportsDuration[a])
const parser = new DOMParser();

fetch('/images/track.svg')
.then(response => response.text())
.then((data) => {
    const doc = parser.parseFromString(data, 'text/html');
    const element = doc.body.firstChild;
    document.querySelector(`#top-sports svg#track`).replaceWith(element);
    document.querySelector(`#top-sports svg`).setAttribute('id', 'track');
})

document.querySelector('#best-sport .number-md').innerHTML = sportLanguages.fr[orderedSports[0]];
for(let i = 0; i < 5; i++){
    fetch(sportIcons[orderedSports[i]])
    .then(response => response.text())
    .then((data) => {
        const doc = parser.parseFromString(data, 'text/html');
        const element = doc.body.firstChild;
        document.querySelector(`#top-sports #sports div:nth-child(${i+1}) svg`).replaceWith(element);
        document.querySelector(`#top-sports #sports div:nth-child(${i+1}) svg`).style.fill = 'white';
    })
    let percentage = (sportsDuration[orderedSports[i]]/60/60 / recap.totals2023.total.hours) * 100;
    document.querySelector(`#top-sports #sports div:nth-child(${i+1}) p.number-sm`).innerHTML = percentage.toFixed(0).toString(10) + '%'
}