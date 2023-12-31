const recap = JSON.parse(localStorage.getItem('recap'));
const longest = recap.bestActivities.longest;
const parser = new DOMParser();

document.querySelector('#pr #number .number-xxl').innerHTML = recap.totals2023.total.pr;
document.querySelector('#everest .number-xxl').innerHTML = (recap.totals2023.total.climb/8848).toFixed(1).toString(10);
document.querySelector('#kudos #received .number-md').innerHTML = recap.totals2023.total.kudos;
document.querySelector('#kudos #max .number-md').innerHTML = recap.bestActivities.mostKudoed.kudos_count;
document.querySelector('#kudos #max #name').innerHTML = recap.bestActivities.mostKudoed.name;