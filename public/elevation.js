const recap = JSON.parse(localStorage.getItem('recap'));
const elevationByMonth = recap.totals2023.byMonth.map(e => e.total.climb)

function getBestMonth(elevationByMonth){
    maxMonth = 0;
    for(let i = 0; i < 12; i++){
        if(elevationByMonth[i] > elevationByMonth[maxMonth]){
            maxMonth = i;
        }
    }
    return maxMonth;
}

const bestMonthId = getBestMonth(elevationByMonth);
document.querySelector('#total .number-xl').innerHTML = recap.totals2023.total.climb.toFixed(0).toString(10);
const bestMonthElems = document.querySelectorAll(`#chart>div>p:nth-child(${bestMonthId+1})`);
bestMonthElems.forEach(e => e.classList.add("max"));
for(let i = 0; i < 12; i++){
    document.querySelector(`#chart div#meters p:nth-child(${i+1})`).innerHTML = elevationByMonth[i].toFixed(0) + ' M'
    let percentage = (elevationByMonth[i] / elevationByMonth[bestMonthId]);
    document.querySelector(`#chart div#triangles div:nth-child(${i+1}) img`).style.height = `${percentage*32}vh`;
}