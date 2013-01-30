# -- tlrobinson Tom Robinson
io = require "./io"
exports.print = (args...) ->
  exports.stdout.write(Array::join.call(args, " ") + "\n").flush()

exports.stdin        = new io.TextInputStream(new io.IO(Packages.java.lang.System["in"], null))
exports.stdout       = new io.TextOutputStream(new io.IO(null, Packages.java.lang.System.out))
exports.stderr       = new io.TextOutputStream(new io.IO(null, Packages.java.lang.System.err))
exports.args         = [""].concat global.arguments
exports.originalArgs = exports.args.slice(0)
exports.env          = global.environment or {}

securityManager = Packages.java.lang.System.getSecurityManager()
if securityManager
  securityManagerName = securityManager.getClass().getName()
  exports.appEngine = true  if /^com.google.app(engine|hosting)./.test(securityManagerName)
  exports.appEngineHosting = true  if /^com.google.apphosting\./.test(securityManagerName)
