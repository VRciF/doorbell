(function(exports){
  exports.preprocessPCM = function(arr, backupBuffer) {
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

              return {arr:newArray, backupBuffer: backupBuffer};
  };

  exports.encodeMp3 = function(mp3Encoder, arr){
              var mp3Data = mp3Encoder.encodeBuffer(arr);
              //mp3 = mp3Data;
              var mp3Tail = mp3Encoder.flush();
              var mp3 = new Int8Array(mp3Data.length+mp3Tail.length);
              mp3.set(mp3Data);
              mp3.set(mp3Tail, mp3Data.length);
              //console.log("mp3 size", mp3.length, mp3);
              return mp3;
  };

}(typeof exports === 'undefined' ? this.mediautil = {} : exports));
