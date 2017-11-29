const WebSocket = require('ws');
var path = require('path');
var http = require('http');
var fs = require('fs-extra');
const url = require('url');
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

var httpServer = null;
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', function connection(ws, req) {
  const location = url.parse(req.url, true);
  console.log("connection received: ", location.query);

  ws.endianess  = location.query.e;  // l,b,m
  ws.sampleRate = location.query.s;
  ws.bit        = location.query.b;  // 8,16,32
  ws.signedness = location.query.t;  // f,s,u
  ws.channel    = location.query.channel;
  ws.uuid       = guid();

  ws.on('message', function (message) {
        var length = new Uint32Array(message.slice(0,4))[0];
        var jsonbuff = message.slice(4,4+length);
        var obj = JSON.parse(jsonbuff.toString('utf8'));

        if(obj.type=='video'){
            var now = new Date().getTime();
            var ffmpeg = null;
            var filename = "/tmp/vid."+ws.uuid+"."+now+".mp4";
            var video = message.slice(4+length);
            switch(obj.encoding){
                case 'video/webm;codecs=vp8':
                    //console.log("vp8 transcoder");
                    ffmpeg = spawn('ffmpeg', ['-i', 'pipe:0', '-f', 'webm', '-qscale', '0', filename]);
                    break;
                case 'video/webm;codecs=h264':
                    //console.log("h264 transcoder");
                    ffmpeg = spawn('ffmpeg', ['-i', 'pipe:0', '-f', 'webm', '-c:v', 'copy', filename]);
                    // transcode to mp4
                    break;
            }
            ffmpeg.on('exit', function(){
                //console.log("ffmpeg exit!!");
                try{
                    fs.readFile(filename, 'utf8', function(err, data){
                        if(!err){
                            var newMessage = new Uint8Array(4+length+data.length);
                            newMessage.set(message.slice(0,4+length));
                            newMessage.set(data, 4+length);
                            newMessage = message;
                            broadcastAudioChunk(ws.uuid, ws.channel, message);
                        }
                        try{
                            //console.log("unlink file success");
                            fs.unlinkSync(filename);
                        }catch(e){}
                    });
                }catch(e){
                    try{
                        //console.log("unlink file error");
                        fs.unlinkSync(filename);
                    }catch(e){}
                }
            });
            ffmpeg.stderr.on('data', function (data) {
                //console.log('grep stderr: ' + data);
            });
            ffmpeg.stdin.end(video);
        }
        else{
            broadcastAudioChunk(ws.uuid, ws.channel, message);
        }
  });
});

function broadcastAudioChunk(originDevice, destinationChannel, pcm){
    //console.log("broadcast");
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN && client.uuid != originDevice && (destinationChannel == "*" || client.channel == destinationChannel)) {
            client.send(pcm);
        }
    });
}

httpServer = http.createServer(function(request, response){
    try {
        console.log(request.url);

        var filePath = path.join(__dirname, request.url);
        var head = {};
        switch(request.url){
            case '/favicon.ico':
                response.end('test\n');
                return;
            case "/":
                filePath = path.join(__dirname, 'index.html');
                head['Content-Type'] = 'text/html';
                break;
            default:
                head['Content-Type'] = 'text/html';
                break;
        }
        var stat = fs.statSync(filePath);
        head['Content-Length'] = stat.size;
        var stat = fs.statSync(filePath);
        response.writeHead(200, head);
        var readStream = fs.createReadStream(filePath);
        readStream.pipe(response);

        //log the request on console
        //console.log(request.url);
        //Disptach
        //dispatcher.dispatch(request, response);
    } catch(err) {
        console.log(err);
    }
});

httpServer.listen(80, function(){
    console.log("server listening");
});

var microphones = {};
var currentMic = null;
var ffmpegProc = null;

function handleMicrophones(){
    return;
    parseArecord();
    if(Object.keys(microphones).length <= 0){
        return;
    }
    if(!currentMic || !(currentMic in microphones)){
        var firstMic = Object.keys(microphones)[0];
        currentMic = firstMic;
        if(ffmpegProc){ ffmpegProc.kill(); }
        ffmpegProc = spawn("ffmpeg", ["-loglevel","error","-f","alsa","-i","hw:"+microphones[firstMic].hw,"-f","f32le","-acodec","pcm_f32le","-ac","1","-ar","16000","-"]);
        ffmpegProc.stdout.on('data', function(pcm){
            broadcastAudioChunk(currentMic, "*", pcm);
        });
        ffmpegProc.stderr.on('data', function(errstr){ console.log("ffmpeg error: ", errstr.toString('utf8')); ffmpegProc.kill(); });
        ffmpegProc.on('close', function(){});
    }
}

function parseArecord(){
    exec("arecord -l", function(error, output, err){
        var newMics = {};
        var cardlines = output.match(/card .*/g);
        for(var i=0;i<cardlines.length;i++){
            var line = cardlines[i];
            var parts = line.split(',');
            var card = parts[0].split(':');
            card[0] = parseInt(card[0].match(/\d+/)[0]);
            card[1] = card[1].trim();
            var device = parts[1].split(':');
            device[0] = parseInt(device[0].match(/\d+/)[0]);
            device[1] = device[1].trim();
            var result = {card: {id: card[0], name: card[1]}, device: {id: device[0], name: device[1]}, hw: card[0]+","+device[0], name: card[1]+","+device[1]};
//            console.log(result);
            newMics[result.hw+":"+result.name] = result;
        }
        microphones = newMics;
    });
}

setInterval(handleMicrophones, 1000);
