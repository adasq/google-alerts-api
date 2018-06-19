const request = require('request');
let cheerio = require('cheerio');

var jar = request.jar();
let parsedCookies = null;
const LOGIN_URL = 'https://accounts.google.com/ServiceLogin?continue=https%3A%2F%2Faccounts.google.com%2FManageAccount&rip=1&nojavascript=1'
const LOGIN_PASSWORD_URL = 'https://accounts.google.com/signin/challenge/sl/password';

const ALERTS_URL = 'https://www.google.com/alerts';
const ALERTS_MODIFY_URL = 'https://www.google.com/alerts/modify?x={requestX}';
const ALERTS_CREATE_URL = 'https://www.google.com/alerts/create?x={requestX}';
const ALERTS_DELETE_URL = 'https://www.google.com/alerts/delete?x={requestX}';

const COOKIES_URL = 'https://accounts.google.com';

function removeCookies(){
    jar = request.jar();
}

function createFormByBody(body) {
    const form = {};
    const $ = cheerio.load(body);
    const inputs = cheerio($('form').html()).serializeArray();
    inputs.forEach(input => {
        form[input.name] = input.value;
    });
    return form;
}
function getCookies(){
    return parsedCookies;
}

function setCookies(cookies){
    applyCookies(cookies);
}

function rememberCookies(cookies) {
    parsedCookies = [];
    cookies.forEach(cookie => {
        var newCookie = {};
        newCookie.key = cookie.key;
        newCookie.value = cookie.value;
        newCookie.expires = cookie.expires;
        newCookie.path = cookie.path;
        newCookie.domain = cookie.domain;
        newCookie.creation = cookie.creation;
        newCookie.lastAccessed = cookie.lastAccessed;
        newCookie.hostOnly = cookie.hostOnly;
        parsedCookies.push(newCookie)
    });
}

function applyCookies(cookies) {
    removeCookies();
    cookies.forEach(cookie => {
        var newCookie = request.cookie(`${cookie.key}=${cookie.value}`);
        newCookie.key = cookie.key;
        newCookie.value = cookie.value;
        newCookie.path = cookie.path;
        newCookie.domain = cookie.domain;
        newCookie.creation = cookie.creation;
        newCookie.lastAccessed = cookie.lastAccessed;
        newCookie.hostOnly = cookie.hostOnly;
        jar.setCookie(newCookie, COOKIES_URL);
    });
}
function login({mail, password, cookies}, cb) {
    if(cookies){
        setCookies(cookies);
        return cb(null);
    }
    request({
        url: LOGIN_URL,
        jar
    }, (err, resp, body) => {
        if(err) return cb(err);
        const form = createFormByBody(body);
        form.Email = mail+'';
        form.Passwd = password+'';
        request({
            method: 'POST',
            url: LOGIN_PASSWORD_URL,
            form, jar
        }, (err, resp, body) => {
            rememberCookies(jar.getCookies(COOKIES_URL));
            // require('fs').writeFileSync('./xxx', body);
            // console.log(resp.headers['set-cookie'], resp.statusCode)
            if (err) return cb(err);
            // if(resp.headers['set-cookie'] && resp.statusCode === 302){
            //      return cb(null, jar);
            // }else{
            //     return cb('invalid credentials');
            // }
            // if (resp.statusCode !== 302 ) return cb('invalid credentials');
            return cb(null, {
                body,
                headers: resp.headers,
                statusCode: resp.statusCode
            });
        });
    });   
}

function modify(requestX, form, cb){
    const url = ALERTS_MODIFY_URL.replace('{requestX}', requestX);
    request({
        method: 'POST',
        url, jar,
        form: {
            params: JSON.stringify(form)
        }
    }, cb);
}

function create(requestX, form, cb) {
    const url = ALERTS_CREATE_URL.replace('{requestX}', requestX);
    request({
        method: 'POST',
        url, jar,
        form: {
            params: JSON.stringify(form)
        }
    }, cb);
}

function remove(requestX, id, cb) {
    const url = ALERTS_DELETE_URL.replace('{requestX}', requestX);
    request({
        method: 'POST',
        url, jar,
        form: {
            params: JSON.stringify([null, id])
        }
    }, cb);    
}

function get(cb) {
    request({
        url: ALERTS_URL, jar
    }, cb);    
}

function checkRssSource(url, cb){
    return request(url, (err, resp, body) => {
        if(err){
            return cb(err);
        }
        cb(null, resp.statusCode === 200);
    });  
}

module.exports = {
    login,
    create,
    modify,
    delete: remove,
    get,
    checkRssSource,
    removeCookies,
    getCookies
};