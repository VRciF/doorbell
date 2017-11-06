var ws = null;
var wsserver = null;
var wsport = 8080;
var audioSampleRate = 0;
var audiobit = 0;
var audiotype = '';
var audioEndianess = checkEndian();
var init = false;
var channelName = "";

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

onmessage = function(e) {
  var msg = e.data;
  switch(msg.type){
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
              ws.send(arr);
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

