/**
 * Created by dirwin517 on 3/19/16.
 */
var Mindwave = require('./index.js');
var mw = new Mindwave();


mw.on('error', function(data){
    console.log(data);
});

mw.on('log', function(data){
    console.log(data);
});

mw.connect();
