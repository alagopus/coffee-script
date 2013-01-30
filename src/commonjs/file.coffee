
# -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License
# -- tlrobinson Tom Robinson
# -- tolmasky Francisco Tolmasky
# -- dangoor Kevin Dangoor

# NOTE: portions of the "file" module are implemented in "file-bootstrap" and "file-engine",
# which are loaded at the bottom of this file to allow for overriding default implementations
io = require("io")
require "file-bootstrap"

# streams 
exports.open = (path, mode, options) ->
  
  # it's possible to confuse options and mode,
  # particularly with exports.read(path, options).
  # if a mode string is passed into options, 
  # tollerate it.
  options = mode: exports.mode(options)  if typeof options is "string"
  
  # we'll channel all of the arguments through
  # the options object, so create an empty one if none
  # was given.
  options = {}  unless options
  
  # if options were specified as the first (and
  # presumably only) argument, use those options,
  # overriding any in the options object if both
  # were provided.
  if typeof path is "object"
    for key of path
      options[key] = path[key]  if Object::hasOwnProperty.call(path, key)
  
  # if the path is a string, however, write it
  # onto the options object alone.
  options.path = path  if typeof path is "string"
  
  # accumulate the mode from options.mode and 
  # the mode arg through successive generations;
  # coerce the options.mode to an object, suitable
  # for updates
  options.mode = exports.mode(options.mode)
  
  # update options.mode with the mode argument
  options.mode = exports.mode(mode, options.mode)  if mode
  
  # channel all the options back into local variables
  path = options.path
  mode = options.mode
  permissions = options.permissions
  charset = options.charset
  buffering = options.buffering
  recordSeparator = options.recordSeparator
  fieldSeparator = options.fieldSeparator
  
  # and decompose the mode object
  read = mode.read
  write = mode.write
  append = mode.append
  update = mode.update
  binary = mode.binary
  
  # read by default
  read = mode.read = true  unless read or write or append
  
  # create a byte stream
  raw = exports.FileIO(path, mode, permissions)
  
  # if we're in binary mode, just return the raw
  # stream
  return raw  if binary
  
  # otherwise, go through the courses to return the
  # appropriate reader, writer, or updater, buffered,
  # line buffered, and charset decoded/encoded
  # abstraction
  lineBuffering = buffering is 1 or buffering is `undefined` and raw.isatty and raw.isatty()
  
  # leaving buffering undefined is a signal to the engine implementation
  #  that it ought to pick a good size on its own.
  
  # Photoshop's JavaScript engine thinks undefined < 0. ಠ_ಠ
  throw new Error("invalid buffering size: " + buffering)  if buffering isnt `undefined` and buffering < 0
  throw new Error("can't have unbuffered text IO")  if buffering is 0
  new io.TextIOWrapper(raw, mode, lineBuffering, buffering, charset, options)


#
#    idempotent normalization of acceptable formats for
#    file modes.
#
exports.mode = (mode, result) ->
  unless result
    result =
      read: false
      write: false
      append: false
      update: false
      binary: false
      canonical: false
      exclusive: false
  else throw new Error("Mode to update is not a proper mode object: " + result)  unless typeof result is "object"
  if mode is `undefined` or mode is null

  else if mode instanceof String or typeof mode is "string"
    mode.split("").forEach (option) ->
      if option is "r"
        result.read = true
      else if option is "w"
        result.write = true
      else if option is "a"
        result.append = true
      else if option is "+"
        result.update = false
      else if option is "b"
        result.binary = true
      else if option is "t"
        result.binary = false
      else if option is "c"
        result.canonical = true
      else if option is "x"
        result.exclusive = true
      else
        throw new Error("unrecognized mode option in mode: " + option)

  else if mode instanceof Array
    mode.forEach (option) ->
      if Object::hasOwnProperty.call(result, option)
        result[option] = true
      else
        throw new Error("unrecognized mode option in mode: " + option)

  else if mode instanceof Object
    for option of mode
      if Object::hasOwnProperty.call(mode, option)
        if Object::hasOwnProperty.call(result, option)
          result[option] = !!mode[option]
        else
          throw new Error("unrecognized mode option in mode: " + option)
  else
    throw new Error("unrecognized mode: " + mode)
  result


# read, write, &c 
exports.read = (path, options) ->
  path = String(path)
  file = exports.open(path, "r", options)
  try
    return file.read()
  finally
    file.close()

exports.write = (path, data, options) ->
  path = String(path)
  file = exports.open(path, "w", options)
  try
    file.write data
    file.flush()
  finally
    file.close()

exports.copy = (source, target) ->
  source = exports.path(source)
  target = exports.path(target)
  sourceStream = source.open("rb")
  try
    targetStream = target.open("wb")
    try
      sourceStream.copy targetStream
    finally
      targetStream.close()
  finally
    sourceStream.close()

list = exports.list
exports.list = (path) ->
  list String(path or "") or "."

exports.listTree = (path) ->
  path = String(path or "")
  path = "."  unless path
  paths = [""]
  exports.list(path).forEach (child) ->
    fullPath = exports.join(path, child)
    if exports.isDirectory(fullPath)
      paths.push.apply paths, exports.listTree(fullPath).map((p) ->
        exports.join child, p
      )
    else
      paths.push child

  paths

exports.listDirectoryTree = (path) ->
  path = String(path or "")
  path = "."  unless path
  paths = [""]
  exports.list(path).forEach (child) ->
    fullPath = exports.join(path, child)
    if exports.isDirectory(fullPath)
      paths.push.apply paths, exports.listDirectoryTree(fullPath).map((p) ->
        exports.join child, p
      )

  paths

exports.FNM_LEADING_DIR = 1 << 1
exports.FNM_PATHNAME = 1 << 2
exports.FNM_PERIOD = 1 << 3
exports.FNM_NOESCAPE = 1 << 4
exports.FNM_CASEFOLD = 1 << 5
exports.FNM_DOTMATCH = 1 << 6
fnmatchFlags = ["FNM_LEADING_DIR", "FNM_PATHNAME", "FNM_PERIOD", "FNM_NOESCAPE", "FNM_CASEFOLD", "FNM_DOTMATCH"]
exports.fnmatch = (pattern, string, flags) ->
  re = exports.patternToRegExp(pattern, flags)
  
  #print("PATTERN={"+pattern+"} REGEXP={"+re+"}");
  re.test string

exports.patternToRegExp = (pattern, flags) ->
  options = {}
  if typeof flags is "number"
    fnmatchFlags.forEach (flagName) ->
      options[flagName] = !!(flags & exports[flagName])

  else options = flags  if flags
  
  # FNM_PATHNAME: don't match separators
  matchAny = (if options.FNM_PATHNAME then "[^" + RegExp.escape(exports.SEPARATOR) + "]" else ".")
  
  # FNM_NOESCAPE match "\" separately
  tokenizeRegex = (if options.FNM_NOESCAPE then /\[[^\]]*\]|{[^}]*}|[^\[{]*/g else /\\(.)|\[[^\]]*\]|{[^}]*}|[^\\\[{]*/g)
  
  # if escaping is on, always return the next character escaped
  
  # negation
  
  # swap any range characters that are out of order
  new RegExp("^" + pattern.replace(tokenizeRegex, (pattern, $1) ->
    return RegExp.escape($1)  if not options.FNM_NOESCAPE and (/^\\/).test(pattern) and $1
    if /^\[/.test(pattern)
      result = "["
      pattern = pattern.slice(1, pattern.length - 1)
      if /^[!^]/.test(pattern)
        pattern = pattern.slice(1)
        result += "^"
      pattern = pattern.replace(/(.)-(.)/, (match, a, b) ->
        (if a.charCodeAt(0) > b.charCodeAt(0) then b + "-" + a else match)
      )
      return result + pattern.split("-").map(RegExp.escape).join("-") + "]"
    if /^\{/.test(pattern)
      return ("(" + pattern.slice(1, pattern.length - 1).split(",").map((pattern) ->
        RegExp.escape pattern
      ).join("|") + ")")
    pattern.replace(exports.SEPARATORS_RE(), exports.SEPARATOR).split(new RegExp(exports.SEPARATOR + "?" + "\\*\\*" + exports.SEPARATOR + "?")).map((pattern) ->
      pattern.split(exports.SEPARATOR).map((pattern) ->
        return "\\.?"  if pattern is ""
        return  if pattern is "."
        return "(|\\.|\\.\\.(" + exports.SEPARATOR + "\\.\\.)*?)"  if pattern is "..."
        pattern.split("*").map((pattern) ->
          pattern.split("?").map((pattern) ->
            RegExp.escape pattern
          ).join matchAny
        ).join matchAny + "*"
      ).join RegExp.escape(exports.SEPARATOR)
    ).join ".*?"
  ) + "$", (if options.FNM_CASEFOLD then "i" else ""))

exports.copyTree = (source, target, path) ->
  sourcePath = (source = exports.path(source)).join(path)
  targetPath = (target = exports.path(target)).join(path)
  throw new Error("file exists: " + targetPath)  if exports.exists(targetPath)
  if exports.isDirectory(sourcePath)
    exports.mkdir targetPath
    exports.list(sourcePath).forEach (name) ->
      exports.copyTree source, target, exports.join(path, name)

  else
    exports.copy sourcePath, targetPath

exports.match = (path, pattern) ->
  exports.patternToRegExp(pattern).test path

exports.glob = (pattern, flags) ->
  pattern = String(pattern or "")
  parts = exports.split(pattern)
  paths = ["."]
  if exports.isAbsolute(pattern)
    paths = (if parts[0] is "" then ["/"] else [parts[0]])
    parts.shift()
  parts[parts.length - 1] = "*"  if parts[parts.length - 1] is "**"
  parts.forEach (part) ->
    if part is ""

    else if part is "**"
      paths = globTree(paths)
    else if part is "..."
      paths = globHeredity(paths)
    else if /[\\\*\?\[{]/.test(part)
      paths = globPattern(paths, part, flags)
    else
      paths = paths.map((path) ->
        return exports.join(path, part)  if path
        part
      ).filter((path) ->
        exports.exists path
      )
    
    # uniqueness
    visited = {}
    paths = paths.filter((path) ->
      result = not Object::hasOwnProperty.call(visited, path)
      visited[path] = true
      result
    )

  paths.shift()  if paths[0] is ""
  paths

globTree = (paths) ->
  Array::concat.apply [], paths.map((path) ->
    return []  unless exports.isDirectory(path)
    exports.listDirectoryTree(path).map (child) ->
      exports.join path, child

  )

globHeredity = (paths) ->
  Array::concat.apply [], paths.map((path) ->
    isRelative = exports.isRelative(path)
    heredity = []
    parts = exports.split(exports.absolute(path))
    parts.pop()  if parts[parts.length - 1] is ""
    while parts.length
      heredity.push exports.join.apply(null, parts)
      parts.pop()
    if isRelative
      heredity = heredity.map((path) ->
        exports.relative "", path
      )
    heredity
  )

globPattern = (paths, pattern, flags) ->
  re = exports.patternToRegExp(pattern, flags)
  
  # print("PATTERN={"+pattern+"} REGEXP={"+re+"}");
  # use concat to flatten result arrays
  Array::concat.apply [], paths.map((path) ->
    return []  unless exports.isDirectory(path)
    #".", ".."
    [].concat(exports.list(path)).filter((name) ->
      re.test name
    ).map((name) ->
      return exports.join(path, name)  if path
      name
    ).filter (path) ->
      exports.exists path

  )

exports.globPaths = (pattern, flags) ->
  exports.glob(pattern, flags).map (path) ->
    new exports.Path(path)


exports.rmtree = (path) ->
  if exports.isLink(path)
    exports.remove path
  else if exports.isDirectory(path)
    exports.list(path).forEach (name) ->
      exports.rmtree exports.join(path, name)

    exports.rmdir path
  else
    exports.remove path

unless exports.mkdirs
  exports.mkdirs = (path) ->
    parts = exports.split(path)
    at = []
    parts.forEach (part) ->
      at.push part
      path = exports.join.apply(null, at)
      try
        exports.mkdir path


# path manipulation 
exports.relative = (source, target) ->
  unless target
    target = source
    source = exports.cwd() + "/"
  source = exports.absolute(source)
  target = exports.absolute(target)
  source = source.split(exports.SEPARATORS_RE())
  target = target.split(exports.SEPARATORS_RE())
  source.pop()
  while source.length and target.length and target[0] is source[0]
    source.shift()
    target.shift()
  while source.length
    source.shift()
    target.unshift ".."
  target.join exports.SEPARATOR

exports.absolute = (path) ->
  exports.resolve exports.join(exports.cwd(), ""), path

exports.cwdPath = ->
  new exports.Path(exports.cwd())


# path wrapper, for chaining 
exports.path = (args...) -> #path
  return exports.Path("")  if args.length is 1 and args[0] is ""
  exports.Path exports.join.apply(exports, args)

Path = exports.Path = (path) ->
  return new exports.Path(path)  unless this instanceof exports.Path
  @toString = ->
    path

Path:: = new String()
Path::valueOf = ->
  @toString()

Path::join = (args...) ->
  exports.Path exports.join.apply(null, [@toString()].concat(Array::slice.call(args)))

Path::resolve = (args...) ->
  exports.Path exports.resolve.apply(null, [@toString()].concat(Array::slice.call(args)))

Path::to = (target) ->
  exports.Path exports.relative(@toString(), target)

Path::from = (target) ->
  exports.Path exports.relative(target, @toString())

Path::glob = (pattern, flags) ->
  return []  unless @isDirectory()
  return exports.glob(exports.join(this, pattern), flags)  if @toString()
  exports.glob pattern

Path::globPaths = (pattern, flags) ->
  return []  unless @isDirectory()
  if @toString()
    return exports.glob(exports.join(this, pattern), flags).map((path) ->
      new exports.Path(path)
    , this).filter((path) ->
      !!path.toString()
    )
  exports.glob pattern, flags

pathed = ["absolute", "basename", "canonical", "dirname", "normal", "relative"]
i = 0

while i < pathed.length
  name = pathed[i]
  Path::[name] = ((name) ->
    (args...) ->
      exports.Path exports[name].apply(this, [@toString()].concat(Array::slice.call(args)))
  )(name)
  i++
pathIterated = ["list", "listTree"]
i = 0

while i < pathIterated.length
  name = pathIterated[i]
  
  # create the module-scope variant
  exports[name + "Paths"] = ((name) ->
    (args...) ->
      exports[name].apply(exports, args).map (path) ->
        new exports.Path(path)

  )(name)
  
  # create the Path object variant
  Path::[name + "Paths"] = ((name) ->
    ->
      self = this
      exports[name](this).map (path) ->
        self.join path

  )(name)
  i++
nonPathed = ["chown", "copy", "exists", "extension", "isDirectory", "isFile", "isLink", "isReadable", "isWritable", "link", "linkExists", "list", "listTree", "mkdir", "mkdirs", "move", "mtime", "open", "read", "remove", "rename", "rmdir", "rmtree", "size", "split", "stat", "symlink", "touch", "write"]
i = 0

while i < nonPathed.length
  name = nonPathed[i]
  Path::[name] = ((name) ->
    (args...) ->
      throw new Error("NYI Path based on " + name)  unless exports[name]
      result = exports[name].apply(this, [@toString()].concat(Array::slice.call(args)))
      result = this  if result is `undefined`
      result
  )(name)
  i++
require "file-engine"
