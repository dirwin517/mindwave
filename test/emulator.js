/**
 * Created by dirwin517 on 3/19/16.
 */

/**
 * Closurized simulated serialPort module for forcing specific data for testing
 * @param datum
 * @returns {{SerialPort: Function}}
 * @constructor
 */
module.exports.SerialPort = function(datum){

    return {
        SerialPort: function () {
            function open() {

            }

            function on(type, cb) {
                switch (type) {
                    case 'data':
                        cb(datum);
                        break
                }
            }

            function close() {

            }

            function flush() {

            }

            function pause() {

            }

            function write(data, cb) {
            }

            return {
                open: open,
                on: on,
                close: close,
                flush: flush,
                pause: pause,
                write : write
            };
        }
    };
};