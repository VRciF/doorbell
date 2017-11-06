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
    ws.binaryType = 'arraybuffer';
    ws.onopen = function(){
       console.log("open");
    }
    ws.onerror = function(err){
        console.log("error", err);
        ws.close();
    };
    ws.onclose = function(){
        console.log("onclose");
        ws = null;
    };
    ws.onmessage = function(event){
        postMessage({type:"pcm", data: event.data});
    }
}

onmessage = function(e) {
  console.log('Message received from main script', e.data);

  var msg = e.data;
  switch(msg.type){
      case "init":
          wsserver  = msg.server;
          wsport    = msg.port;
          audioSampleRate = msg.sampleRate;
          channelName = msg.channel;
          init = true;
          openWs();
          break;
  }
}

postMessage({type:'init'});

