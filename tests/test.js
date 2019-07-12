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

        xit('creates', (done) => {
            api.configure({
                cookies: COOKIES
            });
            api.sync(() => {
                const alertToCreate = {
                    name: NAME,
                    howOften: HOW_OFTEN.AT_MOST_ONCE_A_DAY,
                    sources: SOURCE_TYPE.AUTOMATIC,
                    lang: 'en',
                    region: 'PL',
                    howMany: HOW_MANY.BEST,
                    deliverTo: DELIVER_TO.MAIL,
                    deliverToData: 'ffmpeg3@gmail.com',
                };

                api.create(alertToCreate, (err, alert) => {
                    console.log(err)
                    expect(alert.name).to.be(alertToCreate.name);
                    done();
                });
            });
        });

        it('creates mail alert', (done) => {
            api.configure({
                cookies: COOKIES
            });
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

        it('retrive mail alert', (done) => {
            api.configure({
                cookies: COOKIES
            });
            api.sync(() => {
                const alert = findAlertByName(api.getAlerts(), NAME);
                expect(alert.name).to.be(NAME);
                done();
            });
        });

        [
            {howOften: HOW_OFTEN.AS_IT_HAPPENS},
            {howOften: HOW_OFTEN.AT_MOST_ONCE_A_DAY},
            {howOften: HOW_OFTEN.AT_MOST_ONCE_A_WEEK},

            {sources: SOURCE_TYPE.AUTOMATIC},
            {sources: SOURCE_TYPE.NEWS},
            {sources: SOURCE_TYPE.BLOGS},
            {sources: SOURCE_TYPE.WEB},

            {sources: SOURCE_TYPE.NEWS_AND_BLOGS},
            {sources: SOURCE_TYPE.NEWS_AND_WEB},
            {sources: SOURCE_TYPE.BLOGS_AND_WEB},

            {sources: SOURCE_TYPE.VIDEO},
            {sources: SOURCE_TYPE.BOOKS},
            {sources: SOURCE_TYPE.DISCUSSIONS},
            {sources: SOURCE_TYPE.FINANCE},

            { lang: 'pl'},

            { region: 'RU'},

            { howMany: HOW_MANY.BEST },
            { howMany: HOW_MANY.ALL },
            
            { deliverTo: DELIVER_TO.RSS, deliverToData: '' },
            { deliverTo: DELIVER_TO.MAIL, deliverToData: 'ffmpeg3@gmail.com' }
        ].forEach((modifiedData) => xit(`modifing: ${Object.keys(modifiedData)}`, (done) => {
            api.sync((err) => {
                expect(err).to.be(null);
                const alert = findAlertByName(api.getAlerts(), NAME);

                api.modify(alert.id, modifiedData, () => {
                    expect(err).to.be(null);
                    api.sync(() => {
                        const alert = findAlertByName(api.getAlerts(), NAME);
                        expect(alert).to.eql({...alert, ...modifiedData});
                        done();
                    });
                });
            });
        }))

        it('remove NAME', (done) => {
            const alert = findAlertByName(api.getAlerts(), NAME);
            api.remove(alert.id, (err, resp, body) => {
                api.sync(() => {
                     const alert = findAlertByName(api.getAlerts(), NAME);
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