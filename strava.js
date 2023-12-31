const { MongoClient } = require('mongodb');
const crypto = require('node:crypto');
const {
    sortByKudos,
    getMostKudoed,
    getMostKudoedPicturesActivitiesId,
    getTotals,
    getSportsDuration,
    getEquipments,
    getBestEquipment, 
    getDaysActive,
    getBest,
    getBestActivities
} = require('./yearinsport');

class Strava {
    client_id;
    #client_secret;
    #client;
    database;
    waitlist = [];

    constructor(client_id, client_secret, db_user, db_password, cluster_url){
        this.client_id = client_id;
        this.#client_secret = client_secret;
        this.#client = new MongoClient(`mongodb+srv://${db_user}:${db_password}@${cluster_url}?retryWrites=true&w=majority`);
        this.database = this.#client.db("YearInSport");
    }

    async createAthlete(code){
        const result = await fetch(`https://www.strava.com/oauth/token?client_id=${this.client_id}&client_secret=${this.#client_secret}&code=${code}&grant_type=authorization_code`, {
            method: 'POST'
        })        
        if(result.status === 200){
            const response = await result.json();
            if('athlete' in response){
                const athlete = new Athlete(this, response.athlete.id);
                athlete.setCredentials(response);
                await athlete.setProfile(response.athlete);                
                return athlete;
            }
        }
        //TODO : catch network error + bad codes
    }

    async refreshAthlete(athlete){
        const result = await fetch(`https://www.strava.com/oauth/token?client_id=${this.client_id}&client_secret=${this.#client_secret}&refresh_token=${athlete.refresh_token}&grant_type=refresh_token`, {
            method: 'POST'
        });
        if(result.status === 200){
            const response = await result.json();
            athlete.setCredentials(response);
        }
        //TODO : catch network error + bad codes
    }

    async getAthlete(token){
        const result = await this.database.collection("credentials").findOne({token: token});
        if(result !== null){
            const athlete = new Athlete(this, result._id);
            await athlete.setCredentials({
                'access_token': result.token,
                'refresh_token': result.refresh_token,
                'expires_at': result.expiration/1000
            });
            return athlete;
        } else {
            return null;
        }
    }

    async getStats(access){
        const result = await this.database.collection("stats").findOne({_id: access});
        return result;
    }
}

class Athlete {
    #strava_instance;
    token;
    refresh_token;
    expiration;
    id;
    link;

    constructor(strava, id){
        this.#strava_instance = strava;
        this.id = id;
    }

    async setCredentials(data){
        this.refresh_token = data.refresh_token;
        this.token = data.access_token;
        this.expiration = data.expires_at*1000;
        const credentialsCollection = this.#strava_instance.database.collection("credentials");
        const databaseCredential = await credentialsCollection.findOne({_id: this.id});
        if(databaseCredential === null){
            this.link = crypto.randomUUID()
            await credentialsCollection.insertOne({_id: this.id, token: data.access_token, refresh_token: data.refresh_token, expiration: data.expires_at*1000, link: this.link});
        } else {
            this.link = databaseCredential.link;
            await credentialsCollection.updateOne({ _id: this.id }, {'$set': {token: data.access_token, refresh_token: data.refresh_token, expiration: data.expires_at*1000}});
        }
    }

    async setProfile(data){
        let id = data.id
        delete data['id'];
        const success = await this.#strava_instance.database.collection("athletes").updateOne({ _id: id }, {'$set': data}, {upsert: true});
        if(success){
            this.id = data._id;
        }
    }

    get profile(){
        const profiles = this.#strava_instance.database.collection("athletes");
        return profiles.findOne({'_id': this.id});
    }

    async getDaysActive(){
        let activities = this.getAllActivities()
        const daysActive = [];
        for(let i = 0; i < 12; i++){
            daysActive.push([]);
        }
        for(const activity of activities){
            const actDate = new Date(activity.start_date);
            if(!(daysActive[actDate.getMonth()].find(date => date === actDate.getDate()))){
                daysActive[actDate.getMonth()].push(actDate.getDate());
            }
        }
        res.status(200).json(daysActive);
    }

    async fetchActivities(options = {collection: 'activities', updateAll: false, timezone: 0, startDate: new Date('2023-01-01 00:00:00'), endDate: new Date('2024-01-01 00:00:00')}){
        if(Date.now() > this.expiration){
            await this.#strava_instance.refreshAthlete(this);
        }
        options.timezone = options.timezone || 0;
        options.updateAll = options.updateAll || false;
        options.collection = options.collection || 'activities';
        let timeZoneString;
        if(options.timezone >= 0){
            timeZoneString = `GMT+${options.timezone.toString(10)}`;
        } else {
            timeZoneString = `GMT${options.timezone.toString(10)}`;
        }
        options.startDate = options.startDate || new Date(`2023-01-01 00:00:00 ${timeZoneString}`);
        options.endDate = options.endDate || new Date(`2024-01-01 00:00:00 ${timeZoneString}`);
        const cursor = this.#strava_instance.database.collection(options.collection).find({'athleteId': this.id})
        const prevActivities = await cursor.toArray();
        let endDate = options.endDate;
        if(prevActivities.length !== 0 && !options.updateAll){
            endDate = new Date(prevActivities.sort((a,b) => new Date(a.start_date) - new Date(b.start_date))[0].start_date)
        }
        let startDate = options.startDate;
        const response = await fetch(`https://www.strava.com/api/v3/athlete/activities?before=${endDate.valueOf()/1000}&after=${startDate.valueOf()/1000}&page=1`, {
            headers: {
                'Authorization': `Bearer ${this.token}`
            },
            method: 'GET'
        });
        if(response.status === 401){
            console.log(response);
            //BAD TOKEN
        }
        if(response.status === 429){
            console.log(response);
            //WAITLIST
        }
        if(response.status === 200){
            const res = await response.json();
            let newActivities = []
            for(const activity of res){
                delete Object.assign(activity, { 'athleteId': activity.athlete.id })['athlete'];
                Object.assign(res, {'detailled': false});
                delete Object.assign(activity, { '_id': activity.id })['id'];
                if(!options.updateAll){
                    if(!(prevActivities.find(a => a._id === activity.id))){  // checking for no doubles (page refresh for example)
                        newActivities.push({
                            'insertOne': {
                                'document': activity
                            }
                        });
                    }    
                } else {
                    newActivities.push({
                        'updateOne': {
                            'filter': {'_id': activity._id},
                            'update': {'$set': activity},
                            'upsert': true
                        }
                    });
                }
            }
            if(newActivities.length !== 0){
                await this.#strava_instance.database.collection(options.collection).bulkWrite(newActivities);
            }
            if(res.length === 30){
                await this.fetchActivities({collection: options.collection, updateAll: options.updateAll, timezone:options.timezone, startDate:startDate, endDate:endDate}); 
            }
        }
    }

    async fetchDetailledActivity(id, options = {collection: 'activities', updateAll: false}){
        if(Date.now() > this.expiration){
            await this.#strava_instance.refreshAthlete(this);
        }
        options.updateAll = options.updateAll || false;
        options.collection = options.collection || 'activities';
        const activity = await this.#strava_instance.database.collection(options.collection).findOne({_id:id});
        if(!options.updateAll && activity.detailled){
            return;
        }
        const response = await fetch(`https://www.strava.com/api/v3/activities/${id}?include_all_efforts=true`, {
            headers: {
                'Authorization': `Bearer ${this.token}`
            },
            method: 'GET'
        });
        if(response.status === 401){
            console.log(response);
            //BAD TOKEN
        }
        if(response.status === 429){
            console.log(response);
            //WAITLIST
        }
        if(response.status === 200){
            const res = await response.json();
            delete Object.assign(res, { '_id': res.id })['id'];
            Object.assign(res, {'detailled': true});
            delete Object.assign(res, { 'athleteId': res.athlete.id })['athlete'];
            await this.#strava_instance.database.collection(options.collection).updateOne({_id: res._id},{$set:res},{upsert: true});
        }
    }

    async fetchNewActivities(collection='activities'){
        const cursor = this.#strava_instance.database.collection(collection).find({'athleteId': this.id})
        const prevActivities = await cursor.toArray();
        const startDate = new Date(prevActivities.sort((a,b) => new Date(b.start_date) - new Date(a.start_date))[0].start_date)
        await this.fetchActivities({collection: collection, startDate: startDate, endDate: new Date('2024-01-01 00:00:00'), updateAll: true})
    }

    async getAllActivities(collection='activities'){
        const cursor = this.#strava_instance.database.collection(collection).find({athleteId: this.id})
        return await cursor.toArray();
    }

    async fetchDetailledEquipment(equipment, force = false){
        const databaseEquipment = await this.#strava_instance.database.collection("equipments").findOne({_id:equipment.id});
        if(databaseEquipment !== null && !force){
            return;
        }
        const response = await fetch(`https://www.strava.com/api/v3/gear/${equipment.id}`, {
            headers: {
                'Authorization': `Bearer ${this.token}`
            },
            method: 'GET'
        });
        if(response.status === 401){
            console.log(response);
            //BAD TOKEN
        }
        if(response.status === 429){
            console.log(response);
            //WAITLIST
        }
        if(response.status === 200){
            const res = await response.json();
            delete Object.assign(res, { '_id': res.id })['id'];
            Object.assign(res, { 'athleteId': this.id })
            this.#strava_instance.database.collection('equipments').updateOne({_id: res._id}, {$set: res}, {upsert: true});
        }
    }

    async getAllEquipments(){
        const cursor = this.#strava_instance.database.collection('equipments').find({athleteId: this.id})
        return await cursor.toArray();
    }

    async prepare(forceFetch=false, timezone=0){ // TODO : gestion waitlist
        const prevActivities = await this.getAllActivities();
        if(prevActivities.length === 0 || forceFetch){
            await this.fetchActivities({updateAll: forceFetch});
        } else {
            await this.fetchNewActivities();
        }
        const activities = await this.getAllActivities();
        const activitiesToDetail = getMostKudoedPicturesActivitiesId(activities);
        const mostKudoed = await getMostKudoed(activities);
        activitiesToDetail.push(mostKudoed._id)
        const longestActivity = getBest(activities, 'all', 'distance');
        activitiesToDetail.push(longestActivity._id)

        for(const id of activitiesToDetail){
           this.fetchDetailledActivity(id)
        }
        const equipments2023 = getEquipments(activities);
        const bestBike = getBestEquipment(equipments2023, 'ride');
        const bestShoes = getBestEquipment(equipments2023, 'run');
        if(bestBike !== null){
            this.fetchDetailledEquipment(bestBike)
        }
        if(bestShoes !== null){
            this.fetchDetailledEquipment(bestShoes)
        }
        this.buildStats();
        await this.fetchActivities({collection: '2022-activities', startDate: new Date('2022-01-01 00:00:00'), endDate: new Date('2023-01-01 00:00:00')})
        return true;//préparation terminée
    }

    async buildStats(){
        const activities = await this.getAllActivities();
        const equipments = await this.getAllEquipments();
        const athlete = await this.profile
        const equipments2023 = getEquipments(activities);
        const bestBike = getBestEquipment(equipments2023, 'ride');
        const bestShoes = getBestEquipment(equipments2023, 'run');
        const lastYearActivities = await this.getAllActivities("2022-activities");
        const totals = getTotals(activities);
        const notSportKey = ['byMonth', 'total', 'heartrate'];
        const bestSports = Object.keys(totals).filter(key => !notSportKey.includes(key)).sort((a, b) => totals[b].hours - totals[a].hours);
        const stats = {
            _id: this.link,
            daysActive: getDaysActive(activities),
            totals2023: getTotals(activities),
            totals2022: getTotals(lastYearActivities),
            sportsDuration: getSportsDuration(activities),
            bestActivities: getBestActivities(activities, bestSports[0], bestSports[1]),
            bestPictures: getMostKudoedPicturesActivitiesId(activities).map(id => activities.find(e => e._id === id)),
            bestEquipments: {
                'ride': bestBike !== null ? {...bestBike, ...equipments.find(e => e._id === bestBike.id)} : null,
                'run': bestShoes !== null ? {...bestShoes, ...equipments.find(e => e._id === bestShoes.id)} : null
            },
            athlete: {
                'image': athlete.profile,
                'firstname': athlete.firstname,
                'lastname': athlete.lastname
            }
        };
        this.#strava_instance.database.collection("stats").updateOne({_id: this.link},{$set: stats},{upsert: true});
        return stats;
    }
}

module.exports = {'Strava': Strava, 'Athlete': Athlete};