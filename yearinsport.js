function sortByKudos(activities){
    activities.sort((a, b) => {
        if(b.kudos_count === a.kudos_count){
            return b.comment_count - a.comment_count;
        }
        return b.kudos_count - a.kudos_count;
    });
    return activities;
}

function getMostKudoed(activities){
    return sortByKudos(activities)[0]._id;
}

function getMostKudoedPicturesActivitiesId(activities, limit=4, pictureByActivity=1){
    const sortedActivities = sortByKudos(activities);
    let counter = 0;
    const result = [];
    for(const activity of sortedActivities){
        if(activity.total_photo_count > 0 && counter < limit){
            counter += Math.min(activity.total_photo_count, pictureByActivity);
            result.push(activity._id);
        }
        if(counter >= limit){
            break;
        }
    }
    return result;
}

function getTotals(activities, byMonth=true){
    const totals = {
        total : {
            climb : 0,
            distance : 0,
            hours : 0,
            pr: 0,
            kudos : 0,
            count : 0
        },
        heartrate : {
            total : 0,
            count : 0,
            max : 0,
            maxId : undefined
        }
    };
    for(const activity of activities){
        if('total_elevation_gain' in activity){
            totals.total.climb += activity.total_elevation_gain;
        }
        if('distance' in activity){
            totals.total.distance += activity.distance;
        }
        if('moving_time' in activity){
            totals.total.hours += activity.moving_time/60/60;
        }
        totals.total.pr += activity.pr_count;
        totals.total.kudos += activity.kudos_count;
        totals.total.count += 1;
        if("average_heartrate" in activity){
            totals.heartrate.count += 1;
            totals.heartrate.total += activity.average_heartrate;
            if(activity.average_heartrate > totals.heartrate.max){
                totals.heartrate.max = activity.average_heartrate;
                totals.heartrate.maxId = activity.id;
            }
        }
        const type = activity.type;
        if(!(type in totals)){
            totals[type] = {};
            if('total_elevation_gain' in activity){
                totals[type].climb = activity.total_elevation_gain;
            }
            if('distance' in activity){
                totals[type].distance = activity.distance;
            }
            if('moving_time' in activity){
                totals[type].hours = activity.moving_time/60/60;
            }
            totals[type].pr = activity.pr_count;
            totals[type].kudos = activity.kudos_count;
            totals[type].count = 1;
        } else {
            if('total_elevation_gain' in activity){
                totals[type].climb += activity.total_elevation_gain;
            }
            if('distance' in activity){
                totals[type].distance += activity.distance;
            }
            if('moving_time' in activity){
                totals[type].hours += activity.moving_time/60/60;
            }
            totals[type].pr += activity.pr_count;
            totals[type].kudos += activity.kudos_count;
            totals[type].count += 1;
        }
    }
    if(byMonth){
        totals.byMonth = []
        for(i=0; i<12; i++){
            const monthActivities = [];
            for(const activity of activities){
                if(new Date(activity.start_date_local).getMonth() === i){
                    monthActivities.push(activity);
                }
            }
            totals.byMonth[i] = getTotals(monthActivities, false)
        }
    }
    return totals;
}

function getSportsDuration(activities){
    const sportDuration = {};
    for(const activity of activities){
        if(sportDuration[activity.sport_type] === undefined){
            sportDuration[activity.sport_type] = activity.moving_time;
        } else {
            sportDuration[activity.sport_type] += activity.moving_time;
        }
    }
    return sportDuration;
}

function getEquipments(activities){
    const equipments = {};
    for(const activity of activities){
        if(activity.gear_id !== null){
            if(activity.gear_id in equipments){
                equipments[activity.gear_id].year_hours += activity.moving_time/60/60;
                equipments[activity.gear_id].year_count += 1;
                equipments[activity.gear_id].year_distance += activity.distance;
            } else {
                equipments[activity.gear_id] = {
                    "sport" : activity.type.toLowerCase(),
                    "year_hours" : activity.moving_time/60/60,
                    "year_count" : 1,
                    "year_distance" : activity.distance,
                    "id" : activity.gear_id
                }
            }
        }
    }
    return equipments;
}

function getBestEquipment(equipments, sportType){
    sportType = sportType.toLowerCase();
    if(Object.values(equipments).length === 0 || Object.values(equipments).length === 1 && Object.values(equipments)[0].sport !== sportType){
        return null;

    }
    const best = Object.values(equipments).reduce((maxValue, currentValue) => {
        if(maxValue === null || maxValue.sport !== sportType){
            if(currentValue.sport === sportType){
                return currentValue;
            }
            return null;
        }
        if(currentValue.sport !== sportType){
            return maxValue;
        }
        if(currentValue.year_hours > maxValue.year_hours){
            return currentValue;
        }
        return maxValue;
    })
    return best;
}

function getDaysActive(activities){
    const daysActive = [];
    for(let i = 0; i < 12; i++){
        daysActive.push([]);
    }
    for(const activity of activities){
        const actDate = new Date(activity.start_date_local);
        if(!(daysActive[actDate.getMonth()].find(date => date === actDate.getDate()))){
            daysActive[actDate.getMonth()].push(actDate.getDate());
        }
    }
    return daysActive;
}

module.exports = {
    sortByKudos: sortByKudos,
    getMostKudoed: getMostKudoed,
    getMostKudoedPicturesActivitiesId: getMostKudoedPicturesActivitiesId,
    getTotals: getTotals,
    getSportsDuration: getSportsDuration,
    getEquipments: getEquipments,
    getBestEquipment: getBestEquipment, 
    getDaysActive: getDaysActive
}