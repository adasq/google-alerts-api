const reqHandler = require('./request-handler.js');
const alerts = require('./alerts.js');

const { HOW_OFTEN, DELIVER_TO, HOW_MANY, SOURCE_TYPE } = alerts;
const config = { mail: '', password: ''};

let isAuthenticated = false;
let state = null;

const ERROR = {
    AUTHENTICATION: 'authentication issue',
    ALERTS_FETCH: 'alert retriving issue',
    CONFIGURATION: 'no mail/pass specified'
};

function getCookies() {
    const str = JSON.stringify(reqHandler.getCookies());
    return Buffer.from(str).toString('base64');
}

function generateCookies(mail, password, cb) {
    configure({mail, password});
    sync((err) => {
        if(err) return cb(err);
        const cookies = getCookies();
        cb(null, cookies);
    });
}

function setCookies(cookies){
    reqHandler.setCookies(JSON.parse(cookies));
}

function configure({mail, password, cookies}) {
    config.mail = mail;
    config.password = password;
    config.cookies = (cookies && parseCookies(cookies)) || null;
    isAuthenticated = false;
    reqHandler.removeCookies();
}

function parseCookies(cookies) {
    const str = Buffer.from(cookies, 'base64').toString('ascii');
    return JSON.parse(str);
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

    const createId = alerts.getCreateIdByState(state);

    const modifiedAlert = alerts.modifyData(alert, newData, createId);

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
            let alert = parsedBody[4][0];
            const id = alert[1];
            const rss = alerts.getRssFeedByCreateResponse(body);
            cb(null, { ...createData, id, rss});
        }catch(e) {
            cb(e);
        }
    });
}

function preview(previewData, cb) {
    const previewParams = alerts.create(previewData);

    reqHandler.preview(previewParams, (err, resp, preview) => {
        if (err) return cb(err);
        try {
            cb(null, { ...previewData, preview});
        } catch (e) {
            cb(e);
        }
    });
}

function generateCookiesBySID(SID, HSID, SSID) {
    const str = JSON.stringify(
        [
            { key: 'SID', value: SID, domain: 'google.com' },
            { key: 'HSID', value: HSID, domain: 'google.com' },
            { key: 'SSID', value: SSID, domain: 'google.com' },
        ]
    );
    return Buffer.from(str).toString('base64');
}

module.exports = {
    HOW_OFTEN, DELIVER_TO, HOW_MANY, ERROR, SOURCE_TYPE,
    configure,
    generateCookies,
    generateCookiesBySID,
    sync,
    getAlerts,
    preview,
    create,
    remove,
    modify,
    getCookies,
    reqHandler
};
