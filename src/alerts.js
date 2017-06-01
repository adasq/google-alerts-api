const cheerio = require('cheerio');
const np = require('nested-property');

const DOMAIN = 'https://google.com/';
const RSS_ID_REGEX = /\/alerts\/feeds\/(\d+)\//;

const HOW_OFTEN = {
    AS_IT_HAPPENS: 1,
    AT_MOST_ONCE_A_DAY: 2,
    AT_MOST_ONCE_A_WEEK: 3
};

const HOW_MANY = {
    ALL: 2,
    BEST: 3
};

const DELIVER_TO = {
    MAIL: 1,
    RSS: 2
};

const ID_LOC = '1';
const HOW_OFTEN_LOC = '2.6.0.4';
const RSS_ID_LOC = '2.6.0.11';
const LANG_LOC = '2.3.3.1';
const REGION_LOC = '2.3.3.2';
const HOW_MANY_LOC = '2.5';
const DELIVER_TO_LOC = '2.6.0.1';
const DELIVER_TO_DATA_LOC = '2.6.0.2';
const NAME_LOC = '2.3.1';

function dataTypeToPropertyLocMap(dataType) {
    return {
        howOften: HOW_OFTEN_LOC,
        lang: LANG_LOC,
        region: REGION_LOC,
        howMany: HOW_MANY_LOC,
        name: NAME_LOC
    }[dataType];
}

function isLoggedInByState(state){
    const stateString = JSON.stringify(state);
    const isLoggedIn = stateString.indexOf('@') > -1;
    return isLoggedIn;
}

function getStateByBody(body) {
        try {
            const $ = cheerio.load(body);
            let state = null;            
            $('script').each(function(i, elem) {
                let text = $(this).text();
                if(text.indexOf('window.STATE') > -1){
                    text= text.trim().substr(15);
                    text = text.substr(0, text.length-1);
                    state = JSON.parse(text);
                }
            });
            return state;
        }catch(e) {
            return null;
        }
    }

function prepareRssFeedUrl(userId, rssId) {
    return `${DOMAIN}alerts/feeds/${userId}/${rssId}`;
}

function getRssFeedByCreateResponse(body) {
    
    const parsedBody = JSON.parse(body);
    let alert = parsedBody[4][0][3]; 
    const rssId = alert[6][0][11];
    
    const match = body.match(RSS_ID_REGEX);
    
    if(match){
        const userId = match[1];
        return prepareRssFeedUrl(userId, rssId);
    } else {
        return '';
    }
}

    function parseAlertToData(alert) {
        function getSources(alert) {
            return [np.get(alert, "2.7"), np.get(alert, "2.8"), np.get(alert, "2.9")];
        }
        function getRss(alert) {
            const rssId = np.get(alert, RSS_ID_LOC);
            const userId = alert[alert.length - 1];

            if (typeof userId !== 'string') { return ''; }
            return prepareRssFeedUrl(userId, rssId);
        }
        
        return {
            name: np.get(alert, NAME_LOC),
            
            id: np.get(alert, ID_LOC),
            howOften: np.get(alert, HOW_OFTEN_LOC),
            sources: getSources(alert),
            lang: np.get(alert, LANG_LOC),            
            region: np.get(alert, REGION_LOC),
            howMany: np.get(alert, HOW_MANY_LOC),
            deliverTo: np.get(alert, DELIVER_TO_LOC),
            rss: getRss(alert),
            deliverToData: np.get(alert, DELIVER_TO_DATA_LOC)            
        };
    }

    function create(data, createId) {
        const {howOften, sources, lang, name, region, howMany, deliverTo, deliverToData} = data;
        const n = null;
        const getHowOftenPadding = (howOften) => {
            if(howOften === HOW_OFTEN.AT_MOST_ONCE_A_DAY) {
                return [n, n, 15];
            }
            if(howOften === HOW_OFTEN.AT_MOST_ONCE_A_WEEK) {
                return [n, n, 15, 4];
            }            
            return [];
        }
        const rssId = "0";
        return [n,
                    [
                        n,n,n,
                        [
                            n, name, "com", [n, lang, region || 'US'], n, n, n, region ? 1 : 0, 1
                        ],
                        n, howMany,
                        [
                            [
                                n, deliverTo, deliverToData,
                                [...getHowOftenPadding(howOften)],
                                howOften,"pl-US",n,n,n,n,n, rssId, n,n, createId
                            ]
                        ],
                        ...sources
                    ]
                ];
    }




function toString(category, value) {
    let str = '';
    Object.keys(category).find((key, val) => {
        if( category[key] === value ) {
            str = key;
            return true;
        }
    });
    return str;
}

    function getCreateIdByState(state) {
        return state[2][6][0][14];
    }

    function getAlertsByState(state){
        return state[1][1]; 
    }

function printAlertData(data) {
    console.log('name', data.name);
    console.log('id', data.id);
    console.log('howOften', toString(HOW_OFTEN, data.howOften));
    console.log('lang', data.lang);
    console.log('region', data.region);
    console.log('rss', data.rss);
    console.log('howMany', toString(HOW_MANY, data.howMany));
    console.log('deliverTo', toString(DELIVER_TO, data.deliverTo));    
}

function findAlertById(id, state) {
    const alert = getAlertsByState(state).find(alert => {
        const alertData = parseAlertToData(alert);
        return (alertData.id === id);
    });
    return alert || null;
}

function getRequestXByState(state) {
    return state[3];
}

function getAlertCopy(alert) {
    return JSON.parse(JSON.stringify(alert));
}

function modifyData(alert, newData) {
    
    const alertCopy = getAlertCopy(alert);
    
    Object.keys(newData).forEach(paramType => {
        const paramValue = newData[paramType];
        const propertyLoc = dataTypeToPropertyLocMap(paramType);
        np.set(alertCopy, propertyLoc, paramValue);
    });

    return alertCopy;
}

module.exports = {
    HOW_OFTEN, DELIVER_TO, HOW_MANY,
    findAlertById, modifyData,
    getCreateIdByState, getAlertsByState, getRequestXByState,
    getStateByBody, create, parseAlertToData, printAlertData,
    isLoggedInByState, getRssFeedByCreateResponse
};