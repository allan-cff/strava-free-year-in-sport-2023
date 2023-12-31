const recap = JSON.parse(localStorage.getItem('recap'));
const pictures = recap.bestPictures;

let frames = ['first', 'second', 'third'];
for(let i=0; i<3; i++){
    document.querySelector(`#best-pictures #${frames[i]} .pictures-photo`).setAttribute('src', pictures[i].photos.primary.urls[600])
    document.querySelector(`#best-pictures #${frames[i]} .pictures-info .pictures-name .number-sm`).innerHTML = pictures[i].name;
    let startDate = new Date(pictures[i].start_date)
    document.querySelector(`#best-pictures #${frames[i]} .pictures-info .pictures-schedules .number-sm:nth-child(1)`).innerHTML = startDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
    document.querySelector(`#best-pictures #${frames[i]} .pictures-info .pictures-schedules .number-sm:nth-child(2)`).innerHTML = startDate.toLocaleTimeString();
}