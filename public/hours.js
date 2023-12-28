const recap = JSON.parse(localStorage.getItem('recap'));

function getBestMonth(hoursByMonth){
    maxMonth = 0;
    for(let i = 0; i < 12; i++){
        if(hoursByMonth[i] > hoursByMonth[maxMonth]){
            maxMonth = i;
        }
    }
    return maxMonth;
}

const bestMonthId = getBestMonth(recap.hoursByMonth);
document.querySelector('#total-hours .number-xl').innerHTML = recap.totals2023.total.hours.toFixed(0).toString(10) + 'H';
document.querySelector('#comp-21 h2:nth-child(2)').innerHTML = recap.totals2022.total.hours.toFixed(0).toString(10) + 'H';
const bestMonthElem = document.querySelector(`#calendar div:nth-child(${bestMonthId + 1}) div.progress-bar`);
bestMonthElem.classList.add("best-month");
for(let i = 0; i < 12; i++){
    document.querySelector(`#calendar div:nth-child(${i+1}) p.value`).innerHTML = recap.hoursByMonth[i].toFixed(0) + 'H'
    if(i !==  bestMonthId){
        let percentage = (recap.hoursByMonth[i] / recap.hoursByMonth[bestMonthId]) * 100;
        document.querySelector(`#calendar div:nth-child(${i+1}) div.progress-bar`).style.background = `radial-gradient(closest-side, black 79%, transparent 80% 100%),conic-gradient(white ${percentage}%, transparent 0)`
        document.querySelector(`#calendar div:nth-child(${i+1}) div.progress-bar`).setAttribute('aria-valuenow', percentage)
    }
}