const recap = JSON.parse(localStorage.getItem('recap'));
const distanceByMonth = recap.totals2023.byMonth.map(e => e.total.distance/1000)

function getBestMonth(distanceByMonth){
    maxMonth = 0;
    for(let i = 0; i < 12; i++){
        if(distanceByMonth[i] > distanceByMonth[maxMonth]){
            maxMonth = i;
        }
    }
    return maxMonth;
}

const bestMonthId = getBestMonth(distanceByMonth);
document.querySelector('.total-number .number-xxl').innerHTML = (recap.totals2023.total.distance/1000).toFixed(0).toString(10);
const bestMonthElem = document.querySelector(`#year div.month:nth-child(${bestMonthId+1})`);
bestMonthElem.classList.add("max-month");
for(let i = 0; i < 12; i++){
    document.querySelector(`#year div.month:nth-child(${i+1}) .distance`).innerHTML = distanceByMonth[i].toFixed(0) + 'KM'
    let percentage = (distanceByMonth[i] / distanceByMonth[bestMonthId])*100;
    document.querySelector(`#year div.month:nth-child(${i+1}) .bar .rectangle`).style.width = `${percentage}%`;
}