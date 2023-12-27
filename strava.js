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
    getDaysActive
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

    async fetchActivities(updateAll=false, options = {timezone: 0, startDate: new Date('2023-01-01 00:00:00'), endDate: new Date('2024-01-01 00:00:00')}){
        if(Date.now() > this.expiration){
            await this.#strava_instance.refreshAthlete(this);
        }
        options.timezone = options.timezone || 0;
        let timeZoneString;
        if(options.timezone >= 0){
            timeZoneString = `GMT+${options.timezone.toString(10)}`;
        } else {
            timeZoneString = `GMT${options.timezone.toString(10)}`;
        }
        options.endDate = options.endDate || new Date(`2024-01-01 00:00:00 ${timeZoneString}`);
        options.startDate = options.startDate || new Date(`2023-01-01 00:00:00 ${timeZoneString}`);
        const cursor = this.#strava_instance.database.collection("activities").find({'athleteId': this.id})
        const prevActivities = await cursor.toArray();
        let endDate = options.endDate;
        if(prevActivities.length !== 0 && !updateAll){
            endDate = new Date(prevActivities.sort((a,b) => new Date(a.start_date) - new Date(b.start_date))[0].start_date)
        }
        let startDate = options.startDate;
        const response = await fetch(`https://www.strava.com/api/v3/athlete/activities?before=${endDate/1000}&after=${startDate/1000}&page=1`, {
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
                if(!updateAll){
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
                            'update': activity,
                            'upsert': true
                        }
                    });
                }
            }
            if(newActivities.length !== 0){
                await this.#strava_instance.database.collection("activities").bulkWrite(newActivities);
            }
            if(res.length === 30){
                await this.fetchActivities(updateAll, {timezone:options.timezone, endDate:options.endDate}); 
            }
        }
    }

    async fetchDetailledActivity(id, force=false){
        if(Date.now() > this.expiration){
            await this.#strava_instance.refreshAthlete(this);
        }
        const activity = await this.#strava_instance.database.collection("activities").findOne({_id:id});
        if(!force && activity.detailled){
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
            await this.#strava_instance.database.collection("activities").updateOne({_id: res._id},{$set:res},{upsert: true});
        }
    }

    async getAllActivities(collection='activities'){
        const cursor = this.#strava_instance.database.collection(collection).find({})
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
            console.log(res);
            delete Object.assign(res, { '_id': res.id })['id'];
            this.#strava_instance.database.collection('equipments').updateOne({_id: res._id}, {$set: res}, {upsert: true});
        }
    }

    async prepare(forceFetch=false, timezone=0){ // TODO : gestion waitlist
        await this.fetchActivities()
        const activities = await this.getAllActivities();
        const bestPicturesActivitiesId = getMostKudoedPicturesActivitiesId(activities);
        for(const id of bestPicturesActivitiesId){
           this.fetchDetailledActivity(id)
        }
        const mostKudoed = await getMostKudoed(activities);
        await this.fetchDetailledActivity(mostKudoed);
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
        return true;//préparation terminée
    }

    async buildStats(){
        const activities = await this.getAllActivities();
        const stats = {
            _id: this.link,
            daysActive: getDaysActive(activities),
            totals2023: getTotals(activities),
            sportsDuration2023: getSportsDuration(activities)
        };
        this.#strava_instance.database.collection("stats").updateOne({_id: this.link},{$set: stats},{upsert: true});
        return stats;
    }
}

module.exports = {'Strava': Strava, 'Athlete': Athlete};