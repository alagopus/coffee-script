(function() {
  var BOM, BOOL, CALLABLE, CODE, COFFEE_ALIASES, COFFEE_ALIAS_MAP, COFFEE_KEYWORDS, COMMENT, COMPARE, COMPOUND_ASSIGN, HEREDOC, HEREDOC_ILLEGAL, HEREDOC_INDENT, HEREGEX, HEREGEX_OMIT, IDENTIFIER, INDEXABLE, INVERSES, JSTOKEN, JS_FORBIDDEN, JS_KEYWORDS, LINE_BREAK, LINE_CONTINUER, LITERATE, LOGIC, Lexer, MATH, MULTILINER, MULTI_DENT, NOT_REGEX, NOT_SPACED_REGEX, NUMBER, OPERATOR, REGEX, RELATION, RESERVED, Rewriter, SHIFT, SIMPLESTR, STRICT_PROSCRIBED, TRAILING_SPACES, UNARY, WHITESPACE, compact, count, key, last, starts, _ref, _ref1,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  _ref = require('./rewriter'), Rewriter = _ref.Rewriter, INVERSES = _ref.INVERSES;

  _ref1 = require('./helpers'), count = _ref1.count, starts = _ref1.starts, compact = _ref1.compact, last = _ref1.last;

  exports.Lexer = Lexer = (function() {

    function Lexer() {}

    Lexer.prototype.tokenize = (function(){ function _tokenize(code, opts) {
      var i, tag, _tokenize;
      if (opts == null) {
        opts = {};
      }
      this.literate = opts.literate;
      code = this.clean(code);
      this.line = opts.line || 0;
      this.indent = 0;
      this.indebt = 0;
      this.outdebt = 0;
      this.indents = [];
      this.ends = [];
      this.tokens = [];
      i = 0;
      while (this.chunk = code.slice(i)) {
        i += this.identifierToken() || this.commentToken() || this.whitespaceToken() || this.lineToken() || this.heredocToken() || this.stringToken() || this.numberToken() || this.regexToken() || this.jsToken() || this.literalToken();
      }
      this.closeIndentation();
      if (tag = this.ends.pop()) {
        this.error("missing " + tag);
      }
      if (opts.rewrite === false) {
        return this.tokens;
      }
      return (new Rewriter).rewrite(this.tokens);
    }; return _tokenize})();

    Lexer.prototype.clean = (function(){ function _clean(code) {
      var line, lines, match, _clean;
      if (code.charCodeAt(0) === BOM) {
        code = code.slice(1);
      }
      if (WHITESPACE.test(code)) {
        code = "\n" + code;
      }
      code = code.replace(/\r/g, '').replace(TRAILING_SPACES, '');
      if (this.literate) {
        lines = (function() {
          var _i, _len, _ref2, _results;
          _ref2 = code.split('\n');
          _results = [];
          for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
            line = _ref2[_i];
            if (match = LITERATE.exec(line)) {
              _results.push(line.slice(match[0].length));
            } else {
              _results.push('# ' + line);
            }
          }
          return _results;
        })();
        code = lines.join('\n');
      }
      return code;
    }; return _clean})();

    Lexer.prototype.identifierToken = (function(){ function _identifierToken() {
      var colon, forcedIdentifier, id, input, match, prev, tag, _identifierToken, _ref2, _ref3;
      if (!(match = IDENTIFIER.exec(this.chunk))) {
        return 0;
      }
      input = match[0], id = match[1], colon = match[2];
      if (id === 'own' && this.tag() === 'FOR') {
        this.token('OWN', id);
        return id.length;
      }
      forcedIdentifier = colon || (prev = last(this.tokens)) && (((_ref2 = prev[0]) === '.' || _ref2 === '?.' || _ref2 === '::') || !prev.spaced && prev[0] === '@');
      tag = 'IDENTIFIER';
      if (!forcedIdentifier && (__indexOf.call(JS_KEYWORDS, id) >= 0 || __indexOf.call(COFFEE_KEYWORDS, id) >= 0)) {
        tag = id.toUpperCase();
        if (tag === 'WHEN' && (_ref3 = this.tag(), __indexOf.call(LINE_BREAK, _ref3) >= 0)) {
          tag = 'LEADING_WHEN';
        } else if (tag === 'FOR') {
          this.seenFor = true;
        } else if (tag === 'UNLESS') {
          tag = 'IF';
        } else if (__indexOf.call(UNARY, tag) >= 0) {
          tag = 'UNARY';
        } else if (__indexOf.call(RELATION, tag) >= 0) {
          if (tag !== 'INSTANCEOF' && this.seenFor) {
            tag = 'FOR' + tag;
            this.seenFor = false;
          } else {
            tag = 'RELATION';
            if (this.value() === '!') {
              this.tokens.pop();
              id = '!' + id;
            }
          }
        }
      }
      if (__indexOf.call(JS_FORBIDDEN, id) >= 0) {
        if (forcedIdentifier) {
          tag = 'IDENTIFIER';
          id = new String(id);
          id.reserved = true;
        } else if (__indexOf.call(RESERVED, id) >= 0) {
          this.error("reserved word \"" + id + "\"");
        }
      }
      if (!forcedIdentifier) {
        if (__indexOf.call(COFFEE_ALIASES, id) >= 0) {
          id = COFFEE_ALIAS_MAP[id];
        }
        tag = (function() {
          switch (id) {
            case '!':
              return 'UNARY';
            case '==':
            case '!=':
              return 'COMPARE';
            case '&&':
            case '||':
              return 'LOGIC';
            case 'true':
            case 'false':
              return 'BOOL';
            case 'break':
            case 'continue':
              return 'STATEMENT';
            default:
              return tag;
          }
        })();
      }
      this.token(tag, id);
      if (colon) {
        this.token(':', ':');
      }
      return input.length;
    }; return _identifierToken})();

    Lexer.prototype.numberToken = (function(){ function _numberToken() {
      var binaryLiteral, lexedLength, match, number, octalLiteral, _numberToken;
      if (!(match = NUMBER.exec(this.chunk))) {
        return 0;
      }
      number = match[0];
      if (/^0[BOX]/.test(number)) {
        this.error("radix prefix '" + number + "' must be lowercase");
      } else if (/E/.test(number) && !/^0x/.test(number)) {
        this.error("exponential notation '" + number + "' must be indicated with a lowercase 'e'");
      } else if (/^0\d*[89]/.test(number)) {
        this.error("decimal literal '" + number + "' must not be prefixed with '0'");
      } else if (/^0\d+/.test(number)) {
        this.error("octal literal '" + number + "' must be prefixed with '0o'");
      }
      lexedLength = number.length;
      if (octalLiteral = /^0o([0-7]+)/.exec(number)) {
        number = '0x' + (parseInt(octalLiteral[1], 8)).toString(16);
      }
      if (binaryLiteral = /^0b([01]+)/.exec(number)) {
        number = '0x' + (parseInt(binaryLiteral[1], 2)).toString(16);
      }
      this.token('NUMBER', number);
      return lexedLength;
    }; return _numberToken})();

    Lexer.prototype.stringToken = (function(){ function _stringToken() {
      var match, octalEsc, string, _stringToken;
      switch (this.chunk.charAt(0)) {
        case "'":
          if (!(match = SIMPLESTR.exec(this.chunk))) {
            return 0;
          }
          this.token('STRING', (string = match[0]).replace(MULTILINER, '\\\n'));
          break;
        case '"':
          if (!(string = this.balancedString(this.chunk, '"'))) {
            return 0;
          }
          if (0 < string.indexOf('#{', 1)) {
            this.interpolateString(string.slice(1, -1));
          } else {
            this.token('STRING', this.escapeLines(string));
          }
          break;
        default:
          return 0;
      }
      if (octalEsc = /^(?:\\.|[^\\])*\\(?:0[0-7]|[1-7])/.test(string)) {
        this.error("octal escape sequences " + string + " are not allowed");
      }
      this.line += count(string, '\n');
      return string.length;
    }; return _stringToken})();

    Lexer.prototype.heredocToken = (function(){ function _heredocToken() {
      var doc, heredoc, match, quote, _heredocToken;
      if (!(match = HEREDOC.exec(this.chunk))) {
        return 0;
      }
      heredoc = match[0];
      quote = heredoc.charAt(0);
      doc = this.sanitizeHeredoc(match[2], {
        quote: quote,
        indent: null
      });
      if (quote === '"' && 0 <= doc.indexOf('#{')) {
        this.interpolateString(doc, {
          heredoc: true
        });
      } else {
        this.token('STRING', this.makeString(doc, quote, true));
      }
      this.line += count(heredoc, '\n');
      return heredoc.length;
    }; return _heredocToken})();

    Lexer.prototype.commentToken = (function(){ function _commentToken() {
      var comment, here, match, _commentToken;
      if (!(match = this.chunk.match(COMMENT))) {
        return 0;
      }
      comment = match[0], here = match[1];
      if (here) {
        this.token('HERECOMMENT', this.sanitizeHeredoc(here, {
          herecomment: true,
          indent: Array(this.indent + 1).join(' ')
        }));
      }
      this.line += count(comment, '\n');
      return comment.length;
    }; return _commentToken})();

    Lexer.prototype.jsToken = (function(){ function _jsToken() {
      var match, script, _jsToken;
      if (!(this.chunk.charAt(0) === '`' && (match = JSTOKEN.exec(this.chunk)))) {
        return 0;
      }
      this.token('JS', (script = match[0]).slice(1, -1));
      this.line += count(script, '\n');
      return script.length;
    }; return _jsToken})();

    Lexer.prototype.regexToken = (function(){ function _regexToken() {
      var flags, length, match, prev, regex, _ref2, _ref3, _regexToken;
      if (this.chunk.charAt(0) !== '/') {
        return 0;
      }
      if (match = HEREGEX.exec(this.chunk)) {
        length = this.heregexToken(match);
        this.line += count(match[0], '\n');
        return length;
      }
      prev = last(this.tokens);
      if (prev && (_ref2 = prev[0], __indexOf.call((prev.spaced ? NOT_REGEX : NOT_SPACED_REGEX), _ref2) >= 0)) {
        return 0;
      }
      if (!(match = REGEX.exec(this.chunk))) {
        return 0;
      }
      _ref3 = match, match = _ref3[0], regex = _ref3[1], flags = _ref3[2];
      if (regex.slice(0, 2) === '/*') {
        this.error('regular expressions cannot begin with `*`');
      }
      if (regex === '//') {
        regex = '/(?:)/';
      }
      this.token('REGEX', "" + regex + flags);
      return match.length;
    }; return _regexToken})();

    Lexer.prototype.heregexToken = (function(){ function _heregexToken(match) {
      var body, flags, heregex, re, tag, tokens, value, _heregexToken, _i, _len, _ref2, _ref3, _ref4, _ref5;
      heregex = match[0], body = match[1], flags = match[2];
      if (0 > body.indexOf('#{')) {
        re = body.replace(HEREGEX_OMIT, '').replace(/\//g, '\\/');
        if (re.match(/^\*/)) {
          this.error('regular expressions cannot begin with `*`');
        }
        this.token('REGEX', "/" + (re || '(?:)') + "/" + flags);
        return heregex.length;
      }
      this.token('IDENTIFIER', 'RegExp');
      this.tokens.push(['CALL_START', '(']);
      tokens = [];
      _ref2 = this.interpolateString(body, {
        regex: true
      });
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        _ref3 = _ref2[_i], tag = _ref3[0], value = _ref3[1];
        if (tag === 'TOKENS') {
          tokens.push.apply(tokens, value);
        } else {
          if (!(value = value.replace(HEREGEX_OMIT, ''))) {
            continue;
          }
          value = value.replace(/\\/g, '\\\\');
          tokens.push(['STRING', this.makeString(value, '"', true)]);
        }
        tokens.push(['+', '+']);
      }
      tokens.pop();
      if (((_ref4 = tokens[0]) != null ? _ref4[0] : void 0) !== 'STRING') {
        this.tokens.push(['STRING', '""'], ['+', '+']);
      }
      (_ref5 = this.tokens).push.apply(_ref5, tokens);
      if (flags) {
        this.tokens.push([',', ','], ['STRING', '"' + flags + '"']);
      }
      this.token(')', ')');
      return heregex.length;
    }; return _heregexToken})();

    Lexer.prototype.lineToken = (function(){ function _lineToken() {
      var diff, indent, match, noNewlines, size, _lineToken;
      if (!(match = MULTI_DENT.exec(this.chunk))) {
        return 0;
      }
      indent = match[0];
      this.line += count(indent, '\n');
      this.seenFor = false;
      size = indent.length - 1 - indent.lastIndexOf('\n');
      noNewlines = this.unfinished();
      if (size - this.indebt === this.indent) {
        if (noNewlines) {
          this.suppressNewlines();
        } else {
          this.newlineToken();
        }
        return indent.length;
      }
      if (size > this.indent) {
        if (noNewlines) {
          this.indebt = size - this.indent;
          this.suppressNewlines();
          return indent.length;
        }
        diff = size - this.indent + this.outdebt;
        this.token('INDENT', diff);
        this.indents.push(diff);
        this.ends.push('OUTDENT');
        this.outdebt = this.indebt = 0;
      } else {
        this.indebt = 0;
        this.outdentToken(this.indent - size, noNewlines);
      }
      this.indent = size;
      return indent.length;
    }; return _lineToken})();

    Lexer.prototype.outdentToken = (function(){ function _outdentToken(moveOut, noNewlines) {
      var dent, len, _outdentToken;
      while (moveOut > 0) {
        len = this.indents.length - 1;
        if (this.indents[len] === void 0) {
          moveOut = 0;
        } else if (this.indents[len] === this.outdebt) {
          moveOut -= this.outdebt;
          this.outdebt = 0;
        } else if (this.indents[len] < this.outdebt) {
          this.outdebt -= this.indents[len];
          moveOut -= this.indents[len];
        } else {
          dent = this.indents.pop() - this.outdebt;
          moveOut -= dent;
          this.outdebt = 0;
          this.pair('OUTDENT');
          this.token('OUTDENT', dent);
        }
      }
      if (dent) {
        this.outdebt -= moveOut;
      }
      while (this.value() === ';') {
        this.tokens.pop();
      }
      if (!(this.tag() === 'TERMINATOR' || noNewlines)) {
        this.token('TERMINATOR', '\n');
      }
      return this;
    }; return _outdentToken})();

    Lexer.prototype.whitespaceToken = (function(){ function _whitespaceToken() {
      var match, nline, prev, _whitespaceToken;
      if (!((match = WHITESPACE.exec(this.chunk)) || (nline = this.chunk.charAt(0) === '\n'))) {
        return 0;
      }
      prev = last(this.tokens);
      if (prev) {
        prev[match ? 'spaced' : 'newLine'] = true;
      }
      if (match) {
        return match[0].length;
      } else {
        return 0;
      }
    }; return _whitespaceToken})();

    Lexer.prototype.newlineToken = (function(){ function _newlineToken() {
      var _newlineToken;
      while (this.value() === ';') {
        this.tokens.pop();
      }
      if (this.tag() !== 'TERMINATOR') {
        this.token('TERMINATOR', '\n');
      }
      return this;
    }; return _newlineToken})();

    Lexer.prototype.suppressNewlines = (function(){ function _suppressNewlines() {
      var _suppressNewlines;
      if (this.value() === '\\') {
        this.tokens.pop();
      }
      return this;
    }; return _suppressNewlines})();

    Lexer.prototype.literalToken = (function(){ function _literalToken() {
      var match, prev, tag, value, _literalToken, _ref2, _ref3, _ref4, _ref5;
      if (match = OPERATOR.exec(this.chunk)) {
        value = match[0];
        if (CODE.test(value)) {
          this.tagParameters();
        }
      } else {
        value = this.chunk.charAt(0);
      }
      tag = value;
      prev = last(this.tokens);
      if (value === '=' && prev) {
        if (!prev[1].reserved && (_ref2 = prev[1], __indexOf.call(JS_FORBIDDEN, _ref2) >= 0)) {
          this.error("reserved word \"" + (this.value()) + "\" can't be assigned");
        }
        if ((_ref3 = prev[1]) === '||' || _ref3 === '&&') {
          prev[0] = 'COMPOUND_ASSIGN';
          prev[1] += '=';
          return value.length;
        }
      }
      if (value === ';') {
        this.seenFor = false;
        tag = 'TERMINATOR';
      } else if (__indexOf.call(MATH, value) >= 0) {
        tag = 'MATH';
      } else if (__indexOf.call(COMPARE, value) >= 0) {
        tag = 'COMPARE';
      } else if (__indexOf.call(COMPOUND_ASSIGN, value) >= 0) {
        tag = 'COMPOUND_ASSIGN';
      } else if (__indexOf.call(UNARY, value) >= 0) {
        tag = 'UNARY';
      } else if (__indexOf.call(SHIFT, value) >= 0) {
        tag = 'SHIFT';
      } else if (__indexOf.call(LOGIC, value) >= 0 || value === '?' && (prev != null ? prev.spaced : void 0)) {
        tag = 'LOGIC';
      } else if (prev && !prev.spaced) {
        if (value === '(' && (_ref4 = prev[0], __indexOf.call(CALLABLE, _ref4) >= 0)) {
          if (prev[0] === '?') {
            prev[0] = 'FUNC_EXIST';
          }
          tag = 'CALL_START';
        } else if (value === '[' && (_ref5 = prev[0], __indexOf.call(INDEXABLE, _ref5) >= 0)) {
          tag = 'INDEX_START';
          switch (prev[0]) {
            case '?':
              prev[0] = 'INDEX_SOAK';
          }
        }
      }
      switch (value) {
        case '(':
        case '{':
        case '[':
          this.ends.push(INVERSES[value]);
          break;
        case ')':
        case '}':
        case ']':
          this.pair(value);
      }
      this.token(tag, value);
      return value.length;
    }; return _literalToken})();

    Lexer.prototype.sanitizeHeredoc = (function(){ function _sanitizeHeredoc(doc, options) {
      var attempt, herecomment, indent, match, _ref2, _sanitizeHeredoc;
      indent = options.indent, herecomment = options.herecomment;
      if (herecomment) {
        if (HEREDOC_ILLEGAL.test(doc)) {
          this.error("block comment cannot contain \"*/\", starting");
        }
        if (doc.indexOf('\n') < 0) {
          return doc;
        }
      } else {
        while (match = HEREDOC_INDENT.exec(doc)) {
          attempt = match[1];
          if (indent === null || (0 < (_ref2 = attempt.length) && _ref2 < indent.length)) {
            indent = attempt;
          }
        }
      }
      if (indent) {
        doc = doc.replace(RegExp("\\n" + indent, "g"), '\n');
      }
      if (!herecomment) {
        doc = doc.replace(/^\n/, '');
      }
      return doc;
    }; return _sanitizeHeredoc})();

    Lexer.prototype.tagParameters = (function(){ function _tagParameters() {
      var i, stack, tok, tokens, _tagParameters;
      if (this.tag() !== ')') {
        return this;
      }
      stack = [];
      tokens = this.tokens;
      i = tokens.length;
      tokens[--i][0] = 'PARAM_END';
      while (tok = tokens[--i]) {
        switch (tok[0]) {
          case ')':
            stack.push(tok);
            break;
          case '(':
          case 'CALL_START':
            if (stack.length) {
              stack.pop();
            } else if (tok[0] === '(') {
              tok[0] = 'PARAM_START';
              return this;
            } else {
              return this;
            }
        }
      }
      return this;
    }; return _tagParameters})();

    Lexer.prototype.closeIndentation = (function(){ function _closeIndentation() {
      var _closeIndentation;
      return this.outdentToken(this.indent);
    }; return _closeIndentation})();

    Lexer.prototype.balancedString = (function(){ function _balancedString(str, end) {
      var continueCount, i, letter, match, prev, stack, _balancedString, _i, _ref2;
      continueCount = 0;
      stack = [end];
      for (i = _i = 1, _ref2 = str.length; 1 <= _ref2 ? _i < _ref2 : _i > _ref2; i = 1 <= _ref2 ? ++_i : --_i) {
        if (continueCount) {
          --continueCount;
          continue;
        }
        switch (letter = str.charAt(i)) {
          case '\\':
            ++continueCount;
            continue;
          case end:
            stack.pop();
            if (!stack.length) {
              return str.slice(0, +i + 1 || 9e9);
            }
            end = stack[stack.length - 1];
            continue;
        }
        if (end === '}' && (letter === '"' || letter === "'")) {
          stack.push(end = letter);
        } else if (end === '}' && letter === '/' && (match = HEREGEX.exec(str.slice(i)) || REGEX.exec(str.slice(i)))) {
          continueCount += match[0].length - 1;
        } else if (end === '}' && letter === '{') {
          stack.push(end = '}');
        } else if (end === '"' && prev === '#' && letter === '{') {
          stack.push(end = '}');
        }
        prev = letter;
      }
      return this.error("missing " + (stack.pop()) + ", starting");
    }; return _balancedString})();

    Lexer.prototype.interpolateString = (function(){ function _interpolateString(str, options) {
      var expr, heredoc, i, inner, interpolated, len, letter, nested, pi, regex, tag, tokens, value, _i, _interpolateString, _len, _ref2, _ref3, _ref4;
      if (options == null) {
        options = {};
      }
      heredoc = options.heredoc, regex = options.regex;
      tokens = [];
      pi = 0;
      i = -1;
      while (letter = str.charAt(i += 1)) {
        if (letter === '\\') {
          i += 1;
          continue;
        }
        if (!(letter === '#' && str.charAt(i + 1) === '{' && (expr = this.balancedString(str.slice(i + 1), '}')))) {
          continue;
        }
        if (pi < i) {
          tokens.push(['NEOSTRING', str.slice(pi, i)]);
        }
        inner = expr.slice(1, -1);
        if (inner.length) {
          nested = new Lexer().tokenize(inner, {
            line: this.line,
            rewrite: false
          });
          nested.pop();
          if (((_ref2 = nested[0]) != null ? _ref2[0] : void 0) === 'TERMINATOR') {
            nested.shift();
          }
          if (len = nested.length) {
            if (len > 1) {
              nested.unshift(['(', '(', this.line]);
              nested.push([')', ')', this.line]);
            }
            tokens.push(['TOKENS', nested]);
          }
        }
        i += expr.length;
        pi = i + 1;
      }
      if ((i > pi && pi < str.length)) {
        tokens.push(['NEOSTRING', str.slice(pi)]);
      }
      if (regex) {
        return tokens;
      }
      if (!tokens.length) {
        return this.token('STRING', '""');
      }
      if (tokens[0][0] !== 'NEOSTRING') {
        tokens.unshift(['', '']);
      }
      if (interpolated = tokens.length > 1) {
        this.token('(', '(');
      }
      for (i = _i = 0, _len = tokens.length; _i < _len; i = ++_i) {
        _ref3 = tokens[i], tag = _ref3[0], value = _ref3[1];
        if (i) {
          this.token('+', '+');
        }
        if (tag === 'TOKENS') {
          (_ref4 = this.tokens).push.apply(_ref4, value);
        } else {
          this.token('STRING', this.makeString(value, '"', heredoc));
        }
      }
      if (interpolated) {
        this.token(')', ')');
      }
      return tokens;
    }; return _interpolateString})();

    Lexer.prototype.pair = (function(){ function _pair(tag) {
      var size, wanted, _pair;
      if (tag !== (wanted = last(this.ends))) {
        if ('OUTDENT' !== wanted) {
          this.error("unmatched " + tag);
        }
        this.indent -= size = last(this.indents);
        this.outdentToken(size, true);
        return this.pair(tag);
      }
      return this.ends.pop();
    }; return _pair})();

    Lexer.prototype.token = (function(){ function _token(tag, value) {
      var _token;
      return this.tokens.push([tag, value, this.line]);
    }; return _token})();

    Lexer.prototype.tag = (function(){ function _tag(index, tag) {
      var tok, _tag;
      return (tok = last(this.tokens, index)) && (tag ? tok[0] = tag : tok[0]);
    }; return _tag})();

    Lexer.prototype.value = (function(){ function _value(index, val) {
      var tok, _value;
      return (tok = last(this.tokens, index)) && (val ? tok[1] = val : tok[1]);
    }; return _value})();

    Lexer.prototype.unfinished = (function(){ function _unfinished() {
      var _ref2, _unfinished;
      return LINE_CONTINUER.test(this.chunk) || ((_ref2 = this.tag()) === '\\' || _ref2 === '.' || _ref2 === '?.' || _ref2 === 'UNARY' || _ref2 === 'MATH' || _ref2 === '+' || _ref2 === '-' || _ref2 === 'SHIFT' || _ref2 === 'RELATION' || _ref2 === 'COMPARE' || _ref2 === 'LOGIC' || _ref2 === 'THROW' || _ref2 === 'EXTENDS');
    }; return _unfinished})();

    Lexer.prototype.escapeLines = (function(){ function _escapeLines(str, heredoc) {
      var _escapeLines;
      return str.replace(MULTILINER, heredoc ? '\\n' : '');
    }; return _escapeLines})();

    Lexer.prototype.makeString = (function(){ function _makeString(body, quote, heredoc) {
      var _makeString;
      if (!body) {
        return quote + quote;
      }
      body = body.replace(/\\([\s\S])/g, function(match, contents) {
        if (contents === '\n' || contents === quote) {
          return contents;
        } else {
          return match;
        }
      });
      body = body.replace(RegExp("" + quote, "g"), '\\$&');
      return quote + this.escapeLines(body, heredoc) + quote;
    }; return _makeString})();

    Lexer.prototype.error = (function(){ function _error(message) {
      var _error;
      throw SyntaxError("" + message + " on line " + (this.line + 1));
    }; return _error})();

    return Lexer;

  })();

  JS_KEYWORDS = ['true', 'false', 'null', 'this', 'new', 'delete', 'typeof', 'in', 'instanceof', 'return', 'throw', 'break', 'continue', 'debugger', 'if', 'else', 'switch', 'for', 'while', 'do', 'try', 'catch', 'finally', 'class', 'extends', 'super'];

  COFFEE_KEYWORDS = ['undefined', 'then', 'unless', 'until', 'loop', 'of', 'by', 'when'];

  COFFEE_ALIAS_MAP = {
    and: '&&',
    or: '||',
    is: '==',
    isnt: '!=',
    not: '!',
    yes: 'true',
    no: 'false',
    on: 'true',
    off: 'false'
  };

  COFFEE_ALIASES = (function() {
    var _results;
    _results = [];
    for (key in COFFEE_ALIAS_MAP) {
      _results.push(key);
    }
    return _results;
  })();

  COFFEE_KEYWORDS = COFFEE_KEYWORDS.concat(COFFEE_ALIASES);

  RESERVED = ['case', 'default', 'function', 'var', 'void', 'with', 'const', 'let', 'enum', 'export', 'import', 'native', '__hasProp', '__extends', '__slice', '__bind', '__indexOf', 'implements', 'interface', 'package', 'private', 'protected', 'public', 'static', 'yield'];

  STRICT_PROSCRIBED = ['arguments', 'eval'];

  JS_FORBIDDEN = JS_KEYWORDS.concat(RESERVED).concat(STRICT_PROSCRIBED);

  exports.RESERVED = RESERVED.concat(JS_KEYWORDS).concat(COFFEE_KEYWORDS).concat(STRICT_PROSCRIBED);

  exports.STRICT_PROSCRIBED = STRICT_PROSCRIBED;

  BOM = 65279;

  IDENTIFIER = /^([$A-Za-z_\x7f-\uffff][$\w\x7f-\uffff]*)([^\n\S]*:(?!:))?/;

  NUMBER = /^0b[01]+|^0o[0-7]+|^0x[\da-f]+|^\d*\.?\d+(?:e[+-]?\d+)?/i;

  HEREDOC = /^("""|''')([\s\S]*?)(?:\n[^\n\S]*)?\1/;

  OPERATOR = /^(?:[-=]>|[-+*\/%<>&|^!?=]=|>>>=?|([-+:])\1|([&|<>])\2=?|\?\.|\.{2,3})/;

  WHITESPACE = /^[^\n\S]+/;

  COMMENT = /^###([^#][\s\S]*?)(?:###[^\n\S]*|(?:###)$)|^(?:\s*#(?!##[^#]).*)+/;

  LITERATE = /^([ ]{4}|\t)/;

  CODE = /^[-=]>/;

  MULTI_DENT = /^(?:\n[^\n\S]*)+/;

  SIMPLESTR = /^'[^\\']*(?:\\.[^\\']*)*'/;

  JSTOKEN = /^`[^\\`]*(?:\\.[^\\`]*)*`/;

  REGEX = /^(\/(?![\s=])[^[\/\n\\]*(?:(?:\\[\s\S]|\[[^\]\n\\]*(?:\\[\s\S][^\]\n\\]*)*])[^[\/\n\\]*)*\/)([imgy]{0,4})(?!\w)/;

  HEREGEX = /^\/{3}([\s\S]+?)\/{3}([imgy]{0,4})(?!\w)/;

  HEREGEX_OMIT = /\s+(?:#.*)?/g;

  MULTILINER = /\n/g;

  HEREDOC_INDENT = /\n+([^\n\S]*)/g;

  HEREDOC_ILLEGAL = /\*\//;

  LINE_CONTINUER = /^\s*(?:,|\??\.(?![.\d])|::)/;

  TRAILING_SPACES = /\s+$/;

  COMPOUND_ASSIGN = ['-=', '+=', '/=', '*=', '%=', '||=', '&&=', '?=', '<<=', '>>=', '>>>=', '&=', '^=', '|='];

  UNARY = ['!', '~', 'NEW', 'TYPEOF', 'DELETE', 'DO'];

  LOGIC = ['&&', '||', '&', '|', '^'];

  SHIFT = ['<<', '>>', '>>>'];

  COMPARE = ['==', '!=', '<', '>', '<=', '>='];

  MATH = ['*', '/', '%'];

  RELATION = ['IN', 'OF', 'INSTANCEOF'];

  BOOL = ['TRUE', 'FALSE'];

  NOT_REGEX = ['NUMBER', 'REGEX', 'BOOL', 'NULL', 'UNDEFINED', '++', '--', ']'];

  NOT_SPACED_REGEX = NOT_REGEX.concat(')', '}', 'THIS', 'IDENTIFIER', 'STRING');

  CALLABLE = ['IDENTIFIER', 'STRING', 'REGEX', ')', ']', '}', '?', '::', '@', 'THIS', 'SUPER'];

  INDEXABLE = CALLABLE.concat('NUMBER', 'BOOL', 'NULL', 'UNDEFINED');

  LINE_BREAK = ['INDENT', 'OUTDENT', 'TERMINATOR'];

}).call(this);

// Generated by CoffeeScript 1.5.0-pre
