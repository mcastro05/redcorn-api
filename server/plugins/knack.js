'use strict';
// Load modules

// const Request = require('request-promise');
const Request = require('promise-request-retry');
const QueryString = require('querystring');


// Declare internals

const internals = {};


internals.knack = {
    protocol: 'https',
    host: 'us-api.knack.com',
    apiVer: '/v1'
};


exports.plugin = {
    name: 'Knack',
    register: function (server) {

        server.expose('create', internals.create);
        server.expose('delete', internals.delete);
        server.expose('find', internals.find);
        server.expose('update', internals.update);
        server.expose('objects', internals.objects);
    }
};


internals.getUri = function () {

    const { knack } = internals;
    return `${knack.protocol}://${knack.host}${knack.apiVer}`;
};

internals.objects = () => {

    return {
        blr: 'object_95'
    };
};

internals.acceptedErrorCodes = () => {
    const sArray = [];

    for (let i = 0; i < 52; i++) {
        const status = 400 + i;
        sArray.push(status);
    }   

    return sArray;
};

internals.update = (info) => {

    const options = {
        uri: `${internals.getUri()}/objects/${info.objectKey}/records/${info.id}`,
        method: 'PUT',
        form: info.body,
        headers: {
            'X-Knack-Application-ID': info.appID || process.env.KNACK_APP_ID,
            'X-Knack-REST-API-Key': info.apiKey || process.env.KNACK_API_KEY
        },
        retry : 3,
        accepted: internals.acceptedErrorCodes(),
        delay: 5000
    };

    return Request(options);
};


internals.create = (info) => {

    const options = {
        uri: `${internals.getUri()}/objects/${info.objectKey}/records`,
        method: 'POST',
        form: info.body,
        headers: {
            'X-Knack-Application-ID': info.appID || process.env.KNACK_APP_ID,
            'X-Knack-REST-API-Key': info.apiKey || process.env.KNACK_API_KEY
        },
        retry : 3,
        accepted: internals.acceptedErrorCodes(),
        delay: 5000
    };

    return Request(options);
};

internals.delete = (info) => {

    const options = {
        uri: `${internals.getUri()}/objects/${info.objectKey}/records/${info.id}`,
        method: 'DELETE',
        headers: {
            'X-Knack-Application-ID': info.appID || process.env.KNACK_APP_ID,
            'X-Knack-REST-API-Key': info.apiKey || process.env.KNACK_API_KEY
        },
        retry : 3,
        accepted: internals.acceptedErrorCodes(),
        delay: 5000
    };

    return Request(options);
};

internals.find = (info) => {

    const query = QueryString.stringify({
        page: info.page || 1,
        rows_per_page: info.rowsPerPage || 1000,
        filters: JSON.stringify(info.filters || [])
    });
    const options = {
        uri: `${internals.getUri()}/objects/${info.objectKey}/records?${query}`,
        method: 'GET',
        json: true,
        headers: {
            'X-Knack-Application-ID': info.appID || process.env.KNACK_APP_ID,
            'X-Knack-REST-API-Key': info.apiKey || process.env.KNACK_API_KEY
        },
        retry : 3,
        accepted: internals.acceptedErrorCodes(),
        delay: 5000
    };

    return Request(options);
};
