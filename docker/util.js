(function(exports){
  exports.isNode = function(){
      if(typeof process === 'object' && process + '' === '[object process]')
          return true;
      return false;
  }
  exports.guid = function(){
      function s4() {
          return Math.floor((1 + Math.random()) * 0x10000)
                 .toString(16)
                 .substring(1);
      }
      return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
             s4() + '-' + s4() + s4() + s4();
  }

  exports.checkEndian = function(){
      var arrayBuffer = new ArrayBuffer(2);
      var uint8Array = new Uint8Array(arrayBuffer);
      var uint16array = new Uint16Array(arrayBuffer);
      uint8Array[0] = 0xAA; // set first byte
      uint8Array[1] = 0xBB; // set second byte
      if(uint16array[0] === 0xBBAA) return 'l'; // little endian
      if(uint16array[0] === 0xAABB) return 'b'; // big endian
      else return 'm'; // mixed endian
  };
  exports.identifyTypedArray = function(arr){
              switch (arr.constructor){
                  case Float32Array:      return {bit: 32, type: 'f'}; break;
                  case Float64Array:      return {bit: 64, type: 'f'}; break;
                  case Int8Array:         return {bit: 8, type: 's'}; break;
                  case Uint8Array: 
                  case Uint8ClampedArray: return {bit: 8, type: 'u'}; break;
                  case Int16Array:        return {bit: 16, type: 's'}; break;
                  case Uint16Array: return {bit: 16, type: 'u'}; break;
                  case Int32Array: return {bit: 32, type: 's'}; break;
                  case Uint32Array: return {bit: 32, type: 'u'}; break;
              }
  };
  exports.concatTypedArray = function(){
    var finallength = 0;
    var u8arrays = [];
    for(var argno = 0; argno < arguments.length; argno++)
    {
        var arg = arguments[argno];
        var u8arr = new Uint8Array(arg.buffer);
        finallength += u8arr.length;
        u8arrays.push(u8arr);
    }
    var final = new Uint8Array(finallength);
    var pos = 0;
    for(var i=0;i<u8arrays.length;i++){
        var u8 = u8arrays[i];
        final.set(u8, pos);
        pos += u8.length;
    }
    return final;
  };

  exports.encodeMsg = function(obj, data){
    var jsonobj      = JSON.stringify(obj);
    var uint8jsonobj = exports.stringToUint(jsonobj);
    var uint8data    = new Uint8Array(data);

    var payload = new Uint8Array(uint8jsonobj.length+uint8data.length+4);
    var length  = new Uint32Array(1);
    length[0]   = uint8jsonobj.length;
    var payload = exports.concatTypedArray(length, uint8jsonobj, uint8data);
    return payload;
  };
  exports.decodeMsg = function(message){
      var length = new Uint32Array(message.slice(0,4))[0];
      var jsonbuff = message.slice(4,4+length);
      var obj = JSON.parse(jsonbuff.toString('utf8'));
      return { header: obj, payload: message.slice(4+length) };
  };

  exports.stringToUint = function(str) {
    if(!exports.isNode()) return new TextEncoder('utf-8').encode(str); // browser variant

    // nodejs code
    var utf8 = require('utf8');
    return utf8.encode(str);
  };
  exports.uintToString = function(uintArray) {
    if(!exports.isNode()) return new TextDecoder().decode(uintArray);  // browser variant

    // nodejs code
    var utf8 = require('utf8');
    return utf8.decode(uintArray);
  };

}(typeof exports === 'undefined' ? this.doorutil = {} : exports));
