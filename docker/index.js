const WebSocket = require('ws');
var path = require('path');
var http = require('http');
var fs = require('fs-extra');
const url = require('url');
var exec = require('child_process').exec;

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
      wss.clients.forEach(function each(client) {
          console.log(ws.uuid, ws.channel, client.uuid, client.channel);
          if (client.readyState === WebSocket.OPEN && client.uuid != ws.uuid && client.channel == ws.channel) {
              client.send(message);
          }
      });
  });
});

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

function handleMicrophones(){
    parseArecord();
}

function parseArecord(){
    exec("arecord -l", function(error, output, err){
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
            console.log(result);
        }
    });
}

setInterval(handleMicrophones, 1000);

