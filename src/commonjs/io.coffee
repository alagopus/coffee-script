# -- tlrobinson Tom Robinson

# IO: engine independent
engine = require("io-engine")
ByteString = require("binary").ByteString
ByteArray = require("binary").ByteArray
B_COPY = require("binary").B_COPY

for name of engine
  exports[name] = engine[name]  if Object::hasOwnProperty.call(engine, name)

IO = exports.IO
IO::readChunk = IO::readChunk or (length) ->
  length = 1024  if typeof length isnt "number"
  buffer = new ByteArray(length)
  readLength = @readInto(buffer, length, 0)
  return new ByteString()  if readLength <= 0
  new ByteString(buffer._bytes, 0, readLength)

IO::read = IO::read or (length) ->
  return @readChunk(length)  if length isnt `undefined`
  buffers = []
  total = 0
  loop
    buffer = @readChunk()
    if buffer.length > 0
      buffers.push buffer
      total += buffer.length
    else
      break
  buffer = new ByteArray(total)
  dest = buffer._bytes
  copied = 0
  i = 0

  while i < buffers.length
    b = buffers[i]
    len = b.length
    B_COPY b._bytes, b._offset, dest, copied, len
    copied += len
    i++
  new ByteString(dest, 0, copied)

IO::write = IO::write or (object, charset) ->
  throw new Error("Argument to IO.write must have toByteString() method")  if object is null or object is `undefined` or typeof object.toByteString isnt "function"
  binary = object.toByteString(charset)
  @writeInto binary, 0, binary.length
  this

IO::puts = (args...) ->
  @write (if args.length is 0 then "\n" else Array::join.apply(args, ["\n"]) + "\n")

exports.Peekable = (input) ->
  @_input = input
  @_buffer = new exports.StringIO()

exports.Peekable::read = (length) ->
  if not length?
    @_buffer.read() + @_input.read()
  else if @_buffer.length
    @_buffer.read length
  else
    @_input.read length

exports.Peekable::peek = (length) ->
  while @_buffer.length < length
    read = @_input.read(length - @_buffer.length)
    break  unless read.length
    @_buffer.write read
  @_buffer.substring 0, length
