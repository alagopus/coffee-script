# -- tlrobinson Tom Robinson
# -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License

# IO: Rhino
IO = exports.IO = (inputStream, outputStream) ->
  @inputStream = inputStream
  @outputStream = outputStream
  return this

IO::readInto = (buffer, length, from) ->
  bytes = buffer._bytes # java byte array
  offset = buffer._offset
  offset += from  if typeof from is "number"
  throw "FIXME: Buffer too small. Throw or truncate?"  if length > bytes.length + offset
  total = 0
  bytesRead = 0
  while total < length
    bytesRead = @inputStream.read(bytes, offset + total, length - total)
    break  if bytesRead < 0
    total += bytesRead
  total

IO::writeInto = (buffer, from, to) -> @outputStream.write buffer._bytes, buffer._offset + from, to - from
IO::isatty = -> false
IO::copy = (output, mode, options) ->
  loop
    buffer = @read(null)
    break  unless buffer.length
    output.write buffer
  output.flush()
  this

IO::flush = ->
  @outputStream.flush()
  this

IO::close = ->
  @inputStream.close()  if @inputStream
  @outputStream.close()  if @outputStream

exports.TextInputStream = (raw, lineBuffering, buffering, charset, options) ->
  stream = undefined
  if charset is `undefined`
    stream = new Packages.java.io.InputStreamReader(raw.inputStream)
  else
    stream = new Packages.java.io.InputStreamReader(raw.inputStream, charset)
  if buffering is `undefined`
    stream = new Packages.java.io.BufferedReader(stream)
  else
    stream = new Packages.java.io.BufferedReader(stream, buffering)
  self = this
  self.raw = raw

  self.readLine = ->
    line = stream.readLine()
    return ""  if line is null
    String(line) + "\n"

  self.next = ->
    line = stream.readLine()
    throw StopIteration  if line is null
    String line

  self.iterator = -> self
  self.forEach = (block, context) ->
    line = undefined
    loop
      try
        line = self.next()
      catch exception
        break
      block.call context, line

  self.input = -> throw "NYI"
  self.readLines = ->
    lines = []
    loop
      line = self.readLine()
      lines.push line  if line.length
      break unless line.length
    lines

  self.read = -> self.readLines().join ""
  self.readInto = (buffer) -> throw "NYI"
  self.copy = (output, mode, options) ->
    loop
      line = self.readLine()
      output.write(line).flush()
      break unless line.length
    self

  self.close = -> stream.close()

  Object.create self

exports.TextOutputStream = (raw, lineBuffering, buffering, charset, options) ->
  stream = undefined
  if charset is `undefined`
    stream = new Packages.java.io.OutputStreamWriter(raw.outputStream)
  else
    stream = new Packages.java.io.OutputStreamWriter(raw.outputStream, charset)
  if buffering is `undefined`
    stream = new Packages.java.io.BufferedWriter(stream)
  else
    stream = new Packages.java.io.BufferedWriter(stream, buffering)
  self = this
  self.raw = raw
  self.write = (args...) ->
    stream.write.apply stream, args
    self

  self.writeLine = (line) ->
    self.write line + "\n" # todo recordSeparator
    self

  self.writeLines = (lines) ->
    lines.forEach self.writeLine
    self

  self.print = (args...) ->
    self.write Array::join.call(args, " ") + "\n"
    self.flush()
    
    # todo recordSeparator, fieldSeparator
    self

  self.flush = ->
    stream.flush()
    self

  self.close = ->
    stream.close()
    self

  Object.create self

exports.TextIOWrapper = (raw, mode, lineBuffering, buffering, charset, options) ->
  if mode.update
    new exports.TextIOStream(raw, lineBuffering, buffering, charset, options)
  else if mode.write or mode.append
    new exports.TextOutputStream(raw, lineBuffering, buffering, charset, options)
  else if mode.read
    new exports.TextInputStream(raw, lineBuffering, buffering, charset, options)
  else
    throw new Error("file must be opened for read, write, or append mode.")


# ByteIO 

# FIXME: this doesn't read/write the same stream
ByteIO = exports.ByteIO = (binary) ->
  @inputStream = (if binary then new java.io.ByteArrayInputStream(binary._bytes, binary._offset, binary._length) else null)
  @outputStream = new java.io.ByteArrayOutputStream()
  stream = (@inStream
  @outStream
  )
  @length = (if binary then binary.length else 0)

ByteIO:: = new exports.IO()
ByteIO::toByteString = ->
  bytes = @outputStream.toByteArray()
  ByteString = require("binary").ByteString
  new ByteString(bytes, 0, bytes.length)

ByteIO::decodeToString = (charset) ->
  String (if charset then @outputStream.toString(charset) else @outputStream.toString())

StringIO = exports.StringIO = (initial, delimiter) ->
  length = ->
    buffer.length()
  read = (length) ->
    if length?
      length = 1024 if not length or length < 1
      length = Math.min(buffer.length(), length)
      result = String(buffer.substring(0, length))
      buffer["delete"] 0, length
      result
    else
      result = String(buffer)
      buffer["delete"] 0, buffer.length()
      result
  write = (text) ->
    buffer.append text
    self
  copy = (output) ->
    output.write(read()).flush()
    self
  next = ->
    throw StopIteration  if buffer.length() is 0
    pos = buffer.indexOf(delimiter)
    pos = buffer.length()  if pos is -1
    result = read(pos)
    read 1
    result
  buffer = new java.lang.StringBuffer()
  delimiter = "\n"  unless delimiter
  buffer.append initial  if initial
  self =
    read: read
    write: write
    copy: copy
    close: -> self
    flush: -> self
    iterator: -> self

    forEach: (block) ->
      loop
        try
          block.call this, next()
        catch exception
          break  if exception instanceof StopIteration
          throw exception

    readLine: ->
      pos = buffer.indexOf(delimiter)
      pos = buffer.length()  if pos is -1
      read pos + 1

    readLines: ->
      lines = []
      loop
        line = self.readLine()
        lines.push line  if line.length
        break unless line.length
      lines

    next: next
    print: (line) -> write(line + delimiter).flush()
    toString: -> String buffer

    substring: (args...) -> 
      string = String(buffer)
      string.substring.apply string, args

    slice: (args...) ->
      string = String(buffer)
      string.slice.apply string, args

    substr: (args...) ->
      string = String(buffer)
      string.substr.apply string, args

  self.__defineGetter__ "length", -> length()

  Object.create self
