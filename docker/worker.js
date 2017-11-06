onmessage = function(e) {
  console.log('Message received from main script', e.data);
}
/*
var i=0;
function timedCount() {
    i=i+1;
    postMessage(i);
    setTimeout("timedCount()", 1000);
}

timedCount();
*/
