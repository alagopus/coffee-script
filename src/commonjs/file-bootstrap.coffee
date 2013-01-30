
# -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License
# -- tlrobinson Tom Robinson
# -- cadorn Christoph Dorn

# NOTE: this file is used is the bootstrapping process,
# so any "requires" must be accounted for in narwhal.js
exports = require "file"
system = require "system"

# path manipulation, needed by the sandbox module in the 
# * bootstrapping process before "require" is ready for use 
if /\bwindows\b/i.test(system.os) or /\bwinnt\b/i.test(system.os)
  exports.ROOT = "\\"
  exports.SEPARATOR = "\\"
  exports.ALT_SEPARATOR = "/"
else
  exports.ROOT = "/"
  exports.SEPARATOR = "/"
  exports.ALT_SEPARATOR = `undefined`

# we need to make sure the separator regex is always in sync with the separators.
# this caches the generated regex and rebuild if either separator changes.
exports.SEPARATORS_RE = ->
  if separatorCached isnt exports.SEPARATOR or altSeparatorCached isnt exports.ALT_SEPARATOR
    separatorCached = exports.SEPARATOR
    altSeparatorCached = exports.ALT_SEPARATOR
    separatorReCached = new RegExp("[" + (separatorCached or "").replace(/[-[\]{}()*+?.\\^$|,#\s]/g, "\\$&") + (altSeparatorCached or "").replace(/[-[\]{}()*+?.\\^$|,#\s]/g, "\\$&") + "]", "g")
  separatorReCached

separatorCached = undefined
altSeparatorCached = undefined
separatorReCached = undefined

exports.join = (args...) -> 
  # special case for root, helps glob
  return exports.SEPARATOR  if args.length is 1 and args[0] is "" # [""] -> "/"
  # ["", ""] -> "/",
  # ["", "a"] -> "/a"
  # ["a"] -> "a"
  exports.normal Array::join.call(args, exports.SEPARATOR)

exports.split = (path) ->
  parts = undefined
  try
    parts = String(path).split(exports.SEPARATORS_RE())
  catch exception
    throw new Error("Cannot split " + (typeof path) + ", \"" + path + "\"")
  
  # this special case helps isAbsolute
  # distinguish an empty path from an absolute path
  # "" -> [] NOT [""]
  return []  if parts.length is 1 and parts[0] is ""
  
  # "a" -> ["a"]
  # "/a" -> ["", "a"]
  parts

exports.resolve = (args...) ->
  root = ""
  parents = []
  children = []
  leaf = ""
  i = 0

  while i < args.length
    path = String(args[i++])
    continue if path is ""
    parts = path.split(exports.SEPARATORS_RE())
    if exports.isAbsolute(path)
      root = parts.shift() + exports.SEPARATOR
      parents = []
      children = []
    leaf = parts.pop()
    if leaf is "." or leaf is ".."
      parts.push leaf
      leaf = ""
    j = 0

    while j < parts.length
      part = parts[j]
      if part is "." or part is ""

      else if part is ".."
        if children.length
          children.pop()
        else
          parents.push ".."  unless root
      else
        children.push part
      j++
  path = parents.concat(children).join(exports.SEPARATOR)
  leaf = exports.SEPARATOR + leaf  if path
  root + path + leaf

exports.normal = (path) ->
  exports.resolve path


# XXX not standard
exports.isAbsolute = (path) ->
  
  # for absolute paths on any operating system,
  # the first path component always determines
  # whether it is relative or absolute.  On Unix,
  # it is empty, so ['', 'foo'].join('/') == '/foo',
  # '/foo'.split('/') == ['', 'foo'].
  parts = exports.split(path)
  
  # split('') == [].  '' is not absolute.
  # split('/') == ['', ''] is absolute.
  # split(?) == [''] does not occur.
  return false  if parts.length is 0
  exports.isDrive parts[0]


# XXX not standard
exports.isRelative = (path) ->
  not exports.isAbsolute(path)


# XXX not standard
exports.isDrive = (first) ->
  if /\bwindows\b/i.test(system.os) or /\bwinnt\b/i.test(system.os)
    /:$/.test first
  else
    first is ""


###
root
returns the Unix root path
or corresponding Windows drive
for a given path.
###

# XXX not standard
exports.root = (path) ->
  path = require("file").absolute(path)  unless exports.isAbsolute(path)
  parts = exports.split(path)
  exports.join parts[0], ""

exports.dirname = (path) ->
  parts = exports.split(path)
  
  # XXX needs to be sensitive to the root for
  # Windows compatibility
  parts.pop()
  exports.join.apply(null, parts) or "."


# XXX the extension argument is not standard
exports.basename = (path, extension) ->
  chop = (a, b) ->
    return a unless b
    start = a.length - b.length
    if a.lastIndexOf(b, start) is start
      a.substring(0, start)
    else a
  chop /[^\/\\]+$/.exec(path)[0], extension

exports.extension = (path) ->
  path = exports.basename(path)
  path = path.replace(/^\.*/, "")
  index = path.lastIndexOf(".")
  (if index <= 0 then "" else path.substring(index))

