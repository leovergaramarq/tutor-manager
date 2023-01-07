import { PORT } from './config.js';

/**
 * Module dependencies.
 */

import app from './app.js';
import debug from 'debug';

/**
 * Get port from environment and store in Express.
 */

app.set('port', PORT || 5000);

/**
 * Listen on provided port, on all network interfaces.
 */
app.listen(app.get('port'), () => {
    console.log(`Server listening on ${PORT}`);
});
app.on('error', onError);
app.on('listening', onListening);

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    const bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
    const addr = server.address();
    const bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
    debug('backend:server')('Listening on ' + bind);
}
