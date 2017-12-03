importScripts('util.js');

var ws = null;
var wsserver = null;
var wsport = 8080;
var init = false;
var channelName = "";

function openWs(){
    if(ws) ws.close();
    ws = new WebSocket("ws://"+wsserver+":"+wsport+"/?channel="+channelName);
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
        var decoded = doorutil.decodeMsg(event.data);
        console.log(event.data, decoded);
        postMessage(decoded);
    }
}

onmessage = function(e) {
  console.log('Message received from main script', e.data);

  var msg = e.data;
  switch(msg.type){
      case "init":
          wsserver  = msg.server;
          wsport    = msg.port;
          channelName = msg.channel;
          init = true;
          openWs();
          break;
  }
}

postMessage({header:{type:'init'}});
