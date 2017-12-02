importScripts('lame.min.js');

importScripts('util.js');
importScripts('mediautil.js');

var ws = null;
var wsserver = null;
var wsport = 8080;
var init = false;
var channelName = "";
var mp3Encoder = null;

function openWs(){
    if(ws) ws.close();
    ws = new WebSocket("ws://"+wsserver+":"+wsport+"/?&channel="+channelName);
    ws.onerror = function(err){
        console.log("error", err);
        ws.close();
    };
    ws.onclose = function(){
        console.log("onclose");
        ws = null;
    };
}

var backupBuffer = null;

onmessage = function(e) {
  var msg = e.data;
  switch(msg.type){
      case "video/webm;codecs=vp8":
      case "video/webm;codecs=h264":
            var payload = doorutil.encodeMsg({type: 'video', encoding: msg.type, recordTimes: msg.recordTimes}, msg.data.buffer);
            //var payload = json.encode({
            //  type: 'video',
            //  encoding: 'webm/h264',
            //  data: msg.data,
            //});
            //var payload = json.encode({
            //  type: 'video',
            //  encoding: 'mp4/h264',
            //  data: msg.data,
            //});
            ws.send(payload);
            break;

      case "pcm":
          if(!init){ return; }
          arr = msg.data;
          if(ws && ws.readyState == 1){
              var res = mediautil.preprocessPCM(arr, backupBuffer);
              backupBuffer = res.backupBuffer;
              var mp3 = mediautil.encodeMp3(new lamejs.Mp3Encoder(1, msg.sampleRate, 128), res.arr);

              var payload = doorutil.encodeMsg({type: 'audio', encoding: 'mp3'}, mp3.buffer);
              ws.send(payload);
          }
          else{
              openWs();
          }
          break;
      case "init":
          wsserver  = msg.server;
          wsport    = msg.port;
          audioSampleRate = msg.sampleRate;
          channelName = msg.channel;
          init = true;
          break;
  }
}

postMessage({type:'init'});
