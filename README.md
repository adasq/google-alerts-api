[![Actions Status](https://github.com/adasq/google-alerts-api/workflows/Node%20CI/badge.svg)](https://github.com/adasq/google-alerts-api/actions)
[![NPM Downloads](https://img.shields.io/npm/dm/google-alerts-api.svg?style=flat)](https://www.npmjs.org/package/google-alerts-api)
[![NPM Downloads](https://img.shields.io/npm/dt/google-alerts-api.svg?style=flat)](https://www.npmjs.org/package/google-alerts-api)

# google-alerts-api

Google Alerts API for nodejs. See [tests] for all features coverage.

## Features

- **Creating alerts** (no support for few parameters)
- **Fetching alerts**
- **Modifing alerts** (no support for few parameters)
- **Removing alerts**


## Getting started
```js
$ npm i -S google-alerts-api
```

```js
const alerts = require('google-alerts-api');
```

## Configuration

#### IMPORTANT: Due to the latest changes in Google, authentication with disabled JavaScript is permited. Still, you can generate cookies on your own and reuse it later on ([see how to get cookies](#generate-cookies))

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
    cookies: 'W3sia2V5IjoiR0FQUyIsInZhbHVlIjoiMTpCRXRtZEpjc...saGRasC==',
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
        region: 'PL', // or "any", if you want "All Regions"
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

#### Preview alert:

Alert preview returns Google provided HTML preview without generating the alert.

```js
alerts.sync(() => {
    const alertToPreview = {
    	howOften: HOW_OFTEN.AT_MOST_ONCE_A_DAY,
	sources: SOURCE_TYPE.AUTOMATIC, // default one
        lang: 'en',
        name: 'NodeJS AND "Chrome V8"',
        region: 'PL', // or "any", if you want "All Regions"
        howMany: HOW_MANY.BEST,
        deliverTo: DELIVER_TO.RSS,
        deliverToData: ''
    };

    alerts.preview(alertToPreview, (err, alert) => {
        console.log(alert.preview); //HTML data
    });
});
```

### Generate cookies:

You can authenticate once, and then use your cookies. Unfortunatelly it requires an additional action from you:

#### STEP 1: Authenticate in browser

1. Open **Chrome Browser** in **Incognito** mode
2. Navigate http://myaccount.google.com
3. **Log into** your account

#### STEP 2: Find your SID, HSID, SSID cookie values

1. Open Chrome Dev Tools
2. Navigate **Application** tab, select **Cookies** preview for http://myaccount.google.com domain
3. Copy **SID**, **HSID** and **SSID** cookie values

![copy SID, HSID, SSID cookie values](https://cdn.steemitimages.com/DQmbMvsdTvVpwukxMSXss57wq28gxXmLUNqkEgzYREHcLtZ/image.png)


#### STEP 3: Prepare your auth cookie string

1. Put your SID, HSID, SSID values into value field of the code:

```js
window.btoa(JSON.stringify(
    [{
            key: 'SID',
            value: '',
            domain: 'google.com'
        },
        {
            key: 'HSID',
            value: '',
            domain: 'google.com'
        },
        {
            key: 'SSID',
            value: '',
            domain: 'google.com'
        },
    ]
));
```

2. Run this code in **Console** tab
3. The output is your **auth cookie string**

![enter image description here](https://cdn.steemitimages.com/DQmTifruHFrXeabrXpgwymYmCJBxCUuasUHvjVaTjNsKh5o/image.png)

4. Put **auth cookie string** configuration:

```js
const fs = require('fs')
const alerts = require('google-alerts-api')

alerts.configure({
    cookies: "your 'auth cookie string' goes here..."
});

alerts.sync((err) => {
    if(err) return console.log(err)
    const alertList = alerts.getAlerts()
});
```

## Problem with authentication?

- https://accounts.google.com/b/1/DisplayUnlockCaptcha (make sure you are editing settings for proper user...)
- https://myaccount.google.com/lesssecureapps
- review [auth issues] labeled issues, hope you will find an answer


[auth issues]: <https://github.com/adasq/google-alerts-api/issues?q=label%3Aauth-issues+>
[tests]: <https://github.com/adasq/google-alerts-api/blob/master/tests/test.js>
[how to get cookies]: <https://github.com/adasq/google-alerts-api#generate-cookies>
