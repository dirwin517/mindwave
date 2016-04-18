
// TODO: add more
// http://developer.neurosky.com/docs/doku.php?id=thinkgear_communications_protocol#data_payload_structure
// http://developer.neurosky.com/docs/doku.php?id=thinkgear_communications_protocol#thinkgear_command_bytes
module.exports.Mindwave = function(overrideSerialPort){

    var EventEmitter = require('events').EventEmitter;
    var serialPort = overrideSerialPort || require('serialport');
    var buffy = require('buffy');
    var SerialPort = serialPort.SerialPort;

    var Mindwave = function(){
        this.lockPort = false;
        EventEmitter.call(this);
    };

    Mindwave.prototype.__proto__ = EventEmitter.prototype;

    var Commands = {
        BAUD_9600: 0x00, //9600 baud, normal output mode
        BAUD_1200: 0x01, //1200 baud, normal output mode
        BAUD_57K: 0x02, //57.6k baud, normal+raw output mode
        BAUD_57K_FFT: 0x03, //57.6k baud, FFT output mode

        TOGGLE_RAW: 0x10, //Set/unset to enable/disable raw wave output
        TOGGLE_10BIT_8BIT: 0x11, //Set/unset to use 10-bit/8-bit raw wave output
        TOGGLE_RAW_MARKER: 0x12, //Set/unset to enable/disable raw marker output
        //0x13 //Ignored

        TOGGLE_POOR_QUALITY: 0x20, //Set/unset to enable/disable poor quality output
        TOGGLE_EEG_INT: 0x21, //Set/unset to enable/disable EEG powers (int) output
        TOGGLE_EEG_FLOAT: 0x22, //Set/unset to enable/disable EEG powers (legacy/floats) output
        TOGGLE_BATTERY: 0x23, //Set/unset to enable/disable battery output***

        TOGGLE_ATTENTION: 0x30, //Set/unset to enable/disable attention output
        TOGGLE_MEDITATION: 0x31, //Set/unset to enable/disable meditation output
        //0x32 //Ignored
        //    0x32 //Ignored


        NO_CHANGE: 0x60, //No change
        BAUD_1200_2: 0x61, //1200 baud
        BAUD_9600_2: 0x62, //9600 baud
        BAUD_57K_2: 0x63 //57.6k baud
    };

    var OPCodes = {
        BT_SYNC : 0xAA,
        CODE_EX : 0x55,              // Extended code
        CODE_SIGNAL_QUALITY : 0x02,  // POOR_SIGNAL quality 0-255
        CODE_HEART : 0x03,           // HEART_RATE 0-255
        CODE_ATTENTION : 0x04,       // ATTENTION eSense 0-100
        CODE_MEDITATION : 0x05,      // MEDITATION eSense 0-100
        CODE_BLINK : 0x16,           // BLINK strength 0-255
        CODE_WAVE : 0x80,            // RAW wave value: 2-byte big-endian 2s-complement
        CODE_ASIC_EEG : 0x83,        // ASIC EEG POWER 8 3-byte big-endian integers
        BATTERY_LEVEL : 0x01       //BATTERY Level
    };

    var Emitters = {
        disconnect : 'disconnect',
        error : 'error',
        log : 'log',
        connect : 'connect',
        extended : 'extended',
        battery : 'battery',
        heart : 'heart',
        signal : 'signal',
        attention : 'attention',
        meditation : 'meditation',
        blink : 'blink',
        wave : 'wave',
        eeg : 'eeg'
    };


    var OpCodesToEmitters = {
        0xAA : Emitters.battery,
        0x03 : Emitters.heart,
        0x02 : Emitters.signal,
        0x04 : Emitters.attention,
        0x05 : Emitters.meditation,
        0x16 : Emitters.blink
    };

    Mindwave.prototype.COMMANDS = Commands;
    Mindwave.prototype.OPCODES = OPCodes;
    Mindwave.prototype.EMITTERS = Emitters;

    Mindwave.prototype.autodetect = function(cb){
        return serialPort.list(function (err, ports) {
            if(err){
                return cb(null);
            }
            var possibleMatches = ports.filter(function(port) {
                return port.comName.toLowerCase().indexOf('mindwave') !== -1;
            });
            if(possibleMatches.length === 1){
                return cb(possibleMatches[0].comName);
            }
            return cb(null);
        });
    };



    var connectTo = function connectTo(self, port, baud) {
        self.baud = baud;
        self.port = port;
        // TODO: switch baud code if 57600 for higher res data
        self.serialPort = new SerialPort(self.port, {
            baudrate: self.baud
        }, false);
        self.serialPort.open(function () {
            self.emit('connect');
            self.serialPort.on('data', function (data) {
                self.emit(self.parse(data));
            });
            self.serialPort.on('close', function () {
                self.emit('disconnect','disconnected : ' + port );
            });
        });
    };

    Mindwave.prototype.connect = function(options){
        if(!options){
            options = {};
        }

        var port = options.port;

        var baud = 9600;
        if (options.baud){
            baud = options.baud;
        }

        if (baud !== 9600 && baud !== 57600){
            return this.emit('error', 'Invalid baud. Set to 9600 or 57600');
        }


        if(!options || !options.port) {
            this.emit('log','trying to auto-detect com port');
            var self = this;
            this.autodetect(function(detectedPort){

                if(!detectedPort){
                    return self.emit('error', 'Invalid Connect must include options object w/ port');
                }

                self.emit('log', 'found : ' + detectedPort);
                connectTo(self, detectedPort, baud);
            });
        }
        else{
            connectTo(this, port, baud);
        }
    };

    Mindwave.prototype.command = function(command, cb){
        switch(command){

            case Commands.BAUD_9600:
                break;
            case Commands.BAUD_1200:
                break;
            case Commands.BAUD_57K:
                break;
            case Commands.BAUD_57K_FFT:
                break;
            case Commands.BAUD_1200_2:
                break;
            case Commands.BAUD_9600_2:
                break;
            case Commands.BAUD_57K_2:
                break;
            case Commands.TOGGLE_10BIT_8BIT:
                break;
            case Commands.TOGGLE_EEG_FLOAT:
                break;
            case Commands.TOGGLE_EEG_INT:
                break;

            default :
                this.serialPort.write(command, cb);
        }

    };

    Mindwave.prototype.disconnect = function(optionalCallback){
        var self = this;
        self.serialPort.pause();
        self.serialPort.flush(function(){
            self.serialPort.close(function(){
                self.emit(Emitters.disconnect);
                if(optionalCallback){
                    optionalCallback();
                }
            });
        });
    };

    Mindwave.prototype.parse = function(data){
        var reader = buffy.createReader(data);
        while (reader.bytesAhead() > 2) {
            if (reader.uint8() === OPCodes.BT_SYNC && reader.uint8() === OPCodes.BT_SYNC) {
                var len = reader.uint8();
                var payload = reader.buffer(len);
                this.parsePacket(payload);
            }
        }
    };

    Mindwave.prototype.parsePacket = function(data) {
        var reader = buffy.createReader(data);

        function readPacket(){
            const code = reader.uint8();
            if(code === OPCodes.CODE_ASIC_EEG){
                return this.emit(Emitters.eeg, this.parseEEG(reader.buffer(24)));
            }
            else if(code === OPCodes.CODE_WAVE){
                reader.skip(1);
                return this.emit(Emitters.wave, reader.int16BE());
            }
            else if(code === OPCodes.CODE_EX){
                this.emit(Emitters.extended);
            }
        else {
                this.emit(OpCodesToEmitters[code], reader.uint8());
            }
        }

        while(reader.bytesAhead() > 0) {
            readPacket();
        }
    };

    Mindwave.prototype.parseEEG = function(data) {
        return {
            delta       : this.parse3ByteInteger(data[0], data[1], data[2]),
            theta       : this.parse3ByteInteger(data[3], data[4], data[5]),
            loAlpha     : this.parse3ByteInteger(data[6], data[7], data[8]),
            hiAlpha     : this.parse3ByteInteger(data[9], data[10], data[11]),
            loBeta      : this.parse3ByteInteger(data[12], data[13], data[14]),
            hiBeta      : this.parse3ByteInteger(data[15], data[16], data[17]),
            loGamma     : this.parse3ByteInteger(data[18], data[19], data[20]),
            midGamma    : this.parse3ByteInteger(data[21], data[22], data[23])
        };
    };

    Mindwave.prototype.parse3ByteInteger = function(byte1, byte2, byte3) {
        return (byte1 << 16) |
            (((1 << 16) - 1) & (byte2 << 8)) |
            ((1 << 8) - 1) &
            byte3;
    };

    return new Mindwave();

};