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

const SOURCE_TYPE = {
    AUTOMATIC: '[null,null,null]',
    NEWS: '[null,null,[1,3]]',
    BLOGS: '[null,null,[2,3]]',
    WEB: '[null,null,[2,1]]',

    NEWS_AND_BLOGS: '[null,null,[3]]',
    NEWS_AND_WEB: '[null,null,[1]]',
    BLOGS_AND_WEB: '[null,null,[2]]',

    VIDEO: '[null,[5],[2,1,3]]',
    BOOKS: '[null,[6],[2,1,3]]',
    DISCUSSIONS: '[null,[7],[2,1,3]]',
    FINANCE: '[null,[8],[2,1,3]]',
};

const ID_LOC = '0';
const HOW_OFTEN_LOC = '2.6.0.4';
const RSS_ID_LOC = '1.5.0.10';
const LANG_LOC = '1.2.2.0';
const REGION_LOC = '1.2.2.1';
const IS_REGION_SPECIFIED_LOC = '1.2.6';
const HOW_MANY_LOC = '1.4';
const DELIVER_TO_LOC = '1.5.0.0';
const DELIVER_TO_DATA_LOC = '1.5.0.1';
const NAME_LOC = '1.2.0';

function dataTypeToPropertyLocMap(dataType) {
    return {
        howOften: HOW_OFTEN_LOC,
        lang: LANG_LOC,
        region: REGION_LOC,
        howMany: HOW_MANY_LOC,
        name: NAME_LOC,
        deliverTo: DELIVER_TO_LOC,
        deliverToData: DELIVER_TO_DATA_LOC,
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
                    text= text.trim().substr(25);
                    text = text.substr(0, text.length-6);
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
            return [np.get(alert, "1.6"), np.get(alert, "1.7"), np.get(alert, "1.8")];
        }
        function getRss(alert) {
            const rssId = np.get(alert, RSS_ID_LOC);
            const userId = alert[alert.length - 1];

            if (typeof userId !== 'string') { return ''; }
            return prepareRssFeedUrl(userId, rssId);
        }

        function getHowOften(alert) {
            const hoModel = np.get(alert, '1.5.0.2');
            if(hoModel.length === 0) return HOW_OFTEN.AS_IT_HAPPENS;
            if(hoModel.length === 2) return HOW_OFTEN.AT_MOST_ONCE_A_DAY;
            if(hoModel.length === 3) return HOW_OFTEN.AT_MOST_ONCE_A_WEEK;
        }

        function getRegion() {
            const isRegionSpecified = np.get(alert, IS_REGION_SPECIFIED_LOC, false);
            return isRegionSpecified ? np.get(alert, REGION_LOC) : 'any';
        }

        const alertD = {
            name: np.get(alert, NAME_LOC),
            id: np.get(alert, ID_LOC),
            howOften: getHowOften(alert),
            sources: JSON.stringify(getSources(alert)),
            lang: np.get(alert, LANG_LOC),            
            region: getRegion(alert),
            howMany: np.get(alert, HOW_MANY_LOC),
            deliverTo: np.get(alert, DELIVER_TO_LOC),
            rss: getRss(alert),
            deliverToData: np.get(alert, DELIVER_TO_DATA_LOC)
        };
                
        return alertD;
    }

    function modify(data, createId, rssId) {
        let {howOften, sources, lang, name, region, howMany, deliverTo, deliverToData} = data;
        sources = JSON.parse(sources || SOURCE_TYPE.AUTOMATIC);
        const n = null;
        const getHowOftenPadding = (howOften) => {
            if(howOften === HOW_OFTEN.AT_MOST_ONCE_A_DAY) {
                return [n, n, 19];
            }
            if(howOften === HOW_OFTEN.AT_MOST_ONCE_A_WEEK) {
                return [n, n, 19, 4];
            }            
            return [];
        }

        const isAnyRegion = !region || region === 'any';
   
        const result = [n, data.id ? data.id : undefined,
                    [
                        n,n,n,
                        [
                            n, name, "com", [n, lang, isAnyRegion ? 'US' : region], n, n, n, isAnyRegion ? 0 : 1, 1
                        ],
                        n, howMany,
                        [
                            [
                                n, deliverTo, deliverToData,
                                [...getHowOftenPadding(howOften)],
                                howOften,"pl-US",1,n,n,n,n, rssId || "0", n,n, createId
                            ]
                        ],
                        ...sources
                    ]
                ];
        return result;
    }

    function create(data, createId, rssId) {
        let {howOften, sources, lang, name, region, howMany, deliverTo, deliverToData} = data;
        sources = JSON.parse(sources || SOURCE_TYPE.AUTOMATIC);
        const n = null;
        const getHowOftenPadding = (howOften) => {
            if(howOften === HOW_OFTEN.AT_MOST_ONCE_A_DAY) {
                return [n, n, 19];
            }
            if(howOften === HOW_OFTEN.AT_MOST_ONCE_A_WEEK) {
                return [n, n, 19, 4];
            }            
            return [];
        }
   
        const isAnyRegion = !region || region === 'any';

        const result = [n,
                    [
                        n,n,n,
                        [
                            n, name, "com", [n, lang, isAnyRegion ? 'US' : region], n, n, n, isAnyRegion ? 0 : 1, 1
                        ],
                        n, howMany,
                        [
                            [
                                n, deliverTo, deliverToData,
                                [...getHowOftenPadding(howOften)],
                                howOften,"pl-US",n,n,n,n,n, rssId || "0", n,n, createId
                            ]
                        ],
                        ...sources
                    ]
                ];
        return result;
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
        return state[1][5][0][13];
    }

    function getAlertsByState(state){
        if (state === null || state[0] === null || state[1] === null) {
            return [];
        }
        return state[0][0];
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
    return state[state.length - 4];
}

function getAlertCopy(alert) {
    return JSON.parse(JSON.stringify(alert));
}

function modifyData(alert, newData, createId) {
    const alertCopy = getAlertCopy(alert);
    const n = null;
    const rssId = np.get(alert, RSS_ID_LOC);

    const newAlert = { ...parseAlertToData(alert), ...newData };
    const request = modify(newAlert, createId, rssId)

    return request;
}

module.exports = {
    HOW_OFTEN, DELIVER_TO, HOW_MANY, SOURCE_TYPE,
    findAlertById, modifyData, create,
    getCreateIdByState, getAlertsByState, getRequestXByState,
    getStateByBody, create, parseAlertToData, printAlertData,
    isLoggedInByState, getRssFeedByCreateResponse
};