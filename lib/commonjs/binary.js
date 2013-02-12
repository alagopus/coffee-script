(function() {
  var B_ALLOC, B_COPY, B_DECODE, B_DECODE_DEFAULT, B_ENCODE, B_ENCODE_DEFAULT, B_FILL, B_GET, B_LENGTH, B_SET, B_TRANSCODE, Binary, ByteArray, ByteString, engine, numericCompareFunction,
    __slice = [].slice;

  engine = require('binary-engine');

  B_ALLOC = (function(){ function _B_ALLOC(length) {
    var _B_ALLOC;
    return Packages.java.lang.reflect.Array.newInstance(Packages.java.lang.Byte.TYPE, length);
  }; return _B_ALLOC})();

  B_LENGTH = (function(){ function _B_LENGTH(bytes) {
    var _B_LENGTH;
    return bytes.length;
  }; return _B_LENGTH})();

  B_GET = (function(){ function _B_GET(bytes, index) {
    var _B_GET;
    return (bytes[index] >>> 0) & 0xFF;
  }; return _B_GET})();

  B_SET = (function(){ function _B_SET(bytes, index, value) {
    var _B_SET;
    return bytes[index] = (value & 0x80 ? -1 - (value ^ 0xFF) : value);
  }; return _B_SET})();

  B_FILL = (function(){ function _B_FILL(bytes, length, offset, value) {
    var _B_FILL;
    return Packages.java.util.Arrays.fill(bytes, length, offset, value);
  }; return _B_FILL})();

  exports.B_COPY = B_COPY = (function(){ function _B_COPY(src, srcOffset, dst, dstOffset, length) {
    var _B_COPY;
    return Packages.java.lang.System.arraycopy(src, srcOffset, dst, dstOffset, length);
  }; return _B_COPY})();

  B_DECODE = (function(){ function _B_DECODE(bytes, offset, length, codec) {
    var _B_DECODE;
    return String(new Packages.java.lang.String(bytes, offset, length, codec));
  }; return _B_DECODE})();

  B_ENCODE = (function(){ function _B_ENCODE(string, codec) {
    var _B_ENCODE;
    return new Packages.java.lang.String(string).getBytes(codec);
  }; return _B_ENCODE})();

  B_DECODE_DEFAULT = (function(){ function _B_DECODE_DEFAULT(bytes, offset, length) {
    var _B_DECODE_DEFAULT;
    return String(new Packages.java.lang.String(bytes, offset, length, "UTF-8"));
  }; return _B_DECODE_DEFAULT})();

  B_ENCODE_DEFAULT = (function(){ function _B_ENCODE_DEFAULT(string) {
    var _B_ENCODE_DEFAULT;
    return new Packages.java.lang.String(string).getBytes("UTF-8");
  }; return _B_ENCODE_DEFAULT})();

  B_TRANSCODE = (function(){ function _B_TRANSCODE(bytes, offset, length, sourceCodec, targetCodec) {
    var _B_TRANSCODE;
    return new Packages.java.lang.String(bytes, offset, length, sourceCodec).getBytes(targetCodec);
  }; return _B_TRANSCODE})();

  Binary = exports.Binary = (function(){ function _Binary() {}; return _Binary})();

  Object.defineProperty(Binary.prototype, "length", {
    get: (function(){ function _get() {
      var _get;
      return this._length;
    }; return _get})(),
    enumerable: false,
    configurable: false
  });

  Binary.prototype.toArray = (function(){ function _toArray(charset) {
    var array, i, length, string, _toArray;
    if (charset != null) {
      string = B_DECODE(this._bytes, this._offset, this._length, charset);
      length = string.length;
      array = new Array(length);
      i = 0;
      while (i < length) {
        array[i] = string.charCodeAt(i);
        i++;
      }
      return array;
    } else {
      array = new Array(this._length);
      i = 0;
      while (i < this._length) {
        array[i] = this.get(i);
        i++;
      }
      return array;
    }
  }; return _toArray})();

  Binary.prototype.toByteArray = (function(){ function _toByteArray(sourceCodec, targetCodec) {
    var bytes, _toByteArray;
    if (typeof sourceCodec === "string" && typeof targetCodec === "string") {
      bytes = B_TRANSCODE(this._bytes, this._offset, this._length, sourceCodec, targetCodec);
      return new ByteArray(bytes, 0, B_LENGTH(bytes));
    } else {
      return new ByteArray(this);
    }
  }; return _toByteArray})();

  Binary.prototype.toByteString = (function(){ function _toByteString(sourceCodec, targetCodec) {
    var bytes, _toByteString;
    if (typeof sourceCodec === "string" && typeof targetCodec === "string") {
      bytes = B_TRANSCODE(this._bytes, this._offset, this._length, sourceCodec, targetCodec);
      return new ByteString(bytes, 0, B_LENGTH(bytes));
    } else {
      return new ByteString(this);
    }
  }; return _toByteString})();

  Binary.prototype.decodeToString = (function(){ function _decodeToString(charset) {
    var _decodeToString;
    if (charset) {
      if (typeof charset === "number") {
        return require("base" + charset).encode(this);
      } else if (/^base/.test(charset)) {
        return require(charset).encode(this);
      } else {
        return B_DECODE(this._bytes, this._offset, this._length, charset);
      }
    }
    return B_DECODE_DEFAULT(this._bytes, this._offset, this._length);
  }; return _decodeToString})();

  Binary.prototype.get = (function(){ function _get(offset) {
    var _get;
    if (offset < 0 || offset >= this._length) {
      return NaN;
    }
    return B_GET(this._bytes, this._offset + offset);
  }; return _get})();

  Binary.prototype.indexOf = (function(){ function _indexOf(byteValue, start, stop) {
    var array, result, _indexOf;
    array = ByteString.prototype.slice.apply(this, [start, stop]).toArray();
    result = array.indexOf(byteValue);
    if (result < 0) {
      return -1;
    } else {
      return result + (start || 0);
    }
  }; return _indexOf})();

  Binary.prototype.lastIndexOf = (function(){ function _lastIndexOf(byteValue, start, stop) {
    var array, result, _lastIndexOf;
    array = ByteString.prototype.slice.apply(this, [start, stop]).toArray();
    result = array.lastIndexOf(byteValue);
    if (result < 0) {
      return -1;
    } else {
      return result + (start || 0);
    }
  }; return _lastIndexOf})();

  Binary.prototype.valueOf = (function(){ function _valueOf() {
    var _valueOf;
    return this;
  }; return _valueOf})();

  ByteString = exports.ByteString = (function(){ function _ByteString() {
    var args, array, b, copy, i, _ByteString;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    if (!(this instanceof ByteString)) {
      if (args.length === 0) {
        return new ByteString();
      }
      if (args.length === 1) {
        return new ByteString(args[0]);
      }
      if (args.length === 2) {
        return new ByteString(args[0], args[1]);
      }
      if (args.length === 3) {
        return new ByteString(args[0], args[1], args[2]);
      }
    }
    if (args.length === 0) {
      this._bytes = B_ALLOC(0);
      this._offset = 0;
      this._length = 0;
    } else if (args.length === 1 && args[0] instanceof ByteString) {
      return args[0];
    } else if (args.length === 1 && args[0] instanceof ByteArray) {
      copy = args[0].toByteArray();
      this._bytes = copy._bytes;
      this._offset = copy._offset;
      this._length = copy._length;
    } else if (args.length === 1 && Array.isArray(args[0])) {
      array = args[0];
      this._bytes = B_ALLOC(array.length);
      i = 0;
      while (i < array.length) {
        b = array[i];
        if (b < -0x80 || b > 0xFF) {
          throw new Error("ByteString constructor argument Array of integers must be -128 - 255 (" + b + ")");
        }
        B_SET(this._bytes, i, b);
        i++;
      }
      this._offset = 0;
      this._length = B_LENGTH(this._bytes);
    } else if ((args.length === 1 || (args.length === 2 && args[1] === undefined)) && typeof args[0] === "string") {
      this._bytes = B_ENCODE_DEFAULT(args[0]);
      this._offset = 0;
      this._length = B_LENGTH(this._bytes);
    } else if (args.length === 2 && typeof args[0] === "string" && typeof args[1] === "string") {
      this._bytes = B_ENCODE(args[0], args[1]);
      this._offset = 0;
      this._length = B_LENGTH(this._bytes);
    } else if (args.length === 3 && typeof args[1] === "number" && typeof args[2] === "number") {
      this._bytes = args[0];
      this._offset = args[1];
      this._length = args[2];
    } else {
      throw new Error("Illegal arguments to ByteString constructor: " + args.join(', '));
    }
    if (engine.ByteStringWrapper) {
      return engine.ByteStringWrapper(this);
    } else {
      return this;
    }
  }; return _ByteString})();

  ByteString.prototype = new Binary();

  ByteString.prototype.__defineGetter__("length", function() {
    return this._length;
  });

  ByteString.prototype.__defineSetter__("length", function(length) {});

  ByteString.prototype.toString = (function(){ function _toString(charset) {
    var _toString;
    if (charset) {
      return this.decodeToString(charset);
    }
    return "[ByteString " + this._length + "]";
  }; return _toString})();

  ByteString.prototype.byteAt = ByteString.prototype.charAt = (function(){ function _charAt(offset) {
    var byteValue, _charAt;
    byteValue = this.get(offset);
    if (isNaN(byteValue)) {
      return new ByteString();
    }
    return new ByteString([byteValue]);
  }; return _charAt})();

  ByteString.prototype.charCodeAt = Binary.prototype.get;

  ByteString.prototype.split = (function(){ function _split(delimiters, options) {
    var components, count, currentOffset, d, i, includeDelimiter, j, offsetMoved, reachedStop, startOffset, _split;
    options = options || {};
    count = (options.count === undefined ? -1 : options.count);
    includeDelimiter = options.includeDelimiter || false;
    if (!Array.isArray(delimiters)) {
      delimiters = [delimiters];
    }
    delimiters = delimiters.map(function(delimiter) {
      if (typeof delimiter === "number") {
        delimiter = [delimiter];
      }
      return new ByteString(delimiter);
    });
    components = [];
    startOffset = this._offset;
    currentOffset = this._offset;
    while (currentOffset < this._offset + this._length) {
      offsetMoved = false;
      i = 0;
      while (i < delimiters.length) {
        reachedStop = false;
        d = delimiters[i];
        j = 0;
        while (j < d._length) {
          if (currentOffset + j > this._offset + this._length || B_GET(this._bytes, currentOffset + j) !== B_GET(d._bytes, d._offset + j)) {
            reachedStop = true;
            break;
          }
          j++;
        }
        if (!reachedStop) {
          components.push(new ByteString(this._bytes, startOffset, currentOffset - startOffset));
          if (includeDelimiter) {
            components.push(new ByteString(this._bytes, currentOffset, d._length));
          }
          startOffset = currentOffset = currentOffset + d._length;
          offsetMoved = true;
          break;
        }
        i++;
      }
      if (!offsetMoved) {
        currentOffset++;
      }
    }
    if (currentOffset > startOffset) {
      components.push(new ByteString(this._bytes, startOffset, currentOffset - startOffset));
    }
    return components;
  }; return _split})();

  ByteString.prototype.slice = (function(){ function _slice(begin, end) {
    var _slice;
    if (begin === undefined) {
      begin = 0;
    } else {
      if (begin < 0) {
        begin = this._length + begin;
      }
    }
    if (end === undefined) {
      end = this._length;
    } else {
      if (end < 0) {
        end = this._length + end;
      }
    }
    begin = Math.min(this._length, Math.max(0, begin));
    end = Math.min(this._length, Math.max(0, end));
    return new ByteString(this._bytes, this._offset + begin, end - begin);
  }; return _slice})();

  ByteString.prototype.substr = (function(){ function _substr(start, length) {
    var _substr;
    if (start !== undefined) {
      if (length !== undefined) {
        return this.slice(start);
      } else {
        return this.slice(start, start + length);
      }
    }
    return this.slice();
  }; return _substr})();

  ByteString.prototype.substring = (function(){ function _substring(from, to) {
    var _substring;
    if (from !== undefined) {
      if (to !== undefined) {
        return this.slice(Math.max(Math.min(from, this._length), 0));
      } else {
        return this.slice(Math.max(Math.min(from, this._length), 0), Math.max(Math.min(to, this._length), 0));
      }
    }
    return this.slice();
  }; return _substring})();

  ByteString.prototype.toSource = (function(){ function _toSource() {
    var _toSource;
    return "ByteString([" + this.toArray().join(",") + "])";
  }; return _toSource})();

  ByteArray = exports.ByteArray = (function(){ function _ByteArray() {
    var args, array, b, byteArray, i, _ByteArray;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    if (!this instanceof ByteArray) {
      if (args.length === 0) {
        return new ByteArray();
      }
      if (args.length === 1) {
        return new ByteArray(args[0]);
      }
      if (args.length === 2) {
        return new ByteArray(args[0], args[1]);
      }
      if (args.length === 3) {
        return new ByteArray(args[0], args[1], args[2]);
      }
    }
    if (args.length === 0) {
      this._bytes = B_ALLOC(0);
      this._offset = 0;
      this._length = 0;
    } else if (args.length === 1 && typeof args[0] === "number") {
      this._bytes = B_ALLOC(args[0]);
      this._offset = 0;
      this._length = B_LENGTH(this._bytes);
    } else if (args.length === 1 && (args[0] instanceof ByteArray || args[0] instanceof ByteString)) {
      byteArray = new ByteArray(args[0]._length);
      B_COPY(args[0]._bytes, args[0]._offset, byteArray._bytes, byteArray._offset, byteArray._length);
      return byteArray;
    } else if (args.length === 1 && Array.isArray(args[0])) {
      array = args[0];
      this._bytes = B_ALLOC(array.length);
      i = 0;
      while (i < array.length) {
        b = array[i];
        if (b < 0 || b > 0xFF) {
          throw new Error("ByteString constructor argument Array of integers must be 0 - 255 (" + b + ")");
        }
        B_SET(this._bytes, i, b);
        i++;
      }
      this._offset = 0;
      this._length = B_LENGTH(this._bytes);
    } else if ((args.length === 1 || (args.length === 2 && args[1] === undefined)) && typeof args[0] === "string") {
      this._bytes = B_ENCODE_DEFAULT(args[0]);
      this._offset = 0;
      this._length = B_LENGTH(this._bytes);
    } else if (args.length === 2 && typeof args[0] === "string" && typeof args[1] === "string") {
      this._bytes = B_ENCODE(args[0], args[1]);
      this._offset = 0;
      this._length = B_LENGTH(this._bytes);
    } else if (args.length === 3 && typeof args[1] === "number" && typeof args[2] === "number") {
      this._bytes = args[0];
      this._offset = args[1];
      this._length = args[2];
    } else {
      throw new Error("Illegal arguments to ByteString constructor: [" + Array.prototype.join.apply(args, [","]) + "] (" + args.length + ")");
    }
    if (engine.ByteArrayWrapper) {
      return engine.ByteArrayWrapper(this);
    } else {
      return this;
    }
  }; return _ByteArray})();

  ByteArray.prototype = new Binary();

  ByteArray.prototype.__defineGetter__("length", function() {
    return this._length;
  });

  ByteArray.prototype.__defineSetter__("length", function(length) {
    var newBytes;
    if (typeof length !== "number") {
      return;
    }
    if (length === this._length) {

    } else if (length < this._length) {
      return this._length = length;
    } else if (this._offset + length <= B_LENGTH(this._bytes)) {
      B_FILL(this._bytes, this._length, this._offset + length - 1, 0);
      return this._length = length;
    } else if (length <= B_LENGTH(this._bytes)) {
      B_COPY(this._bytes, this._offset, this._bytes, 0, this._length);
      this._offset = 0;
      B_FILL(this._bytes, this._length, this._offset + length - 1, 0);
      return this._length = length;
    } else {
      newBytes = B_ALLOC(length);
      B_COPY(this._bytes, this._offset, newBytes, 0, this._length);
      this._bytes = newBytes;
      this._offset = 0;
      return this._length = length;
    }
  });

  ByteArray.prototype.set = (function(){ function _set(index, b) {
    var _set;
    if (b < 0 || b > 0xFF) {
      throw new Error("ByteString constructor argument Array of integers must be 0 - 255 (" + b + ")");
    }
    if (index < 0 || index >= this._length) {
      throw new Error("Out of range");
    }
    return B_SET(this._bytes, this._offset + index, b);
  }; return _set})();

  ByteArray.prototype.toString = (function(){ function _toString(charset) {
    var _toString;
    if (charset) {
      return this.decodeToString(charset);
    }
    return "[ByteArray " + this._length + "]";
  }; return _toString})();

  ByteArray.prototype.concat = (function(){ function _concat() {
    var args, component, components, i, j, offset, result, subcomponent, totalLength, _concat;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    components = [this];
    totalLength = this._length;
    i = 0;
    while (i < args.length) {
      component = (Array.isArray(args[i]) ? args[i] : [args[i]]);
      j = 0;
      while (j < component.length) {
        subcomponent = component[j];
        if ((!(subcomponent instanceof ByteString)) && (!(subcomponent instanceof ByteArray))) {
          throw "Arguments to ByteArray.concat() must be ByteStrings, ByteArrays, or Arrays of those.";
        }
        components.push(subcomponent);
        totalLength += subcomponent.length;
        j++;
      }
      i++;
    }
    result = new ByteArray(totalLength);
    offset = 0;
    components.forEach(function(component) {
      B_COPY(component._bytes, component._offset, result._bytes, offset, component._length);
      return offset += component._length;
    });
    return result;
  }; return _concat})();

  ByteArray.prototype.pop = (function(){ function _pop() {
    var _pop;
    if (this._length === 0) {
      return undefined;
    }
    this._length--;
    return B_GET(this._bytes, this._offset + this._length);
  }; return _pop})();

  ByteArray.prototype.push = (function(){ function _push() {
    var args, i, length, newLength, _push;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    length = void 0;
    newLength = this.length += length = args.length;
    try {
      i = 0;
      while (i < length) {
        this.set(newLength - length + i, args[i]);
        i++;
      }
    } catch (e) {
      this.length -= length;
      throw e;
    }
    return newLength;
  }; return _push})();

  ByteArray.prototype.extendRight = (function(){ function _extendRight() {
    var _extendRight;
    throw "NYI";
  }; return _extendRight})();

  ByteArray.prototype.shift = (function(){ function _shift() {
    var _shift;
    if (this._length === 0) {
      return undefined;
    }
    this._length--;
    this._offset++;
    return B_GET(this._bytes, this._offset - 1);
  }; return _shift})();

  ByteArray.prototype.unshift = (function(){ function _unshift() {
    var args, copy, _unshift;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    copy = this.slice();
    this.length = 0;
    try {
      this.push.apply(this, args);
      this.push.apply(this, copy.toArray());
      return this.length;
    } catch (e) {
      B_COPY(copy._bytes, copy._offset, this._bytes, this._offset, copy.length);
      this.length = copy.length;
      throw e;
    }
  }; return _unshift})();

  ByteArray.prototype.extendLeft = (function(){ function _extendLeft() {
    var _extendLeft;
    throw "NYI";
  }; return _extendLeft})();

  ByteArray.prototype.reverse = (function(){ function _reverse() {
    var i, limit, tmp, top, _reverse;
    limit = Math.floor(this._length / 2) + this._offset;
    top = this._length - 1;
    i = this._offset;
    while (i < limit) {
      tmp = B_GET(this._bytes, i);
      B_SET(this._bytes, i, B_GET(this._bytes, top - i));
      B_SET(this._bytes, top - i, tmp);
      i++;
    }
    return this;
  }; return _reverse})();

  ByteArray.prototype.slice = (function(){ function _slice() {
    var args, _slice;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return new ByteArray(ByteString.prototype.slice.apply(this, args));
  }; return _slice})();

  numericCompareFunction = (function(){ function _numericCompareFunction(o1, o2) {
    var _numericCompareFunction;
    return o1 - o2;
  }; return _numericCompareFunction})();

  ByteArray.prototype.sort = (function(){ function _sort(compareFunction) {
    var array, i, _results, _sort;
    array = this.toArray();
    if (compareFunction != null) {
      array.sort(compareFunction);
    } else {
      array.sort(numericCompareFunction);
    }
    i = 0;
    _results = [];
    while (i < array.length) {
      this.set(i, array[i]);
      _results.push(i++);
    }
    return _results;
  }; return _sort})();

  ByteArray.prototype.splice = (function(){ function _splice() {
    var end, howMany, index, inject, keep, remove, _splice;
    index = arguments[0], howMany = arguments[1], inject = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
    if (index === undefined) {
      return;
    }
    if (index < 0) {
      index += this.length;
    }
    if (howMany === undefined) {
      howMany = this._length - index;
    }
    end = index + howMany;
    remove = this.slice(index, end);
    keep = this.slice(end);
    this._length = index;
    this.push.apply(this, inject);
    this.push.apply(this, keep.toArray());
    return remove;
  }; return _splice})();

  ByteArray.prototype.split = (function(){ function _split() {
    var args, components, i, _split;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    components = ByteString.prototype.split.apply(this.toByteString(), args);
    i = 0;
    while (i < components.length) {
      components[i] = new ByteArray(components[i]._bytes, components[i]._offset, components[i]._length);
      i++;
    }
    return components;
  }; return _split})();

  ByteArray.prototype.filter = (function(){ function _filter(callback, thisObject) {
    var i, length, result, value, _filter;
    result = new ByteArray(this._length);
    i = 0;
    length = this._length;
    while (i < length) {
      value = this.get(i);
      if (callback.apply(thisObject, [value, i, this])) {
        result.push(value);
      }
      i++;
    }
    return result;
  }; return _filter})();

  ByteArray.prototype.forEach = (function(){ function _forEach(callback, thisObject) {
    var i, length, _forEach, _results;
    i = 0;
    length = this._length;
    _results = [];
    while (i < length) {
      callback.apply(thisObject, [this.get(i), i, this]);
      _results.push(i++);
    }
    return _results;
  }; return _forEach})();

  ByteArray.prototype.every = (function(){ function _every(callback, thisObject) {
    var i, length, _every;
    i = 0;
    length = this._length;
    while (i < length) {
      if (!callback.apply(thisObject, [this.get(i), i, this])) {
        return false;
      }
      i++;
    }
    return true;
  }; return _every})();

  ByteArray.prototype.some = (function(){ function _some(callback, thisObject) {
    var i, length, _some;
    i = 0;
    length = this._length;
    while (i < length) {
      if (callback.apply(thisObject, [this.get(i), i, this])) {
        return true;
      }
      i++;
    }
    return false;
  }; return _some})();

  ByteArray.prototype.map = (function(){ function _map(callback, thisObject) {
    var i, length, result, _map;
    result = new ByteArray(this._length);
    i = 0;
    length = this._length;
    while (i < length) {
      result.set(i, callback.apply(thisObject, [this.get(i), i, this]));
      i++;
    }
    return result;
  }; return _map})();

  ByteArray.prototype.reduce = (function(){ function _reduce(callback, initialValue) {
    var i, length, value, _reduce;
    value = initialValue;
    i = 0;
    length = this._length;
    while (i < length) {
      value = callback(value, this.get(i), i, this);
      i++;
    }
    return value;
  }; return _reduce})();

  ByteArray.prototype.reduceRight = (function(){ function _reduceRight(callback, initialValue) {
    var i, value, _reduceRight;
    value = initialValue;
    i = this._length - 1;
    while (i > 0) {
      value = callback(value, this.get(i), i, this);
      i--;
    }
    return value;
  }; return _reduceRight})();

  ByteArray.prototype.displace = (function(){ function _displace(begin, end) {
    var _displace;
    throw "NYI";
  }; return _displace})();

  ByteArray.prototype.toSource = (function(){ function _toSource() {
    var _toSource;
    return "ByteArray([" + this.toArray().join(",") + "])";
  }; return _toSource})();

}).call(this);

// Generated by CoffeeScript 1.5.0-pre
