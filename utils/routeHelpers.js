function asyncHandler(handler) {
    return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function toInt(value, fallback = null) {
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? fallback : parsed;
}

function toNumber(value, fallback = null) {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? fallback : parsed;
}

function normalizeError(err) {
    return {
        status: err.number && err.number >= 50000 ? 400 : err.status || 500,
        message: err.message || 'Something went wrong.'
    };
}

module.exports = { asyncHandler, toInt, toNumber, normalizeError };
