const express = require('express');
const http = require('node:http');
const bodyParser = require('body-parser');
const path = require('node:path');
require('dotenv').config();
const {Strava} = require('./strava');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
const router = express.Router();
router.use(express.static(path.join(__dirname, 'public')));

const strava = new Strava(process.env.ID, process.env.SECRET, process.env.DBUSER, process.env.DBPSSWRD, process.env.DBURL);

router.get('/authorization', (req, res) => {
    let redirect = req.query.redirect_uri;
    res.status(200).json({
        'url': `https://www.strava.com/oauth/authorize?client_id=${strava.client_id}&redirect_uri=${redirect}&response_type=code&scope=read_all,profile:read_all,activity:read_all`,
        'client_id': strava.client_id,
    })
})

router.get('/token', async (req, res) => {
    let code = req.query.code;
    let athlete = await strava.createAthlete(code);
    res.status(200).json({
        'token': athlete.token,
    });
})

router.get('/profile', async (req, res) => {
    let token = req.query.token;
    let athlete = await strava.getAthlete(token);
    if(athlete !== null){
        let profile = await athlete.profile;
        profile.token = athlete.token;
        res.status(200).json(profile);
    } else {
        res.status(401).end();
    }
})

router.get('/process', async (req, res) => {
    //Ici on essaye de générer, si ça passe on affiche sinon on dit que c'est en file d'attente
    let timezone = req.query.timezone;
    let options = {};
    if(timezone){
        options.timezone = timezone
    }
    let token = req.query.token;
    let athlete = await strava.getAthlete(token);
    if(athlete !== null){
        let result = await athlete.prepare(options);
        if(result){
            res.status(200).end();
        }
    } else {
        res.status(401).end();
    }
})

router.get('/stats', async (req, res) => {
    let access = req.query.access;
    let stats = await strava.getStats(access);
    if(stats !== null){
        res.status(200).json(stats);
    } else {
        res.status(404).end();
    }
})


app.use('', router);
const server = http.createServer(app);
server.listen(8080);

server.on('listening', () => console.log(`Listening on port ${server.address().port}`))