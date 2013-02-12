(function() {
  var ByteIO, IO, StringIO,
    __slice = [].slice;

  IO = exports.IO = (function(){ function _IO(inputStream, outputStream) {
    var _IO;
    this.inputStream = inputStream;
    this.outputStream = outputStream;
    return this;
  }; return _IO})();

  IO.prototype.readInto = (function(){ function _readInto(buffer, length, from) {
    var bytes, bytesRead, offset, total, _readInto;
    bytes = buffer._bytes;
    offset = buffer._offset;
    if (typeof from === "number") {
      offset += from;
    }
    if (length > bytes.length + offset) {
      throw "FIXME: Buffer too small. Throw or truncate?";
    }
    total = 0;
    bytesRead = 0;
    while (total < length) {
      bytesRead = this.inputStream.read(bytes, offset + total, length - total);
      if (bytesRead < 0) {
        break;
      }
      total += bytesRead;
    }
    return total;
  }; return _readInto})();

  IO.prototype.writeInto = (function(){ function _writeInto(buffer, from, to) {
    var _writeInto;
    return this.outputStream.write(buffer._bytes, buffer._offset + from, to - from);
  }; return _writeInto})();

  IO.prototype.isatty = (function(){ function _isatty() {
    var _isatty;
    return false;
  }; return _isatty})();

  IO.prototype.copy = (function(){ function _copy(output, mode, options) {
    var buffer, _copy;
    while (true) {
      buffer = this.read(null);
      if (!buffer.length) {
        break;
      }
      output.write(buffer);
    }
    output.flush();
    return this;
  }; return _copy})();

  IO.prototype.flush = (function(){ function _flush() {
    var _flush;
    this.outputStream.flush();
    return this;
  }; return _flush})();

  IO.prototype.close = (function(){ function _close() {
    var _close;
    if (this.inputStream) {
      this.inputStream.close();
    }
    if (this.outputStream) {
      return this.outputStream.close();
    }
  }; return _close})();

  exports.TextInputStream = (function(){ function _TextInputStream(raw, lineBuffering, buffering, charset, options) {
    var self, stream, _TextInputStream;
    stream = void 0;
    if (charset === undefined) {
      stream = new Packages.java.io.InputStreamReader(raw.inputStream);
    } else {
      stream = new Packages.java.io.InputStreamReader(raw.inputStream, charset);
    }
    if (buffering === undefined) {
      stream = new Packages.java.io.BufferedReader(stream);
    } else {
      stream = new Packages.java.io.BufferedReader(stream, buffering);
    }
    self = this;
    self.raw = raw;
    self.readLine = (function(){ function _readLine() {
      var line, _readLine;
      line = stream.readLine();
      if (line === null) {
        return "";
      }
      return String(line) + "\n";
    }; return _readLine})();
    self.next = (function(){ function _next() {
      var line, _next;
      line = stream.readLine();
      if (line === null) {
        throw StopIteration;
      }
      return String(line);
    }; return _next})();
    self.iterator = (function(){ function _iterator() {
      var _iterator;
      return self;
    }; return _iterator})();
    self.forEach = (function(){ function _forEach(block, context) {
      var line, _forEach, _results;
      line = void 0;
      _results = [];
      while (true) {
        try {
          line = self.next();
        } catch (exception) {
          break;
        }
        _results.push(block.call(context, line));
      }
      return _results;
    }; return _forEach})();
    self.input = (function(){ function _input() {
      var _input;
      throw "NYI";
    }; return _input})();
    self.readLines = (function(){ function _readLines() {
      var line, lines, _readLines;
      lines = [];
      while (true) {
        line = self.readLine();
        if (line.length) {
          lines.push(line);
        }
        if (!line.length) {
          break;
        }
      }
      return lines;
    }; return _readLines})();
    self.read = (function(){ function _read() {
      var _read;
      return self.readLines().join("");
    }; return _read})();
    self.readInto = (function(){ function _readInto(buffer) {
      var _readInto;
      throw "NYI";
    }; return _readInto})();
    self.copy = (function(){ function _copy(output, mode, options) {
      var line, _copy;
      while (true) {
        line = self.readLine();
        output.write(line).flush();
        if (!line.length) {
          break;
        }
      }
      return self;
    }; return _copy})();
    self.close = (function(){ function _close() {
      var _close;
      return stream.close();
    }; return _close})();
    return Object.create(self);
  }; return _TextInputStream})();

  exports.TextOutputStream = (function(){ function _TextOutputStream(raw, lineBuffering, buffering, charset, options) {
    var self, stream, _TextOutputStream;
    stream = void 0;
    if (charset === undefined) {
      stream = new Packages.java.io.OutputStreamWriter(raw.outputStream);
    } else {
      stream = new Packages.java.io.OutputStreamWriter(raw.outputStream, charset);
    }
    if (buffering === undefined) {
      stream = new Packages.java.io.BufferedWriter(stream);
    } else {
      stream = new Packages.java.io.BufferedWriter(stream, buffering);
    }
    self = this;
    self.raw = raw;
    self.write = (function(){ function _write() {
      var args, _write;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      stream.write.apply(stream, args);
      return self;
    }; return _write})();
    self.writeLine = (function(){ function _writeLine(line) {
      var _writeLine;
      self.write(line + "\n");
      return self;
    }; return _writeLine})();
    self.writeLines = (function(){ function _writeLines(lines) {
      var _writeLines;
      lines.forEach(self.writeLine);
      return self;
    }; return _writeLines})();
    self.print = (function(){ function _print() {
      var args, _print;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      self.write(Array.prototype.join.call(args, " ") + "\n");
      self.flush();
      return self;
    }; return _print})();
    self.flush = (function(){ function _flush() {
      var _flush;
      stream.flush();
      return self;
    }; return _flush})();
    self.close = (function(){ function _close() {
      var _close;
      stream.close();
      return self;
    }; return _close})();
    return Object.create(self);
  }; return _TextOutputStream})();

  exports.TextIOWrapper = (function(){ function _TextIOWrapper(raw, mode, lineBuffering, buffering, charset, options) {
    var _TextIOWrapper;
    if (mode.update) {
      return new exports.TextIOStream(raw, lineBuffering, buffering, charset, options);
    } else if (mode.write || mode.append) {
      return new exports.TextOutputStream(raw, lineBuffering, buffering, charset, options);
    } else if (mode.read) {
      return new exports.TextInputStream(raw, lineBuffering, buffering, charset, options);
    } else {
      throw new Error("file must be opened for read, write, or append mode.");
    }
  }; return _TextIOWrapper})();

  ByteIO = exports.ByteIO = (function(){ function _ByteIO(binary) {
    var stream, _ByteIO;
    this.inputStream = (binary ? new java.io.ByteArrayInputStream(binary._bytes, binary._offset, binary._length) : null);
    this.outputStream = new java.io.ByteArrayOutputStream();
    stream = (this.inStream, this.outStream);
    return this.length = (binary ? binary.length : 0);
  }; return _ByteIO})();

  ByteIO.prototype = new exports.IO();

  ByteIO.prototype.toByteString = (function(){ function _toByteString() {
    var ByteString, bytes, _toByteString;
    bytes = this.outputStream.toByteArray();
    ByteString = require("binary").ByteString;
    return new ByteString(bytes, 0, bytes.length);
  }; return _toByteString})();

  ByteIO.prototype.decodeToString = (function(){ function _decodeToString(charset) {
    var _decodeToString;
    return String((charset ? this.outputStream.toString(charset) : this.outputStream.toString()));
  }; return _decodeToString})();

  StringIO = exports.StringIO = (function(){ function _StringIO(initial, delimiter) {
    var buffer, copy, length, next, read, self, write, _StringIO;
    length = (function(){ function _length() {
      var _length;
      return buffer.length();
    }; return _length})();
    read = (function(){ function _read(length) {
      var result, _read;
      if (length != null) {
        if (!length || length < 1) {
          length = 1024;
        }
        length = Math.min(buffer.length(), length);
        result = String(buffer.substring(0, length));
        buffer["delete"](0, length);
        return result;
      } else {
        result = String(buffer);
        buffer["delete"](0, buffer.length());
        return result;
      }
    }; return _read})();
    write = (function(){ function _write(text) {
      var _write;
      buffer.append(text);
      return self;
    }; return _write})();
    copy = (function(){ function _copy(output) {
      var _copy;
      output.write(read()).flush();
      return self;
    }; return _copy})();
    next = (function(){ function _next() {
      var pos, result, _next;
      if (buffer.length() === 0) {
        throw StopIteration;
      }
      pos = buffer.indexOf(delimiter);
      if (pos === -1) {
        pos = buffer.length();
      }
      result = read(pos);
      read(1);
      return result;
    }; return _next})();
    buffer = new java.lang.StringBuffer();
    if (!delimiter) {
      delimiter = "\n";
    }
    if (initial) {
      buffer.append(initial);
    }
    self = {
      read: read,
      write: write,
      copy: copy,
      close: (function(){ function _close() {
        var _close;
        return self;
      }; return _close})(),
      flush: (function(){ function _flush() {
        var _flush;
        return self;
      }; return _flush})(),
      iterator: (function(){ function _iterator() {
        var _iterator;
        return self;
      }; return _iterator})(),
      forEach: (function(){ function _forEach(block) {
        var _forEach, _results;
        _results = [];
        while (true) {
          try {
            _results.push(block.call(this, next()));
          } catch (exception) {
            if (exception instanceof StopIteration) {
              break;
            }
            throw exception;
          }
        }
        return _results;
      }; return _forEach})(),
      readLine: (function(){ function _readLine() {
        var pos, _readLine;
        pos = buffer.indexOf(delimiter);
        if (pos === -1) {
          pos = buffer.length();
        }
        return read(pos + 1);
      }; return _readLine})(),
      readLines: (function(){ function _readLines() {
        var line, lines, _readLines;
        lines = [];
        while (true) {
          line = self.readLine();
          if (line.length) {
            lines.push(line);
          }
          if (!line.length) {
            break;
          }
        }
        return lines;
      }; return _readLines})(),
      next: next,
      print: (function(){ function _print(line) {
        var _print;
        return write(line + delimiter).flush();
      }; return _print})(),
      toString: (function(){ function _toString() {
        var _toString;
        return String(buffer);
      }; return _toString})(),
      substring: (function(){ function _substring() {
        var args, string, _substring;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        string = String(buffer);
        return string.substring.apply(string, args);
      }; return _substring})(),
      slice: (function(){ function _slice() {
        var args, string, _slice;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        string = String(buffer);
        return string.slice.apply(string, args);
      }; return _slice})(),
      substr: (function(){ function _substr() {
        var args, string, _substr;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        string = String(buffer);
        return string.substr.apply(string, args);
      }; return _substr})()
    };
    self.__defineGetter__("length", function() {
      return length();
    });
    return Object.create(self);
  }; return _StringIO})();

}).call(this);

// Generated by CoffeeScript 1.5.0-pre
