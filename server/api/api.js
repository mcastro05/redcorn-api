'use strict';
// Load modules

const Promise = require('bluebird');
const Request = require('promise-request-retry');


exports.plugin = {
    name: 'api',
    register: function (server) {

        server.route([
            {
                method: 'GET',
                path: '/status',
                handler: async function (request, h) {
                    return {status: 'ok'};
                }
            }
        ]);
    }
};
