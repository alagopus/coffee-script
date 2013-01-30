# Binary 

# -- tlrobinson Tom Robinson
# -- gozala Irakli Gozalishvili
# -- tschaub
# -- nrstott Nathan Stott
# -- tlrobinson Tom Robinson
engine = require 'binary-engine'
B_ALLOC = (length) -> Packages.java.lang.reflect.Array.newInstance Packages.java.lang.Byte.TYPE, length
B_LENGTH = (bytes) -> bytes.length
B_GET = (bytes, index) -> (bytes[index] >>> 0) & 0xFF
B_SET = (bytes, index, value) -> bytes[index] = ((if (value & 0x80) then -1 - (value ^ 0xFF) else value))
B_FILL = (bytes, length, offset, value) -> Packages.java.util.Arrays.fill bytes, length, offset, value
exports.B_COPY = B_COPY = (src, srcOffset, dst, dstOffset, length) -> Packages.java.lang.System.arraycopy src, srcOffset, dst, dstOffset, length
B_DECODE = (bytes, offset, length, codec) -> String new Packages.java.lang.String(bytes, offset, length, codec)
B_ENCODE = (string, codec) -> new Packages.java.lang.String(string).getBytes codec
B_DECODE_DEFAULT = (bytes, offset, length) -> String new Packages.java.lang.String(bytes, offset, length, "UTF-8")
B_ENCODE_DEFAULT = (string) -> new Packages.java.lang.String(string).getBytes "UTF-8"
B_TRANSCODE = (bytes, offset, length, sourceCodec, targetCodec) -> new Packages.java.lang.String(bytes, offset, length, sourceCodec).getBytes targetCodec

Binary = exports.Binary = ->

Object.defineProperty Binary::, "length", 
  get: ->
    @_length

  enumerable: false
  configurable: false

# toArray() - n array of the byte values
# toArray(charset) - an array of the code points, decoded
Binary::toArray = (charset) ->
  if charset?
    string = B_DECODE(@_bytes, @_offset, @_length, charset)
    length = string.length
    array = new Array(length)
    i = 0

    while i < length
      array[i] = string.charCodeAt(i)
      i++
    array
  else
    array = new Array(@_length)
    i = 0

    while i < @_length
      array[i] = @get(i)
      i++
    array


# toByteArray() - just a copy
# toByteArray(sourceCharset, targetCharset) - transcoded
Binary::toByteArray = (sourceCodec, targetCodec) ->
  if typeof sourceCodec is "string" and typeof targetCodec is "string"
    bytes = B_TRANSCODE(@_bytes, @_offset, @_length, sourceCodec, targetCodec)
    return new ByteArray(bytes, 0, B_LENGTH(bytes))
  else
    return new ByteArray(this)


# toByteString() - byte for byte copy
# toByteString(sourceCharset, targetCharset) - transcoded
Binary::toByteString = (sourceCodec, targetCodec) ->
  if typeof sourceCodec is "string" and typeof targetCodec is "string"
    bytes = B_TRANSCODE(@_bytes, @_offset, @_length, sourceCodec, targetCodec)
    return new ByteString(bytes, 0, B_LENGTH(bytes))
  else
    return new ByteString(this)


# decodeToString()
# decodeToString(charset) - returns a String from its decoded bytes in a given charset. If no charset is provided, or if the charset is "undefined", assumes the default system encoding.
# decodeToString(number) - returns a String from its decoded bytes in a given base, like 64, 32, 16, 8, 2
Binary::decodeToString = (charset) ->
  if charset
    if typeof charset is "number"
      return require("base" + charset).encode(this)
    else if /^base/.test(charset)
      return require(charset).encode(this)
    else
      return B_DECODE(@_bytes, @_offset, @_length, charset)
  B_DECODE_DEFAULT @_bytes, @_offset, @_length


# get(offset) - Return the byte at offset as a Number.
Binary::get = (offset) ->
  return NaN  if offset < 0 or offset >= @_length
  
  #var b = this._bytes[this._offset + offset];
  #return (b >= 0) ? b : -1 * ((b ^ 0xFF) + 1);
  B_GET @_bytes, @_offset + offset

Binary::indexOf = (byteValue, start, stop) ->
  
  # HACK: use ByteString's slice since we know we won't be modifying result
  array = ByteString::slice.apply(this, [start, stop]).toArray()
  result = array.indexOf(byteValue)
  (if (result < 0) then -1 else result + (start or 0))

Binary::lastIndexOf = (byteValue, start, stop) ->
  
  # HACK: use ByteString's slice since we know we won't be modifying result
  array = ByteString::slice.apply(this, [start, stop]).toArray()
  result = array.lastIndexOf(byteValue)
  (if (result < 0) then -1 else result + (start or 0))


# valueOf()
Binary::valueOf = ->
  this


# ByteString 
ByteString = exports.ByteString = (args...) ->
  unless this instanceof ByteString
    return new ByteString()  if args.length is 0
    return new ByteString(args[0])  if args.length is 1
    return new ByteString(args[0], args[1])  if args.length is 2
    return new ByteString(args[0], args[1], args[2])  if args.length is 3
  
  # ByteString() - Construct an empty byte string.
  if args.length is 0
    @_bytes = B_ALLOC(0) # null;
    @_offset = 0
    @_length = 0
  
  # ByteString(byteString) - Copies byteString.
  else if args.length is 1 and args[0] instanceof ByteString
    return args[0]
  
  # ByteString(byteArray) - Use the contents of byteArray.
  else if args.length is 1 and args[0] instanceof ByteArray
    copy = args[0].toByteArray()
    @_bytes = copy._bytes
    @_offset = copy._offset
    @_length = copy._length
  
  # ByteString(arrayOfNumbers) - Use the numbers in arrayOfNumbers as the bytes.
  else if args.length is 1 and Array.isArray(args[0])
    array = args[0]
    @_bytes = B_ALLOC(array.length)
    i = 0

    while i < array.length
      b = array[i]
      
      # If any element is outside the range 0...255, an exception (TODO) is thrown.
      throw new Error("ByteString constructor argument Array of integers must be -128 - 255 (" + b + ")")  if b < -0x80 or b > 0xFF
      
      # Java "bytes" are interpreted as 2's complement
      #this._bytes[i] = (b < 128) ? b : -1 * ((b ^ 0xFF) + 1);
      B_SET @_bytes, i, b
      i++
    @_offset = 0
    @_length = B_LENGTH(@_bytes)
  
  # ByteString(string, charset) - Convert a string. The ByteString will contain string encoded with charset.
  else if (args.length is 1 or (args.length is 2 and args[1] is `undefined`)) and typeof args[0] is "string"
    @_bytes = B_ENCODE_DEFAULT(args[0])
    @_offset = 0
    @_length = B_LENGTH(@_bytes)
  else if args.length is 2 and typeof args[0] is "string" and typeof args[1] is "string"
    @_bytes = B_ENCODE(args[0], args[1])
    @_offset = 0
    @_length = B_LENGTH(@_bytes)
  
  # private: ByteString(bytes, offset, length)
  else if args.length is 3 and typeof args[1] is "number" and typeof args[2] is "number"
    @_bytes = args[0]
    @_offset = args[1]
    @_length = args[2]
  else
    throw new Error("Illegal arguments to ByteString constructor: " + args.join(', '))
  if engine.ByteStringWrapper
    engine.ByteStringWrapper this
  else
    this

ByteString:: = new Binary()
ByteString::__defineGetter__ "length", ->
  @_length

ByteString::__defineSetter__ "length", (length) ->


# toByteArray() - Returns a byte for byte copy in a ByteArray.
# toByteArray(sourceCharset, targetCharset) - Returns a transcoded copy in a ByteArray.
#  - implemented on Binary

# toByteString() - Returns itself, since there's no need to copy an immutable ByteString.
# toByteString(sourceCharset, targetCharset) - Returns a transcoded copy.
#  - implemented on Binary

# toArray() - Returns an array containing the bytes as numbers.
# toArray(charset) - Returns an array containing the decoded Unicode code points.
#  - implemented on Binary

# toString()
ByteString::toString = (charset) ->
  return @decodeToString(charset)  if charset
  "[ByteString " + @_length + "]"


# decodeToString(charset) - Returns the decoded ByteArray as a string.
#  - implemented on Binary
ByteString::byteAt = ByteString::charAt = (offset) ->
  byteValue = @get(offset)
  return new ByteString()  if isNaN(byteValue)
  new ByteString([byteValue])


# indexOf() - implemented on Binary
# lastIndexOf() - implemented on Binary

# charCodeAt(offset)
ByteString::charCodeAt = Binary::get

# get(offset) - implemented on Binary

# byteAt(offset) ByteString - implemented on Binary
# charAt(offset) ByteString - implemented on Binary

# split(delimiter, [options])
ByteString::split = (delimiters, options) ->
  options = options or {}
  count = (if options.count is `undefined` then -1 else options.count)
  includeDelimiter = options.includeDelimiter or false
  
  # standardize delimiters into an array of ByteStrings:
  delimiters = [delimiters]  unless Array.isArray(delimiters)
  delimiters = delimiters.map((delimiter) ->
    delimiter = [delimiter]  if typeof delimiter is "number"
    new ByteString(delimiter)
  )
  components = []
  startOffset = @_offset
  currentOffset = @_offset
  
  # loop until there's no more bytes to consume
  while currentOffset < @_offset + @_length
    offsetMoved = false
    
    # try each delimiter until we find a match
    i = 0

    while i < delimiters.length
      reachedStop = false
      d = delimiters[i]
      j = 0

      while j < d._length
        
        # reached the end of the bytes, OR bytes not equal
        if currentOffset + j > @_offset + @_length or B_GET(@_bytes, currentOffset + j) isnt B_GET(d._bytes, d._offset + j)
          reachedStop = true
          break
        j++
      unless reachedStop
        
        # push the part before the delimiter
        components.push new ByteString(@_bytes, startOffset, currentOffset - startOffset)
        
        # optionally push the delimiter
        components.push new ByteString(@_bytes, currentOffset, d._length)  if includeDelimiter
        
        # reset the offsets
        startOffset = currentOffset = currentOffset + d._length
        offsetMoved = true
        break
      i++
    
    # if there was no match, increment currentOffset to try the next one
    currentOffset++  unless offsetMoved
  
  # push the remaining part, if any
  components.push new ByteString(@_bytes, startOffset, currentOffset - startOffset)  if currentOffset > startOffset
  components


# slice()
# slice(begin)
# slice(begin, end)
ByteString::slice = (begin, end) ->
  if begin is `undefined`
    begin = 0
  else begin = @_length + begin  if begin < 0
  if end is `undefined`
    end = @_length
  else end = @_length + end  if end < 0
  begin = Math.min(@_length, Math.max(0, begin))
  end = Math.min(@_length, Math.max(0, end))
  new ByteString(@_bytes, @_offset + begin, end - begin)


# substr(start)
# substr(start, length)
ByteString::substr = (start, length) ->
  if start isnt `undefined`
    if length isnt `undefined`
      return @slice(start)
    else
      return @slice(start, start + length)
  @slice()


# substring(first)
# substring(first, last)
ByteString::substring = (from, to) ->
  if from isnt `undefined`
    if to isnt `undefined`
      return @slice(Math.max(Math.min(from, @_length), 0))
    else
      return @slice(Math.max(Math.min(from, @_length), 0), Math.max(Math.min(to, @_length), 0))
  @slice()


# [] ByteString - TODO

# toSource()
ByteString::toSource = ->
  "ByteString([" + @toArray().join(",") + "])"


# ByteArray 

# ByteArray() - New, empty ByteArray.
# ByteArray(length) - New ByteArray filled with length zero bytes.
# ByteArray(byteArray) - Copy byteArray.
# ByteArray(byteString) - Copy contents of byteString.
# ByteArray(arrayOfBytes) - Use numbers in arrayOfBytes as contents.
#     Throws an exception if any element is outside the range 0...255 (TODO).
# ByteArray(string, charset) - Create a ByteArray from a Javascript string, the result being encoded with charset.
ByteArray = exports.ByteArray = (args...) ->
  if not this instanceof ByteArray
    return new ByteArray()  if args.length is 0
    return new ByteArray(args[0])  if args.length is 1
    return new ByteArray(args[0], args[1])  if args.length is 2
    return new ByteArray(args[0], args[1], args[2])  if args.length is 3
  
  # ByteArray() - New, empty ByteArray.
  if args.length is 0
    @_bytes = B_ALLOC(0) # null;
    @_offset = 0
    @_length = 0
  
  # ByteArray(length) - New ByteArray filled with length zero bytes.
  else if args.length is 1 and typeof args[0] is "number"
    @_bytes = B_ALLOC(args[0]) # null;
    @_offset = 0
    @_length = B_LENGTH(@_bytes)
  
  # ByteArray(byteArray) - Copy byteArray.
  # ByteArray(byteString) - Copy contents of byteString.
  else if args.length is 1 and (args[0] instanceof ByteArray or args[0] instanceof ByteString)
    byteArray = new ByteArray(args[0]._length)
    B_COPY args[0]._bytes, args[0]._offset, byteArray._bytes, byteArray._offset, byteArray._length
    return byteArray
  
  # ByteArray(arrayOfBytes) - Use numbers in arrayOfBytes as contents.
  # Throws an exception if any element is outside the range 0...255 (TODO).
  else if args.length is 1 and Array.isArray(args[0])
    array = args[0]
    @_bytes = B_ALLOC(array.length)
    i = 0

    while i < array.length
      b = array[i]
      
      # If any element is outside the range 0...255, an exception (TODO) is thrown.
      throw new Error("ByteString constructor argument Array of integers must be 0 - 255 (" + b + ")")  if b < 0 or b > 0xFF
      
      # Java "bytes" are interpreted as 2's complement
      #this._bytes[i] = (b < 128) ? b : -1 * ((b ^ 0xFF) + 1);
      B_SET @_bytes, i, b
      i++
    @_offset = 0
    @_length = B_LENGTH(@_bytes)
  
  # ByteArray(string, charset) - Create a ByteArray from a Javascript string, the result being encoded with charset.
  else if (args.length is 1 or (args.length is 2 and args[1] is `undefined`)) and typeof args[0] is "string"
    @_bytes = B_ENCODE_DEFAULT(args[0])
    @_offset = 0
    @_length = B_LENGTH(@_bytes)
  else if args.length is 2 and typeof args[0] is "string" and typeof args[1] is "string"
    @_bytes = B_ENCODE(args[0], args[1])
    @_offset = 0
    @_length = B_LENGTH(@_bytes)
  
  # private: ByteArray(bytes, offset, length)
  else if args.length is 3 and typeof args[1] is "number" and typeof args[2] is "number"
    @_bytes = args[0]
    @_offset = args[1]
    @_length = args[2]
  else
    throw new Error("Illegal arguments to ByteString constructor: [" + Array::join.apply(args, [","]) + "] (" + args.length + ")")
  if engine.ByteArrayWrapper
    engine.ByteArrayWrapper this
  else
    this

ByteArray:: = new Binary()
ByteArray::__defineGetter__ "length", ->
  @_length

ByteArray::__defineSetter__ "length", (length) ->
  return  if typeof length isnt "number"
  
  # same length
  if length is @_length
    return
  
  # new length is less, truncate
  else if length < @_length
    @_length = length
  
  # new length is more, but fits without moving, just clear new bytes
  else if @_offset + length <= B_LENGTH(@_bytes)
    B_FILL @_bytes, @_length, @_offset + length - 1, 0
    @_length = length
  
  # new length is more, but fits if we shift to bottom, so do that.
  else if length <= B_LENGTH(@_bytes)
    B_COPY @_bytes, @_offset, @_bytes, 0, @_length
    @_offset = 0
    B_FILL @_bytes, @_length, @_offset + length - 1, 0
    @_length = length
  
  # new length is more than the allocated bytes array, allocate a new one and copy the data
  else
    newBytes = B_ALLOC(length)
    B_COPY @_bytes, @_offset, newBytes, 0, @_length
    @_bytes = newBytes
    @_offset = 0
    @_length = length


# FIXME: array notation for set and get
ByteArray::set = (index, b) ->
  
  # If any element is outside the range 0...255, an exception (TODO) is thrown.
  throw new Error("ByteString constructor argument Array of integers must be 0 - 255 (" + b + ")")  if b < 0 or b > 0xFF
  throw new Error("Out of range")  if index < 0 or index >= @_length
  
  # Java "bytes" are interpreted as 2's complement
  #this._bytes[this._offset + index] = (b < 128) ? b : -1 * ((b ^ 0xFF) + 1);
  B_SET @_bytes, @_offset + index, b


# toArray()
# toArray(charset)
#  - implemented on Binary

# toByteArray() - just a copy
# toByteArray(sourceCharset, targetCharset) - transcoded
#  - implemented on Binary

# toByteString() - byte for byte copy
# toByteString(sourceCharset, targetCharset) - transcoded
#  - implemented on Binary

# toString() - a string representation like "[ByteArray 10]"
# toString(charset) - an alias for decodeToString(charset)
ByteArray::toString = (charset) ->
  return @decodeToString(charset)  if charset
  "[ByteArray " + @_length + "]"


# decodeToString(charset) - implemented on Binary

# byteAt(offset) ByteString - Return the byte at offset as a ByteString.
#  - implemented on Binary

# get(offset) Number - Return the byte at offset as a Number.
#  - implemented on Binary

# concat(other ByteArray|ByteString|Array)
# TODO: I'm assuming Array means an array of ByteStrings/ByteArrays, not an array of integers.
ByteArray::concat = (args...) ->
  components = [this]
  totalLength = @_length
  i = 0

  while i < args.length
    component = (if Array.isArray(args[i]) then args[i] else [args[i]])
    j = 0

    while j < component.length
      subcomponent = component[j]
      throw "Arguments to ByteArray.concat() must be ByteStrings, ByteArrays, or Arrays of those."  if (subcomponent not instanceof ByteString) and (subcomponent not instanceof ByteArray)
      components.push subcomponent
      totalLength += subcomponent.length
      j++
    i++
  result = new ByteArray(totalLength)
  offset = 0
  components.forEach (component) ->
    B_COPY component._bytes, component._offset, result._bytes, offset, component._length
    offset += component._length

  result


# pop() -> byte Number
ByteArray::pop = ->
  return `undefined`  if @_length is 0
  @_length--
  B_GET @_bytes, @_offset + @_length


# push(...variadic Numbers...)-> count Number
ByteArray::push = (args...) ->
  length = undefined
  newLength = @length += length = args.length
  try
    i = 0

    while i < length
      @set newLength - length + i, args[i]
      i++
  catch e
    @length -= length
    throw e
  newLength


# extendRight(...variadic Numbers / Arrays / ByteArrays / ByteStrings ...)
ByteArray::extendRight = ->
  throw "NYI"


# shift() -> byte Number
ByteArray::shift = ->
  return `undefined`  if @_length is 0
  @_length--
  @_offset++
  B_GET @_bytes, @_offset - 1


# unshift(...variadic Numbers...) -> count Number
ByteArray::unshift = (args...) ->
  copy = @slice()
  @length = 0
  try
    @push.apply this, args
    @push.apply this, copy.toArray()
    return @length
  catch e
    B_COPY copy._bytes, copy._offset, @_bytes, @_offset, copy.length
    @length = copy.length
    throw e


# extendLeft(...variadic Numbers / Arrays / ByteArrays / ByteStrings ...)
ByteArray::extendLeft = ->
  throw "NYI"


# reverse() in place reversal
ByteArray::reverse = ->
  
  # "limit" is halfway, rounded down. "top" is the last index.
  limit = Math.floor(@_length / 2) + @_offset
  top = @_length - 1
  
  # swap each pair of bytes, up to the halfway point
  i = @_offset

  while i < limit
    tmp = B_GET(@_bytes, i)
    B_SET @_bytes, i, B_GET(@_bytes, top - i)
    B_SET @_bytes, top - i, tmp
    i++
  this


# slice()
ByteArray::slice = (args...) ->
  new ByteArray(ByteString::slice.apply(this, args))

numericCompareFunction = (o1, o2) ->
  o1 - o2


# sort([compareFunction])
ByteArray::sort = (compareFunction) ->
  
  # FIXME: inefficient?
  array = @toArray()
  if compareFunction?
    array.sort compareFunction
  else
    array.sort numericCompareFunction
  i = 0

  while i < array.length
    @set i, array[i]
    i++


# splice()
ByteArray::splice = (index, howMany, inject...) -> #, elem1, elem2
  return  if index is `undefined`
  index += @length  if index < 0
  howMany = @_length - index  if howMany is `undefined`
  end = index + howMany
  remove = @slice(index, end)
  keep = @slice(end)
  @_length = index
  @push.apply this, inject
  @push.apply this, keep.toArray()
  remove


# indexOf() - implemented on Binary
# lastIndexOf() - implemented on Binary

# split() Returns an array of ByteArrays instead of ByteStrings.
ByteArray::split = (args...) ->
  components = ByteString::split.apply(@toByteString(), args)
  
  # convert ByteStrings to ByteArrays
  i = 0

  while i < components.length
    
    # we know we can use these byte buffers directly since we copied them above
    components[i] = new ByteArray(components[i]._bytes, components[i]._offset, components[i]._length)
    i++
  components


# filter(callback[, thisObject])
ByteArray::filter = (callback, thisObject) ->
  result = new ByteArray(@_length)
  i = 0
  length = @_length

  while i < length
    value = @get(i)
    result.push value  if callback.apply(thisObject, [value, i, this])
    i++
  result


# forEach(callback[, thisObject]);
ByteArray::forEach = (callback, thisObject) ->
  i = 0
  length = @_length

  while i < length
    callback.apply thisObject, [@get(i), i, this]
    i++


# every(callback[, thisObject])
ByteArray::every = (callback, thisObject) ->
  i = 0
  length = @_length

  while i < length
    return false  unless callback.apply(thisObject, [@get(i), i, this])
    i++
  true


# some(callback[, thisObject])
ByteArray::some = (callback, thisObject) ->
  i = 0
  length = @_length

  while i < length
    return true  if callback.apply(thisObject, [@get(i), i, this])
    i++
  false


# map(callback[, thisObject]);
ByteArray::map = (callback, thisObject) ->
  result = new ByteArray(@_length)
  i = 0
  length = @_length

  while i < length
    result.set i, callback.apply(thisObject, [@get(i), i, this])
    i++
  result


# reduce(callback[, initialValue])
ByteArray::reduce = (callback, initialValue) ->
  value = initialValue
  i = 0
  length = @_length

  while i < length
    value = callback(value, @get(i), i, this)
    i++
  value


# reduceRight(callback[, initialValue])
ByteArray::reduceRight = (callback, initialValue) ->
  value = initialValue
  i = @_length - 1

  while i > 0
    value = callback(value, @get(i), i, this)
    i--
  value


# displace(begin, end, values/ByteStrings/ByteArrays/Arrays...) -> length
#     begin/end are specified like for slice. Can be used like splice but does not return the removed elements.
ByteArray::displace = (begin, end) ->
  throw "NYI"


# toSource() returns a string like "ByteArray([])" for a null byte-array.
ByteArray::toSource = ->
  "ByteArray([" + @toArray().join(",") + "])"
