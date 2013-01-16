file          = require 'file'
os            = require 'os'
{extend}      = require './lib/coffee-script/helpers'
CoffeeScript  = require './lib/coffee-script/coffee-script'

# ANSI Terminal Colors.
enableColors = no
unless system.os is 'win32'
  enableColors = not system.env.NODE_DISABLE_COLORS

bold = red = green = reset = ''
if enableColors
  bold  = '\x1B[0;1m'
  red   = '\x1B[0;31m'
  green = '\x1B[0;32m'
  reset = '\x1B[0m'

# Built file header.
header = """
  /**
   * CoffeeScript Compiler v#{CoffeeScript.VERSION}
   * http://coffeescript.org
   *
   * Copyright 2011, Jeremy Ashkenas
   * Released under the MIT License
   */
"""

sources = [
  'coffee-script', 'grammar', 'helpers'
  'lexer', 'nodes', 'rewriter', 'scope'
].map (filename) -> "src/#{filename}.coffee"

# Run a CoffeeScript through our interpreter.
run = (args, cb) ->
  status = os.system ['narwhal', 'bin/coffee'].concat(args)
  os.exit(1) if status != 0
  cb() if typeof cb is 'function'

# Log a message with a color.
log = (message, color, explanation) ->
  system.stdout.print color + message + reset + ' ' + (explanation or '')

option '-p', '--prefix [DIR]', 'set the installation prefix for `cake install`'

task 'build', 'build the CoffeeScript language from source', build = (cb) ->
  files = file.list 'src'
  files = ('src/' + f for f in files when f.match(/\.(lit)?coffee$/))
  run ['-c', '-o', 'lib/coffee-script'].concat(files), cb


task 'build:full', 'rebuild the source twice, and run the tests', ->
  build ->
    build ->
      csPath = './lib/coffee-script'
      delete require.cache[require.resolve csPath]
      unless runTests require csPath
        system.exit 1


task 'build:parser', 'rebuild the Jison parser (run build first)', ->
  extend global, require('util')
  require 'jison'
  parser = require('./lib/coffee-script/grammar').parser
  file.write 'lib/coffee-script/parser.js', parser.generate()


task 'build:browser', 'rebuild the merged script for inclusion in the browser', ->
  code = ''
  for name in ['helpers', 'rewriter', 'lexer', 'parser', 'scope', 'nodes', 'coffee-script', 'browser']
    code += """
      require['./#{name}'] = new function() {
        var exports = this;
        #{file.read "lib/coffee-script/#{name}.js"}
      };
    """
  code = """
    (function(root) {
      var CoffeeScript = function() {
        function require(path){ return require[path]; }
        #{code}
        return require['./coffee-script'];
      }();

      if (typeof define === 'function' && define.amd) {
        define(function() { return CoffeeScript; });
      } else {
        root.CoffeeScript = CoffeeScript;
      }
    }(this));
  """
  unless system.env.MINIFY is 'false'
    {code} = require('uglify-js').minify code, fromString: true
  file.write 'extras/coffee-script.js', header + '\n' + code
  system.stdout.print "built ... running browser tests:"
  invoke 'test:browser'


task 'doc:site', 'watch and continually rebuild the documentation for the website', ->
  os.system 'rake doc'


task 'doc:source', 'rebuild the internal documentation', ->
  os.system 'docco src/*.coffee && cp -rf docs documentation && rm -r docs'


task 'doc:underscore', 'rebuild the Underscore.coffee documentation page', ->
  os.system 'docco examples/underscore.coffee && cp -rf docs documentation && rm -r docs'

task 'bench', 'quick benchmark of compilation time', ->
  {Rewriter} = require './lib/coffee-script/rewriter'
  co     = sources.map((name) -> file.read name).join '\n'
  fmt    = (ms) -> " #{bold}#{ "   #{ms}".slice -4 }#{reset} ms"
  total  = 0
  now    = Date.now()
  time   = -> total += ms = -(now - now = Date.now()); fmt ms
  tokens = CoffeeScript.tokens co, rewrite: false
  system.stdout.print "Lex    #{time()} (#{tokens.length} tokens)"
  tokens = new Rewriter().rewrite tokens
  system.stdout.print "Rewrite#{time()} (#{tokens.length} tokens)"
  nodes  = CoffeeScript.nodes tokens
  system.stdout.print "Parse  #{time()}"
  js     = nodes.compile bare: true
  system.stdout.print "Compile#{time()} (#{js.length} chars)"
  system.stdout.print "total  #{ fmt total }"

task 'loc', 'count the lines of source code in the CoffeeScript compiler', ->
  os.system "cat #{ sources.join(' ') } | grep -v '^\\( *#\\|\\s*$\\)' | wc -l | tr -s ' '"


# Run the CoffeeScript test suite.
runTests = (CoffeeScript) ->
  startTime   = Date.now()
  currentFile = null
  passedTests = 0
  failures    = []

  global[name] = func for name, func of require 'assert'
  unless global.doesNotThrow?
    global.doesNotThrow = (block, error, message) ->
      try
        block()
      catch e
        message = String(e) unless message?
        global.fail {message}

  # Convenience aliases.
  global.CoffeeScript = CoffeeScript

  # Our test helper function for delimiting different test cases.
  global.test = (description, fn) ->
    try
      fn.test = {description, currentFile}
      fn.call(fn)
      ++passedTests
    catch e
      e.description = description if description?
      e.source      = fn.toString() if fn.toString?
      e.stack = e.rhinoException.scriptStackTrace unless e.stack or not e.rhinoException
      failures.push filename: currentFile, error: e

  # See http://wiki.ecmascript.org/doku.php?id=harmony:egal
  egal = (a, b) ->
    if a is b
      a isnt 0 or 1/a is 1/b
    else
      a isnt a and b isnt b

  # A recursive functional equivalence helper; uses egal for testing equivalence.
  arrayEgal = (a, b) ->
    if egal a, b then yes
    else if a instanceof Array and b instanceof Array
      return no unless a.length is b.length
      return no for el, idx in a when not arrayEgal el, b[idx]
      yes

  global.eq      = (a, b, msg) -> ok egal(a, b), msg
  global.arrayEq = (a, b, msg) -> ok arrayEgal(a,b), msg

  # Run every test in the `test` folder, recording failures.
  files = file.list 'test'
  for f in files when f.match /\.(lit)?coffee$/i
    literate = file.extension(f) is '.litcoffee'
    currentFile = filename = file.join 'test', f
    code = file.read filename
    try
      CoffeeScript.run code.toString(), {filename, literate}
    catch error
      failures.push {filename, error}

  # When all the tests have run, collect and print errors.
  # If a stacktrace is available, output the compiled function source.
  time = ((Date.now() - startTime) / 1000).toFixed(2)
  message = "passed #{passedTests} tests in #{time} seconds#{reset}"
  return log(message, green) unless failures.length
  log "failed #{failures.length} and #{message}", red
  for fail in failures
    {error, filename}  = fail
    jsFilename         = filename.replace(/\.coffee$/,'.js')
    match              = error.stack?.match(new RegExp(fail.file+":(\\d+):(\\d+)"))
    match              = error.stack?.match(/on line (\d+):/) unless match
    [match, line, col] = match if match
    system.stdout.print ''
    log "  #{error.description}", red if error.description
    log "  #{error.stack}", red if error.stack
    log "  #{error}", red
    log "  #{jsFilename}: line #{line ? 'unknown'}, column #{col ? 'unknown'}", red
    system.stdout.print "  #{error.source}" if error.source

  return !failures.length


task 'test', 'run the CoffeeScript language test suite', ->
  runTests CoffeeScript


task 'test:browser', 'run the test suite against the merged browser script', ->
  source = file.read 'extras/coffee-script.js', 'utf-8'
  result = {}
  global.testingBrowser = yes
  (-> eval source).call result
  runTests result.CoffeeScript
