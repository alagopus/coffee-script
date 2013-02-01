# The `coffee` utility. Handles command-line compilation of CoffeeScript
# into various forms: saved into `.js` files or printed to stdout, piped to
# [JavaScript Lint](http://javascriptlint.com/) or recompiled every time the source is
# saved, printed as a token stream or as the syntax tree, or launch an
# interactive REPL.

# External dependencies.
fsa0           = require 'fs-base'
file           = require 'file'
os             = require 'os'
system         = require 'system'
helpers        = require './helpers'
optparse       = require './optparse'
CoffeeScript   = require './coffee-script'

printLine = (line) -> system.stdout.print line
printWarn = (line) -> system.stderr.print line

hidden = (f) -> /^\.|~$/.test f

# The help banner that is printed when `coffee` is called without arguments.
BANNER = '''
  Usage: coffee [options] path/to/script.coffee -- [args]

  If called without options, `coffee` will run your script.
'''

# The list of all the valid option flags that `coffee` knows how to handle.
SWITCHES = [
  ['-b', '--bare',            'compile without a top-level function wrapper']
  ['-c', '--compile',         'compile to JavaScript and save as .js files']
  ['-e', '--eval',            'pass a string from the command line as input']
  ['-h', '--help',            'display this help message']
  ['-i', '--interactive',     'run an interactive CoffeeScript REPL']
  ['-j', '--join [FILE]',     'concatenate the source CoffeeScript before compiling']
  ['-l', '--lint',            'pipe the compiled JavaScript through JavaScript Lint']
  ['-n', '--nodes',           'print out the parse tree that the parser produces']
  ['-o', '--output [DIR]',    'set the output directory for compiled JavaScript']
  ['-p', '--print',           'print out the compiled JavaScript']
  ['-s', '--stdio',           'listen for and compile scripts over stdio']
  ['-t', '--tokens',          'print out the tokens that the lexer/rewriter produce']
  ['-v', '--version',         'display the version number']
]

# Top-level objects shared by all the functions.
opts         = {}
sources      = []
sourceCode   = []
notSources   = {}
optionParser = null

# Run `coffee` by parsing passed options and determining what action to take.
# Many flags cause us to divert before compiling anything. Flags passed after
# `--` will be passed verbatim to your script as arguments in `global.arguments`
exports.run = ->
  parseOptions()
  return usage()                         if opts.help
  return version()                       if opts.version
  return require './repl'                if opts.interactive
  return compileStdio()                  if opts.stdio
  return compileScript null, sources[0]  if opts.eval
  return require './repl'                unless sources.length
  literals = if opts.run then sources.splice 1 else []
  global.arguments = global.arguments[0..0].concat literals
  for source in sources
    compilePath source, yes, file.resolve source

# Compile a path, which could be a script or a directory. If a directory
# is passed, recursively compile all '.coffee' and '.litcoffee' extension source
# files in it and all subdirectories.
compilePath = (source, topLevel, base) ->
  if not file.exists source
    if topLevel and not CoffeeScript.iscoffee(source)
      source = sources[sources.indexOf(source)] = "#{source}.coffee"
      return compilePath source, topLevel, base
    if topLevel
      system.stderr.print "File not found: #{source}"
      os.exit 1
    return
  else if file.isDirectory source
    files = file.list source
    index = sources.indexOf source
    files = files.filter (f) -> not hidden f
    sources[index..index] = (file.join source, f for f in files)
    sourceCode[index..index] = files.map -> null
    files.forEach (f) ->
      compilePath (file.join source, f), no, base
  else if topLevel or CoffeeScript.iscoffee(source)
    code = file.read source
    compileScript(source, code.toString(), base)
  else
    notSources[source] = yes
    removeSource source, base


# Compile a single source script, containing the given code, according to the
# requested options. If evaluating the script directly sets `__filename`,
# `__dirname` and `module.filename` to be correct relative to the script's path.
compileScript = (f, input, base) ->
  o = opts
  options = compileOptions f
  try
    t = {file: f, input, options}
    if      o.tokens      then printTokens CoffeeScript.tokens t.input, t.options
    else if o.nodes       then printLine CoffeeScript.nodes(t.input, t.options).toString().trim()
    else if o.run         then CoffeeScript.run t.input, t.options
    else if o.join and t.file isnt o.join
      sourceCode[sources.indexOf(t.file)] = t.input
      compileJoin()
    else
      t.output = CoffeeScript.compile t.input, t.options
      if o.print          then printLine t.output.trim()
      else if o.compile   then writeJs t.file, t.output, base
      else if o.lint      then lint t.file, t.output
  catch err
    printWarn "ERROR: #{err}"
    os.exit 1

# Attach the appropriate listeners to compile scripts incoming over **stdin**,
# and write them back to **stdout**.
compileStdio = ->
  compileScript null, system.stdin.read()

# If all of the source files are done being read, concatenate and compile
# them together.
joinTimeout = null
compileJoin = ->
  return unless opts.join
  unless sourceCode.some((code) -> code is null)
    clearTimeout joinTimeout
    joinTimeout = wait 100, ->
      compileScript opts.join, sourceCode.join('\n'), opts.join

# Remove a file from our source list, and source code cache. Optionally remove
# the compiled JS version as well.
removeSource = (source, base) ->
  index = sources.indexOf source
  sources.splice index, 1
  sourceCode.splice index, 1

# Get the corresponding output JavaScript path for a source file.
outputPath = (source, base) ->
  filename  = file.basename(source, file.extension(source)) + '.js'
  srcDir    = file.dirname source
  baseDir   = if base is '.' then srcDir else srcDir.substring base.length
  dir       = if opts.output then file.join opts.output, baseDir else srcDir
  file.resolve dir, filename

# Write out a JavaScript source file with the compiled code. By default, files
# are written out in `cwd` as `.js` files with the same name, but the output
# directory can be customized with `--output`.
writeJs = (source, js, base) ->
  jsPath = outputPath source, base
  jsDir  = file.dirname jsPath
  js = ' ' if js.length <= 0
  file.write jsPath, js

# Convenience for cleaner setTimeouts.
wait = (milliseconds, func) -> setTimeout func, milliseconds

# Pipe compiled JS through JSLint (requires a working `jsl` command), printing
# any errors or warnings that arise.
lint = (f, js) ->
  printIt = (buffer) -> printLine f + ':\t' + buffer.toString().trim()
  conf = __dirname + '/../../extras/jsl.conf'
  jsl = os.popen "jsl -nologo -stdin -conf " + conf
  jsl.stdout.on 'data', printIt
  jsl.stderr.on 'data', printIt
  jsl.stdin.write js
  jsl.stdin.end()

# Pretty-print a stream of tokens.
printTokens = (tokens) ->
  strings = for token in tokens
    [tag, value] = [token[0], token[1].toString().replace(/\n/, '\\n')]
    "[#{tag} #{value}]"
  printLine strings.join(' ')

# Use the [OptionParser module](optparse.html) to extract all options from
# `global.arguments` that are specified in `SWITCHES`.
parseOptions = ->
  optionParser  = new optparse.OptionParser SWITCHES, BANNER
  o = opts      = optionParser.parse global.arguments[1..]
  o.compile     or=  !!o.output
  o.run         = not (o.compile or o.print or o.lint)
  o.print       = !!  (o.print or (o.eval or o.stdio and o.compile))
  sources       = o.arguments
  sourceCode[i] = null for source, i in sources
  return

# The compile-time options to pass to the CoffeeScript compiler.
compileOptions = (filename) ->
  literate = file.extension(filename) is '.litcoffee'
  {filename, literate, bare: opts.bare, header: opts.compile}

# Print the `--help` usage message and exit. Deprecated switches are not
# shown.
usage = ->
  printLine (new optparse.OptionParser SWITCHES, BANNER).help()

# Print the `--version` message and exit.
version = ->
  printLine "CoffeeScript version #{CoffeeScript.VERSION}"
