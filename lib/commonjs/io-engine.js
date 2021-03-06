// Generated by CoffeeScript 1.6.2
(function() {
  var ByteIO, IO, StringIO,
    __slice = [].slice;

  IO = exports.IO = function(inputStream, outputStream) {
    this.inputStream = inputStream;
    this.outputStream = outputStream;
    return this;
  };

  IO.prototype.readInto = function(buffer, length, from) {
    var bytes, bytesRead, offset, total;
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
  };

  IO.prototype.writeInto = function(buffer, from, to) {
    return this.outputStream.write(buffer._bytes, buffer._offset + from, to - from);
  };

  IO.prototype.isatty = function() {
    return false;
  };

  IO.prototype.copy = function(output, mode, options) {
    var buffer;
    while (true) {
      buffer = this.read(null);
      if (!buffer.length) {
        break;
      }
      output.write(buffer);
    }
    output.flush();
    return this;
  };

  IO.prototype.flush = function() {
    this.outputStream.flush();
    return this;
  };

  IO.prototype.close = function() {
    if (this.inputStream) {
      this.inputStream.close();
    }
    if (this.outputStream) {
      return this.outputStream.close();
    }
  };

  exports.TextInputStream = function(raw, lineBuffering, buffering, charset, options) {
    var self, stream;
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
    self.readLine = function() {
      var line;
      line = stream.readLine();
      if (line === null) {
        return "";
      }
      return String(line) + "\n";
    };
    self.next = function() {
      var line;
      line = stream.readLine();
      if (line === null) {
        throw StopIteration;
      }
      return String(line);
    };
    self.iterator = function() {
      return self;
    };
    self.forEach = function(block, context) {
      var exception, line, _results;
      line = void 0;
      _results = [];
      while (true) {
        try {
          line = self.next();
        } catch (_error) {
          exception = _error;
          break;
        }
        _results.push(block.call(context, line));
      }
      return _results;
    };
    self.input = function() {
      throw "NYI";
    };
    self.readLines = function() {
      var line, lines;
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
    };
    self.read = function() {
      return self.readLines().join("");
    };
    self.readInto = function(buffer) {
      throw "NYI";
    };
    self.copy = function(output, mode, options) {
      var line;
      while (true) {
        line = self.readLine();
        output.write(line).flush();
        if (!line.length) {
          break;
        }
      }
      return self;
    };
    self.close = function() {
      return stream.close();
    };
    return Object.create(self);
  };

  exports.TextOutputStream = function(raw, lineBuffering, buffering, charset, options) {
    var self, stream;
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
    self.write = function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      stream.write.apply(stream, args);
      return self;
    };
    self.writeLine = function(line) {
      self.write(line + "\n");
      return self;
    };
    self.writeLines = function(lines) {
      lines.forEach(self.writeLine);
      return self;
    };
    self.print = function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      self.write(Array.prototype.join.call(args, " ") + "\n");
      self.flush();
      return self;
    };
    self.flush = function() {
      stream.flush();
      return self;
    };
    self.close = function() {
      stream.close();
      return self;
    };
    return Object.create(self);
  };

  exports.TextIOWrapper = function(raw, mode, lineBuffering, buffering, charset, options) {
    if (mode.update) {
      return new exports.TextIOStream(raw, lineBuffering, buffering, charset, options);
    } else if (mode.write || mode.append) {
      return new exports.TextOutputStream(raw, lineBuffering, buffering, charset, options);
    } else if (mode.read) {
      return new exports.TextInputStream(raw, lineBuffering, buffering, charset, options);
    } else {
      throw new Error("file must be opened for read, write, or append mode.");
    }
  };

  ByteIO = exports.ByteIO = function(binary) {
    var stream;
    this.inputStream = (binary ? new java.io.ByteArrayInputStream(binary._bytes, binary._offset, binary._length) : null);
    this.outputStream = new java.io.ByteArrayOutputStream();
    stream = (this.inStream, this.outStream);
    return this.length = (binary ? binary.length : 0);
  };

  ByteIO.prototype = new exports.IO();

  ByteIO.prototype.toByteString = function() {
    var ByteString, bytes;
    bytes = this.outputStream.toByteArray();
    ByteString = require("binary").ByteString;
    return new ByteString(bytes, 0, bytes.length);
  };

  ByteIO.prototype.decodeToString = function(charset) {
    return String((charset ? this.outputStream.toString(charset) : this.outputStream.toString()));
  };

  StringIO = exports.StringIO = function(initial, delimiter) {
    var buffer, copy, length, next, read, self, write;
    length = function() {
      return buffer.length();
    };
    read = function(length) {
      var result;
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
    };
    write = function(text) {
      buffer.append(text);
      return self;
    };
    copy = function(output) {
      output.write(read()).flush();
      return self;
    };
    next = function() {
      var pos, result;
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
    };
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
      close: function() {
        return self;
      },
      flush: function() {
        return self;
      },
      iterator: function() {
        return self;
      },
      forEach: function(block) {
        var exception, _results;
        _results = [];
        while (true) {
          try {
            _results.push(block.call(this, next()));
          } catch (_error) {
            exception = _error;
            if (exception instanceof StopIteration) {
              break;
            }
            throw exception;
          }
        }
        return _results;
      },
      readLine: function() {
        var pos;
        pos = buffer.indexOf(delimiter);
        if (pos === -1) {
          pos = buffer.length();
        }
        return read(pos + 1);
      },
      readLines: function() {
        var line, lines;
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
      },
      next: next,
      print: function(line) {
        return write(line + delimiter).flush();
      },
      toString: function() {
        return String(buffer);
      },
      substring: function() {
        var args, string;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        string = String(buffer);
        return string.substring.apply(string, args);
      },
      slice: function() {
        var args, string;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        string = String(buffer);
        return string.slice.apply(string, args);
      },
      substr: function() {
        var args, string;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        string = String(buffer);
        return string.substr.apply(string, args);
      }
    };
    self.__defineGetter__("length", function() {
      return length();
    });
    return Object.create(self);
  };

}).call(this);
