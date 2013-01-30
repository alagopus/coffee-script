
# -- tlrobinson Tom Robinson

#
#exports.B_DECODE_DEFAULT = function(bytes, offset, length) {
#    return String(new Packages.java.lang.String(bytes, offset, length));
#}
#

#
#exports.B_ENCODE_DEFAULT = function(string) {
#    return new Packages.java.lang.String(string).getBytes();
#}
#
wrapper = (that) ->
  obj = new JavaAdapter(Packages.org.mozilla.javascript.ScriptableObject, Packages.org.mozilla.javascript.Wrapper,
    get: (index, start) ->
      return that.get(index)  if typeof index is "number"
      that[index]

    has: (index, start) ->
      return index < that._length  if typeof index is "number"
      that[index] isnt `undefined`

    put: (index, start, value) ->
      if typeof index is "number"
        that.set index, value
      else
        that[index] = value

    unwrap: ->
      bytes = Packages.java.lang.reflect.Array.newInstance(Packages.java.lang.Byte.TYPE, that._length)
      Packages.java.lang.System.arraycopy that._bytes, that._offset, bytes, 0, that._length
      bytes
  )
  obj.__proto__ = that
  obj
exports.B_LENGTH = (bytes) ->
  bytes.length

exports.B_ALLOC = (length) ->
  Packages.java.lang.reflect.Array.newInstance Packages.java.lang.Byte.TYPE, length

exports.B_FILL = (bytes, length, offset, value) ->
  Packages.java.util.Arrays.fill bytes, length, offset, value

exports.B_COPY = (src, srcOffset, dst, dstOffset, length) ->
  Packages.java.lang.System.arraycopy src, srcOffset, dst, dstOffset, length

exports.B_GET = (bytes, index) ->
  (bytes[index] >>> 0) & 0xFF

exports.B_SET = (bytes, index, value) ->
  bytes[index] = ((if (value & 0x80) then -1 - (value ^ 0xFF) else value))

exports.B_DECODE = (bytes, offset, length, codec) ->
  String new Packages.java.lang.String(bytes, offset, length, codec)

exports.B_DECODE_DEFAULT = (bytes, offset, length) ->
  String new Packages.java.lang.String(bytes, offset, length, "UTF-8")

exports.B_ENCODE = (string, codec) ->
  new Packages.java.lang.String(string).getBytes codec

exports.B_ENCODE_DEFAULT = (string) ->
  new Packages.java.lang.String(string).getBytes "UTF-8"

exports.B_TRANSCODE = (bytes, offset, length, sourceCodec, targetCodec) ->
  new Packages.java.lang.String(bytes, offset, length, sourceCodec).getBytes targetCodec

# FIXME: disabling these because it broke several tests. figure out why.
#exports.ByteStringWrapper = wrapper;
#exports.ByteArrayWrapper = wrapper;
