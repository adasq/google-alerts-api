[![Build Status](https://travis-ci.org/adasq/google-alerts-api.svg?branch=master)](https://travis-ci.org/adasq/google-alerts-api)
[![NPM Downloads](https://img.shields.io/npm/dm/google-alerts-api.svg?style=flat)](https://www.npmjs.org/package/google-alerts-api)
[![NPM Downloads](https://img.shields.io/npm/dt/google-alerts-api.svg?style=flat)](https://www.npmjs.org/package/google-alerts-api)

# google-alerts-api

Google Alerts API wrapper for nodejs. See [tests] for all features coverage.

## Features

- Creating alerts (no support for few parameters)
- Fetching alerts
- Modifing alerts (no support for few parameters)
- Removing alerts


## Getting started
```js
$ npm i -S google-alerts-api
```

```js
const alerts = require('google-alerts-api');
```

## Configuration

Fetching alerts forces us to authenticate. Pass your credentials using `configure` method:

- using mail/password
```js
alerts.configure({
    mail: 'your_mail@gmail.com',
    password: '**********'
});
```

#### IMPORTANT: Due to the latest changes in Google, authentication (with disabled JavaScript) requires Captcha form to be filled in. You will have to do it within command line. If you do not want to fill it each time, generate cookies and reuse it later on ([see how to get cookies](#generate-cookies)) 

- using cookie, ([see how to get cookies](#generate-cookies))

```js
alerts.configure({
    cookies: 'W3sia2V5IjoiR0FQUyIsInZhbHVlIjoiMTpCRXRtZEpjc...saGRasC==',
});
```

## How to use

#### Fetch alerts:

```js
const alerts = require('google-alerts-api');
const { HOW_OFTEN, DELIVER_TO, HOW_MANY, SOURCE_TYPE } = alerts;

alerts.configure({
    mail: 'your_mail@gmail.com',
    password: '**********'
});

alerts.sync((err) => {
    if(err) return console.log(err);
    const alertList = alerts.getAlerts();
    alertList.forEach(alert => printAlertInfo);
});

function printAlertInfo(alert) {
    console.log('name:', alert.name);
    //'How Many' property information:
    if (alert.howMany === HOW_MANY.BEST) {
    	console.log('How many: Only the best results');
    } else if (alert.howMany === HOW_MANY.ALL) {
    	console.log('How many: All Results');
    }
}
```
#### Example alert object:
```js
{
    name: '"Donald Trump * ISIS"',
    id: '4f94515ec736ef62:ade5b03803caa237:com:en:PL:R',
    howOften: 2, //use HOW_OFTEN enum to find out proper meaning
    sources: '...', // some of SOURCE_TYPE enum property, SOURCE_TYPE.AUTOMATIC by default
    lang: 'en',
    region: 'PL',
    howMany: 3, //use HOW_MANY enum to find out proper meaning
    deliverTo: 2, //use DELIVER_TO enum to find out proper meaning
    deliverToData: '', //email address, available when deliverTo === DELIVER_TO.MAIL
    rss: 'https://google.com/alerts/feeds/00357582442749620569/11537740808718742679' //field available, when deliverTo === DELIVER_TO.RSS
}
```
#### Modify alert (see [tests] for more examples):
```js
const { HOW_OFTEN, DELIVER_TO, HOW_MANY } = alerts;

alerts.sync((err) => {
    if(err) return console.log(err);
    const alertToModify = alerts.getAlerts()[0];
    alerts.modify(alertToModify.id, {
    	name: '"(Donald OR Melania) Trump"'
    }, () => {
        alerts.sync(() => {
            const syncedAlertsList = alerts.getAlerts();
            //search in syncedAlertsList to check updated alert
        });
    });
});

function printAlertInfo(alert){
    console.log('name:', alert.name);
    //'How Many' property information:
    if (alert.howMany === HOW_MANY.BEST) {
    	console.log('How many: Only the best results');
    } else if (alert.howMany === HOW_MANY.ALL) {
    	console.log('How many: All Results');
    }
}
```

#### Available source types:

```
const SOURCE_TYPE = {
    AUTOMATIC,
    NEWS,
    BLOGS,
    WEB,

    NEWS_AND_BLOGS,
    NEWS_AND_WEB,
    BLOGS_AND_WEB,

    VIDEO,
    BOOKS,
    DISCUSSIONS,
    FINANCE,
};
```

#### Create alert:

```js
alerts.sync(() => {
    const alertToCreate = {
    	howOften: HOW_OFTEN.AT_MOST_ONCE_A_DAY,
	sources: SOURCE_TYPE.AUTOMATIC, // default one
        lang: 'en',
        name: 'NodeJS AND "Chrome V8"',
        region: 'PL', // or do not specify it at all, if you want "All Regions"
        howMany: HOW_MANY.BEST,
        deliverTo: DELIVER_TO.RSS,
        deliverToData: ''
    };

    alerts.create(alertToCreate, (err, alert) => {
        console.log(alert);
    });
});
```

#### Remove alert:

```js
alerts.sync((err) => {
    const alertToRemove = alerts.getAlerts()[0];
    alerts.remove(alertToRemove.id, (err) => {
    	alerts.sync((err) => {
            const syncedAlertsList = alerts.getAlerts(); //alertToRemove does not exists here.
        });
    });   
});
```

#### Generate cookies:

You can authenticate once, and then use cookies.

```js
const fs = require('fs');

alerts.generateCookies(MAIL, PASSWORD, (err, cookies) => {
    if(err) return console.log(err);
    fs.writeFileSync('cookies.data', cookies);
});
```
and then:
```js
const fs = require('fs');

alerts.configure({
    cookies: fs.readFileSync('cookies.data').toString()
});

alerts.sync((err) => {
    if(err) return console.log(err);
    const alertList = alerts.getAlerts();
});
```

## Problem with authentication?

- https://accounts.google.com/b/1/DisplayUnlockCaptcha (make sure you are editing settings for proper user...)
- https://myaccount.google.com/lesssecureapps
- still can't authenticate? Check out how does the HTTP login response looks like:

```js
api.reqHandler.login({
    mail: MAIL,
    password: PASSWORD
}, (err, debug) => {
    console.log(debug.statusCode); 
    // For success, you should see here '302'.
    console.log(debug.headers); 
    // For success, in 'set-cookie' header content, you should see SID, LSID, HID, SSID (etc.) definitions.
    console.log(debug.body); 
    // For success, this should be short and include "LoginDoneHtml" and "Moved Temporarily" text inside.
});
```	    

[tests]: <https://github.com/adasq/google-alerts-api/blob/master/tests/test.js>
[how to get cookies]: <https://github.com/adasq/google-alerts-api#generate-cookies>
