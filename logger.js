const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.simple(),
    transports: [
        new winston.transports.File({ filename: './logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: './logs/combined.log' }),
    ],
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple(),
    }));
}

// Store the original console methods
const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info
};

function redirectConsoleToWinston(methodName, level) {
    console[methodName] = (...args) => {
        logger[level](...args);
        if (process.env.NODE_ENV !== 'production') originalConsole[methodName](...args);
    };
}

// Redirect console methods to Winston
redirectConsoleToWinston('log', 'info');
redirectConsoleToWinston('error', 'error');
redirectConsoleToWinston('warn', 'warn');
redirectConsoleToWinston('info', 'info');

exports.logger = logger;