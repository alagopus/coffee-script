
# Copyright (C) 1999 Masanao Izumo <iz@onicos.co.jp>
# * Version: 1.0
# * LastModified: Dec 25 1999
# * This library is free.  You can redistribute it and/or modify it.
# 

# -- Mansano Izumo Copyright 1999 "free"
# modified to add support for Binary for Narwhal:
# -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License
# -- cadorn Christoph Dorn
encodeChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
decodeChars = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 62, -1, -1, -1, 63, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, -1, -1, -1, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1, -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1, -1, -1]
binary = require("binary")
exports.encode = (str) ->
  length = len(str)
  i = 0
  out = []
  while i < length
    c1 = str.charCodeAt(i++) & 0xff
    if i is length
      out.push encodeChars.charCodeAt(c1 >> 2)
      out.push encodeChars.charCodeAt((c1 & 0x3) << 4)
      out.push "=".charCodeAt(0)
      out.push "=".charCodeAt(0)
      break
    c2 = str.charCodeAt(i++)
    if i is length
      out.push encodeChars.charCodeAt(c1 >> 2)
      out.push encodeChars.charCodeAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4))
      out.push encodeChars.charCodeAt((c2 & 0xF) << 2)
      out.push "=".charCodeAt(0)
      break
    c3 = str.charCodeAt(i++)
    out.push encodeChars.charCodeAt(c1 >> 2)
    out.push encodeChars.charCodeAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4))
    out.push encodeChars.charCodeAt(((c2 & 0xF) << 2) | ((c3 & 0xC0) >> 6))
    out.push encodeChars.charCodeAt(c3 & 0x3F)
  binary.ByteString(out).toString "ascii"

exports.decode = (str) ->
  length = len(str)
  i = 0
  out = []
  while i < length
    
    # c1 
    loop
      c1 = decodeChars[str.charCodeAt(i++) & 0xff]
      break unless i < length and c1 is -1
    break  if c1 is -1
    
    # c2 
    loop
      c2 = decodeChars[str.charCodeAt(i++) & 0xff]
      break unless i < length and c2 is -1
    break  if c2 is -1
    out.push String.fromCharCode((c1 << 2) | ((c2 & 0x30) >> 4))
    
    # c3 
    loop
      c3 = str.charCodeAt(i++) & 0xff
      return out.join("")  if c3 is 61
      c3 = decodeChars[c3]
      break unless i < length and c3 is -1
    break  if c3 is -1
    out.push String.fromCharCode(((c2 & 0xF) << 4) | ((c3 & 0x3C) >> 2))
    
    # c4 
    loop
      c4 = str.charCodeAt(i++) & 0xff
      return out.join("")  if c4 is 61
      c4 = decodeChars[c4]
      break unless i < length and c4 is -1
    break  if c4 is -1
    out.push String.fromCharCode(((c3 & 0x03) << 6) | c4)
  out.join ""

len = (object) ->
  if object.length isnt `undefined`
    object.length
  else if object.getLength isnt `undefined`
    object.getLength()
  else
    `undefined`
