const reqHandler = require('./request-handler.js');
const alerts = require('./alerts.js');

const { HOW_OFTEN, DELIVER_TO, HOW_MANY } = alerts;
const config = { mail: '', password: ''};

let isAuthenticated = false;
let state = null;

const ERROR = {
    AUTHENTICATION: 'authentication issue',
    ALERTS_FETCH: 'alert retriving issue',
    CONFIGURATION: 'no mail/pass specified'
};

function getCookies(){
    //require('fs').writeFileSync('./cookiez', JSON.stringify(x));
    return JSON.stringify(reqHandler.getCookies());
}

function setCookies(cookies){
            // let cookiezStr = require('fs').readFileSync('./cookiez');

    //require('fs').writeFileSync('./cookiez', JSON.stringify(x));
    reqHandler.setCookies(JSON.parse(cookies));
}

function configure({mail, password, cookies}) {
    config.mail = mail;
    config.password = password;
    config.cookies = (cookies && JSON.parse(cookies)) || null;
    isAuthenticated = false;
    reqHandler.removeCookies();
}

function sync(cb) {
    if( (config.mail && config.password) ||  config.cookies) {

    } else {
        return cb(ERROR.CONFIGURATION);
    }

    if (!isAuthenticated) {
        reqHandler.login(config, (err) => {
           if(err) return cb(err);
            isAuthenticated = true;
            reqHandler.get(getCb);
        });
    } else {
        reqHandler.get(getCb);
    }

    function getCb(err, resp, body) {
        if(err) return cb(err);
        state = alerts.getStateByBody(body);
        if (!state) return cb(ERROR.ALERTS_FETCH);
        if (alerts.isLoggedInByState(state)) {
            cb(null);
        } else {
            cb(ERROR.AUTHENTICATION);
        }
    }
}

function getAlerts() {
    const alertsList = alerts.getAlertsByState(state);
    return alertsList.map(alerts.parseAlertToData);
}
function getAlerts2() {
    return alerts.getAlertsByState(state);
}

function remove(id, cb) {
    const requestX = alerts.getRequestXByState(state);
    reqHandler.delete(requestX, id, (err, resp, body) => {
        if(err) { return cb(err); }
        sync(err => {
            if(err) { return cb(err); }
            cb(null, body);
        });
    });
}

function modify(id, newData, cb) {
    const alert = alerts.findAlertById(id, state);
    if(!alert) return cb('no alert found');

    const modifiedAlert = alerts.modifyData(alert, newData);
    modifiedAlert.pop();

    const requestX = alerts.getRequestXByState(state);
    reqHandler.modify(requestX, modifiedAlert, (err, resp, body) => {
        cb(body);
    });
}

function create(createData, cb) {
    const requestX = alerts.getRequestXByState(state);
    const createId = alerts.getCreateIdByState(state);
    
    const createParams = alerts.create(createData, createId);
    reqHandler.create(requestX, createParams, (err, resp, body) => {
        if(err) return cb(err);
        try {
            const parsedBody = JSON.parse(body);
            let alert = parsedBody[4][0][3]; 
            const id = parsedBody[4][0][1];
            // console.log(alert[6][0][11])
            cb(null, alerts.parseAlertToData([null, id, alert]));
        }catch(e) {
            cb(e);
        }
    });
}

module.exports = {
    HOW_OFTEN, DELIVER_TO, HOW_MANY, ERROR,
    configure,
    sync,
    getAlerts,
    getAlerts2,
    create,
    remove,
    modify,
    getCookies
};