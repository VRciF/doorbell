var ws = null;
var wsserver = null;
var wsport = 8080;
var audioSampleRate = 0;
var audiobit = 0;
var audiotype = '';
var audioEndianess = checkEndian();
var init = false;
var channelName = "";
var mp3Encoder = null;

importScripts('lame.min.js');
importScripts('bin-json.0.3.1.js');

var json = json();

function checkEndian() {
    var arrayBuffer = new ArrayBuffer(2);
    var uint8Array = new Uint8Array(arrayBuffer);
    var uint16array = new Uint16Array(arrayBuffer);
    uint8Array[0] = 0xAA; // set first byte
    uint8Array[1] = 0xBB; // set second byte
    if(uint16array[0] === 0xBBAA) return 'l'; // little endian
    if(uint16array[0] === 0xAABB) return 'b'; // big endian
    else return 'm'; // mixed endian
}

function openWs(){
    if(ws) ws.close();
    ws = new WebSocket("ws://"+wsserver+":"+wsport+"/?e="+audioEndianess+"&s="+audioSampleRate+"&b="+audiobit+"&t="+audiotype+"&channel="+channelName);
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
      case "webm":
          var payload = json.encode({
            type: 'video',
            encoding: 'webm/h264',
            data: msg.data,
          });
          ws.send(payload);
          break;
      case "mp4":
          var payload = json.encode({
            type: 'video',
            encoding: 'mp4/h264',
            data: msg.data,
          });
          ws.send(payload);
          break;

      case "pcm":
          if(!init){ return; }
          arr = msg.data;
          if(audiobit==0){
              audiobit = 32; audiotype = 'f';
              switch (arr.constructor){
                  case Float32Array: audiobit = 32; audiotype = 'f'; break;
                  case Float64Array: audiobit = 64; audiotype = 'f'; break;
                  case Int8Array: audiobit = 8; audiotype = 's'; break;
                  case Uint8Array: case Uint8ClampedArray: audiobit = 8; audiotype = 'u'; break;
                  case Int16Array: audiobit = 16; audiotype = 's'; break;
                  case Uint16Array: audiobit = 16; audiotype = 'u'; break;
                  case Int32Array: audiobit = 32; audiotype = 's'; break;
                  case Uint32Array: audiobit = 32; audiotype = 'u'; break;
              }
              openWs();
          }
          else if(ws && ws.readyState == 1){
// NewValue = (((OldValue - (-1)) * (0.5 - (-0.5))) / (1 - (-1))) + (-0.5)
// console.log("max: ",Math.max.apply(null, arr));
              //arr.fill(1);

//              var ser = pson.toArrayBuffer({t: 'a', p: arr});
//              console.log("pson:", arr, ser, ser.byteLength, pson.decode(ser));
//              console.log("msgpack:", msgpack.pack({t: 'a', p: arr}));
//              console.log("unpack: ", msgpack.unpack(msgpack.pack({t: 'a', p: arr})));


              var pattern = [1,1,1,1,1,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0];
              var newArray = null;
              if(backupBuffer){
                  newArray = new Float32Array(pattern.length+backupBuffer.length+arr.length+pattern.length);
              }
              else{
                  newArray = new Float32Array(pattern.length+arr.length+pattern.length);
              }
//console.log("channel length: ", arr.byteLength, pattern.length, newArray.length);
              for(var i=0;i<pattern.length;i++){
                  newArray[i] = pattern[i];
                  newArray[newArray.length-pattern.length+i] = pattern[i];
              }
              if(backupBuffer){
                  newArray.set(backupBuffer, pattern.length);
                  newArray.set(arr, pattern.length+backupBuffer.length);
              }
              else{
                  newArray.set(arr, pattern.length);
              }
              backupBuffer = arr.slice(arr.length-1024);


              arr = newArray;

              var len = arr.length;
              var dataAsInt16Array = new Int16Array(len);
              for(var i=0;i < len;i++){
                  var n = arr[i];
                  dataAsInt16Array[i] = Math.max(-32768, Math.min(32768, n < 0 ? n * 32768 : n * 32767));
              }
              arr = dataAsInt16Array;

              //for(var i=0;i<arr.length;i++){
              //    arr[i] = arr[i]*32767.5;
              //}
//              var mp3Encoder = new lamejs.Mp3Encoder(1, 16000, 16);  // encode mono 16khz to 16kbps
              //var mp3Encoder = new lamejs.Mp3Encoder(1, msg.sampleRate, 128);  // encode mono 44.1khz to 128kbps
              if(!mp3Encoder){
                  mp3Encoder = new lamejs.Mp3Encoder(1, msg.sampleRate, 128);  // encode mono 44.1khz to 128kbps
              }
              var mp3Data = mp3Encoder.encodeBuffer(arr);
              //mp3 = mp3Data;
              var mp3Tail = mp3Encoder.flush();
              var mp3 = new Int8Array(mp3Data.length+mp3Tail.length);
              mp3.set(mp3Data);
              mp3.set(mp3Tail, mp3Data.length);
              //console.log("mp3 size", mp3.length, mp3);

              var payload = json.encode({
                type: 'audio',
                encoding: 'mp3',
                data: mp3,
              });
              ws.send(payload);
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
