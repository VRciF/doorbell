const WebSocket = require('ws');
var path = require('path');
var http = require('http');
var fs = require('fs-extra');
const url = require('url');

var httpServer = null;
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', function connection(ws, req) {
  const location = url.parse(req.url, true);
  console.log(location.query);

  ws.endianess  = location.query.e;  // l,b,m
  ws.sampleRate = location.query.s;
  ws.bit        = location.query.b;  // 8,16,32
  ws.signedness = location.query.t;  // f,s,u

  ws.on('message', function incoming(message) {
    //console.log('received: %s', message);
  });

  ws.send('something');
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
            default:
                filePath = path.join(__dirname, 'index.html');
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

