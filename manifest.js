'use strict';
// Load modules

const Confidence = require('confidence');
const Config = require('./config');
const Chalk = require('chalk');


const criteria = {
    env: process.env.NODE_ENV
};


const manifest = {
    server: {
        debug: {
            $filter: 'env',
            production: false,
            $default: {
                request: ['error']
            }
        },
        port: Config.get('/port/api'),
        routes: {
            cors: Config.get('/routes/cors'),
            security: Config.get('/routes/security')
        }
    },
    register: {
        plugins: [
           
            './server/plugins/gracefully',
            // {
            //     plugin: 'hapi-cron',
            //     options: {
            //         jobs: [
            //             {
            //                 name: 'check-for-sms',
            //                 time: '0 23 * * *',
            //                 timezone: Config.get('/cron/timezone'),
            //                 request: {
            //                     method: 'GET',
            //                     url: `${Config.get('/routes/prefix')}/sms-checker`
            //                 },
            //                 onComplete: () => {
            //
            //                     console.info(Chalk.green(`SMS checked finished.`));
            //                 }
            //             }
            //         ]
            //     }
            // },
            // './server/plugins/knack',
            {

                plugin: 'good',
                options: {
                    ops: {
                        interval: 1000
                    },
                    reporters: {
                        console: [
                            {
                                module: 'good-squeeze',
                                name: 'Squeeze',
                                args: [{ log: '*', response: '*' }]
                            },
                            {
                                module: 'good-console',
                                args: [{
                                    format: 'DD/MM/YY hh:MM a',
                                    utc: false
                                }]
                            },
                            'stdout'
                        ]
                    }
                }
            },
            './server/plugins/knack',
            {
                plugin: './server/api/api',
                routes: {
                    prefix: Config.get('/routes/prefix')
                }
            }
        ]
    }
};


const store = new Confidence.Store(manifest);


exports.get = function (key) {

    return store.get(key, criteria);
};


exports.meta = function (key) {

    return store.meta(key, criteria);
};
