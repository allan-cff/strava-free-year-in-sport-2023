const recap = JSON.parse(localStorage.getItem('recap'));

document.querySelector(`.number-xxl`).innerHTML = recap.daysActive.reduce((sum, current) => sum + current.length, 0);

const months = ['janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin', 'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'];
const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const languages = JSON.parse(localStorage.getItem('sport-languages'))

let streak = 0;
let maxStreak = 0;
for(let i = 0; i < 12; i++){
    const monthDiv = document.querySelector(`body main .calendar .year #${months[i]} .days`);
    for(let day = 1; day <= daysInMonth[i]; day++){
        if(recap.daysActive[i].find(date => date === day)){
            monthDiv.insertAdjacentHTML('beforeend', '<div class="active-day"></div>');
            streak++;
            if(streak > maxStreak){
                maxStreak = streak;
            }
        } else {
            monthDiv.insertAdjacentHTML('beforeend', '<div class="rest-day"></div>');
            streak = 0;
        }
    }
}

document.querySelector('.streak .serie-phrase .number-md').innerHTML = maxStreak;