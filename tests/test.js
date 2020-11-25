const expect = require('expect.js');
const nconf = require('nconf');
const fs = require('fs');
const forEach = require('mocha-each');

const api = require('../index.js');

const { HOW_OFTEN, DELIVER_TO, HOW_MANY, SOURCE_TYPE } = api;

const TIMEOUT_MS = 100 * 1000;

nconf.argv()
    .env()
    .file({ file: './config.json' });

const MAIL = nconf.get('mail');
const COOKIES = nconf.get('cookies');

const NAME = generateRandomName();
const MODIFIED_NAME = NAME + ' modified';

describe('google', function () {
    this.timeout(TIMEOUT_MS);

    describe('alerts', () => {
        this.beforeAll(() => {
            api.configure({
                cookies: COOKIES
            });
        })

        it('generates cookies by SSIDs', () => {
            const SID = 'SID';
            const HSID = 'HSID';
            const SSID = 'SSID';

            expect(
                api.generateCookiesBySID(SID, HSID, SSID)
            ).to.be('W3sia2V5IjoiU0lEIiwidmFsdWUiOiJTSUQiLCJkb21haW4iOiJnb29nbGUuY29tIn0seyJrZXkiOiJIU0lEIiwidmFsdWUiOiJIU0lEIiwiZG9tYWluIjoiZ29vZ2xlLmNvbSJ9LHsia2V5IjoiU1NJRCIsInZhbHVlIjoiU1NJRCIsImRvbWFpbiI6Imdvb2dsZS5jb20ifV0=')
        })

        it('creates RSS', (done) => {
            api.sync(() => {
                const alertToCreate = {
                    name: NAME,
                    howOften: HOW_OFTEN.AT_MOST_ONCE_A_DAY,
                    sources: SOURCE_TYPE.AUTOMATIC,
                    lang: 'en',
                    region: 'PL',
                    howMany: HOW_MANY.BEST,
                    deliverTo: DELIVER_TO.RSS,
                    deliverToData: '',
                };

                api.create(alertToCreate, (err, alert) => {
                    expect(err).to.be(null);
                    expect(alert.name).to.be(alertToCreate.name);
                    expect(alert).to.have.property('rss');
                    done();
                });
            });
        });

        describe('creates with region', () => {
            it('as "any"', (done) => {
                api.sync(() => {
                    const NEW_NAME = NAME + '(region:ANY)';
                    const alertToCreate = {
                        name: NEW_NAME,
                        howOften: HOW_OFTEN.AT_MOST_ONCE_A_DAY,
                        sources: SOURCE_TYPE.AUTOMATIC,
                        lang: 'en',
                        region: 'any',
                        howMany: HOW_MANY.BEST,
                        deliverTo: DELIVER_TO.RSS,
                        deliverToData: '',
                    };
    
                    api.create(alertToCreate, (err, alert) => {
                        expect(err).to.be(null);
                        api.sync(() => {
                            const alert = findAlertByName(api.getAlerts(), NEW_NAME);
                            expect(alert.region).to.be('any');
                            done();
                        });
                    });
                });
            });

            it('as not specified', (done) => {
                api.sync(() => {
                    const NEW_NAME = NAME + '(region:undefined)';
                    const alertToCreate = {
                        name: NEW_NAME,
                        howOften: HOW_OFTEN.AT_MOST_ONCE_A_DAY,
                        sources: SOURCE_TYPE.AUTOMATIC,
                        lang: 'en',
                        howMany: HOW_MANY.BEST,
                        deliverTo: DELIVER_TO.RSS,
                        deliverToData: '',
                    };
    
                    api.create(alertToCreate, (err) => {
                        expect(err).to.be(null);
                        api.sync(() => {
                            const alert = findAlertByName(api.getAlerts(), NEW_NAME);
                            expect(alert).to.eql({ ...alert, region: 'any' });
                            done();
                        });
                       
                    });
                });
            });
        })
        
        it('edit name for RSS', done => {
            api.sync((err) => {
                expect(err).to.be(null);
                const alert = findAlertByName(api.getAlerts(), NAME);
                const modifiedData = { name: MODIFIED_NAME }

                api.modify(alert.id, modifiedData, () => {
                    expect(err).to.be(null);
                    api.sync(() => {
                        const alert = findAlertByName(api.getAlerts(), MODIFIED_NAME);
                        expect(alert).to.eql({ ...alert, ...modifiedData });
                        done();
                    });
                });
            });
        })

        it('creates mail alert', (done) => {
            api.sync(() => {
                const alertToCreate = {
                    howOften: HOW_OFTEN.AT_MOST_ONCE_A_DAY,
                    lang: 'en',
                    name: NAME,
                    region: 'PL',
                    howMany: HOW_MANY.BEST,
                    deliverTo: DELIVER_TO.MAIL,
                    deliverToData: MAIL
                };

                api.create(alertToCreate, (err, alert) => {
                    expect(alert.deliverTo).to.be(DELIVER_TO.MAIL);
                    expect(alert.deliverToData).to.be(MAIL);
                    done();
                });
            });
        });

        forEach([
            { howOften: HOW_OFTEN.AS_IT_HAPPENS },
            { howOften: HOW_OFTEN.AT_MOST_ONCE_A_DAY },
            { howOften: HOW_OFTEN.AT_MOST_ONCE_A_WEEK },

            { sources: SOURCE_TYPE.AUTOMATIC },
            { sources: SOURCE_TYPE.NEWS },
            { sources: SOURCE_TYPE.BLOGS },
            { sources: SOURCE_TYPE.WEB },

            { sources: SOURCE_TYPE.NEWS_AND_BLOGS },
            { sources: SOURCE_TYPE.NEWS_AND_WEB },
            { sources: SOURCE_TYPE.BLOGS_AND_WEB },

            { sources: SOURCE_TYPE.VIDEO },
            { sources: SOURCE_TYPE.BOOKS },
            { sources: SOURCE_TYPE.DISCUSSIONS },
            { sources: SOURCE_TYPE.FINANCE },

            { lang: 'pl' },
            { region: 'RU' },
            { region: 'any' },

            { howMany: HOW_MANY.BEST },
            { howMany: HOW_MANY.ALL },

            { deliverTo: DELIVER_TO.RSS, deliverToData: '' },
            { deliverTo: DELIVER_TO.MAIL, deliverToData: MAIL }
        ]).it(params => `modifing: ${JSON.stringify(params)}`, (modifiedData, done) => {
            api.sync((err) => {
                expect(err).to.be(null);
                const alert = findAlertByName(api.getAlerts(), NAME);

                api.modify(alert.id, modifiedData, () => {
                    expect(err).to.be(null);
                    api.sync(() => {
                        const alert = findAlertByName(api.getAlerts(), NAME);
                        expect(alert).to.eql({ ...alert, ...modifiedData });
                        setTimeout(done, 3000)
                    });
                });
            });
        })

        forEach([
            [NAME],
            [MODIFIED_NAME]
        ]).it((a) => `removing "${a}"`, (name, done) => {
            const alert = findAlertByName(api.getAlerts(), name);

            api.remove(alert.id, () => {
                api.sync(() => {
                    const alert = findAlertByName(api.getAlerts(), name);
                    expect(alert).to.be(null);
                    done();
                });
            });
        })

    });
});

function generateRandomName() {
    return 'alert-name-' + (+new Date());
}

function findAlertByName(alerts, alertName) {
    return alerts.find(alert => alert.name === alertName) || null;
}
