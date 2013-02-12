(function() {
  var IO, JavaPath, copyForLink, exports, javaPopen, javaRuntime;

  exports = require("./file");

  IO = require("./io").IO;

  javaRuntime = (function(){ function _javaRuntime() {
    var _javaRuntime;
    return Packages.java.lang.Runtime.getRuntime();
  }; return _javaRuntime})();

  javaPopen = (function(){ function _javaPopen(command) {
    var _javaPopen;
    return javaRuntime().exec(command);
  }; return _javaPopen})();

  exports.FileIO = (function(){ function _FileIO(path, mode, permissions) {
    var append, read, update, write, _FileIO, _ref;
    path = JavaPath(path);
    _ref = exports.mode(mode), update = _ref.update, append = _ref.append, write = _ref.write, read = _ref.read;
    if (update) {
      throw new Error("Updating IO not yet implemented.");
    } else if (write || append) {
      return new IO(null, new Packages.java.io.FileOutputStream(path, append));
    } else if (read) {
      return new IO(new Packages.java.io.FileInputStream(path), null);
    } else {
      throw new Error("Files must be opened either for read, write, or update mode.");
    }
  }; return _FileIO})();

  exports.cwd = (function(){ function _cwd() {
    var _cwd;
    return String(Packages.java.lang.System.getProperty("user.dir"));
  }; return _cwd})();

  JavaPath = (function(){ function _JavaPath(path) {
    var _JavaPath;
    return new java.io.File(String(path) || ".");
  }; return _JavaPath})();

  exports.canonical = (function(){ function _canonical(path) {
    var _canonical;
    return String(JavaPath(path).getCanonicalPath());
  }; return _canonical})();

  exports.mtime = (function(){ function _mtime(path) {
    var lastModified, _mtime;
    path = JavaPath(path);
    lastModified = path.lastModified();
    if (lastModified === 0) {
      return undefined;
    } else {
      return new Date(lastModified);
    }
  }; return _mtime})();

  exports.size = (function(){ function _size(path) {
    var _size;
    path = JavaPath(path);
    return path.length();
  }; return _size})();

  exports.stat = (function(){ function _stat(path) {
    var _stat;
    path = JavaPath(path);
    return {
      mtime: exports.mtime(path),
      size: exports.size(path)
    };
  }; return _stat})();

  exports.exists = (function(){ function _exists(path) {
    var _exists;
    try {
      return JavaPath(path).exists();
    } catch (_error) {}
    return false;
  }; return _exists})();

  exports.linkExists = (function(){ function _linkExists(path) {
    var _linkExists;
    return exports.isLink(path) || exports.exists(path);
  }; return _linkExists})();

  exports.isDirectory = (function(){ function _isDirectory(path) {
    var _isDirectory;
    try {
      return JavaPath(path).isDirectory();
    } catch (_error) {}
    return false;
  }; return _isDirectory})();

  exports.isFile = (function(){ function _isFile(path) {
    var _isFile;
    try {
      return JavaPath(path).isFile();
    } catch (_error) {}
    return false;
  }; return _isFile})();

  exports.isAbsolute = (function(){ function _isAbsolute(path) {
    var _isAbsolute;
    return new java.io.File(path).isAbsolute();
  }; return _isAbsolute})();

  exports.isLink = (function(){ function _isLink(path) {
    var absolute, canonical, _isLink;
    if (java.io.File.separator === "\\") {
      return false;
    }
    path = exports.path(path);
    canonical = path.canonical().toString();
    absolute = path.absolute().toString();
    return absolute !== canonical;
  }; return _isLink})();

  exports.isReadable = (function(){ function _isReadable(path) {
    var _isReadable;
    return JavaPath(path).canRead();
  }; return _isReadable})();

  exports.isWritable = (function(){ function _isWritable(path) {
    var _isWritable;
    return JavaPath(path).canWrite();
  }; return _isWritable})();

  copyForLink = (function(){ function _copyForLink(source, target) {
    var sourceStream, targetStream, _copyForLink;
    sourceStream = exports.FileIO(source, {
      read: true
    });
    try {
      targetStream = exports.FileIO(target, {
        write: true
      });
      try {
        return sourceStream.copy(targetStream);
      } finally {
        targetStream.close();
      }
    } finally {
      sourceStream.close();
    }
  }; return _copyForLink})();

  exports.rename = (function(){ function _rename(source, target) {
    var _rename;
    source = exports.path(source);
    target = source.resolve(target);
    source = JavaPath(source);
    target = JavaPath(target);
    if (!source.renameTo(target)) {
      throw new Error("failed to rename " + source + " to " + target);
    }
  }; return _rename})();

  exports.move = (function(){ function _move(source, target) {
    var _move;
    source = exports.path(source);
    target = exports.path(target);
    source = JavaPath(source);
    target = JavaPath(target);
    if (!source.renameTo(target)) {
      throw new Error("failed to rename " + source + " to " + target);
    }
  }; return _move})();

  exports.remove = (function(){ function _remove(path) {
    var _remove;
    if (!JavaPath(path)["delete"]()) {
      throw new Error("failed to delete " + path);
    }
  }; return _remove})();

  exports.mkdir = (function(){ function _mkdir(path) {
    var _mkdir;
    if (!JavaPath(path).mkdir()) {
      throw new Error("failed to make directory " + path);
    }
  }; return _mkdir})();

  exports.mkdirs = (function(){ function _mkdirs(path) {
    var _mkdirs;
    JavaPath(path).mkdirs();
    if (!exports.isDirectory(path)) {
      throw new Error("failed to make directories leading to " + path);
    }
  }; return _mkdirs})();

  exports.rmdir = (function(){ function _rmdir(path) {
    var _rmdir;
    if (!JavaPath(String(path))["delete"]()) {
      throw new Error("failed to remove the directory " + path);
    }
  }; return _rmdir})();

  exports.list = (function(){ function _list(path) {
    var i, listing, paths, _list;
    path = JavaPath(String(path));
    listing = path.list();
    if (!(listing instanceof Array)) {
      throw new Error("no such directory: " + path);
    }
    paths = [];
    i = 0;
    while (i < listing.length) {
      paths[i] = String(listing[i]);
      i++;
    }
    return paths;
  }; return _list})();

  exports.touch = (function(){ function _touch(path, mtime) {
    var _touch;
    if (mtime === undefined || mtime === null) {
      mtime = new Date();
    }
    path = JavaPath(path);
    path.createNewFile();
    if (!path.setLastModified(mtime.getTime())) {
      throw new Error("unable to set mtime of " + path + " to " + mtime);
    }
  }; return _touch})();

}).call(this);

// Generated by CoffeeScript 1.5.0-pre
