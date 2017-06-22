process.env.NODE_DEBUG='fs'

var ws = require("nodejs-websocket")
var path = require('path')
var fs = require('fs-extra')
var http = require('http');
var https = require('https');
var base64 = require('base64-js');

var httpServer = null;
var wssServer = null;

var wav = require('wav');
var spawn = require('child_process').spawn;
var mp3Parser = require("mp3-parser");

function broadcastMp3(mp3){
    wssServer.connections.forEach(function(conn){
        conn.sendBinary(mp3);
    });
}


var Inotify = require('inotify').Inotify;
var inotify = new Inotify(); //persistent by default, new Inotify(false) //no persistent 
var data = {}; //used to correlate two events 

const Lame = require("node-lame").Lame;
var doorbellSoundBuffer = null;
 
try{
const decoder = new Lame({
    "output": "buffer"
}).setFile("./doorbell.sounds/Ding-dong.mp3");

decoder.decode()
    .then(() => {
        // Decoding finished
        const buffer = decoder.getBuffer();
        doorbellSoundBuffer = buffer;
    })
    .catch((error) => {
        // Something went wrong
        console.log("some error: ", error);
    });
}catch(e){console.log("decoder failed: ", e); }
var callback = function(event) {
        var mask = event.mask;
        var file = event.name;
        // the purpose of this hell of 'if' statements is only illustrative. 
 
        if (!(mask & Inotify.IN_CLOSE_WRITE)) {
            return;
        }
        if(wssServer.connections.length>0){
            fs.readFile('record/'+file, function(err, data){
                if(err){ console.log("failed reading "+file, err); return; }
                broadcastMp3(data);
            });
        }
}
var home_dir = {
        // Change this for a valid directory in your machine. 
        path:      'record',
        watch_for: Inotify.IN_CLOSE_WRITE,
        callback:  callback
};
var home_watch_descriptor = inotify.addWatch(home_dir);

var ffmpeg = spawn("ffmpeg", ['-loglevel', 'error', '-i', '-', '-f', 'mp3', '-']);
var mpg123 = spawn("mpg123", ['-a', 'hw:1,0', '-']);
ffmpeg.stdout.pipe(mpg123.stdin);

ffmpeg.stderr.on('data', function(data){
  console.log('ffmpeg stderr: ', data.toString());
});
ffmpeg.on('exit', function(code){
  console.log('ffmpeg child process exited with code: ', code.toString());
});

mpg123.stdout.on('data', function (data) {
  console.log('mpg123 stdout: ' + data.toString());
});
mpg123.stderr.on('data', function (data) {
  console.log('mpg123 stderr: ' + data.toString());
});
mpg123.on('exit', function (code) {
  console.log('mpg123 child process exited with code ' + code.toString());
});

var wavWriter = new wav.Writer({
    channels: 1,
    sampleRate: 48000,
    bitDepth: 16
});
wavWriter.pipe(ffmpeg.stdin);

try{
    var wssOptions = {
        key  : fs.readFileSync('./cert/server.key'),
        cert : fs.readFileSync('./cert/server.crt'),
        secure: true,
    };
    wssServer = ws.createServer(wssOptions, function(conn){
        conn.on("binary", function(inStream){

            // Read chunks of binary data and add to the buffer 
            inStream.on("readable", function () {
                var newData = inStream.read();
                if (newData){
                    wavWriter.write(newData);
                }
            })
        });
        conn.on("text", function(data){
            var msg = JSON.parse(data);
            switch(msg.action){
                case "ring":
                    wavWriter.write(doorbellSoundBuffer);
                    break;
            }
        });
        conn.on("error", function(e){});
        conn.on("close", function(code, reason){});
    });
    wssServer.on('listening', function(){
        console.log("[ssl websocket] server in listening state");
    });
    wssServer.on('close', function(){
        console.log("[ssl websocket] server closed");
    });
    wssServer.on('error', function(error){
        console.log("[ssl websocket] error", error);
    });
    wssServer.listen(8080);
}catch(err){
    wssServer = null;
    console.log("[ssl websocket] init error", err);
}

var secureServer = https.createServer({
    key: fs.readFileSync('./cert/server.key'),
    cert: fs.readFileSync('./cert/server.crt'),
    ca: fs.readFileSync('./cert/ca.crt'),
    requestCert: true,
    rejectUnauthorized: false
}, function(request, response){

    if(request.url == "/favicon.ico"){
        response.writeHead(404, []);
        response.end();
        return;
    }

    try {
        console.log(request.url);

        var filePath = path.join(__dirname, request.url.split("?")[0]);
        var head = {};
        if(request.url == '/'){
            filePath = path.join(__dirname, 'index.html');
            head['Content-Type'] = 'text/html';
        }
        var stat = fs.statSync(filePath);
        head['Content-Length'] = stat.size;
        var stat = fs.statSync(filePath);
        response.writeHead(200, head);
        var readStream = fs.createReadStream(filePath);
        readStream.pipe(response);
    } catch(err) {
        console.log(err);
        response.writeHead(500, ['error '+ err.toString()]);
        response.end();
    }
}).listen('443', function() {
    console.log("Secure Express server listening on port 443");
});

// just redirect to https
http.createServer(function (req, res) {
    res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
    res.end();
}).listen(80);

