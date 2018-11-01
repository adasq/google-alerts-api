const api = require('../index.js');
const expect = require('expect.js');
const nconf = require('nconf');
const fs = require('fs');
const { parseAlertToData, printAlertData} = require('../src/alerts.js');

const { HOW_OFTEN, DELIVER_TO, HOW_MANY, SOURCE_TYPE } = api;

const TIMEOUT_MS = 100 * 1000;

nconf.argv()
    .env()
    .file({ file: './config.json' });

const MAIL = 'ffmpeg3@gmail.com';
const PASSWORD = nconf.get('password');
const COOKIES = nconf.get('cookies');

const NAME = generateRandomName();
const MODIFIED_NAME = NAME + ' modified';

xdescribe('generateCookies', function() {
    this.timeout(TIMEOUT_MS);
    it('generateCookies', done => {
        api.generateCookies(MAIL, PASSWORD, (err, cookies) => {
            if(err) return console.log(err);
            fs.writeFileSync('cookies.data', cookies);
            done()
        });
    })
})

xdescribe('username / password login', function() {
    this.timeout(TIMEOUT_MS);
    it('username / password login', done => {
        api.configure({
            mail: MAIL,
            password: PASSWORD
        });
        api.sync((err) => {
            expect(err).to.be(null);
            done();
        });
    })
})

describe('google', function() {
    this.timeout(TIMEOUT_MS);
    describe('alerts', () => {
        xit('throws for incorrect configuration', (done) => {
            api.configure({
                mail: undefined
            });
            api.sync((err) => {
                expect(err).to.be('no mail/pass specified');
                done();
            });
        });
        xit('throws for invalid configuration', (done) => {
            api.configure({
                mail: MAIL,
                password: `incorrect${PASSWORD}` 
            });
            api.sync((err) => {
                expect(err).to.be('authentication issue');
                done();
            });
        });
        xit('generates cookie', (done) => {
            api.generateCookies(MAIL, PASSWORD, (err, cookies) => {
                expect(err).to.be(null);
                console.log(cookies);
                done();
            });
        });
       xit('does not throw for valid mail/pswd configuration', (done) => {
            api.configure({
                mail: MAIL,
                password: PASSWORD
            });
            api.sync((err) => {
                expect(err).to.be(null);
                done();
            });
        });
        it('does not throw for valid cookies configuration', (done) => {
            api.configure({
                cookies: COOKIES
            });
            api.sync((err) => {
                expect(err).to.be(null);
                done();
            });
        });

        it('creates', (done) => {
            api.sync(() => {
                const alertToCreate = {
                    howOften: HOW_OFTEN.AT_MOST_ONCE_A_DAY,
                    lang: 'en',
                    name: NAME,
                    region: 'PL',
                    howMany: HOW_MANY.BEST,
                    deliverTo: DELIVER_TO.RSS,
                    deliverToData: '',
                };

                api.create(alertToCreate, (err, alert) => {
                    expect(alert.name).to.be(alertToCreate.name);
                    expect(alert.sources).to.be(SOURCE_TYPE.AUTOMATIC);
                    done();
                });
            });
        });

        it('creates mail alert', (done) => {
            api.sync(() => {
                const alertToCreate = {
                    howOften: HOW_OFTEN.AT_MOST_ONCE_A_DAY,
                    lang: 'en',
                    name: NAME + 2,
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

        it('retrive', (done) => {
            api.sync(() => {
                const alert = findAlertByName(api.getAlerts(), NAME);
                expect(alert.name).to.be(NAME);
                done();
            });
        });
        it('modify:sources:BLOGS', (done) => {
            const alert = findAlertByName(api.getAlerts(), NAME);

            api.modify(alert.id, {sources: SOURCE_TYPE.BLOGS}, (err, resp, body) => {
                api.sync(() => {
                    const alert = findAlertByName(api.getAlerts(), NAME);
                    expect(alert.sources).to.be(SOURCE_TYPE.BLOGS);
                    done();
                });
            });
        });

        it('modify:sources:NEWS_AND_WEB', (done) => {
            const alert = findAlertByName(api.getAlerts(), NAME);

            api.modify(alert.id, {sources: SOURCE_TYPE.NEWS_AND_WEB}, (err, resp, body) => {
                api.sync(() => {
                    const alert = findAlertByName(api.getAlerts(), NAME);
                    expect(alert.sources).to.be(SOURCE_TYPE.NEWS_AND_WEB);
                    done();
                });
            });
        });

        it('modify:deliverTo', (done) => {
            const alert = findAlertByName(api.getAlerts(), NAME);

            api.modify(alert.id, {deliverTo: DELIVER_TO.MAIL, deliverToData: MAIL}, (err, resp, body) => {
                api.sync(() => {
                    const alert = findAlertByName(api.getAlerts(), NAME);
                    expect(alert.deliverTo).to.be(DELIVER_TO.MAIL);
                    expect(alert.deliverToData).to.be(MAIL);
                    done();
                });
            });
        });

        it('modify:lang', (done) => {
            const alert = findAlertByName(api.getAlerts(), NAME);
            api.modify(alert.id, {lang: 'pl'}, (err, resp, body) => {
                api.sync(() => {
                     const alert = findAlertByName(api.getAlerts(), NAME);
                     expect(alert.lang).to.be('pl');
                     done();
                });
            });
        });

        it('modify:region', (done) => {
            const alert = findAlertByName(api.getAlerts(), NAME);
            api.modify(alert.id, {region: 'RU'}, (err, resp, body) => {
                api.sync(() => {
                     const alert = findAlertByName(api.getAlerts(), NAME);
                     expect(alert.region).to.be('RU');
                     done();
                });
            });
        });

        it('modify:howMany', (done) => {
            const alert = findAlertByName(api.getAlerts(), NAME);
            api.modify(alert.id, {howMany: HOW_MANY.ALL}, (err, resp, body) => {
                api.sync(() => {
                     const alert = findAlertByName(api.getAlerts(), NAME);
                     expect(alert.howMany).to.be(HOW_MANY.ALL);
                     done();
                });
            });
        });

        it('modify:name', (done) => {
            const alert = findAlertByName(api.getAlerts(), NAME);
            api.modify(alert.id, {name: MODIFIED_NAME}, (err, resp, body) => {
                api.sync(() => {
                     const alert = findAlertByName(api.getAlerts(), MODIFIED_NAME);
                     expect(alert.name).to.be(MODIFIED_NAME);
                     done();
                });
            });
        });           

        it('remove', (done) => {
            const alert = findAlertByName(api.getAlerts(), MODIFIED_NAME);
            api.remove(alert.id, (err, resp, body) => {
                api.sync(() => {
                     const alert = findAlertByName(api.getAlerts(), MODIFIED_NAME);
                     expect(alert).to.be(null);
                     done();
                });
            });
        });  

        it('remove NAME 2', (done) => {
            const alert = findAlertByName(api.getAlerts(), NAME + 2);
            api.remove(alert.id, (err, resp, body) => {
                api.sync(() => {
                     const alert = findAlertByName(api.getAlerts(), NAME + 2);
                     expect(alert).to.be(null);
                     done();
                });
            });
        });  
           
    });
});

function generateRandomName() {
    return 'alert-name-' + (+new Date());
}

function findAlertByName(alerts, alertName) {
    return alerts.find(alert => alert.name === alertName) || null;
}