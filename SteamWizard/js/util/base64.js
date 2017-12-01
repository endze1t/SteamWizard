/**
 *
 * @author Ahmed
 * 21 October, 2017
 *
 */

define(function() {
    var base64chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    var base64safe  = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";    
    var base64charsLookup = []
    
    for(var i=0; i < base64charsLookup.length; i++)
        base64charsLookup[i] = -1;

    for(var i=0; i < base64chars.length; i++)
        base64charsLookup[base64chars.charAt(i)] = i;

    /* using url-safe base64 '+' -> '-'  and  '/' -> '_' */
    base64charsLookup['-'] = base64charsLookup['+'];
    base64charsLookup['_'] = base64charsLookup['/'];
    
    function base64decode(base64) {
        /* check for null */
        if(base64 == null || base64.length === 0)
           return null;
        
        /* check length requirements */
        if(base64.length % 4 === 1)
           return null;

        var pad = base64.charAt(base64.length-2) === '=' ? 2 :
                  base64.charAt(base64.length-1) === '=' ? 1 : 0;
          
        var decodedBinary = new Uint8Array((base64.length-pad)*3/4);
        
        var outputIndex = 0;
        var len = base64.length-pad;
        /* each 4 base64 digits represent 3 chars */
        for(var i=0; i < len-3; i+= 4) {
            var a = base64charsLookup[base64[i]];
            var b = base64charsLookup[base64[i+1]];
            var c = base64charsLookup[base64[i+2]];
            var d = base64charsLookup[base64[i+3]];

            if(a < 0 || b < 0 || c < 0 || d < 0)
               return null;

            decodedBinary[outputIndex++] = (a<<2 | b>>4);
            decodedBinary[outputIndex++] = (b<<4 | c>>2);
            decodedBinary[outputIndex++] = (c<<6 | d);
        }

        /* last 3-2 digits */
        var rem = len % 4;
        if(rem !== 0) {
           var a = base64charsLookup[base64[len-rem]];
           var b = base64charsLookup[base64[len-rem+1]];
           
           if(a < 0 || b < 0)
              return null;

            decodedBinary[outputIndex++] = (a<<2 | b>>4);

            if(rem === 3) {
                var c = base64charsLookup[base64[len-1]];

                if(c < 0)
                 return null;
             
              decodedBinary[outputIndex++] = (b<<4 | c>>2);
            }
        }
        return decodedBinary;
    }
    
    function base64encode(binary, safe) {
        if(safe === undefined)
            safe = true;
        
        if(typeof binary === 'string')
            binary = new TextEncoder("utf-8").encode(binary);
            
        /* must be Uint8Array */
        if(Object.prototype.toString.call(binary) !== '[object Uint8Array]')
            return null;
        
        var builder = '';
        var len = binary.length;
        var base64 = safe ? base64safe : base64chars;

        /* each 3 chars represents 4 base64 digits */
        /* 000000-00 0000-0000 00-000000 */
        for(var i=0; i < len-2; i+= 3) {
            var a = (binary[i]   & 0xff) >>> 2;
            var b = (binary[i]   & 0x3) << 4 | ((binary[i+1] & 0xff) >>> 4);
            var c = (binary[i+1] & 0xf) << 2 | ((binary[i+2] & 0xff) >>> 6);
            var d =  binary[i+2] & 0x3F;

            builder += (base64.charAt(a));
            builder += (base64.charAt(b));
            builder += (base64.charAt(c));
            builder += (base64.charAt(d));
        }

        /* check that we have all digits */
        var rem = len % 3;
        if(rem !== 0) {
            var a = (binary[len - rem] & 0xff) >>> 2;
            builder += base64.charAt(a);
            if (rem === 2) {
                var b = (binary[len - 2] & 0x3) << 4 | ((binary[len - 1] & 0xff) >>> 4);
                var c = (binary[len - 1] & 0xf) << 2;
                builder += base64.charAt(b);
                builder += base64.charAt(c);

                if (!safe)
                    builder += "=";
            } else {
                var b = (binary[len - 1] & 0x3) << 4;
                builder += base64.charAt(b);
                if (!safe)
                    builder += "==";
            }
        }

        return builder.toString();
    }
    
    return {
        encode: base64encode,
        decode: base64decode,
    };
});