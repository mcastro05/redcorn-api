'use strict';

const Boom = require('boom')  
const Redis = require('ioredis')  
const RequestIp = require('request-ip')  
const RateLimiter = require('async-ratelimiter')

async function register (server, options) {  
    console.log(options);
    const config = Object.assign({},
        {
        namespace: 'hapi-rate-limitor',
        db: new Redis(options.redis)
        },
        options
    )

    const rateLimiter = new RateLimiter(config);

    const getRateLimit = async function (request, decrease) {

        // detect client IP address
        const clientIP = RequestIp.getClientIp(request);

        // find IP-related rate limit
        const rateLimit = await rateLimiter.get({ id: clientIP, decrease: decrease });
        return rateLimit;
    };

    /**
     * Decorate the request with a `rateLimit` property.
     * This property stores the request’s rate limit
     * details for the response headers.
     */
    server.decorate('request', 'rateLimit', getRateLimit);

    /**
     * Extend the request lifecycle and check whether
     * the request exceeds the rate limit.
     */
    server.ext('onRequest', async (request, h) => {
        const rateLimit = await request.rateLimit(request, true);
        
        // proceed request lifecycle or throw rate limit exceeded error
        if (!rateLimit.remaining) {
            throw Boom.tooManyRequests('You have exceeded the request limit');
        }

        return h.continue;
    })

    /**
     * Extend response with rate-limit related headers
     * before sending the response. Append the headers
     * also on an error response.
     */
    server.ext('onPreResponse', async (request) => {
        const rateLimit = await request.rateLimit(request, false);
      
        const { total, remaining, reset } = rateLimit
        const response = request.response

        if (response.isBoom) {
            response.output.headers['X-Rate-Limit-Limit'] = total
            response.output.headers['X-Rate-Limit-Remaining'] = Math.max(0, remaining - 1)
            response.output.headers['X-Rate-Limit-Reset'] = reset

            return response
        }

        return response
        .header('X-Rate-Limit-Limit', total)
        .header('X-Rate-Limit-Remaining', Math.max(0, remaining - 1))
        .header('X-Rate-Limit-Reset', reset)
    })
}

exports.plugin = {
    name: 'rate-limiter',  
    register,
    once: true
}