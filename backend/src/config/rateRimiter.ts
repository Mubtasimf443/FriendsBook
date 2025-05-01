/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import expressRateLimit from 'express-rate-limit'

function rateLimiter(time: number = 600, request: number = 200) {
    return expressRateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 100,
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        message: JSON.stringify({
            success: false,
            error: {
                message: 'You have reached the maximum number of requests allowed in a short period of time. Your access has been temporarily restricted for 10 minutes to ensure system stability. Please wait until this brief cooling period ends, after which your normal access will be automatically restored. Thank you for your understanding. '
            },
            data: null,
        })
    })
}