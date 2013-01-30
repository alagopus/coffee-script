
# -- tlrobinson Tom Robinson
# -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License

# use the "file" module as the exports object.
exports = require("./file")

# File: Rhino
IO = require("./io").IO

javaRuntime = -> Packages.java.lang.Runtime.getRuntime()
javaPopen = (command) -> javaRuntime().exec command

# streams 
exports.FileIO = (path, mode, permissions) ->
  path = JavaPath(path)
  {update, append, write, read} = exports.mode(mode)
  if update
    throw new Error("Updating IO not yet implemented.")
  else if write or append
    new IO(null, new Packages.java.io.FileOutputStream(path, append))
  else if read
    new IO(new Packages.java.io.FileInputStream(path), null)
  else
    throw new Error("Files must be opened either for read, write, or update mode.")


# paths 
exports.cwd = ->
  String Packages.java.lang.System.getProperty("user.dir")

JavaPath = (path) ->
  new java.io.File(String(path) or ".")

exports.canonical = (path) ->
  String JavaPath(path).getCanonicalPath()

exports.mtime = (path) ->
  path = JavaPath(path)
  lastModified = path.lastModified()
  if lastModified is 0
    `undefined`
  else
    new Date(lastModified)

exports.size = (path) ->
  path = JavaPath(path)
  path.length()

exports.stat = (path) ->
  path = JavaPath(path)
  mtime: exports.mtime(path)
  size: exports.size(path)

exports.exists = (path) ->
  try
    return JavaPath(path).exists()
  false

exports.linkExists = (path) ->
  exports.isLink(path) or exports.exists(path)

exports.isDirectory = (path) ->
  try
    return JavaPath(path).isDirectory()
  false

exports.isFile = (path) ->
  try
    return JavaPath(path).isFile()
  false


# XXX not standard
exports.isAbsolute = (path) ->
  new java.io.File(path).isAbsolute()


# see: http://www.idiom.com/~zilla/Xfiles/javasymlinks.html 
exports.isLink = (path) ->
  
  # these file separators result in different canonical vs absolute for non-links, and windows doesn't have symlinks anyway
  return false  if java.io.File.separator is "\\"
  path = exports.path(path)
  canonical = path.canonical().toString()
  absolute = path.absolute().toString()
  absolute isnt canonical

exports.isReadable = (path) ->
  JavaPath(path).canRead()

exports.isWritable = (path) ->
  JavaPath(path).canWrite()

copyForLink = (source, target) ->
  sourceStream = exports.FileIO(source,
    read: true
  )
  try
    targetStream = exports.FileIO(target,
      write: true
    )
    try
      sourceStream.copy targetStream
    finally
      targetStream.close()
  finally
    sourceStream.close()

exports.rename = (source, target) ->
  source = exports.path(source)
  target = source.resolve(target)
  source = JavaPath(source)
  target = JavaPath(target)
  throw new Error("failed to rename " + source + " to " + target)  unless source.renameTo(target)

exports.move = (source, target) ->
  source = exports.path(source)
  target = exports.path(target)
  source = JavaPath(source)
  target = JavaPath(target)
  throw new Error("failed to rename " + source + " to " + target)  unless source.renameTo(target)

exports.remove = (path) ->
  throw new Error("failed to delete " + path)  unless JavaPath(path)["delete"]()

exports.mkdir = (path) ->
  throw new Error("failed to make directory " + path)  unless JavaPath(path).mkdir()

exports.mkdirs = (path) ->
  JavaPath(path).mkdirs()
  throw new Error("failed to make directories leading to " + path)  unless exports.isDirectory(path)

exports.rmdir = (path) ->
  throw new Error("failed to remove the directory " + path)  unless JavaPath(String(path))["delete"]()

exports.list = (path) ->
  path = JavaPath(String(path))
  listing = path.list()
  throw new Error("no such directory: " + path)  unless listing instanceof Array
  paths = []
  i = 0

  while i < listing.length
    paths[i] = String(listing[i])
    i++
  paths

exports.touch = (path, mtime) ->
  mtime = new Date()  if mtime is `undefined` or mtime is null
  path = JavaPath(path)
  path.createNewFile()
  throw new Error("unable to set mtime of " + path + " to " + mtime)  unless path.setLastModified(mtime.getTime())
