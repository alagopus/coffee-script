(function() {
  var BANNER, CoffeeScript, EventEmitter, SWITCHES, coffee_exts, compileJoin, compileOptions, compilePath, compileScript, compileStdio, exec, exists, forkNode, fs, helpers, hidden, joinTimeout, lint, notSources, optionParser, optparse, opts, outputPath, parseOptions, path, printLine, printTokens, printWarn, removeSource, sourceCode, sources, spawn, timeLog, unwatchDir, usage, version, wait, watch, watchDir, watchers, writeJs, _ref,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  fs = require('fs');

  path = require('path');

  helpers = require('./helpers');

  optparse = require('./optparse');

  CoffeeScript = require('./coffee-script');

  _ref = require('child_process'), spawn = _ref.spawn, exec = _ref.exec;

  EventEmitter = require('events').EventEmitter;

  exists = fs.exists || path.exists;

  helpers.extend(CoffeeScript, new EventEmitter);

  printLine = (function(){ function _printLine(line) {
    var _printLine;
    return process.stdout.write(line + '\n');
  }; return _printLine})();

  printWarn = (function(){ function _printWarn(line) {
    var _printWarn;
    return process.stderr.write(line + '\n');
  }; return _printWarn})();

  hidden = (function(){ function _hidden(file) {
    var _hidden;
    return /^\.|~$/.test(file);
  }; return _hidden})();

  BANNER = 'Usage: coffee [options] path/to/script.coffee -- [args]\n\nIf called without options, `coffee` will run your script.';

  SWITCHES = [['-b', '--bare', 'compile without a top-level function wrapper'], ['-c', '--compile', 'compile to JavaScript and save as .js files'], ['-e', '--eval', 'pass a string from the command line as input'], ['-h', '--help', 'display this help message'], ['-i', '--interactive', 'run an interactive CoffeeScript REPL'], ['-j', '--join [FILE]', 'concatenate the source CoffeeScript before compiling'], ['-l', '--lint', 'pipe the compiled JavaScript through JavaScript Lint'], ['-n', '--nodes', 'print out the parse tree that the parser produces'], ['--nodejs [ARGS]', 'pass options directly to the "node" binary'], ['-o', '--output [DIR]', 'set the output directory for compiled JavaScript'], ['-p', '--print', 'print out the compiled JavaScript'], ['-s', '--stdio', 'listen for and compile scripts over stdio'], ['-t', '--tokens', 'print out the tokens that the lexer/rewriter produce'], ['-v', '--version', 'display the version number'], ['-w', '--watch', 'watch scripts for changes and rerun commands']];

  opts = {};

  sources = [];

  sourceCode = [];

  notSources = {};

  watchers = {};

  optionParser = null;

  coffee_exts = ['.coffee', '.litcoffee'];

  exports.run = (function(){ function _run() {
    var literals, source, _i, _len, _results, _run;
    parseOptions();
    if (opts.nodejs) {
      return forkNode();
    }
    if (opts.help) {
      return usage();
    }
    if (opts.version) {
      return version();
    }
    if (opts.interactive) {
      return require('./repl').start();
    }
    if (opts.watch && !fs.watch) {
      return printWarn("The --watch feature depends on Node v0.6.0+. You are running " + process.version + ".");
    }
    if (opts.stdio) {
      return compileStdio();
    }
    if (opts["eval"]) {
      return compileScript(null, sources[0]);
    }
    if (!sources.length) {
      return require('./repl').start();
    }
    literals = opts.run ? sources.splice(1) : [];
    process.argv = process.argv.slice(0, 2).concat(literals);
    process.argv[0] = 'coffee';
    _results = [];
    for (_i = 0, _len = sources.length; _i < _len; _i++) {
      source = sources[_i];
      _results.push(compilePath(source, true, path.normalize(source)));
    }
    return _results;
  }; return _run})();

  compilePath = (function(){ function _compilePath(source, topLevel, base) {
    var _compilePath;
    return fs.stat(source, function(err, stats) {
      var _ref1, _ref2;
      if (err && err.code !== 'ENOENT') {
        throw err;
      }
      if ((err != null ? err.code : void 0) === 'ENOENT') {
        if (topLevel && source && (_ref1 = path.extname(source), __indexOf.call(coffee_exts, _ref1) < 0)) {
          source = sources[sources.indexOf(source)] = "" + source + ".coffee";
          return compilePath(source, topLevel, base);
        }
        if (topLevel) {
          console.error("File not found: " + source);
          process.exit(1);
        }
        return;
      }
      if (stats.isDirectory() && path.dirname(source) !== 'node_modules') {
        if (opts.watch) {
          watchDir(source, base);
        }
        return fs.readdir(source, function(err, files) {
          var file, index, _ref2, _ref3;
          if (err && err.code !== 'ENOENT') {
            throw err;
          }
          if ((err != null ? err.code : void 0) === 'ENOENT') {
            return;
          }
          index = sources.indexOf(source);
          files = files.filter(function(file) {
            return !hidden(file);
          });
          [].splice.apply(sources, [index, index - index + 1].concat(_ref2 = (function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = files.length; _i < _len; _i++) {
              file = files[_i];
              _results.push(path.join(source, file));
            }
            return _results;
          })())), _ref2;
          [].splice.apply(sourceCode, [index, index - index + 1].concat(_ref3 = files.map(function() {
            return null;
          }))), _ref3;
          return files.forEach(function(file) {
            return compilePath(path.join(source, file), false, base);
          });
        });
      } else if (topLevel || (_ref2 = path.extname(source), __indexOf.call(coffee_exts, _ref2) >= 0)) {
        if (opts.watch) {
          watch(source, base);
        }
        return fs.readFile(source, function(err, code) {
          if (err && err.code !== 'ENOENT') {
            throw err;
          }
          if ((err != null ? err.code : void 0) === 'ENOENT') {
            return;
          }
          return compileScript(source, code.toString(), base);
        });
      } else {
        notSources[source] = true;
        return removeSource(source, base);
      }
    });
  }; return _compilePath})();

  compileScript = (function(){ function _compileScript(file, input, base) {
    var o, options, t, task, _compileScript;
    o = opts;
    options = compileOptions(file);
    try {
      t = task = {
        file: file,
        input: input,
        options: options
      };
      CoffeeScript.emit('compile', task);
      if (o.tokens) {
        return printTokens(CoffeeScript.tokens(t.input, t.options));
      } else if (o.nodes) {
        return printLine(CoffeeScript.nodes(t.input, t.options).toString().trim());
      } else if (o.run) {
        return CoffeeScript.run(t.input, t.options);
      } else if (o.join && t.file !== o.join) {
        sourceCode[sources.indexOf(t.file)] = t.input;
        return compileJoin();
      } else {
        t.output = CoffeeScript.compile(t.input, t.options);
        CoffeeScript.emit('success', task);
        if (o.print) {
          return printLine(t.output.trim());
        } else if (o.compile) {
          return writeJs(t.file, t.output, base);
        } else if (o.lint) {
          return lint(t.file, t.output);
        }
      }
    } catch (err) {
      CoffeeScript.emit('failure', err, task);
      if (CoffeeScript.listeners('failure').length) {
        return;
      }
      if (o.watch) {
        return printLine(err.message + '\x07');
      }
      printWarn(err instanceof Error && err.stack || ("ERROR: " + err));
      return process.exit(1);
    }
  }; return _compileScript})();

  compileStdio = (function(){ function _compileStdio() {
    var code, stdin, _compileStdio;
    code = '';
    stdin = process.openStdin();
    stdin.on('data', function(buffer) {
      if (buffer) {
        return code += buffer.toString();
      }
    });
    return stdin.on('end', function() {
      return compileScript(null, code);
    });
  }; return _compileStdio})();

  joinTimeout = null;

  compileJoin = (function(){ function _compileJoin() {
    var _compileJoin;
    if (!opts.join) {
      return;
    }
    if (!sourceCode.some(function(code) {
      return code === null;
    })) {
      clearTimeout(joinTimeout);
      return joinTimeout = wait(100, function() {
        return compileScript(opts.join, sourceCode.join('\n'), opts.join);
      });
    }
  }; return _compileJoin})();

  watch = (function(){ function _watch(source, base) {
    var compile, compileTimeout, prevStats, rewatch, watchErr, watcher, _watch;
    prevStats = null;
    compileTimeout = null;
    watchErr = (function(){ function _watchErr(e) {
      var _watchErr;
      if (e.code === 'ENOENT') {
        if (sources.indexOf(source) === -1) {
          return;
        }
        try {
          rewatch();
          return compile();
        } catch (e) {
          removeSource(source, base, true);
          return compileJoin();
        }
      } else {
        throw e;
      }
    }; return _watchErr})();
    compile = (function(){ function _compile() {
      var _compile;
      clearTimeout(compileTimeout);
      return compileTimeout = wait(25, function() {
        return fs.stat(source, function(err, stats) {
          if (err) {
            return watchErr(err);
          }
          if (prevStats && stats.size === prevStats.size && stats.mtime.getTime() === prevStats.mtime.getTime()) {
            return rewatch();
          }
          prevStats = stats;
          return fs.readFile(source, function(err, code) {
            if (err) {
              return watchErr(err);
            }
            compileScript(source, code.toString(), base);
            return rewatch();
          });
        });
      });
    }; return _compile})();
    try {
      watcher = fs.watch(source, compile);
    } catch (e) {
      watchErr(e);
    }
    return rewatch = (function(){ function _rewatch() {
      var _rewatch;
      if (watcher != null) {
        watcher.close();
      }
      return watcher = fs.watch(source, compile);
    }; return _rewatch})();
  }; return _watch})();

  watchDir = (function(){ function _watchDir(source, base) {
    var readdirTimeout, watcher, _watchDir;
    readdirTimeout = null;
    try {
      return watcher = fs.watch(source, function() {
        clearTimeout(readdirTimeout);
        return readdirTimeout = wait(25, function() {
          return fs.readdir(source, function(err, files) {
            var file, _i, _len, _results;
            if (err) {
              if (err.code !== 'ENOENT') {
                throw err;
              }
              watcher.close();
              return unwatchDir(source, base);
            }
            _results = [];
            for (_i = 0, _len = files.length; _i < _len; _i++) {
              file = files[_i];
              if (!(!hidden(file) && !notSources[file])) {
                continue;
              }
              file = path.join(source, file);
              if (sources.some(function(s) {
                return s.indexOf(file) >= 0;
              })) {
                continue;
              }
              sources.push(file);
              sourceCode.push(null);
              _results.push(compilePath(file, false, base));
            }
            return _results;
          });
        });
      });
    } catch (e) {
      if (e.code !== 'ENOENT') {
        throw e;
      }
    }
  }; return _watchDir})();

  unwatchDir = (function(){ function _unwatchDir(source, base) {
    var file, prevSources, toRemove, _i, _len, _unwatchDir;
    prevSources = sources.slice(0);
    toRemove = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = sources.length; _i < _len; _i++) {
        file = sources[_i];
        if (file.indexOf(source) >= 0) {
          _results.push(file);
        }
      }
      return _results;
    })();
    for (_i = 0, _len = toRemove.length; _i < _len; _i++) {
      file = toRemove[_i];
      removeSource(file, base, true);
    }
    if (!sources.some(function(s, i) {
      return prevSources[i] !== s;
    })) {
      return;
    }
    return compileJoin();
  }; return _unwatchDir})();

  removeSource = (function(){ function _removeSource(source, base, removeJs) {
    var index, jsPath, _removeSource;
    index = sources.indexOf(source);
    sources.splice(index, 1);
    sourceCode.splice(index, 1);
    if (removeJs && !opts.join) {
      jsPath = outputPath(source, base);
      return exists(jsPath, function(itExists) {
        if (itExists) {
          return fs.unlink(jsPath, function(err) {
            if (err && err.code !== 'ENOENT') {
              throw err;
            }
            return timeLog("removed " + source);
          });
        }
      });
    }
  }; return _removeSource})();

  outputPath = (function(){ function _outputPath(source, base) {
    var baseDir, dir, filename, srcDir, _outputPath;
    filename = path.basename(source, path.extname(source)) + '.js';
    srcDir = path.dirname(source);
    baseDir = base === '.' ? srcDir : srcDir.substring(base.length);
    dir = opts.output ? path.join(opts.output, baseDir) : srcDir;
    return path.join(dir, filename);
  }; return _outputPath})();

  writeJs = (function(){ function _writeJs(source, js, base) {
    var compile, jsDir, jsPath, _writeJs;
    jsPath = outputPath(source, base);
    jsDir = path.dirname(jsPath);
    compile = (function(){ function _compile() {
      var _compile;
      if (js.length <= 0) {
        js = ' ';
      }
      return fs.writeFile(jsPath, js, function(err) {
        if (err) {
          return printLine(err.message);
        } else if (opts.compile && opts.watch) {
          return timeLog("compiled " + source);
        }
      });
    }; return _compile})();
    return exists(jsDir, function(itExists) {
      if (itExists) {
        return compile();
      } else {
        return exec("mkdir -p " + jsDir, compile);
      }
    });
  }; return _writeJs})();

  wait = (function(){ function _wait(milliseconds, func) {
    var _wait;
    return setTimeout(func, milliseconds);
  }; return _wait})();

  timeLog = (function(){ function _timeLog(message) {
    var _timeLog;
    return console.log("" + ((new Date).toLocaleTimeString()) + " - " + message);
  }; return _timeLog})();

  lint = (function(){ function _lint(file, js) {
    var conf, jsl, printIt, _lint;
    printIt = (function(){ function _printIt(buffer) {
      var _printIt;
      return printLine(file + ':\t' + buffer.toString().trim());
    }; return _printIt})();
    conf = __dirname + '/../../extras/jsl.conf';
    jsl = spawn('jsl', ['-nologo', '-stdin', '-conf', conf]);
    jsl.stdout.on('data', printIt);
    jsl.stderr.on('data', printIt);
    jsl.stdin.write(js);
    return jsl.stdin.end();
  }; return _lint})();

  printTokens = (function(){ function _printTokens(tokens) {
    var strings, tag, token, value, _printTokens;
    strings = (function() {
      var _i, _len, _ref1, _results;
      _results = [];
      for (_i = 0, _len = tokens.length; _i < _len; _i++) {
        token = tokens[_i];
        _ref1 = [token[0], token[1].toString().replace(/\n/, '\\n')], tag = _ref1[0], value = _ref1[1];
        _results.push("[" + tag + " " + value + "]");
      }
      return _results;
    })();
    return printLine(strings.join(' '));
  }; return _printTokens})();

  parseOptions = (function(){ function _parseOptions() {
    var i, o, source, _i, _len, _parseOptions;
    optionParser = new optparse.OptionParser(SWITCHES, BANNER);
    o = opts = optionParser.parse(process.argv.slice(2));
    o.compile || (o.compile = !!o.output);
    o.run = !(o.compile || o.print || o.lint);
    o.print = !!(o.print || (o["eval"] || o.stdio && o.compile));
    sources = o["arguments"];
    for (i = _i = 0, _len = sources.length; _i < _len; i = ++_i) {
      source = sources[i];
      sourceCode[i] = null;
    }
  }; return _parseOptions})();

  compileOptions = (function(){ function _compileOptions(filename) {
    var literate, _compileOptions;
    literate = path.extname(filename) === '.litcoffee';
    return {
      filename: filename,
      literate: literate,
      bare: opts.bare,
      header: opts.compile
    };
  }; return _compileOptions})();

  forkNode = (function(){ function _forkNode() {
    var args, nodeArgs, _forkNode;
    nodeArgs = opts.nodejs.split(/\s+/);
    args = process.argv.slice(1);
    args.splice(args.indexOf('--nodejs'), 2);
    return spawn(process.execPath, nodeArgs.concat(args), {
      cwd: process.cwd(),
      env: process.env,
      customFds: [0, 1, 2]
    });
  }; return _forkNode})();

  usage = (function(){ function _usage() {
    var _usage;
    return printLine((new optparse.OptionParser(SWITCHES, BANNER)).help());
  }; return _usage})();

  version = (function(){ function _version() {
    var _version;
    return printLine("CoffeeScript version " + CoffeeScript.VERSION);
  }; return _version})();

}).call(this);

// Generated by CoffeeScript 1.5.0-pre
