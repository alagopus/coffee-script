# A very simple Read-Eval-Print-Loop. Compiles one line at a time to JavaScript
# and evaluates it. Good for simple tests, or poking around the **Node.js** API.
# Using it looks like this:
#
#     coffee> system.stdout.print "#{num} bottles of beer" for num in [99..1]

# Start by opening up `stdin` and `stdout`.
stdin = system.stdin
stdout = system.stdout

# Require the **coffee-script** module to get access to the compiler.
CoffeeScript = require './coffee-script'
os           = require 'os'

# REPL Setup

# Config
REPL_PROMPT = 'coffee> '
REPL_PROMPT_MULTILINE = '------> '
REPL_PROMPT_CONTINUATION = '......> '
enableColours = no

# Log an error.
error = (err) ->
  stdout.write err.toString() + (err.stack or '') + '\n'

## Autocompletion

# Regexes to match complete-able bits of text.
ACCESSOR  = /\s*([\w\.]+)(?:\.(\w*))$/
SIMPLEVAR = /(\w+)$/i

# Returns a list of completions, and the completed text.
autocomplete = (text) ->
  completeAttribute(text) or completeVariable(text) or [[], text]

# Attempt to autocomplete a chained dotted attribute: `one.two.three`.
completeAttribute = (text) ->
  if match = text.match ACCESSOR
    [all, obj, prefix] = match
    try obj = Function('return(' + obj + ')')()
    catch e
      return
    return unless obj?
    obj = Object obj
    candidates = Object.getOwnPropertyNames obj
    while obj = Object.getPrototypeOf obj
      for key in Object.getOwnPropertyNames obj when key not in candidates
        candidates.push key
    completions = getCompletions prefix, candidates
    [completions, prefix]

# Attempt to autocomplete an in-scope free variable: `one`.
completeVariable = (text) ->
  free = text.match(SIMPLEVAR)?[1]
  free = "" if text is ""
  if free?
    vars = Function('return Object.getOwnPropertyNames(Object(this))')()
    keywords = (r for r in CoffeeScript.RESERVED when r[..1] isnt '__')
    candidates = vars
    for key in keywords when key not in candidates
      candidates.push key
    completions = getCompletions free, candidates
    [completions, free]

# Return elements of candidates for which `prefix` is a prefix.
getCompletions = (prefix, candidates) ->
  el for el in candidates when 0 is el.indexOf prefix

# Make sure that uncaught exceptions don't kill the REPL.
# FIXME COMMONJS: process.on 'uncaughtException', error

# The current backlog of multi-line code.
backlog = ''

# The main REPL function. **run** is called every time a line of code is entered.
# Attempt to evaluate the command. If there's an exception, print it out instead
# of exiting.
run = (buffer) ->
  # remove single-line comments
  buffer = buffer.replace /(^|[\r\n]+)(\s*)##?(?:[^#\r\n][^\r\n]*|)($|[\r\n])/, "$1$2$3"
  # remove trailing newlines
  buffer = buffer.replace /[\r\n]+$/, ""
  if !buffer.toString().trim() and !backlog
    repl.prompt()
    return
  code = backlog += buffer
  if code[code.length - 1] is '\\'
    backlog = "#{backlog[...-1]}\n"
    repl.setPrompt REPL_PROMPT_CONTINUATION
    repl.prompt()
    return
  repl.setPrompt REPL_PROMPT
  backlog = ''
  try
    _ = global._
    returnValue = CoffeeScript.eval "_=(#{code}\n)", {
      filename: 'repl'
      modulename: 'repl'
    }
    if returnValue is undefined
      global._ = _
    repl.output.write "#{returnValue}\n"
  catch err
    error err
  repl.prompt()

repl =
  prompt: ->
    @output.write @_prompt
    @output.flush()
  setPrompt: (p) -> @_prompt = p
  input: stdin
  output: stdout
  on: ->

repl.setPrompt REPL_PROMPT
repl.prompt()

while line = repl.input.readLine()
  run line

