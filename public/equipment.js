const recap = JSON.parse(localStorage.getItem('recap'));
const equipment = recap.bestEquipments

if(equipment.ride !== null){
    document.querySelector('#bike .kilometers .distance .number-md').innerHTML = (equipment.ride.year_distance/1000).toFixed(1);
    document.querySelector('#bike .info .name').innerHTML = equipment.ride.name;
    document.querySelector('#bike .info .modele').innerHTML = equipment.ride.model_name;
    document.querySelector('#bike .info .hours').innerHTML = `Vous avez passé ${equipment.ride.year_hours.toFixed(1)}h en compagnie de ${equipment.ride.nickname} cette année.`;
}

if(equipment.run !== null){
    document.querySelector('#run .kilometers .distance .number-md').innerHTML = (equipment.run.year_distance/1000).toFixed(1);
    document.querySelector('#run .info .name').innerHTML = equipment.run.name;
    document.querySelector('#run .info .modele').innerHTML = equipment.run.model_name;
    document.querySelector('#run .info .hours').innerHTML = `Vous avez passé ${equipment.run.year_hours.toFixed(1)}h en compagnie de ${equipment.run.nickname} cette année.`;
}

document.querySelector('#average-heart').innerHTML = (recap.totals2023.heartrate.total/recap.totals2023.heartrate.count).toFixed(1)
document.querySelector('#max #triangle-max .number-md').innerHTML = recap.bestActivities.highestHeartRate.average_heartrate
document.querySelector('#max #activity-max p:nth-child(1)').innerHTML = recap.bestActivities.highestHeartRate.name
let startDate = new Date(recap.bestActivities.highestHeartRate.start_date)
document.querySelector('#max #activity-max p:nth-child(2)').innerHTML = startDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });