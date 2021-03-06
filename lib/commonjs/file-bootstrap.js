// Generated by CoffeeScript 1.6.2
(function() {
  var altSeparatorCached, exports, separatorCached, separatorReCached, system,
    __slice = [].slice;

  exports = require("file");

  system = require("system");

  if (/\bwindows\b/i.test(system.os) || /\bwinnt\b/i.test(system.os)) {
    exports.ROOT = "\\";
    exports.SEPARATOR = "\\";
    exports.ALT_SEPARATOR = "/";
  } else {
    exports.ROOT = "/";
    exports.SEPARATOR = "/";
    exports.ALT_SEPARATOR = undefined;
  }

  exports.SEPARATORS_RE = function() {
    var altSeparatorCached, separatorCached, separatorReCached;
    if (separatorCached !== exports.SEPARATOR || altSeparatorCached !== exports.ALT_SEPARATOR) {
      separatorCached = exports.SEPARATOR;
      altSeparatorCached = exports.ALT_SEPARATOR;
      separatorReCached = new RegExp("[" + (separatorCached || "").replace(/[-[\]{}()*+?.\\^$|,#\s]/g, "\\$&") + (altSeparatorCached || "").replace(/[-[\]{}()*+?.\\^$|,#\s]/g, "\\$&") + "]", "g");
    }
    return separatorReCached;
  };

  separatorCached = void 0;

  altSeparatorCached = void 0;

  separatorReCached = void 0;

  exports.join = function() {
    var args;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    if (args.length === 1 && args[0] === "") {
      return exports.SEPARATOR;
    }
    return exports.normal(Array.prototype.join.call(args, exports.SEPARATOR));
  };

  exports.split = function(path) {
    var exception, parts;
    parts = void 0;
    try {
      parts = String(path).split(exports.SEPARATORS_RE());
    } catch (_error) {
      exception = _error;
      throw new Error("Cannot split " + (typeof path) + ", \"" + path + "\"");
    }
    if (parts.length === 1 && parts[0] === "") {
      return [];
    }
    return parts;
  };

  exports.resolve = function() {
    var args, children, i, j, leaf, parents, part, parts, path, root;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    root = "";
    parents = [];
    children = [];
    leaf = "";
    i = 0;
    while (i < args.length) {
      path = String(args[i++]);
      if (path === "") {
        continue;
      }
      parts = path.split(exports.SEPARATORS_RE());
      if (exports.isAbsolute(path)) {
        root = parts.shift() + exports.SEPARATOR;
        parents = [];
        children = [];
      }
      leaf = parts.pop();
      if (leaf === "." || leaf === "..") {
        parts.push(leaf);
        leaf = "";
      }
      j = 0;
      while (j < parts.length) {
        part = parts[j];
        if (part === "." || part === "") {

        } else if (part === "..") {
          if (children.length) {
            children.pop();
          } else {
            if (!root) {
              parents.push("..");
            }
          }
        } else {
          children.push(part);
        }
        j++;
      }
    }
    path = parents.concat(children).join(exports.SEPARATOR);
    if (path) {
      leaf = exports.SEPARATOR + leaf;
    }
    return root + path + leaf;
  };

  exports.normal = function(path) {
    return exports.resolve(path);
  };

  exports.isAbsolute = function(path) {
    var parts;
    parts = exports.split(path);
    if (parts.length === 0) {
      return false;
    }
    return exports.isDrive(parts[0]);
  };

  exports.isRelative = function(path) {
    return !exports.isAbsolute(path);
  };

  exports.isDrive = function(first) {
    if (/\bwindows\b/i.test(system.os) || /\bwinnt\b/i.test(system.os)) {
      return /:$/.test(first);
    } else {
      return first === "";
    }
  };

  /*
  root
  returns the Unix root path
  or corresponding Windows drive
  for a given path.
  */


  exports.root = function(path) {
    var parts;
    if (!exports.isAbsolute(path)) {
      path = require("file").absolute(path);
    }
    parts = exports.split(path);
    return exports.join(parts[0], "");
  };

  exports.dirname = function(path) {
    var parts;
    parts = exports.split(path);
    parts.pop();
    return exports.join.apply(null, parts) || ".";
  };

  exports.basename = function(path, extension) {
    var chop;
    chop = function(a, b) {
      var start;
      if (!b) {
        return a;
      }
      start = a.length - b.length;
      if (a.lastIndexOf(b, start) === start) {
        return a.substring(0, start);
      } else {
        return a;
      }
    };
    return chop(/[^\/\\]+$/.exec(path)[0], extension);
  };

  exports.extension = function(path) {
    var index;
    path = exports.basename(path);
    path = path.replace(/^\.*/, "");
    index = path.lastIndexOf(".");
    if (index <= 0) {
      return "";
    } else {
      return path.substring(index);
    }
  };

}).call(this);
