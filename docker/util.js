(function(exports){
  exports.isNode = function(){
      if(typeof process === 'object' && process + '' === '[object process]')
          return true;
      return false;
  };
  exports.guid = function(){
      function s4() {
          return Math.floor((1 + Math.random()) * 0x10000)
                 .toString(16)
                 .substring(1);
      }
      return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
             s4() + '-' + s4() + s4() + s4();
  };

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

    var encoder = null;
    if(this.isNode()){
        var TextEncoder = require('text-encoding').TextEncoder;
        encoder = new TextEncoder('utf8');
    }
    else{
        encoder = new self.TextEncoder('utf8');
    }
    var uint8jsonobj = encoder.encode(jsonobj);

    var uint8data    = new Uint8Array(data);

    var payload = new Uint8Array(uint8jsonobj.length+uint8data.length+4);
    var length  = new Uint32Array(1);
    length[0]   = uint8jsonobj.length;
    var payload = this.concatTypedArray(length, uint8jsonobj, uint8data);
    return payload;
  };
  exports.decodeMsg = function(message){
      var length = new Uint32Array(message.slice(0,4))[0];
      var jsonbuff = message.slice(4,4+length);

      var decoder = null;
      if(this.isNode()){
          var TextDecoder = require('text-encoding').TextDecoder;
          decoder = new TextDecoder('utf8');
      }
      else{
          decoder = new self.TextDecoder('utf8');
      }
      var str = decoder.decode(jsonbuff);

      var obj = JSON.parse(str);
      return { header: obj, payload: message.slice(4+length) };
  };


}(typeof exports === 'undefined' ? this.doorutil = {} : exports));
