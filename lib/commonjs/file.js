(function() {
  var Path, fnmatchFlags, globHeredity, globPattern, globTree, i, io, list, name, nonPathed, pathIterated, pathed,
    __slice = [].slice;

  io = require("io");

  require("file-bootstrap");

  exports.open = (function(){ function _open(path, mode, options) {
    var append, binary, buffering, charset, fieldSeparator, key, lineBuffering, permissions, raw, read, recordSeparator, update, write, _open;
    if (typeof options === "string") {
      options = {
        mode: exports.mode(options)
      };
    }
    if (!options) {
      options = {};
    }
    if (typeof path === "object") {
      for (key in path) {
        if (Object.prototype.hasOwnProperty.call(path, key)) {
          options[key] = path[key];
        }
      }
    }
    if (typeof path === "string") {
      options.path = path;
    }
    options.mode = exports.mode(options.mode);
    if (mode) {
      options.mode = exports.mode(mode, options.mode);
    }
    path = options.path;
    mode = options.mode;
    permissions = options.permissions;
    charset = options.charset;
    buffering = options.buffering;
    recordSeparator = options.recordSeparator;
    fieldSeparator = options.fieldSeparator;
    read = mode.read;
    write = mode.write;
    append = mode.append;
    update = mode.update;
    binary = mode.binary;
    if (!(read || write || append)) {
      read = mode.read = true;
    }
    raw = exports.FileIO(path, mode, permissions);
    if (binary) {
      return raw;
    }
    lineBuffering = buffering === 1 || buffering === undefined && raw.isatty && raw.isatty();
    if (buffering !== undefined && buffering < 0) {
      throw new Error("invalid buffering size: " + buffering);
    }
    if (buffering === 0) {
      throw new Error("can't have unbuffered text IO");
    }
    return new io.TextIOWrapper(raw, mode, lineBuffering, buffering, charset, options);
  }; return _open})();

  exports.mode = (function(){ function _mode(mode, result) {
    var option, _mode;
    if (!result) {
      result = {
        read: false,
        write: false,
        append: false,
        update: false,
        binary: false,
        canonical: false,
        exclusive: false
      };
    } else {
      if (typeof result !== "object") {
        throw new Error("Mode to update is not a proper mode object: " + result);
      }
    }
    if (mode === undefined || mode === null) {

    } else if (mode instanceof String || typeof mode === "string") {
      mode.split("").forEach(function(option) {
        if (option === "r") {
          return result.read = true;
        } else if (option === "w") {
          return result.write = true;
        } else if (option === "a") {
          return result.append = true;
        } else if (option === "+") {
          return result.update = false;
        } else if (option === "b") {
          return result.binary = true;
        } else if (option === "t") {
          return result.binary = false;
        } else if (option === "c") {
          return result.canonical = true;
        } else if (option === "x") {
          return result.exclusive = true;
        } else {
          throw new Error("unrecognized mode option in mode: " + option);
        }
      });
    } else if (mode instanceof Array) {
      mode.forEach(function(option) {
        if (Object.prototype.hasOwnProperty.call(result, option)) {
          return result[option] = true;
        } else {
          throw new Error("unrecognized mode option in mode: " + option);
        }
      });
    } else if (mode instanceof Object) {
      for (option in mode) {
        if (Object.prototype.hasOwnProperty.call(mode, option)) {
          if (Object.prototype.hasOwnProperty.call(result, option)) {
            result[option] = !!mode[option];
          } else {
            throw new Error("unrecognized mode option in mode: " + option);
          }
        }
      }
    } else {
      throw new Error("unrecognized mode: " + mode);
    }
    return result;
  }; return _mode})();

  exports.read = (function(){ function _read(path, options) {
    var file, _read;
    path = String(path);
    file = exports.open(path, "r", options);
    try {
      return file.read();
    } finally {
      file.close();
    }
  }; return _read})();

  exports.write = (function(){ function _write(path, data, options) {
    var file, _write;
    path = String(path);
    file = exports.open(path, "w", options);
    try {
      file.write(data);
      return file.flush();
    } finally {
      file.close();
    }
  }; return _write})();

  exports.copy = (function(){ function _copy(source, target) {
    var sourceStream, targetStream, _copy;
    source = exports.path(source);
    target = exports.path(target);
    sourceStream = source.open("rb");
    try {
      targetStream = target.open("wb");
      try {
        return sourceStream.copy(targetStream);
      } finally {
        targetStream.close();
      }
    } finally {
      sourceStream.close();
    }
  }; return _copy})();

  list = exports.list;

  exports.list = (function(){ function _list(path) {
    var _list;
    return list(String(path || "") || ".");
  }; return _list})();

  exports.listTree = (function(){ function _listTree(path) {
    var paths, _listTree;
    path = String(path || "");
    if (!path) {
      path = ".";
    }
    paths = [""];
    exports.list(path).forEach(function(child) {
      var fullPath;
      fullPath = exports.join(path, child);
      if (exports.isDirectory(fullPath)) {
        return paths.push.apply(paths, exports.listTree(fullPath).map(function(p) {
          return exports.join(child, p);
        }));
      } else {
        return paths.push(child);
      }
    });
    return paths;
  }; return _listTree})();

  exports.listDirectoryTree = (function(){ function _listDirectoryTree(path) {
    var paths, _listDirectoryTree;
    path = String(path || "");
    if (!path) {
      path = ".";
    }
    paths = [""];
    exports.list(path).forEach(function(child) {
      var fullPath;
      fullPath = exports.join(path, child);
      if (exports.isDirectory(fullPath)) {
        return paths.push.apply(paths, exports.listDirectoryTree(fullPath).map(function(p) {
          return exports.join(child, p);
        }));
      }
    });
    return paths;
  }; return _listDirectoryTree})();

  exports.FNM_LEADING_DIR = 1 << 1;

  exports.FNM_PATHNAME = 1 << 2;

  exports.FNM_PERIOD = 1 << 3;

  exports.FNM_NOESCAPE = 1 << 4;

  exports.FNM_CASEFOLD = 1 << 5;

  exports.FNM_DOTMATCH = 1 << 6;

  fnmatchFlags = ["FNM_LEADING_DIR", "FNM_PATHNAME", "FNM_PERIOD", "FNM_NOESCAPE", "FNM_CASEFOLD", "FNM_DOTMATCH"];

  exports.fnmatch = (function(){ function _fnmatch(pattern, string, flags) {
    var re, _fnmatch;
    re = exports.patternToRegExp(pattern, flags);
    return re.test(string);
  }; return _fnmatch})();

  exports.patternToRegExp = (function(){ function _patternToRegExp(pattern, flags) {
    var matchAny, options, tokenizeRegex, _patternToRegExp;
    options = {};
    if (typeof flags === "number") {
      fnmatchFlags.forEach(function(flagName) {
        return options[flagName] = !!(flags & exports[flagName]);
      });
    } else {
      if (flags) {
        options = flags;
      }
    }
    matchAny = (options.FNM_PATHNAME ? "[^" + RegExp.escape(exports.SEPARATOR) + "]" : ".");
    tokenizeRegex = (options.FNM_NOESCAPE ? /\[[^\]]*\]|{[^}]*}|[^\[{]*/g : /\\(.)|\[[^\]]*\]|{[^}]*}|[^\\\[{]*/g);
    return new RegExp("^" + pattern.replace(tokenizeRegex, function(pattern, $1) {
      var result;
      if (!options.FNM_NOESCAPE && /^\\/.test(pattern) && $1) {
        return RegExp.escape($1);
      }
      if (/^\[/.test(pattern)) {
        result = "[";
        pattern = pattern.slice(1, pattern.length - 1);
        if (/^[!^]/.test(pattern)) {
          pattern = pattern.slice(1);
          result += "^";
        }
        pattern = pattern.replace(/(.)-(.)/, function(match, a, b) {
          if (a.charCodeAt(0) > b.charCodeAt(0)) {
            return b + "-" + a;
          } else {
            return match;
          }
        });
        return result + pattern.split("-").map(RegExp.escape).join("-") + "]";
      }
      if (/^\{/.test(pattern)) {
        return "(" + pattern.slice(1, pattern.length - 1).split(",").map(function(pattern) {
          return RegExp.escape(pattern);
        }).join("|") + ")";
      }
      return pattern.replace(exports.SEPARATORS_RE(), exports.SEPARATOR).split(new RegExp(exports.SEPARATOR + "?" + "\\*\\*" + exports.SEPARATOR + "?")).map(function(pattern) {
        return pattern.split(exports.SEPARATOR).map(function(pattern) {
          if (pattern === "") {
            return "\\.?";
          }
          if (pattern === ".") {
            return;
          }
          if (pattern === "...") {
            return "(|\\.|\\.\\.(" + exports.SEPARATOR + "\\.\\.)*?)";
          }
          return pattern.split("*").map(function(pattern) {
            return pattern.split("?").map(function(pattern) {
              return RegExp.escape(pattern);
            }).join(matchAny);
          }).join(matchAny + "*");
        }).join(RegExp.escape(exports.SEPARATOR));
      }).join(".*?");
    }) + "$", (options.FNM_CASEFOLD ? "i" : ""));
  }; return _patternToRegExp})();

  exports.copyTree = (function(){ function _copyTree(source, target, path) {
    var sourcePath, targetPath, _copyTree;
    sourcePath = (source = exports.path(source)).join(path);
    targetPath = (target = exports.path(target)).join(path);
    if (exports.exists(targetPath)) {
      throw new Error("file exists: " + targetPath);
    }
    if (exports.isDirectory(sourcePath)) {
      exports.mkdir(targetPath);
      return exports.list(sourcePath).forEach(function(name) {
        return exports.copyTree(source, target, exports.join(path, name));
      });
    } else {
      return exports.copy(sourcePath, targetPath);
    }
  }; return _copyTree})();

  exports.match = (function(){ function _match(path, pattern) {
    var _match;
    return exports.patternToRegExp(pattern).test(path);
  }; return _match})();

  exports.glob = (function(){ function _glob(pattern, flags) {
    var parts, paths, _glob;
    pattern = String(pattern || "");
    parts = exports.split(pattern);
    paths = ["."];
    if (exports.isAbsolute(pattern)) {
      paths = (parts[0] === "" ? ["/"] : [parts[0]]);
      parts.shift();
    }
    if (parts[parts.length - 1] === "**") {
      parts[parts.length - 1] = "*";
    }
    parts.forEach(function(part) {
      var visited;
      if (part === "") {

      } else if (part === "**") {
        paths = globTree(paths);
      } else if (part === "...") {
        paths = globHeredity(paths);
      } else if (/[\\\*\?\[{]/.test(part)) {
        paths = globPattern(paths, part, flags);
      } else {
        paths = paths.map(function(path) {
          if (path) {
            return exports.join(path, part);
          }
          return part;
        }).filter(function(path) {
          return exports.exists(path);
        });
      }
      visited = {};
      return paths = paths.filter(function(path) {
        var result;
        result = !Object.prototype.hasOwnProperty.call(visited, path);
        visited[path] = true;
        return result;
      });
    });
    if (paths[0] === "") {
      paths.shift();
    }
    return paths;
  }; return _glob})();

  globTree = (function(){ function _globTree(paths) {
    var _globTree;
    return Array.prototype.concat.apply([], paths.map(function(path) {
      if (!exports.isDirectory(path)) {
        return [];
      }
      return exports.listDirectoryTree(path).map(function(child) {
        return exports.join(path, child);
      });
    }));
  }; return _globTree})();

  globHeredity = (function(){ function _globHeredity(paths) {
    var _globHeredity;
    return Array.prototype.concat.apply([], paths.map(function(path) {
      var heredity, isRelative, parts;
      isRelative = exports.isRelative(path);
      heredity = [];
      parts = exports.split(exports.absolute(path));
      if (parts[parts.length - 1] === "") {
        parts.pop();
      }
      while (parts.length) {
        heredity.push(exports.join.apply(null, parts));
        parts.pop();
      }
      if (isRelative) {
        heredity = heredity.map(function(path) {
          return exports.relative("", path);
        });
      }
      return heredity;
    }));
  }; return _globHeredity})();

  globPattern = (function(){ function _globPattern(paths, pattern, flags) {
    var re, _globPattern;
    re = exports.patternToRegExp(pattern, flags);
    return Array.prototype.concat.apply([], paths.map(function(path) {
      if (!exports.isDirectory(path)) {
        return [];
      }
      return [].concat(exports.list(path)).filter(function(name) {
        return re.test(name);
      }).map(function(name) {
        if (path) {
          return exports.join(path, name);
        }
        return name;
      }).filter(function(path) {
        return exports.exists(path);
      });
    }));
  }; return _globPattern})();

  exports.globPaths = (function(){ function _globPaths(pattern, flags) {
    var _globPaths;
    return exports.glob(pattern, flags).map(function(path) {
      return new exports.Path(path);
    });
  }; return _globPaths})();

  exports.rmtree = (function(){ function _rmtree(path) {
    var _rmtree;
    if (exports.isLink(path)) {
      return exports.remove(path);
    } else if (exports.isDirectory(path)) {
      exports.list(path).forEach(function(name) {
        return exports.rmtree(exports.join(path, name));
      });
      return exports.rmdir(path);
    } else {
      return exports.remove(path);
    }
  }; return _rmtree})();

  if (!exports.mkdirs) {
    exports.mkdirs = (function(){ function _mkdirs(path) {
      var at, parts, _mkdirs;
      parts = exports.split(path);
      at = [];
      return parts.forEach(function(part) {
        at.push(part);
        path = exports.join.apply(null, at);
        try {
          return exports.mkdir(path);
        } catch (_error) {}
      });
    }; return _mkdirs})();
  }

  exports.relative = (function(){ function _relative(source, target) {
    var _relative;
    if (!target) {
      target = source;
      source = exports.cwd() + "/";
    }
    source = exports.absolute(source);
    target = exports.absolute(target);
    source = source.split(exports.SEPARATORS_RE());
    target = target.split(exports.SEPARATORS_RE());
    source.pop();
    while (source.length && target.length && target[0] === source[0]) {
      source.shift();
      target.shift();
    }
    while (source.length) {
      source.shift();
      target.unshift("..");
    }
    return target.join(exports.SEPARATOR);
  }; return _relative})();

  exports.absolute = (function(){ function _absolute(path) {
    var _absolute;
    return exports.resolve(exports.join(exports.cwd(), ""), path);
  }; return _absolute})();

  exports.cwdPath = (function(){ function _cwdPath() {
    var _cwdPath;
    return new exports.Path(exports.cwd());
  }; return _cwdPath})();

  exports.path = (function(){ function _path() {
    var args, _path;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    if (args.length === 1 && args[0] === "") {
      return exports.Path("");
    }
    return exports.Path(exports.join.apply(exports, args));
  }; return _path})();

  Path = exports.Path = (function(){ function _Path(path) {
    var _Path;
    if (!(this instanceof exports.Path)) {
      return new exports.Path(path);
    }
    return this.toString = (function(){ function _toString() {
      var _toString;
      return path;
    }; return _toString})();
  }; return _Path})();

  Path.prototype = new String();

  Path.prototype.valueOf = (function(){ function _valueOf() {
    var _valueOf;
    return this.toString();
  }; return _valueOf})();

  Path.prototype.join = (function(){ function _join() {
    var args, _join;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return exports.Path(exports.join.apply(null, [this.toString()].concat(Array.prototype.slice.call(args))));
  }; return _join})();

  Path.prototype.resolve = (function(){ function _resolve() {
    var args, _resolve;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return exports.Path(exports.resolve.apply(null, [this.toString()].concat(Array.prototype.slice.call(args))));
  }; return _resolve})();

  Path.prototype.to = (function(){ function _to(target) {
    var _to;
    return exports.Path(exports.relative(this.toString(), target));
  }; return _to})();

  Path.prototype.from = (function(){ function _from(target) {
    var _from;
    return exports.Path(exports.relative(target, this.toString()));
  }; return _from})();

  Path.prototype.glob = (function(){ function _glob(pattern, flags) {
    var _glob;
    if (!this.isDirectory()) {
      return [];
    }
    if (this.toString()) {
      return exports.glob(exports.join(this, pattern), flags);
    }
    return exports.glob(pattern);
  }; return _glob})();

  Path.prototype.globPaths = (function(){ function _globPaths(pattern, flags) {
    var _globPaths;
    if (!this.isDirectory()) {
      return [];
    }
    if (this.toString()) {
      return exports.glob(exports.join(this, pattern), flags).map(function(path) {
        return new exports.Path(path);
      }, this).filter(function(path) {
        return !!path.toString();
      });
    }
    return exports.glob(pattern, flags);
  }; return _globPaths})();

  pathed = ["absolute", "basename", "canonical", "dirname", "normal", "relative"];

  i = 0;

  while (i < pathed.length) {
    name = pathed[i];
    Path.prototype[name] = (function(name) {
      return function() {
        var args;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return exports.Path(exports[name].apply(this, [this.toString()].concat(Array.prototype.slice.call(args))));
      };
    })(name);
    i++;
  }

  pathIterated = ["list", "listTree"];

  i = 0;

  while (i < pathIterated.length) {
    name = pathIterated[i];
    exports[name + "Paths"] = (function(name) {
      return function() {
        var args;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return exports[name].apply(exports, args).map(function(path) {
          return new exports.Path(path);
        });
      };
    })(name);
    Path.prototype[name + "Paths"] = (function(name) {
      return function() {
        var self;
        self = this;
        return exports[name](this).map(function(path) {
          return self.join(path);
        });
      };
    })(name);
    i++;
  }

  nonPathed = ["chown", "copy", "exists", "extension", "isDirectory", "isFile", "isLink", "isReadable", "isWritable", "link", "linkExists", "list", "listTree", "mkdir", "mkdirs", "move", "mtime", "open", "read", "remove", "rename", "rmdir", "rmtree", "size", "split", "stat", "symlink", "touch", "write"];

  i = 0;

  while (i < nonPathed.length) {
    name = nonPathed[i];
    Path.prototype[name] = (function(name) {
      return function() {
        var args, result;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        if (!exports[name]) {
          throw new Error("NYI Path based on " + name);
        }
        result = exports[name].apply(this, [this.toString()].concat(Array.prototype.slice.call(args)));
        if (result === undefined) {
          result = this;
        }
        return result;
      };
    })(name);
    i++;
  }

  require("file-engine");

}).call(this);

// Generated by CoffeeScript 1.5.0-pre
