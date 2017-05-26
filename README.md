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

```js
alerts.configure({
	mail: 'your_mail@gmail.com',
    password: '**********'
});
```

## How to use

#### Fetch alerts:

```js
const alerts = require('google-alerts-api');
const { HOW_OFTEN, DELIVER_TO, HOW_MANY } = alerts;

alerts.configure({
	mail: 'your_mail@gmail.com',
    password: '**********'
});

alerts.sync((err) => {
	if(err) return console.log(err);
	const alertList = api.getAlerts();
    alertList.forEach(alert => printAlertInfo);
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
#### Example alert object:
```js
{
    name: '"Donald Trump * ISIS"',
    id: '4f94515ec736ef62:ade5b03803caa237:com:en:PL:R',
    howOften: 2, //use HOW_OFTEN enum to find out proper meaning
    sources: [], // sources are not supported yet
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
	const alertToModify = api.getAlerts()[0];
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

#### Create alert:

```js
alerts.sync(() => {
	const alertToCreate = {
    	howOften: HOW_OFTEN.AT_MOST_ONCE_A_DAY,
		sources: [],
        lang: 'en',
        name: 'NodeJS AND "Chrome V8"',
        region: 'PL',
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
	const alertToRemove = api.getAlerts()[0];
    alerts.remove(alertToRemove.id, (err) => {
    	alerts.sync((err) => {
        	const syncedAlertsList = alerts.getAlerts(); //alertToRemove does not exists here.
        });
    });   
});
```

[tests]: <https://github.com/adasq/google-alerts-api/blob/master/tests/test.js>

