//main.js

(function () {
  function r(e, n, t) {
    function o(i, f) {
      if (!n[i]) {
        if (!e[i]) {
          var c = "function" == typeof require && require;
          if (!f && c)
            return c(i, !0);
          if (u)
            return u(i, !0);
          var a = new Error("Cannot find module '" + i + "'"); throw a.code = "MODULE_NOT_FOUND", a
        } var p = n[i] = { exports: {} }; e[i][0].call(p.exports, function (r) { var n = e[i][1][r]; return o(n || r) }, p, p.exports, r, e, n, t)
      } return n[i].exports
    } for (var u = "function" == typeof require && require, i = 0; i < t.length; i++)o(t[i]); return o
  } return r
})()({
  1: [function (require, module, exports) {
    'use strict'

    exports.byteLength = byteLength
    exports.toByteArray = toByteArray
    exports.fromByteArray = fromByteArray

    var lookup = []
    var revLookup = []
    var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

    var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
    for (var i = 0, len = code.length; i < len; ++i) {
      lookup[i] = code[i]
      revLookup[code.charCodeAt(i)] = i
    }

    // Support decoding URL-safe base64 strings, as Node.js does.
    // See: https://en.wikipedia.org/wiki/Base64#URL_applications
    revLookup['-'.charCodeAt(0)] = 62
    revLookup['_'.charCodeAt(0)] = 63

    function placeHoldersCount(b64) {
      var len = b64.length
      if (len % 4 > 0) {
        throw new Error('Invalid string. Length must be a multiple of 4')
      }

      // the number of equal signs (place holders)
      // if there are two placeholders, than the two characters before it
      // represent one byte
      // if there is only one, then the three characters before it represent 2 bytes
      // this is just a cheap hack to not do indexOf twice
      return b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0
    }

    function byteLength(b64) {
      // base64 is 4/3 + up to two characters of the original data
      return (b64.length * 3 / 4) - placeHoldersCount(b64)
    }

    function toByteArray(b64) {
      var i, l, tmp, placeHolders, arr
      var len = b64.length
      placeHolders = placeHoldersCount(b64)

      arr = new Arr((len * 3 / 4) - placeHolders)

      // if there are placeholders, only get up to the last complete 4 chars
      l = placeHolders > 0 ? len - 4 : len

      var L = 0

      for (i = 0; i < l; i += 4) {
        tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)]
        arr[L++] = (tmp >> 16) & 0xFF
        arr[L++] = (tmp >> 8) & 0xFF
        arr[L++] = tmp & 0xFF
      }

      if (placeHolders === 2) {
        tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4)
        arr[L++] = tmp & 0xFF
      } else if (placeHolders === 1) {
        tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2)
        arr[L++] = (tmp >> 8) & 0xFF
        arr[L++] = tmp & 0xFF
      }

      return arr
    }

    function tripletToBase64(num) {
      return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
    }

    function encodeChunk(uint8, start, end) {
      var tmp
      var output = []
      for (var i = start; i < end; i += 3) {
        tmp = ((uint8[i] << 16) & 0xFF0000) + ((uint8[i + 1] << 8) & 0xFF00) + (uint8[i + 2] & 0xFF)
        output.push(tripletToBase64(tmp))
      }
      return output.join('')
    }

    function fromByteArray(uint8) {
      var tmp
      var len = uint8.length
      var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
      var output = ''
      var parts = []
      var maxChunkLength = 16383 // must be multiple of 3

      // go through the array every three bytes, we'll deal with trailing stuff later
      for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
        parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
      }

      // pad the end with zeros, but make sure to not forget the extra bytes
      if (extraBytes === 1) {
        tmp = uint8[len - 1]
        output += lookup[tmp >> 2]
        output += lookup[(tmp << 4) & 0x3F]
        output += '=='
      } else if (extraBytes === 2) {
        tmp = (uint8[len - 2] << 8) + (uint8[len - 1])
        output += lookup[tmp >> 10]
        output += lookup[(tmp >> 4) & 0x3F]
        output += lookup[(tmp << 2) & 0x3F]
        output += '='
      }

      parts.push(output)

      return parts.join('')
    }

  }, {}], 2: [function (require, module, exports) {

  }, {}], 3: [function (require, module, exports) {
    /*!
     * The buffer module from node.js, for the browser.
     *
     * @author   Feross Aboukhadijeh <https://feross.org>
     * @license  MIT
     */
    /* eslint-disable no-proto */

    'use strict'

    var base64 = require('base64-js')
    var ieee754 = require('ieee754')

    exports.Buffer = Buffer
    exports.SlowBuffer = SlowBuffer
    exports.INSPECT_MAX_BYTES = 50

    var K_MAX_LENGTH = 0x7fffffff
    exports.kMaxLength = K_MAX_LENGTH

    /**
     * If `Buffer.TYPED_ARRAY_SUPPORT`:
     *   === true    Use Uint8Array implementation (fastest)
     *   === false   Print warning and recommend using `buffer` v4.x which has an Object
     *               implementation (most compatible, even IE6)
     *
     * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
     * Opera 11.6+, iOS 4.2+.
     *
     * We report that the browser does not support typed arrays if the are not subclassable
     * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
     * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
     * for __proto__ and has a buggy typed array implementation.
     */
    Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

    if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
      typeof console.error === 'function') {
      console.error(
        'This browser lacks typed array (Uint8Array) support which is required by ' +
        '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
      )
    }

    function typedArraySupport() {
      // Can typed array instances can be augmented?
      try {
        var arr = new Uint8Array(1)
        arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
        return arr.foo() === 42
      } catch (e) {
        return false
      }
    }

    Object.defineProperty(Buffer.prototype, 'parent', {
      get: function () {
        if (!(this instanceof Buffer)) {
          return undefined
        }
        return this.buffer
      }
    })

    Object.defineProperty(Buffer.prototype, 'offset', {
      get: function () {
        if (!(this instanceof Buffer)) {
          return undefined
        }
        return this.byteOffset
      }
    })

    function createBuffer(length) {
      if (length > K_MAX_LENGTH) {
        throw new RangeError('Invalid typed array length')
      }
      // Return an augmented `Uint8Array` instance
      var buf = new Uint8Array(length)
      buf.__proto__ = Buffer.prototype
      return buf
    }

    /**
     * The Buffer constructor returns instances of `Uint8Array` that have their
     * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
     * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
     * and the `Uint8Array` methods. Square bracket notation works as expected -- it
     * returns a single octet.
     *
     * The `Uint8Array` prototype remains unmodified.
     */

    function Buffer(arg, encodingOrOffset, length) {
      // Common case.
      if (typeof arg === 'number') {
        if (typeof encodingOrOffset === 'string') {
          throw new Error(
            'If encoding is specified then the first argument must be a string'
          )
        }
        return allocUnsafe(arg)
      }
      return from(arg, encodingOrOffset, length)
    }

    // Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
    if (typeof Symbol !== 'undefined' && Symbol.species &&
      Buffer[Symbol.species] === Buffer) {
      Object.defineProperty(Buffer, Symbol.species, {
        value: null,
        configurable: true,
        enumerable: false,
        writable: false
      })
    }

    Buffer.poolSize = 8192 // not used by this implementation

    function from(value, encodingOrOffset, length) {
      if (typeof value === 'number') {
        throw new TypeError('"value" argument must not be a number')
      }

      if (isArrayBuffer(value) || (value && isArrayBuffer(value.buffer))) {
        return fromArrayBuffer(value, encodingOrOffset, length)
      }

      if (typeof value === 'string') {
        return fromString(value, encodingOrOffset)
      }

      return fromObject(value)
    }

    /**
     * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
     * if value is a number.
     * Buffer.from(str[, encoding])
     * Buffer.from(array)
     * Buffer.from(buffer)
     * Buffer.from(arrayBuffer[, byteOffset[, length]])
     **/
    Buffer.from = function (value, encodingOrOffset, length) {
      return from(value, encodingOrOffset, length)
    }

    // Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
    // https://github.com/feross/buffer/pull/148
    Buffer.prototype.__proto__ = Uint8Array.prototype
    Buffer.__proto__ = Uint8Array

    function assertSize(size) {
      if (typeof size !== 'number') {
        throw new TypeError('"size" argument must be of type number')
      } else if (size < 0) {
        throw new RangeError('"size" argument must not be negative')
      }
    }

    function alloc(size, fill, encoding) {
      assertSize(size)
      if (size <= 0) {
        return createBuffer(size)
      }
      if (fill !== undefined) {
        // Only pay attention to encoding if it's a string. This
        // prevents accidentally sending in a number that would
        // be interpretted as a start offset.
        return typeof encoding === 'string'
          ? createBuffer(size).fill(fill, encoding)
          : createBuffer(size).fill(fill)
      }
      return createBuffer(size)
    }

    /**
     * Creates a new filled Buffer instance.
     * alloc(size[, fill[, encoding]])
     **/
    Buffer.alloc = function (size, fill, encoding) {
      return alloc(size, fill, encoding)
    }

    function allocUnsafe(size) {
      assertSize(size)
      return createBuffer(size < 0 ? 0 : checked(size) | 0)
    }

    /**
     * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
     * */
    Buffer.allocUnsafe = function (size) {
      return allocUnsafe(size)
    }
    /**
     * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
     */
    Buffer.allocUnsafeSlow = function (size) {
      return allocUnsafe(size)
    }

    function fromString(string, encoding) {
      if (typeof encoding !== 'string' || encoding === '') {
        encoding = 'utf8'
      }

      if (!Buffer.isEncoding(encoding)) {
        throw new TypeError('Unknown encoding: ' + encoding)
      }

      var length = byteLength(string, encoding) | 0
      var buf = createBuffer(length)

      var actual = buf.write(string, encoding)

      if (actual !== length) {
        // Writing a hex string, for example, that contains invalid characters will
        // cause everything after the first invalid character to be ignored. (e.g.
        // 'abxxcd' will be treated as 'ab')
        buf = buf.slice(0, actual)
      }

      return buf
    }

    function fromArrayLike(array) {
      var length = array.length < 0 ? 0 : checked(array.length) | 0
      var buf = createBuffer(length)
      for (var i = 0; i < length; i += 1) {
        buf[i] = array[i] & 255
      }
      return buf
    }

    function fromArrayBuffer(array, byteOffset, length) {
      if (byteOffset < 0 || array.byteLength < byteOffset) {
        throw new RangeError('"offset" is outside of buffer bounds')
      }

      if (array.byteLength < byteOffset + (length || 0)) {
        throw new RangeError('"length" is outside of buffer bounds')
      }

      var buf
      if (byteOffset === undefined && length === undefined) {
        buf = new Uint8Array(array)
      } else if (length === undefined) {
        buf = new Uint8Array(array, byteOffset)
      } else {
        buf = new Uint8Array(array, byteOffset, length)
      }

      // Return an augmented `Uint8Array` instance
      buf.__proto__ = Buffer.prototype
      return buf
    }

    function fromObject(obj) {
      if (Buffer.isBuffer(obj)) {
        var len = checked(obj.length) | 0
        var buf = createBuffer(len)

        if (buf.length === 0) {
          return buf
        }

        obj.copy(buf, 0, 0, len)
        return buf
      }

      if (obj) {
        if (ArrayBuffer.isView(obj) || 'length' in obj) {
          if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
            return createBuffer(0)
          }
          return fromArrayLike(obj)
        }

        if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
          return fromArrayLike(obj.data)
        }
      }

      throw new TypeError('The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object.')
    }

    function checked(length) {
      // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
      // length is NaN (which is otherwise coerced to zero.)
      if (length >= K_MAX_LENGTH) {
        throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
          'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
      }
      return length | 0
    }

    function SlowBuffer(length) {
      if (+length != length) { // eslint-disable-line eqeqeq
        length = 0
      }
      return Buffer.alloc(+length)
    }

    Buffer.isBuffer = function isBuffer(b) {
      return b != null && b._isBuffer === true
    }

    Buffer.compare = function compare(a, b) {
      if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
        throw new TypeError('Arguments must be Buffers')
      }

      if (a === b) return 0

      var x = a.length
      var y = b.length

      for (var i = 0, len = Math.min(x, y); i < len; ++i) {
        if (a[i] !== b[i]) {
          x = a[i]
          y = b[i]
          break
        }
      }

      if (x < y) return -1
      if (y < x) return 1
      return 0
    }

    Buffer.isEncoding = function isEncoding(encoding) {
      switch (String(encoding).toLowerCase()) {
        case 'hex':
        case 'utf8':
        case 'utf-8':
        case 'ascii':
        case 'latin1':
        case 'binary':
        case 'base64':
        case 'ucs2':
        case 'ucs-2':
        case 'utf16le':
        case 'utf-16le':
          return true
        default:
          return false
      }
    }

    Buffer.concat = function concat(list, length) {
      if (!Array.isArray(list)) {
        throw new TypeError('"list" argument must be an Array of Buffers')
      }

      if (list.length === 0) {
        return Buffer.alloc(0)
      }

      var i
      if (length === undefined) {
        length = 0
        for (i = 0; i < list.length; ++i) {
          length += list[i].length
        }
      }

      var buffer = Buffer.allocUnsafe(length)
      var pos = 0
      for (i = 0; i < list.length; ++i) {
        var buf = list[i]
        if (ArrayBuffer.isView(buf)) {
          buf = Buffer.from(buf)
        }
        if (!Buffer.isBuffer(buf)) {
          throw new TypeError('"list" argument must be an Array of Buffers')
        }
        buf.copy(buffer, pos)
        pos += buf.length
      }
      return buffer
    }

    function byteLength(string, encoding) {
      if (Buffer.isBuffer(string)) {
        return string.length
      }
      if (ArrayBuffer.isView(string) || isArrayBuffer(string)) {
        return string.byteLength
      }
      if (typeof string !== 'string') {
        string = '' + string
      }

      var len = string.length
      if (len === 0) return 0

      // Use a for loop to avoid recursion
      var loweredCase = false
      for (; ;) {
        switch (encoding) {
          case 'ascii':
          case 'latin1':
          case 'binary':
            return len
          case 'utf8':
          case 'utf-8':
          case undefined:
            return utf8ToBytes(string).length
          case 'ucs2':
          case 'ucs-2':
          case 'utf16le':
          case 'utf-16le':
            return len * 2
          case 'hex':
            return len >>> 1
          case 'base64':
            return base64ToBytes(string).length
          default:
            if (loweredCase) return utf8ToBytes(string).length // assume utf8
            encoding = ('' + encoding).toLowerCase()
            loweredCase = true
        }
      }
    }
    Buffer.byteLength = byteLength

    function slowToString(encoding, start, end) {
      var loweredCase = false

      // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
      // property of a typed array.

      // This behaves neither like String nor Uint8Array in that we set start/end
      // to their upper/lower bounds if the value passed is out of range.
      // undefined is handled specially as per ECMA-262 6th Edition,
      // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
      if (start === undefined || start < 0) {
        start = 0
      }
      // Return early if start > this.length. Done here to prevent potential uint32
      // coercion fail below.
      if (start > this.length) {
        return ''
      }

      if (end === undefined || end > this.length) {
        end = this.length
      }

      if (end <= 0) {
        return ''
      }

      // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
      end >>>= 0
      start >>>= 0

      if (end <= start) {
        return ''
      }

      if (!encoding) encoding = 'utf8'

      while (true) {
        switch (encoding) {
          case 'hex':
            return hexSlice(this, start, end)

          case 'utf8':
          case 'utf-8':
            return utf8Slice(this, start, end)

          case 'ascii':
            return asciiSlice(this, start, end)

          case 'latin1':
          case 'binary':
            return latin1Slice(this, start, end)

          case 'base64':
            return base64Slice(this, start, end)

          case 'ucs2':
          case 'ucs-2':
          case 'utf16le':
          case 'utf-16le':
            return utf16leSlice(this, start, end)

          default:
            if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
            encoding = (encoding + '').toLowerCase()
            loweredCase = true
        }
      }
    }

    // This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
    // to detect a Buffer instance. It's not possible to use `instanceof Buffer`
    // reliably in a browserify context because there could be multiple different
    // copies of the 'buffer' package in use. This method works even for Buffer
    // instances that were created from another copy of the `buffer` package.
    // See: https://github.com/feross/buffer/issues/154
    Buffer.prototype._isBuffer = true

    function swap(b, n, m) {
      var i = b[n]
      b[n] = b[m]
      b[m] = i
    }

    Buffer.prototype.swap16 = function swap16() {
      var len = this.length
      if (len % 2 !== 0) {
        throw new RangeError('Buffer size must be a multiple of 16-bits')
      }
      for (var i = 0; i < len; i += 2) {
        swap(this, i, i + 1)
      }
      return this
    }

    Buffer.prototype.swap32 = function swap32() {
      var len = this.length
      if (len % 4 !== 0) {
        throw new RangeError('Buffer size must be a multiple of 32-bits')
      }
      for (var i = 0; i < len; i += 4) {
        swap(this, i, i + 3)
        swap(this, i + 1, i + 2)
      }
      return this
    }

    Buffer.prototype.swap64 = function swap64() {
      var len = this.length
      if (len % 8 !== 0) {
        throw new RangeError('Buffer size must be a multiple of 64-bits')
      }
      for (var i = 0; i < len; i += 8) {
        swap(this, i, i + 7)
        swap(this, i + 1, i + 6)
        swap(this, i + 2, i + 5)
        swap(this, i + 3, i + 4)
      }
      return this
    }

    Buffer.prototype.toString = function toString() {
      var length = this.length
      if (length === 0) return ''
      if (arguments.length === 0) return utf8Slice(this, 0, length)
      return slowToString.apply(this, arguments)
    }

    Buffer.prototype.toLocaleString = Buffer.prototype.toString

    Buffer.prototype.equals = function equals(b) {
      if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
      if (this === b) return true
      return Buffer.compare(this, b) === 0
    }

    Buffer.prototype.inspect = function inspect() {
      var str = ''
      var max = exports.INSPECT_MAX_BYTES
      if (this.length > 0) {
        str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
        if (this.length > max) str += ' ... '
      }
      return '<Buffer ' + str + '>'
    }

    Buffer.prototype.compare = function compare(target, start, end, thisStart, thisEnd) {
      if (!Buffer.isBuffer(target)) {
        throw new TypeError('Argument must be a Buffer')
      }

      if (start === undefined) {
        start = 0
      }
      if (end === undefined) {
        end = target ? target.length : 0
      }
      if (thisStart === undefined) {
        thisStart = 0
      }
      if (thisEnd === undefined) {
        thisEnd = this.length
      }

      if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
        throw new RangeError('out of range index')
      }

      if (thisStart >= thisEnd && start >= end) {
        return 0
      }
      if (thisStart >= thisEnd) {
        return -1
      }
      if (start >= end) {
        return 1
      }

      start >>>= 0
      end >>>= 0
      thisStart >>>= 0
      thisEnd >>>= 0

      if (this === target) return 0

      var x = thisEnd - thisStart
      var y = end - start
      var len = Math.min(x, y)

      var thisCopy = this.slice(thisStart, thisEnd)
      var targetCopy = target.slice(start, end)

      for (var i = 0; i < len; ++i) {
        if (thisCopy[i] !== targetCopy[i]) {
          x = thisCopy[i]
          y = targetCopy[i]
          break
        }
      }

      if (x < y) return -1
      if (y < x) return 1
      return 0
    }

    // Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
    // OR the last index of `val` in `buffer` at offset <= `byteOffset`.
    //
    // Arguments:
    // - buffer - a Buffer to search
    // - val - a string, Buffer, or number
    // - byteOffset - an index into `buffer`; will be clamped to an int32
    // - encoding - an optional encoding, relevant is val is a string
    // - dir - true for indexOf, false for lastIndexOf
    function bidirectionalIndexOf(buffer, val, byteOffset, encoding, dir) {
      // Empty buffer means no match
      if (buffer.length === 0) return -1

      // Normalize byteOffset
      if (typeof byteOffset === 'string') {
        encoding = byteOffset
        byteOffset = 0
      } else if (byteOffset > 0x7fffffff) {
        byteOffset = 0x7fffffff
      } else if (byteOffset < -0x80000000) {
        byteOffset = -0x80000000
      }
      byteOffset = +byteOffset  // Coerce to Number.
      if (numberIsNaN(byteOffset)) {
        // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
        byteOffset = dir ? 0 : (buffer.length - 1)
      }

      // Normalize byteOffset: negative offsets start from the end of the buffer
      if (byteOffset < 0) byteOffset = buffer.length + byteOffset
      if (byteOffset >= buffer.length) {
        if (dir) return -1
        else byteOffset = buffer.length - 1
      } else if (byteOffset < 0) {
        if (dir) byteOffset = 0
        else return -1
      }

      // Normalize val
      if (typeof val === 'string') {
        val = Buffer.from(val, encoding)
      }

      // Finally, search either indexOf (if dir is true) or lastIndexOf
      if (Buffer.isBuffer(val)) {
        // Special case: looking for empty string/buffer always fails
        if (val.length === 0) {
          return -1
        }
        return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
      } else if (typeof val === 'number') {
        val = val & 0xFF // Search for a byte value [0-255]
        if (typeof Uint8Array.prototype.indexOf === 'function') {
          if (dir) {
            return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
          } else {
            return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
          }
        }
        return arrayIndexOf(buffer, [val], byteOffset, encoding, dir)
      }

      throw new TypeError('val must be string, number or Buffer')
    }

    function arrayIndexOf(arr, val, byteOffset, encoding, dir) {
      var indexSize = 1
      var arrLength = arr.length
      var valLength = val.length

      if (encoding !== undefined) {
        encoding = String(encoding).toLowerCase()
        if (encoding === 'ucs2' || encoding === 'ucs-2' ||
          encoding === 'utf16le' || encoding === 'utf-16le') {
          if (arr.length < 2 || val.length < 2) {
            return -1
          }
          indexSize = 2
          arrLength /= 2
          valLength /= 2
          byteOffset /= 2
        }
      }

      function read(buf, i) {
        if (indexSize === 1) {
          return buf[i]
        } else {
          return buf.readUInt16BE(i * indexSize)
        }
      }

      var i
      if (dir) {
        var foundIndex = -1
        for (i = byteOffset; i < arrLength; i++) {
          if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
            if (foundIndex === -1) foundIndex = i
            if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
          } else {
            if (foundIndex !== -1) i -= i - foundIndex
            foundIndex = -1
          }
        }
      } else {
        if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
        for (i = byteOffset; i >= 0; i--) {
          var found = true
          for (var j = 0; j < valLength; j++) {
            if (read(arr, i + j) !== read(val, j)) {
              found = false
              break
            }
          }
          if (found) return i
        }
      }

      return -1
    }

    Buffer.prototype.includes = function includes(val, byteOffset, encoding) {
      return this.indexOf(val, byteOffset, encoding) !== -1
    }

    Buffer.prototype.indexOf = function indexOf(val, byteOffset, encoding) {
      return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
    }

    Buffer.prototype.lastIndexOf = function lastIndexOf(val, byteOffset, encoding) {
      return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
    }

    function hexWrite(buf, string, offset, length) {
      offset = Number(offset) || 0
      var remaining = buf.length - offset
      if (!length) {
        length = remaining
      } else {
        length = Number(length)
        if (length > remaining) {
          length = remaining
        }
      }

      var strLen = string.length

      if (length > strLen / 2) {
        length = strLen / 2
      }
      for (var i = 0; i < length; ++i) {
        var parsed = parseInt(string.substr(i * 2, 2), 16)
        if (numberIsNaN(parsed)) return i
        buf[offset + i] = parsed
      }
      return i
    }

    function utf8Write(buf, string, offset, length) {
      return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
    }

    function asciiWrite(buf, string, offset, length) {
      return blitBuffer(asciiToBytes(string), buf, offset, length)
    }

    function latin1Write(buf, string, offset, length) {
      return asciiWrite(buf, string, offset, length)
    }

    function base64Write(buf, string, offset, length) {
      return blitBuffer(base64ToBytes(string), buf, offset, length)
    }

    function ucs2Write(buf, string, offset, length) {
      return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
    }

    Buffer.prototype.write = function write(string, offset, length, encoding) {
      // Buffer#write(string)
      if (offset === undefined) {
        encoding = 'utf8'
        length = this.length
        offset = 0
        // Buffer#write(string, encoding)
      } else if (length === undefined && typeof offset === 'string') {
        encoding = offset
        length = this.length
        offset = 0
        // Buffer#write(string, offset[, length][, encoding])
      } else if (isFinite(offset)) {
        offset = offset >>> 0
        if (isFinite(length)) {
          length = length >>> 0
          if (encoding === undefined) encoding = 'utf8'
        } else {
          encoding = length
          length = undefined
        }
      } else {
        throw new Error(
          'Buffer.write(string, encoding, offset[, length]) is no longer supported'
        )
      }

      var remaining = this.length - offset
      if (length === undefined || length > remaining) length = remaining

      if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
        throw new RangeError('Attempt to write outside buffer bounds')
      }

      if (!encoding) encoding = 'utf8'

      var loweredCase = false
      for (; ;) {
        switch (encoding) {
          case 'hex':
            return hexWrite(this, string, offset, length)

          case 'utf8':
          case 'utf-8':
            return utf8Write(this, string, offset, length)

          case 'ascii':
            return asciiWrite(this, string, offset, length)

          case 'latin1':
          case 'binary':
            return latin1Write(this, string, offset, length)

          case 'base64':
            // Warning: maxLength not taken into account in base64Write
            return base64Write(this, string, offset, length)

          case 'ucs2':
          case 'ucs-2':
          case 'utf16le':
          case 'utf-16le':
            return ucs2Write(this, string, offset, length)

          default:
            if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
            encoding = ('' + encoding).toLowerCase()
            loweredCase = true
        }
      }
    }

    Buffer.prototype.toJSON = function toJSON() {
      return {
        type: 'Buffer',
        data: Array.prototype.slice.call(this._arr || this, 0)
      }
    }

    function base64Slice(buf, start, end) {
      if (start === 0 && end === buf.length) {
        return base64.fromByteArray(buf)
      } else {
        return base64.fromByteArray(buf.slice(start, end))
      }
    }

    function utf8Slice(buf, start, end) {
      end = Math.min(buf.length, end)
      var res = []

      var i = start
      while (i < end) {
        var firstByte = buf[i]
        var codePoint = null
        var bytesPerSequence = (firstByte > 0xEF) ? 4
          : (firstByte > 0xDF) ? 3
            : (firstByte > 0xBF) ? 2
              : 1

        if (i + bytesPerSequence <= end) {
          var secondByte, thirdByte, fourthByte, tempCodePoint

          switch (bytesPerSequence) {
            case 1:
              if (firstByte < 0x80) {
                codePoint = firstByte
              }
              break
            case 2:
              secondByte = buf[i + 1]
              if ((secondByte & 0xC0) === 0x80) {
                tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
                if (tempCodePoint > 0x7F) {
                  codePoint = tempCodePoint
                }
              }
              break
            case 3:
              secondByte = buf[i + 1]
              thirdByte = buf[i + 2]
              if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
                tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
                if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
                  codePoint = tempCodePoint
                }
              }
              break
            case 4:
              secondByte = buf[i + 1]
              thirdByte = buf[i + 2]
              fourthByte = buf[i + 3]
              if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
                tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
                if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
                  codePoint = tempCodePoint
                }
              }
          }
        }

        if (codePoint === null) {
          // we did not generate a valid codePoint so insert a
          // replacement char (U+FFFD) and advance only 1 byte
          codePoint = 0xFFFD
          bytesPerSequence = 1
        } else if (codePoint > 0xFFFF) {
          // encode to utf16 (surrogate pair dance)
          codePoint -= 0x10000
          res.push(codePoint >>> 10 & 0x3FF | 0xD800)
          codePoint = 0xDC00 | codePoint & 0x3FF
        }

        res.push(codePoint)
        i += bytesPerSequence
      }

      return decodeCodePointsArray(res)
    }

    // Based on http://stackoverflow.com/a/22747272/680742, the browser with
    // the lowest limit is Chrome, with 0x10000 args.
    // We go 1 magnitude less, for safety
    var MAX_ARGUMENTS_LENGTH = 0x1000

    function decodeCodePointsArray(codePoints) {
      var len = codePoints.length
      if (len <= MAX_ARGUMENTS_LENGTH) {
        return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
      }

      // Decode in chunks to avoid "call stack size exceeded".
      var res = ''
      var i = 0
      while (i < len) {
        res += String.fromCharCode.apply(
          String,
          codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
        )
      }
      return res
    }

    function asciiSlice(buf, start, end) {
      var ret = ''
      end = Math.min(buf.length, end)

      for (var i = start; i < end; ++i) {
        ret += String.fromCharCode(buf[i] & 0x7F)
      }
      return ret
    }

    function latin1Slice(buf, start, end) {
      var ret = ''
      end = Math.min(buf.length, end)

      for (var i = start; i < end; ++i) {
        ret += String.fromCharCode(buf[i])
      }
      return ret
    }

    function hexSlice(buf, start, end) {
      var len = buf.length

      if (!start || start < 0) start = 0
      if (!end || end < 0 || end > len) end = len

      var out = ''
      for (var i = start; i < end; ++i) {
        out += toHex(buf[i])
      }
      return out
    }

    function utf16leSlice(buf, start, end) {
      var bytes = buf.slice(start, end)
      var res = ''
      for (var i = 0; i < bytes.length; i += 2) {
        res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
      }
      return res
    }

    Buffer.prototype.slice = function slice(start, end) {
      var len = this.length
      start = ~~start
      end = end === undefined ? len : ~~end

      if (start < 0) {
        start += len
        if (start < 0) start = 0
      } else if (start > len) {
        start = len
      }

      if (end < 0) {
        end += len
        if (end < 0) end = 0
      } else if (end > len) {
        end = len
      }

      if (end < start) end = start

      var newBuf = this.subarray(start, end)
      // Return an augmented `Uint8Array` instance
      newBuf.__proto__ = Buffer.prototype
      return newBuf
    }

    /*
     * Need to make sure that buffer isn't trying to write out of bounds.
     */
    function checkOffset(offset, ext, length) {
      if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
      if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
    }

    Buffer.prototype.readUIntLE = function readUIntLE(offset, byteLength, noAssert) {
      offset = offset >>> 0
      byteLength = byteLength >>> 0
      if (!noAssert) checkOffset(offset, byteLength, this.length)

      var val = this[offset]
      var mul = 1
      var i = 0
      while (++i < byteLength && (mul *= 0x100)) {
        val += this[offset + i] * mul
      }

      return val
    }

    Buffer.prototype.readUIntBE = function readUIntBE(offset, byteLength, noAssert) {
      offset = offset >>> 0
      byteLength = byteLength >>> 0
      if (!noAssert) {
        checkOffset(offset, byteLength, this.length)
      }

      var val = this[offset + --byteLength]
      var mul = 1
      while (byteLength > 0 && (mul *= 0x100)) {
        val += this[offset + --byteLength] * mul
      }

      return val
    }

    Buffer.prototype.readUInt8 = function readUInt8(offset, noAssert) {
      offset = offset >>> 0
      if (!noAssert) checkOffset(offset, 1, this.length)
      return this[offset]
    }

    Buffer.prototype.readUInt16LE = function readUInt16LE(offset, noAssert) {
      offset = offset >>> 0
      if (!noAssert) checkOffset(offset, 2, this.length)
      return this[offset] | (this[offset + 1] << 8)
    }

    Buffer.prototype.readUInt16BE = function readUInt16BE(offset, noAssert) {
      offset = offset >>> 0
      if (!noAssert) checkOffset(offset, 2, this.length)
      return (this[offset] << 8) | this[offset + 1]
    }

    Buffer.prototype.readUInt32LE = function readUInt32LE(offset, noAssert) {
      offset = offset >>> 0
      if (!noAssert) checkOffset(offset, 4, this.length)

      return ((this[offset]) |
        (this[offset + 1] << 8) |
        (this[offset + 2] << 16)) +
        (this[offset + 3] * 0x1000000)
    }

    Buffer.prototype.readUInt32BE = function readUInt32BE(offset, noAssert) {
      offset = offset >>> 0
      if (!noAssert) checkOffset(offset, 4, this.length)

      return (this[offset] * 0x1000000) +
        ((this[offset + 1] << 16) |
          (this[offset + 2] << 8) |
          this[offset + 3])
    }

    Buffer.prototype.readIntLE = function readIntLE(offset, byteLength, noAssert) {
      offset = offset >>> 0
      byteLength = byteLength >>> 0
      if (!noAssert) checkOffset(offset, byteLength, this.length)

      var val = this[offset]
      var mul = 1
      var i = 0
      while (++i < byteLength && (mul *= 0x100)) {
        val += this[offset + i] * mul
      }
      mul *= 0x80

      if (val >= mul) val -= Math.pow(2, 8 * byteLength)

      return val
    }

    Buffer.prototype.readIntBE = function readIntBE(offset, byteLength, noAssert) {
      offset = offset >>> 0
      byteLength = byteLength >>> 0
      if (!noAssert) checkOffset(offset, byteLength, this.length)

      var i = byteLength
      var mul = 1
      var val = this[offset + --i]
      while (i > 0 && (mul *= 0x100)) {
        val += this[offset + --i] * mul
      }
      mul *= 0x80

      if (val >= mul) val -= Math.pow(2, 8 * byteLength)

      return val
    }

    Buffer.prototype.readInt8 = function readInt8(offset, noAssert) {
      offset = offset >>> 0
      if (!noAssert) checkOffset(offset, 1, this.length)
      if (!(this[offset] & 0x80)) return (this[offset])
      return ((0xff - this[offset] + 1) * -1)
    }

    Buffer.prototype.readInt16LE = function readInt16LE(offset, noAssert) {
      offset = offset >>> 0
      if (!noAssert) checkOffset(offset, 2, this.length)
      var val = this[offset] | (this[offset + 1] << 8)
      return (val & 0x8000) ? val | 0xFFFF0000 : val
    }

    Buffer.prototype.readInt16BE = function readInt16BE(offset, noAssert) {
      offset = offset >>> 0
      if (!noAssert) checkOffset(offset, 2, this.length)
      var val = this[offset + 1] | (this[offset] << 8)
      return (val & 0x8000) ? val | 0xFFFF0000 : val
    }

    Buffer.prototype.readInt32LE = function readInt32LE(offset, noAssert) {
      offset = offset >>> 0
      if (!noAssert) checkOffset(offset, 4, this.length)

      return (this[offset]) |
        (this[offset + 1] << 8) |
        (this[offset + 2] << 16) |
        (this[offset + 3] << 24)
    }

    Buffer.prototype.readInt32BE = function readInt32BE(offset, noAssert) {
      offset = offset >>> 0
      if (!noAssert) checkOffset(offset, 4, this.length)

      return (this[offset] << 24) |
        (this[offset + 1] << 16) |
        (this[offset + 2] << 8) |
        (this[offset + 3])
    }

    Buffer.prototype.readFloatLE = function readFloatLE(offset, noAssert) {
      offset = offset >>> 0
      if (!noAssert) checkOffset(offset, 4, this.length)
      return ieee754.read(this, offset, true, 23, 4)
    }

    Buffer.prototype.readFloatBE = function readFloatBE(offset, noAssert) {
      offset = offset >>> 0
      if (!noAssert) checkOffset(offset, 4, this.length)
      return ieee754.read(this, offset, false, 23, 4)
    }

    Buffer.prototype.readDoubleLE = function readDoubleLE(offset, noAssert) {
      offset = offset >>> 0
      if (!noAssert) checkOffset(offset, 8, this.length)
      return ieee754.read(this, offset, true, 52, 8)
    }

    Buffer.prototype.readDoubleBE = function readDoubleBE(offset, noAssert) {
      offset = offset >>> 0
      if (!noAssert) checkOffset(offset, 8, this.length)
      return ieee754.read(this, offset, false, 52, 8)
    }

    function checkInt(buf, value, offset, ext, max, min) {
      if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
      if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
      if (offset + ext > buf.length) throw new RangeError('Index out of range')
    }

    Buffer.prototype.writeUIntLE = function writeUIntLE(value, offset, byteLength, noAssert) {
      value = +value
      offset = offset >>> 0
      byteLength = byteLength >>> 0
      if (!noAssert) {
        var maxBytes = Math.pow(2, 8 * byteLength) - 1
        checkInt(this, value, offset, byteLength, maxBytes, 0)
      }

      var mul = 1
      var i = 0
      this[offset] = value & 0xFF
      while (++i < byteLength && (mul *= 0x100)) {
        this[offset + i] = (value / mul) & 0xFF
      }

      return offset + byteLength
    }

    Buffer.prototype.writeUIntBE = function writeUIntBE(value, offset, byteLength, noAssert) {
      value = +value
      offset = offset >>> 0
      byteLength = byteLength >>> 0
      if (!noAssert) {
        var maxBytes = Math.pow(2, 8 * byteLength) - 1
        checkInt(this, value, offset, byteLength, maxBytes, 0)
      }

      var i = byteLength - 1
      var mul = 1
      this[offset + i] = value & 0xFF
      while (--i >= 0 && (mul *= 0x100)) {
        this[offset + i] = (value / mul) & 0xFF
      }

      return offset + byteLength
    }

    Buffer.prototype.writeUInt8 = function writeUInt8(value, offset, noAssert) {
      value = +value
      offset = offset >>> 0
      if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
      this[offset] = (value & 0xff)
      return offset + 1
    }

    Buffer.prototype.writeUInt16LE = function writeUInt16LE(value, offset, noAssert) {
      value = +value
      offset = offset >>> 0
      if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
      this[offset] = (value & 0xff)
      this[offset + 1] = (value >>> 8)
      return offset + 2
    }

    Buffer.prototype.writeUInt16BE = function writeUInt16BE(value, offset, noAssert) {
      value = +value
      offset = offset >>> 0
      if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
      this[offset] = (value >>> 8)
      this[offset + 1] = (value & 0xff)
      return offset + 2
    }

    Buffer.prototype.writeUInt32LE = function writeUInt32LE(value, offset, noAssert) {
      value = +value
      offset = offset >>> 0
      if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
      this[offset + 3] = (value >>> 24)
      this[offset + 2] = (value >>> 16)
      this[offset + 1] = (value >>> 8)
      this[offset] = (value & 0xff)
      return offset + 4
    }

    Buffer.prototype.writeUInt32BE = function writeUInt32BE(value, offset, noAssert) {
      value = +value
      offset = offset >>> 0
      if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
      this[offset] = (value >>> 24)
      this[offset + 1] = (value >>> 16)
      this[offset + 2] = (value >>> 8)
      this[offset + 3] = (value & 0xff)
      return offset + 4
    }

    Buffer.prototype.writeIntLE = function writeIntLE(value, offset, byteLength, noAssert) {
      value = +value
      offset = offset >>> 0
      if (!noAssert) {
        var limit = Math.pow(2, (8 * byteLength) - 1)

        checkInt(this, value, offset, byteLength, limit - 1, -limit)
      }

      var i = 0
      var mul = 1
      var sub = 0
      this[offset] = value & 0xFF
      while (++i < byteLength && (mul *= 0x100)) {
        if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
          sub = 1
        }
        this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
      }

      return offset + byteLength
    }

    Buffer.prototype.writeIntBE = function writeIntBE(value, offset, byteLength, noAssert) {
      value = +value
      offset = offset >>> 0
      if (!noAssert) {
        var limit = Math.pow(2, (8 * byteLength) - 1)

        checkInt(this, value, offset, byteLength, limit - 1, -limit)
      }

      var i = byteLength - 1
      var mul = 1
      var sub = 0
      this[offset + i] = value & 0xFF
      while (--i >= 0 && (mul *= 0x100)) {
        if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
          sub = 1
        }
        this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
      }

      return offset + byteLength
    }

    Buffer.prototype.writeInt8 = function writeInt8(value, offset, noAssert) {
      value = +value
      offset = offset >>> 0
      if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
      if (value < 0) value = 0xff + value + 1
      this[offset] = (value & 0xff)
      return offset + 1
    }

    Buffer.prototype.writeInt16LE = function writeInt16LE(value, offset, noAssert) {
      value = +value
      offset = offset >>> 0
      if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
      this[offset] = (value & 0xff)
      this[offset + 1] = (value >>> 8)
      return offset + 2
    }

    Buffer.prototype.writeInt16BE = function writeInt16BE(value, offset, noAssert) {
      value = +value
      offset = offset >>> 0
      if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
      this[offset] = (value >>> 8)
      this[offset + 1] = (value & 0xff)
      return offset + 2
    }

    Buffer.prototype.writeInt32LE = function writeInt32LE(value, offset, noAssert) {
      value = +value
      offset = offset >>> 0
      if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
      this[offset] = (value & 0xff)
      this[offset + 1] = (value >>> 8)
      this[offset + 2] = (value >>> 16)
      this[offset + 3] = (value >>> 24)
      return offset + 4
    }

    Buffer.prototype.writeInt32BE = function writeInt32BE(value, offset, noAssert) {
      value = +value
      offset = offset >>> 0
      if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
      if (value < 0) value = 0xffffffff + value + 1
      this[offset] = (value >>> 24)
      this[offset + 1] = (value >>> 16)
      this[offset + 2] = (value >>> 8)
      this[offset + 3] = (value & 0xff)
      return offset + 4
    }

    function checkIEEE754(buf, value, offset, ext, max, min) {
      if (offset + ext > buf.length) throw new RangeError('Index out of range')
      if (offset < 0) throw new RangeError('Index out of range')
    }

    function writeFloat(buf, value, offset, littleEndian, noAssert) {
      value = +value
      offset = offset >>> 0
      if (!noAssert) {
        checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
      }
      ieee754.write(buf, value, offset, littleEndian, 23, 4)
      return offset + 4
    }

    Buffer.prototype.writeFloatLE = function writeFloatLE(value, offset, noAssert) {
      return writeFloat(this, value, offset, true, noAssert)
    }

    Buffer.prototype.writeFloatBE = function writeFloatBE(value, offset, noAssert) {
      return writeFloat(this, value, offset, false, noAssert)
    }

    function writeDouble(buf, value, offset, littleEndian, noAssert) {
      value = +value
      offset = offset >>> 0
      if (!noAssert) {
        checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
      }
      ieee754.write(buf, value, offset, littleEndian, 52, 8)
      return offset + 8
    }

    Buffer.prototype.writeDoubleLE = function writeDoubleLE(value, offset, noAssert) {
      return writeDouble(this, value, offset, true, noAssert)
    }

    Buffer.prototype.writeDoubleBE = function writeDoubleBE(value, offset, noAssert) {
      return writeDouble(this, value, offset, false, noAssert)
    }

    // copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
    Buffer.prototype.copy = function copy(target, targetStart, start, end) {
      if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
      if (!start) start = 0
      if (!end && end !== 0) end = this.length
      if (targetStart >= target.length) targetStart = target.length
      if (!targetStart) targetStart = 0
      if (end > 0 && end < start) end = start

      // Copy 0 bytes; we're done
      if (end === start) return 0
      if (target.length === 0 || this.length === 0) return 0

      // Fatal error conditions
      if (targetStart < 0) {
        throw new RangeError('targetStart out of bounds')
      }
      if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
      if (end < 0) throw new RangeError('sourceEnd out of bounds')

      // Are we oob?
      if (end > this.length) end = this.length
      if (target.length - targetStart < end - start) {
        end = target.length - targetStart + start
      }

      var len = end - start

      if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
        // Use built-in when available, missing from IE11
        this.copyWithin(targetStart, start, end)
      } else if (this === target && start < targetStart && targetStart < end) {
        // descending copy from end
        for (var i = len - 1; i >= 0; --i) {
          target[i + targetStart] = this[i + start]
        }
      } else {
        Uint8Array.prototype.set.call(
          target,
          this.subarray(start, end),
          targetStart
        )
      }

      return len
    }

    // Usage:
    //    buffer.fill(number[, offset[, end]])
    //    buffer.fill(buffer[, offset[, end]])
    //    buffer.fill(string[, offset[, end]][, encoding])
    Buffer.prototype.fill = function fill(val, start, end, encoding) {
      // Handle string cases:
      if (typeof val === 'string') {
        if (typeof start === 'string') {
          encoding = start
          start = 0
          end = this.length
        } else if (typeof end === 'string') {
          encoding = end
          end = this.length
        }
        if (encoding !== undefined && typeof encoding !== 'string') {
          throw new TypeError('encoding must be a string')
        }
        if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
          throw new TypeError('Unknown encoding: ' + encoding)
        }
        if (val.length === 1) {
          var code = val.charCodeAt(0)
          if ((encoding === 'utf8' && code < 128) ||
            encoding === 'latin1') {
            // Fast path: If `val` fits into a single byte, use that numeric value.
            val = code
          }
        }
      } else if (typeof val === 'number') {
        val = val & 255
      }

      // Invalid ranges are not set to a default, so can range check early.
      if (start < 0 || this.length < start || this.length < end) {
        throw new RangeError('Out of range index')
      }

      if (end <= start) {
        return this
      }

      start = start >>> 0
      end = end === undefined ? this.length : end >>> 0

      if (!val) val = 0

      var i
      if (typeof val === 'number') {
        for (i = start; i < end; ++i) {
          this[i] = val
        }
      } else {
        var bytes = Buffer.isBuffer(val)
          ? val
          : new Buffer(val, encoding)
        var len = bytes.length
        if (len === 0) {
          throw new TypeError('The value "' + val +
            '" is invalid for argument "value"')
        }
        for (i = 0; i < end - start; ++i) {
          this[i + start] = bytes[i % len]
        }
      }

      return this
    }

    // HELPER FUNCTIONS
    // ================

    var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

    function base64clean(str) {
      // Node takes equal signs as end of the Base64 encoding
      str = str.split('=')[0]
      // Node strips out invalid characters like \n and \t from the string, base64-js does not
      str = str.trim().replace(INVALID_BASE64_RE, '')
      // Node converts strings with length < 2 to ''
      if (str.length < 2) return ''
      // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
      while (str.length % 4 !== 0) {
        str = str + '='
      }
      return str
    }

    function toHex(n) {
      if (n < 16) return '0' + n.toString(16)
      return n.toString(16)
    }

    function utf8ToBytes(string, units) {
      units = units || Infinity
      var codePoint
      var length = string.length
      var leadSurrogate = null
      var bytes = []

      for (var i = 0; i < length; ++i) {
        codePoint = string.charCodeAt(i)

        // is surrogate component
        if (codePoint > 0xD7FF && codePoint < 0xE000) {
          // last char was a lead
          if (!leadSurrogate) {
            // no lead yet
            if (codePoint > 0xDBFF) {
              // unexpected trail
              if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
              continue
            } else if (i + 1 === length) {
              // unpaired lead
              if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
              continue
            }

            // valid lead
            leadSurrogate = codePoint

            continue
          }

          // 2 leads in a row
          if (codePoint < 0xDC00) {
            if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
            leadSurrogate = codePoint
            continue
          }

          // valid surrogate pair
          codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
        } else if (leadSurrogate) {
          // valid bmp char, but last char was a lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        }

        leadSurrogate = null

        // encode utf8
        if (codePoint < 0x80) {
          if ((units -= 1) < 0) break
          bytes.push(codePoint)
        } else if (codePoint < 0x800) {
          if ((units -= 2) < 0) break
          bytes.push(
            codePoint >> 0x6 | 0xC0,
            codePoint & 0x3F | 0x80
          )
        } else if (codePoint < 0x10000) {
          if ((units -= 3) < 0) break
          bytes.push(
            codePoint >> 0xC | 0xE0,
            codePoint >> 0x6 & 0x3F | 0x80,
            codePoint & 0x3F | 0x80
          )
        } else if (codePoint < 0x110000) {
          if ((units -= 4) < 0) break
          bytes.push(
            codePoint >> 0x12 | 0xF0,
            codePoint >> 0xC & 0x3F | 0x80,
            codePoint >> 0x6 & 0x3F | 0x80,
            codePoint & 0x3F | 0x80
          )
        } else {
          throw new Error('Invalid code point')
        }
      }

      return bytes
    }

    function asciiToBytes(str) {
      var byteArray = []
      for (var i = 0; i < str.length; ++i) {
        // Node's code seems to be doing this and not & 0x7F..
        byteArray.push(str.charCodeAt(i) & 0xFF)
      }
      return byteArray
    }

    function utf16leToBytes(str, units) {
      var c, hi, lo
      var byteArray = []
      for (var i = 0; i < str.length; ++i) {
        if ((units -= 2) < 0) break

        c = str.charCodeAt(i)
        hi = c >> 8
        lo = c % 256
        byteArray.push(lo)
        byteArray.push(hi)
      }

      return byteArray
    }

    function base64ToBytes(str) {
      return base64.toByteArray(base64clean(str))
    }

    function blitBuffer(src, dst, offset, length) {
      for (var i = 0; i < length; ++i) {
        if ((i + offset >= dst.length) || (i >= src.length)) break
        dst[i + offset] = src[i]
      }
      return i
    }

    // ArrayBuffers from another context (i.e. an iframe) do not pass the `instanceof` check
    // but they should be treated as valid. See: https://github.com/feross/buffer/issues/166
    function isArrayBuffer(obj) {
      return obj instanceof ArrayBuffer ||
        (obj != null && obj.constructor != null && obj.constructor.name === 'ArrayBuffer' &&
          typeof obj.byteLength === 'number')
    }

    function numberIsNaN(obj) {
      return obj !== obj // eslint-disable-line no-self-compare
    }

  }, { "base64-js": 1, "ieee754": 7 }], 4: [function (require, module, exports) {
    module.exports = {
      "100": "Continue",
      "101": "Switching Protocols",
      "102": "Processing",
      "200": "OK",
      "201": "Created",
      "202": "Accepted",
      "203": "Non-Authoritative Information",
      "204": "No Content",
      "205": "Reset Content",
      "206": "Partial Content",
      "207": "Multi-Status",
      "208": "Already Reported",
      "226": "IM Used",
      "300": "Multiple Choices",
      "301": "Moved Permanently",
      "302": "Found",
      "303": "See Other",
      "304": "Not Modified",
      "305": "Use Proxy",
      "307": "Temporary Redirect",
      "308": "Permanent Redirect",
      "400": "Bad Request",
      "401": "Unauthorized",
      "402": "Payment Required",
      "403": "Forbidden",
      "404": "Not Found",
      "405": "Method Not Allowed",
      "406": "Not Acceptable",
      "407": "Proxy Authentication Required",
      "408": "Request Timeout",
      "409": "Conflict",
      "410": "Gone",
      "411": "Length Required",
      "412": "Precondition Failed",
      "413": "Payload Too Large",
      "414": "URI Too Long",
      "415": "Unsupported Media Type",
      "416": "Range Not Satisfiable",
      "417": "Expectation Failed",
      "418": "I'm a teapot",
      "421": "Misdirected Request",
      "422": "Unprocessable Entity",
      "423": "Locked",
      "424": "Failed Dependency",
      "425": "Unordered Collection",
      "426": "Upgrade Required",
      "428": "Precondition Required",
      "429": "Too Many Requests",
      "431": "Request Header Fields Too Large",
      "451": "Unavailable For Legal Reasons",
      "500": "Internal Server Error",
      "501": "Not Implemented",
      "502": "Bad Gateway",
      "503": "Service Unavailable",
      "504": "Gateway Timeout",
      "505": "HTTP Version Not Supported",
      "506": "Variant Also Negotiates",
      "507": "Insufficient Storage",
      "508": "Loop Detected",
      "509": "Bandwidth Limit Exceeded",
      "510": "Not Extended",
      "511": "Network Authentication Required"
    }

  }, {}], 5: [function (require, module, exports) {
    (function (Buffer) {
      // Copyright Joyent, Inc. and other Node contributors.
      //
      // Permission is hereby granted, free of charge, to any person obtaining a
      // copy of this software and associated documentation files (the
      // "Software"), to deal in the Software without restriction, including
      // without limitation the rights to use, copy, modify, merge, publish,
      // distribute, sublicense, and/or sell copies of the Software, and to permit
      // persons to whom the Software is furnished to do so, subject to the
      // following conditions:
      //
      // The above copyright notice and this permission notice shall be included
      // in all copies or substantial portions of the Software.
      //
      // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
      // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
      // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
      // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
      // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
      // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
      // USE OR OTHER DEALINGS IN THE SOFTWARE.

      // NOTE: These type checking functions intentionally don't use `instanceof`
      // because it is fragile and can be easily faked with `Object.create()`.

      function isArray(arg) {
        if (Array.isArray) {
          return Array.isArray(arg);
        }
        return objectToString(arg) === '[object Array]';
      }
      exports.isArray = isArray;

      function isBoolean(arg) {
        return typeof arg === 'boolean';
      }
      exports.isBoolean = isBoolean;

      function isNull(arg) {
        return arg === null;
      }
      exports.isNull = isNull;

      function isNullOrUndefined(arg) {
        return arg == null;
      }
      exports.isNullOrUndefined = isNullOrUndefined;

      function isNumber(arg) {
        return typeof arg === 'number';
      }
      exports.isNumber = isNumber;

      function isString(arg) {
        return typeof arg === 'string';
      }
      exports.isString = isString;

      function isSymbol(arg) {
        return typeof arg === 'symbol';
      }
      exports.isSymbol = isSymbol;

      function isUndefined(arg) {
        return arg === void 0;
      }
      exports.isUndefined = isUndefined;

      function isRegExp(re) {
        return objectToString(re) === '[object RegExp]';
      }
      exports.isRegExp = isRegExp;

      function isObject(arg) {
        return typeof arg === 'object' && arg !== null;
      }
      exports.isObject = isObject;

      function isDate(d) {
        return objectToString(d) === '[object Date]';
      }
      exports.isDate = isDate;

      function isError(e) {
        return (objectToString(e) === '[object Error]' || e instanceof Error);
      }
      exports.isError = isError;

      function isFunction(arg) {
        return typeof arg === 'function';
      }
      exports.isFunction = isFunction;

      function isPrimitive(arg) {
        return arg === null ||
          typeof arg === 'boolean' ||
          typeof arg === 'number' ||
          typeof arg === 'string' ||
          typeof arg === 'symbol' ||  // ES6 symbol
          typeof arg === 'undefined';
      }
      exports.isPrimitive = isPrimitive;

      exports.isBuffer = Buffer.isBuffer;

      function objectToString(o) {
        return Object.prototype.toString.call(o);
      }

    }).call(this, { "isBuffer": require("../../is-buffer/index.js") })
  }, { "../../is-buffer/index.js": 9 }], 6: [function (require, module, exports) {
    // Copyright Joyent, Inc. and other Node contributors.
    //
    // Permission is hereby granted, free of charge, to any person obtaining a
    // copy of this software and associated documentation files (the
    // "Software"), to deal in the Software without restriction, including
    // without limitation the rights to use, copy, modify, merge, publish,
    // distribute, sublicense, and/or sell copies of the Software, and to permit
    // persons to whom the Software is furnished to do so, subject to the
    // following conditions:
    //
    // The above copyright notice and this permission notice shall be included
    // in all copies or substantial portions of the Software.
    //
    // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
    // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
    // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
    // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
    // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
    // USE OR OTHER DEALINGS IN THE SOFTWARE.

    var objectCreate = Object.create || objectCreatePolyfill
    var objectKeys = Object.keys || objectKeysPolyfill
    var bind = Function.prototype.bind || functionBindPolyfill

    function EventEmitter() {
      if (!this._events || !Object.prototype.hasOwnProperty.call(this, '_events')) {
        this._events = objectCreate(null);
        this._eventsCount = 0;
      }

      this._maxListeners = this._maxListeners || undefined;
    }
    module.exports = EventEmitter;

    // Backwards-compat with node 0.10.x
    EventEmitter.EventEmitter = EventEmitter;

    EventEmitter.prototype._events = undefined;
    EventEmitter.prototype._maxListeners = undefined;

    // By default EventEmitters will print a warning if more than 10 listeners are
    // added to it. This is a useful default which helps finding memory leaks.
    var defaultMaxListeners = 10;

    var hasDefineProperty;
    try {
      var o = {};
      if (Object.defineProperty) Object.defineProperty(o, 'x', { value: 0 });
      hasDefineProperty = o.x === 0;
    } catch (err) { hasDefineProperty = false }
    if (hasDefineProperty) {
      Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
        enumerable: true,
        get: function () {
          return defaultMaxListeners;
        },
        set: function (arg) {
          // check whether the input is a positive number (whose value is zero or
          // greater and not a NaN).
          if (typeof arg !== 'number' || arg < 0 || arg !== arg)
            throw new TypeError('"defaultMaxListeners" must be a positive number');
          defaultMaxListeners = arg;
        }
      });
    } else {
      EventEmitter.defaultMaxListeners = defaultMaxListeners;
    }

    // Obviously not all Emitters should be limited to 10. This function allows
    // that to be increased. Set to zero for unlimited.
    EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
      if (typeof n !== 'number' || n < 0 || isNaN(n))
        throw new TypeError('"n" argument must be a positive number');
      this._maxListeners = n;
      return this;
    };

    function $getMaxListeners(that) {
      if (that._maxListeners === undefined)
        return EventEmitter.defaultMaxListeners;
      return that._maxListeners;
    }

    EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
      return $getMaxListeners(this);
    };

    // These standalone emit* functions are used to optimize calling of event
    // handlers for fast cases because emit() itself often has a variable number of
    // arguments and can be deoptimized because of that. These functions always have
    // the same number of arguments and thus do not get deoptimized, so the code
    // inside them can execute faster.
    function emitNone(handler, isFn, self) {
      if (isFn)
        handler.call(self);
      else {
        var len = handler.length;
        var listeners = arrayClone(handler, len);
        for (var i = 0; i < len; ++i)
          listeners[i].call(self);
      }
    }
    function emitOne(handler, isFn, self, arg1) {
      if (isFn)
        handler.call(self, arg1);
      else {
        var len = handler.length;
        var listeners = arrayClone(handler, len);
        for (var i = 0; i < len; ++i)
          listeners[i].call(self, arg1);
      }
    }
    function emitTwo(handler, isFn, self, arg1, arg2) {
      if (isFn)
        handler.call(self, arg1, arg2);
      else {
        var len = handler.length;
        var listeners = arrayClone(handler, len);
        for (var i = 0; i < len; ++i)
          listeners[i].call(self, arg1, arg2);
      }
    }
    function emitThree(handler, isFn, self, arg1, arg2, arg3) {
      if (isFn)
        handler.call(self, arg1, arg2, arg3);
      else {
        var len = handler.length;
        var listeners = arrayClone(handler, len);
        for (var i = 0; i < len; ++i)
          listeners[i].call(self, arg1, arg2, arg3);
      }
    }

    function emitMany(handler, isFn, self, args) {
      if (isFn)
        handler.apply(self, args);
      else {
        var len = handler.length;
        var listeners = arrayClone(handler, len);
        for (var i = 0; i < len; ++i)
          listeners[i].apply(self, args);
      }
    }

    EventEmitter.prototype.emit = function emit(type) {
      var er, handler, len, args, i, events;
      var doError = (type === 'error');

      events = this._events;
      if (events)
        doError = (doError && events.error == null);
      else if (!doError)
        return false;

      // If there is no 'error' event listener then throw.
      if (doError) {
        if (arguments.length > 1)
          er = arguments[1];
        if (er instanceof Error) {
          throw er; // Unhandled 'error' event
        } else {
          // At least give some kind of context to the user
          var err = new Error('Unhandled "error" event. (' + er + ')');
          err.context = er;
          throw err;
        }
        return false;
      }

      handler = events[type];

      if (!handler)
        return false;

      var isFn = typeof handler === 'function';
      len = arguments.length;
      switch (len) {
        // fast cases
        case 1:
          emitNone(handler, isFn, this);
          break;
        case 2:
          emitOne(handler, isFn, this, arguments[1]);
          break;
        case 3:
          emitTwo(handler, isFn, this, arguments[1], arguments[2]);
          break;
        case 4:
          emitThree(handler, isFn, this, arguments[1], arguments[2], arguments[3]);
          break;
        // slower
        default:
          args = new Array(len - 1);
          for (i = 1; i < len; i++)
            args[i - 1] = arguments[i];
          emitMany(handler, isFn, this, args);
      }

      return true;
    };

    function _addListener(target, type, listener, prepend) {
      var m;
      var events;
      var existing;

      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');

      events = target._events;
      if (!events) {
        events = target._events = objectCreate(null);
        target._eventsCount = 0;
      } else {
        // To avoid recursion in the case that type === "newListener"! Before
        // adding it to the listeners, first emit "newListener".
        if (events.newListener) {
          target.emit('newListener', type,
            listener.listener ? listener.listener : listener);

          // Re-assign `events` because a newListener handler could have caused the
          // this._events to be assigned to a new object
          events = target._events;
        }
        existing = events[type];
      }

      if (!existing) {
        // Optimize the case of one listener. Don't need the extra array object.
        existing = events[type] = listener;
        ++target._eventsCount;
      } else {
        if (typeof existing === 'function') {
          // Adding the second element, need to change to array.
          existing = events[type] =
            prepend ? [listener, existing] : [existing, listener];
        } else {
          // If we've already got an array, just append.
          if (prepend) {
            existing.unshift(listener);
          } else {
            existing.push(listener);
          }
        }

        // Check for listener leak
        if (!existing.warned) {
          m = $getMaxListeners(target);
          if (m && m > 0 && existing.length > m) {
            existing.warned = true;
            var w = new Error('Possible EventEmitter memory leak detected. ' +
              existing.length + ' "' + String(type) + '" listeners ' +
              'added. Use emitter.setMaxListeners() to ' +
              'increase limit.');
            w.name = 'MaxListenersExceededWarning';
            w.emitter = target;
            w.type = type;
            w.count = existing.length;
            if (typeof console === 'object' && console.warn) {
              console.warn('%s: %s', w.name, w.message);
            }
          }
        }
      }

      return target;
    }

    EventEmitter.prototype.addListener = function addListener(type, listener) {
      return _addListener(this, type, listener, false);
    };

    EventEmitter.prototype.on = EventEmitter.prototype.addListener;

    EventEmitter.prototype.prependListener =
      function prependListener(type, listener) {
        return _addListener(this, type, listener, true);
      };

    function onceWrapper() {
      if (!this.fired) {
        this.target.removeListener(this.type, this.wrapFn);
        this.fired = true;
        switch (arguments.length) {
          case 0:
            return this.listener.call(this.target);
          case 1:
            return this.listener.call(this.target, arguments[0]);
          case 2:
            return this.listener.call(this.target, arguments[0], arguments[1]);
          case 3:
            return this.listener.call(this.target, arguments[0], arguments[1],
              arguments[2]);
          default:
            var args = new Array(arguments.length);
            for (var i = 0; i < args.length; ++i)
              args[i] = arguments[i];
            this.listener.apply(this.target, args);
        }
      }
    }

    function _onceWrap(target, type, listener) {
      var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
      var wrapped = bind.call(onceWrapper, state);
      wrapped.listener = listener;
      state.wrapFn = wrapped;
      return wrapped;
    }

    EventEmitter.prototype.once = function once(type, listener) {
      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');
      this.on(type, _onceWrap(this, type, listener));
      return this;
    };

    EventEmitter.prototype.prependOnceListener =
      function prependOnceListener(type, listener) {
        if (typeof listener !== 'function')
          throw new TypeError('"listener" argument must be a function');
        this.prependListener(type, _onceWrap(this, type, listener));
        return this;
      };

    // Emits a 'removeListener' event if and only if the listener was removed.
    EventEmitter.prototype.removeListener =
      function removeListener(type, listener) {
        var list, events, position, i, originalListener;

        if (typeof listener !== 'function')
          throw new TypeError('"listener" argument must be a function');

        events = this._events;
        if (!events)
          return this;

        list = events[type];
        if (!list)
          return this;

        if (list === listener || list.listener === listener) {
          if (--this._eventsCount === 0)
            this._events = objectCreate(null);
          else {
            delete events[type];
            if (events.removeListener)
              this.emit('removeListener', type, list.listener || listener);
          }
        } else if (typeof list !== 'function') {
          position = -1;

          for (i = list.length - 1; i >= 0; i--) {
            if (list[i] === listener || list[i].listener === listener) {
              originalListener = list[i].listener;
              position = i;
              break;
            }
          }

          if (position < 0)
            return this;

          if (position === 0)
            list.shift();
          else
            spliceOne(list, position);

          if (list.length === 1)
            events[type] = list[0];

          if (events.removeListener)
            this.emit('removeListener', type, originalListener || listener);
        }

        return this;
      };

    EventEmitter.prototype.removeAllListeners =
      function removeAllListeners(type) {
        var listeners, events, i;

        events = this._events;
        if (!events)
          return this;

        // not listening for removeListener, no need to emit
        if (!events.removeListener) {
          if (arguments.length === 0) {
            this._events = objectCreate(null);
            this._eventsCount = 0;
          } else if (events[type]) {
            if (--this._eventsCount === 0)
              this._events = objectCreate(null);
            else
              delete events[type];
          }
          return this;
        }

        // emit removeListener for all listeners on all events
        if (arguments.length === 0) {
          var keys = objectKeys(events);
          var key;
          for (i = 0; i < keys.length; ++i) {
            key = keys[i];
            if (key === 'removeListener') continue;
            this.removeAllListeners(key);
          }
          this.removeAllListeners('removeListener');
          this._events = objectCreate(null);
          this._eventsCount = 0;
          return this;
        }

        listeners = events[type];

        if (typeof listeners === 'function') {
          this.removeListener(type, listeners);
        } else if (listeners) {
          // LIFO order
          for (i = listeners.length - 1; i >= 0; i--) {
            this.removeListener(type, listeners[i]);
          }
        }

        return this;
      };

    EventEmitter.prototype.listeners = function listeners(type) {
      var evlistener;
      var ret;
      var events = this._events;

      if (!events)
        ret = [];
      else {
        evlistener = events[type];
        if (!evlistener)
          ret = [];
        else if (typeof evlistener === 'function')
          ret = [evlistener.listener || evlistener];
        else
          ret = unwrapListeners(evlistener);
      }

      return ret;
    };

    EventEmitter.listenerCount = function (emitter, type) {
      if (typeof emitter.listenerCount === 'function') {
        return emitter.listenerCount(type);
      } else {
        return listenerCount.call(emitter, type);
      }
    };

    EventEmitter.prototype.listenerCount = listenerCount;
    function listenerCount(type) {
      var events = this._events;

      if (events) {
        var evlistener = events[type];

        if (typeof evlistener === 'function') {
          return 1;
        } else if (evlistener) {
          return evlistener.length;
        }
      }

      return 0;
    }

    EventEmitter.prototype.eventNames = function eventNames() {
      return this._eventsCount > 0 ? Reflect.ownKeys(this._events) : [];
    };

    // About 1.5x faster than the two-arg version of Array#splice().
    function spliceOne(list, index) {
      for (var i = index, k = i + 1, n = list.length; k < n; i += 1, k += 1)
        list[i] = list[k];
      list.pop();
    }

    function arrayClone(arr, n) {
      var copy = new Array(n);
      for (var i = 0; i < n; ++i)
        copy[i] = arr[i];
      return copy;
    }

    function unwrapListeners(arr) {
      var ret = new Array(arr.length);
      for (var i = 0; i < ret.length; ++i) {
        ret[i] = arr[i].listener || arr[i];
      }
      return ret;
    }

    function objectCreatePolyfill(proto) {
      var F = function () { };
      F.prototype = proto;
      return new F;
    }
    function objectKeysPolyfill(obj) {
      var keys = [];
      for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k)) {
        keys.push(k);
      }
      return k;
    }
    function functionBindPolyfill(context) {
      var fn = this;
      return function () {
        return fn.apply(context, arguments);
      };
    }

  }, {}], 7: [function (require, module, exports) {
    exports.read = function (buffer, offset, isLE, mLen, nBytes) {
      var e, m
      var eLen = (nBytes * 8) - mLen - 1
      var eMax = (1 << eLen) - 1
      var eBias = eMax >> 1
      var nBits = -7
      var i = isLE ? (nBytes - 1) : 0
      var d = isLE ? -1 : 1
      var s = buffer[offset + i]

      i += d

      e = s & ((1 << (-nBits)) - 1)
      s >>= (-nBits)
      nBits += eLen
      for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) { }

      m = e & ((1 << (-nBits)) - 1)
      e >>= (-nBits)
      nBits += mLen
      for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) { }

      if (e === 0) {
        e = 1 - eBias
      } else if (e === eMax) {
        return m ? NaN : ((s ? -1 : 1) * Infinity)
      } else {
        m = m + Math.pow(2, mLen)
        e = e - eBias
      }
      return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
    }

    exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
      var e, m, c
      var eLen = (nBytes * 8) - mLen - 1
      var eMax = (1 << eLen) - 1
      var eBias = eMax >> 1
      var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
      var i = isLE ? 0 : (nBytes - 1)
      var d = isLE ? 1 : -1
      var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

      value = Math.abs(value)

      if (isNaN(value) || value === Infinity) {
        m = isNaN(value) ? 1 : 0
        e = eMax
      } else {
        e = Math.floor(Math.log(value) / Math.LN2)
        if (value * (c = Math.pow(2, -e)) < 1) {
          e--
          c *= 2
        }
        if (e + eBias >= 1) {
          value += rt / c
        } else {
          value += rt * Math.pow(2, 1 - eBias)
        }
        if (value * c >= 2) {
          e++
          c /= 2
        }

        if (e + eBias >= eMax) {
          m = 0
          e = eMax
        } else if (e + eBias >= 1) {
          m = ((value * c) - 1) * Math.pow(2, mLen)
          e = e + eBias
        } else {
          m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
          e = 0
        }
      }

      for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) { }

      e = (e << mLen) | m
      eLen += mLen
      for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) { }

      buffer[offset + i - d] |= s * 128
    }

  }, {}], 8: [function (require, module, exports) {
    if (typeof Object.create === 'function') {
      // implementation from standard node.js 'util' module
      module.exports = function inherits(ctor, superCtor) {
        ctor.super_ = superCtor
        ctor.prototype = Object.create(superCtor.prototype, {
          constructor: {
            value: ctor,
            enumerable: false,
            writable: true,
            configurable: true
          }
        });
      };
    } else {
      // old school shim for old browsers
      module.exports = function inherits(ctor, superCtor) {
        ctor.super_ = superCtor
        var TempCtor = function () { }
        TempCtor.prototype = superCtor.prototype
        ctor.prototype = new TempCtor()
        ctor.prototype.constructor = ctor
      }
    }

  }, {}], 9: [function (require, module, exports) {
    /*!
     * Determine if an object is a Buffer
     *
     * @author   Feross Aboukhadijeh <https://feross.org>
     * @license  MIT
     */

    // The _isBuffer check is for Safari 5-7 support, because it's missing
    // Object.prototype.constructor. Remove this eventually
    module.exports = function (obj) {
      return obj != null && (isBuffer(obj) || isSlowBuffer(obj) || !!obj._isBuffer)
    }

    function isBuffer(obj) {
      return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
    }

    // For Node v0.10 support. Remove this eventually.
    function isSlowBuffer(obj) {
      return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isBuffer(obj.slice(0, 0))
    }

  }, {}], 10: [function (require, module, exports) {
    var toString = {}.toString;

    module.exports = Array.isArray || function (arr) {
      return toString.call(arr) == '[object Array]';
    };

  }, {}], 11: [function (require, module, exports) {
    (function (process) {
      'use strict';

      if (!process.version ||
        process.version.indexOf('v0.') === 0 ||
        process.version.indexOf('v1.') === 0 && process.version.indexOf('v1.8.') !== 0) {
        module.exports = { nextTick: nextTick };
      } else {
        module.exports = process
      }

      function nextTick(fn, arg1, arg2, arg3) {
        if (typeof fn !== 'function') {
          throw new TypeError('"callback" argument must be a function');
        }
        var len = arguments.length;
        var args, i;
        switch (len) {
          case 0:
          case 1:
            return process.nextTick(fn);
          case 2:
            return process.nextTick(function afterTickOne() {
              fn.call(null, arg1);
            });
          case 3:
            return process.nextTick(function afterTickTwo() {
              fn.call(null, arg1, arg2);
            });
          case 4:
            return process.nextTick(function afterTickThree() {
              fn.call(null, arg1, arg2, arg3);
            });
          default:
            args = new Array(len - 1);
            i = 0;
            while (i < args.length) {
              args[i++] = arguments[i];
            }
            return process.nextTick(function afterTick() {
              fn.apply(null, args);
            });
        }
      }


    }).call(this, require('_process'))
  }, { "_process": 12 }], 12: [function (require, module, exports) {
    // shim for using process in browser
    var process = module.exports = {};

    // cached from whatever global is present so that test runners that stub it
    // don't break things.  But we need to wrap it in a try catch in case it is
    // wrapped in strict mode code which doesn't define any globals.  It's inside a
    // function because try/catches deoptimize in certain engines.

    var cachedSetTimeout;
    var cachedClearTimeout;

    function defaultSetTimout() {
      throw new Error('setTimeout has not been defined');
    }
    function defaultClearTimeout() {
      throw new Error('clearTimeout has not been defined');
    }
    (function () {
      try {
        if (typeof setTimeout === 'function') {
          cachedSetTimeout = setTimeout;
        } else {
          cachedSetTimeout = defaultSetTimout;
        }
      } catch (e) {
        cachedSetTimeout = defaultSetTimout;
      }
      try {
        if (typeof clearTimeout === 'function') {
          cachedClearTimeout = clearTimeout;
        } else {
          cachedClearTimeout = defaultClearTimeout;
        }
      } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
      }
    }())
    function runTimeout(fun) {
      if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
      }
      // if setTimeout wasn't available but was latter defined
      if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
      }
      try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
      } catch (e) {
        try {
          // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
          return cachedSetTimeout.call(null, fun, 0);
        } catch (e) {
          // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
          return cachedSetTimeout.call(this, fun, 0);
        }
      }


    }
    function runClearTimeout(marker) {
      if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
      }
      // if clearTimeout wasn't available but was latter defined
      if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
      }
      try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
      } catch (e) {
        try {
          // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
          return cachedClearTimeout.call(null, marker);
        } catch (e) {
          // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
          // Some versions of I.E. have different rules for clearTimeout vs setTimeout
          return cachedClearTimeout.call(this, marker);
        }
      }



    }
    var queue = [];
    var draining = false;
    var currentQueue;
    var queueIndex = -1;

    function cleanUpNextTick() {
      if (!draining || !currentQueue) {
        return;
      }
      draining = false;
      if (currentQueue.length) {
        queue = currentQueue.concat(queue);
      } else {
        queueIndex = -1;
      }
      if (queue.length) {
        drainQueue();
      }
    }

    function drainQueue() {
      if (draining) {
        return;
      }
      var timeout = runTimeout(cleanUpNextTick);
      draining = true;

      var len = queue.length;
      while (len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
          if (currentQueue) {
            currentQueue[queueIndex].run();
          }
        }
        queueIndex = -1;
        len = queue.length;
      }
      currentQueue = null;
      draining = false;
      runClearTimeout(timeout);
    }

    process.nextTick = function (fun) {
      var args = new Array(arguments.length - 1);
      if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
          args[i - 1] = arguments[i];
        }
      }
      queue.push(new Item(fun, args));
      if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
      }
    };

    // v8 likes predictible objects
    function Item(fun, array) {
      this.fun = fun;
      this.array = array;
    }
    Item.prototype.run = function () {
      this.fun.apply(null, this.array);
    };
    process.title = 'browser';
    process.browser = true;
    process.env = {};
    process.argv = [];
    process.version = ''; // empty string to avoid regexp issues
    process.versions = {};

    function noop() { }

    process.on = noop;
    process.addListener = noop;
    process.once = noop;
    process.off = noop;
    process.removeListener = noop;
    process.removeAllListeners = noop;
    process.emit = noop;
    process.prependListener = noop;
    process.prependOnceListener = noop;

    process.listeners = function (name) { return [] }

    process.binding = function (name) {
      throw new Error('process.binding is not supported');
    };

    process.cwd = function () { return '/' };
    process.chdir = function (dir) {
      throw new Error('process.chdir is not supported');
    };
    process.umask = function () { return 0; };

  }, {}], 13: [function (require, module, exports) {
    (function (global) {
      /*! https://mths.be/punycode v1.4.1 by @mathias */
      ; (function (root) {

        /** Detect free variables */
        var freeExports = typeof exports == 'object' && exports &&
          !exports.nodeType && exports;
        var freeModule = typeof module == 'object' && module &&
          !module.nodeType && module;
        var freeGlobal = typeof global == 'object' && global;
        if (
          freeGlobal.global === freeGlobal ||
          freeGlobal.window === freeGlobal ||
          freeGlobal.self === freeGlobal
        ) {
          root = freeGlobal;
        }

        /**
         * The `punycode` object.
         * @name punycode
         * @type Object
         */
        var punycode,

          /** Highest positive signed 32-bit float value */
          maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1

          /** Bootstring parameters */
          base = 36,
          tMin = 1,
          tMax = 26,
          skew = 38,
          damp = 700,
          initialBias = 72,
          initialN = 128, // 0x80
          delimiter = '-', // '\x2D'

          /** Regular expressions */
          regexPunycode = /^xn--/,
          regexNonASCII = /[^\x20-\x7E]/, // unprintable ASCII chars + non-ASCII chars
          regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, // RFC 3490 separators

          /** Error messages */
          errors = {
            'overflow': 'Overflow: input needs wider integers to process',
            'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
            'invalid-input': 'Invalid input'
          },

          /** Convenience shortcuts */
          baseMinusTMin = base - tMin,
          floor = Math.floor,
          stringFromCharCode = String.fromCharCode,

          /** Temporary variable */
          key;

        /*--------------------------------------------------------------------------*/

        /**
         * A generic error utility function.
         * @private
         * @param {String} type The error type.
         * @returns {Error} Throws a `RangeError` with the applicable error message.
         */
        function error(type) {
          throw new RangeError(errors[type]);
        }

        /**
         * A generic `Array#map` utility function.
         * @private
         * @param {Array} array The array to iterate over.
         * @param {Function} callback The function that gets called for every array
         * item.
         * @returns {Array} A new array of values returned by the callback function.
         */
        function map(array, fn) {
          var length = array.length;
          var result = [];
          while (length--) {
            result[length] = fn(array[length]);
          }
          return result;
        }

        /**
         * A simple `Array#map`-like wrapper to work with domain name strings or email
         * addresses.
         * @private
         * @param {String} domain The domain name or email address.
         * @param {Function} callback The function that gets called for every
         * character.
         * @returns {Array} A new string of characters returned by the callback
         * function.
         */
        function mapDomain(string, fn) {
          var parts = string.split('@');
          var result = '';
          if (parts.length > 1) {
            // In email addresses, only the domain name should be punycoded. Leave
            // the local part (i.e. everything up to `@`) intact.
            result = parts[0] + '@';
            string = parts[1];
          }
          // Avoid `split(regex)` for IE8 compatibility. See #17.
          string = string.replace(regexSeparators, '\x2E');
          var labels = string.split('.');
          var encoded = map(labels, fn).join('.');
          return result + encoded;
        }

        /**
         * Creates an array containing the numeric code points of each Unicode
         * character in the string. While JavaScript uses UCS-2 internally,
         * this function will convert a pair of surrogate halves (each of which
         * UCS-2 exposes as separate characters) into a single code point,
         * matching UTF-16.
         * @see `punycode.ucs2.encode`
         * @see <https://mathiasbynens.be/notes/javascript-encoding>
         * @memberOf punycode.ucs2
         * @name decode
         * @param {String} string The Unicode input string (UCS-2).
         * @returns {Array} The new array of code points.
         */
        function ucs2decode(string) {
          var output = [],
            counter = 0,
            length = string.length,
            value,
            extra;
          while (counter < length) {
            value = string.charCodeAt(counter++);
            if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
              // high surrogate, and there is a next character
              extra = string.charCodeAt(counter++);
              if ((extra & 0xFC00) == 0xDC00) { // low surrogate
                output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
              } else {
                // unmatched surrogate; only append this code unit, in case the next
                // code unit is the high surrogate of a surrogate pair
                output.push(value);
                counter--;
              }
            } else {
              output.push(value);
            }
          }
          return output;
        }

        /**
         * Creates a string based on an array of numeric code points.
         * @see `punycode.ucs2.decode`
         * @memberOf punycode.ucs2
         * @name encode
         * @param {Array} codePoints The array of numeric code points.
         * @returns {String} The new Unicode string (UCS-2).
         */
        function ucs2encode(array) {
          return map(array, function (value) {
            var output = '';
            if (value > 0xFFFF) {
              value -= 0x10000;
              output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
              value = 0xDC00 | value & 0x3FF;
            }
            output += stringFromCharCode(value);
            return output;
          }).join('');
        }

        /**
         * Converts a basic code point into a digit/integer.
         * @see `digitToBasic()`
         * @private
         * @param {Number} codePoint The basic numeric code point value.
         * @returns {Number} The numeric value of a basic code point (for use in
         * representing integers) in the range `0` to `base - 1`, or `base` if
         * the code point does not represent a value.
         */
        function basicToDigit(codePoint) {
          if (codePoint - 48 < 10) {
            return codePoint - 22;
          }
          if (codePoint - 65 < 26) {
            return codePoint - 65;
          }
          if (codePoint - 97 < 26) {
            return codePoint - 97;
          }
          return base;
        }

        /**
         * Converts a digit/integer into a basic code point.
         * @see `basicToDigit()`
         * @private
         * @param {Number} digit The numeric value of a basic code point.
         * @returns {Number} The basic code point whose value (when used for
         * representing integers) is `digit`, which needs to be in the range
         * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
         * used; else, the lowercase form is used. The behavior is undefined
         * if `flag` is non-zero and `digit` has no uppercase form.
         */
        function digitToBasic(digit, flag) {
          //  0..25 map to ASCII a..z or A..Z
          // 26..35 map to ASCII 0..9
          return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
        }

        /**
         * Bias adaptation function as per section 3.4 of RFC 3492.
         * https://tools.ietf.org/html/rfc3492#section-3.4
         * @private
         */
        function adapt(delta, numPoints, firstTime) {
          var k = 0;
          delta = firstTime ? floor(delta / damp) : delta >> 1;
          delta += floor(delta / numPoints);
          for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
            delta = floor(delta / baseMinusTMin);
          }
          return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
        }

        /**
         * Converts a Punycode string of ASCII-only symbols to a string of Unicode
         * symbols.
         * @memberOf punycode
         * @param {String} input The Punycode string of ASCII-only symbols.
         * @returns {String} The resulting string of Unicode symbols.
         */
        function decode(input) {
          // Don't use UCS-2
          var output = [],
            inputLength = input.length,
            out,
            i = 0,
            n = initialN,
            bias = initialBias,
            basic,
            j,
            index,
            oldi,
            w,
            k,
            digit,
            t,
            /** Cached calculation results */
            baseMinusT;

          // Handle the basic code points: let `basic` be the number of input code
          // points before the last delimiter, or `0` if there is none, then copy
          // the first basic code points to the output.

          basic = input.lastIndexOf(delimiter);
          if (basic < 0) {
            basic = 0;
          }

          for (j = 0; j < basic; ++j) {
            // if it's not a basic code point
            if (input.charCodeAt(j) >= 0x80) {
              error('not-basic');
            }
            output.push(input.charCodeAt(j));
          }

          // Main decoding loop: start just after the last delimiter if any basic code
          // points were copied; start at the beginning otherwise.

          for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {

            // `index` is the index of the next character to be consumed.
            // Decode a generalized variable-length integer into `delta`,
            // which gets added to `i`. The overflow checking is easier
            // if we increase `i` as we go, then subtract off its starting
            // value at the end to obtain `delta`.
            for (oldi = i, w = 1, k = base; /* no condition */; k += base) {

              if (index >= inputLength) {
                error('invalid-input');
              }

              digit = basicToDigit(input.charCodeAt(index++));

              if (digit >= base || digit > floor((maxInt - i) / w)) {
                error('overflow');
              }

              i += digit * w;
              t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

              if (digit < t) {
                break;
              }

              baseMinusT = base - t;
              if (w > floor(maxInt / baseMinusT)) {
                error('overflow');
              }

              w *= baseMinusT;

            }

            out = output.length + 1;
            bias = adapt(i - oldi, out, oldi == 0);

            // `i` was supposed to wrap around from `out` to `0`,
            // incrementing `n` each time, so we'll fix that now:
            if (floor(i / out) > maxInt - n) {
              error('overflow');
            }

            n += floor(i / out);
            i %= out;

            // Insert `n` at position `i` of the output
            output.splice(i++, 0, n);

          }

          return ucs2encode(output);
        }

        /**
         * Converts a string of Unicode symbols (e.g. a domain name label) to a
         * Punycode string of ASCII-only symbols.
         * @memberOf punycode
         * @param {String} input The string of Unicode symbols.
         * @returns {String} The resulting Punycode string of ASCII-only symbols.
         */
        function encode(input) {
          var n,
            delta,
            handledCPCount,
            basicLength,
            bias,
            j,
            m,
            q,
            k,
            t,
            currentValue,
            output = [],
            /** `inputLength` will hold the number of code points in `input`. */
            inputLength,
            /** Cached calculation results */
            handledCPCountPlusOne,
            baseMinusT,
            qMinusT;

          // Convert the input in UCS-2 to Unicode
          input = ucs2decode(input);

          // Cache the length
          inputLength = input.length;

          // Initialize the state
          n = initialN;
          delta = 0;
          bias = initialBias;

          // Handle the basic code points
          for (j = 0; j < inputLength; ++j) {
            currentValue = input[j];
            if (currentValue < 0x80) {
              output.push(stringFromCharCode(currentValue));
            }
          }

          handledCPCount = basicLength = output.length;

          // `handledCPCount` is the number of code points that have been handled;
          // `basicLength` is the number of basic code points.

          // Finish the basic string - if it is not empty - with a delimiter
          if (basicLength) {
            output.push(delimiter);
          }

          // Main encoding loop:
          while (handledCPCount < inputLength) {

            // All non-basic code points < n have been handled already. Find the next
            // larger one:
            for (m = maxInt, j = 0; j < inputLength; ++j) {
              currentValue = input[j];
              if (currentValue >= n && currentValue < m) {
                m = currentValue;
              }
            }

            // Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
            // but guard against overflow
            handledCPCountPlusOne = handledCPCount + 1;
            if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
              error('overflow');
            }

            delta += (m - n) * handledCPCountPlusOne;
            n = m;

            for (j = 0; j < inputLength; ++j) {
              currentValue = input[j];

              if (currentValue < n && ++delta > maxInt) {
                error('overflow');
              }

              if (currentValue == n) {
                // Represent delta as a generalized variable-length integer
                for (q = delta, k = base; /* no condition */; k += base) {
                  t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
                  if (q < t) {
                    break;
                  }
                  qMinusT = q - t;
                  baseMinusT = base - t;
                  output.push(
                    stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
                  );
                  q = floor(qMinusT / baseMinusT);
                }

                output.push(stringFromCharCode(digitToBasic(q, 0)));
                bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
                delta = 0;
                ++handledCPCount;
              }
            }

            ++delta;
            ++n;

          }
          return output.join('');
        }

        /**
         * Converts a Punycode string representing a domain name or an email address
         * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
         * it doesn't matter if you call it on a string that has already been
         * converted to Unicode.
         * @memberOf punycode
         * @param {String} input The Punycoded domain name or email address to
         * convert to Unicode.
         * @returns {String} The Unicode representation of the given Punycode
         * string.
         */
        function toUnicode(input) {
          return mapDomain(input, function (string) {
            return regexPunycode.test(string)
              ? decode(string.slice(4).toLowerCase())
              : string;
          });
        }

        /**
         * Converts a Unicode string representing a domain name or an email address to
         * Punycode. Only the non-ASCII parts of the domain name will be converted,
         * i.e. it doesn't matter if you call it with a domain that's already in
         * ASCII.
         * @memberOf punycode
         * @param {String} input The domain name or email address to convert, as a
         * Unicode string.
         * @returns {String} The Punycode representation of the given domain name or
         * email address.
         */
        function toASCII(input) {
          return mapDomain(input, function (string) {
            return regexNonASCII.test(string)
              ? 'xn--' + encode(string)
              : string;
          });
        }

        /*--------------------------------------------------------------------------*/

        /** Define the public API */
        punycode = {
          /**
           * A string representing the current Punycode.js version number.
           * @memberOf punycode
           * @type String
           */
          'version': '1.4.1',
          /**
           * An object of methods to convert from JavaScript's internal character
           * representation (UCS-2) to Unicode code points, and back.
           * @see <https://mathiasbynens.be/notes/javascript-encoding>
           * @memberOf punycode
           * @type Object
           */
          'ucs2': {
            'decode': ucs2decode,
            'encode': ucs2encode
          },
          'decode': decode,
          'encode': encode,
          'toASCII': toASCII,
          'toUnicode': toUnicode
        };

        /** Expose `punycode` */
        // Some AMD build optimizers, like r.js, check for specific condition patterns
        // like the following:
        if (
          typeof define == 'function' &&
          typeof define.amd == 'object' &&
          define.amd
        ) {
          define('punycode', function () {
            return punycode;
          });
        } else if (freeExports && freeModule) {
          if (module.exports == freeExports) {
            // in Node.js, io.js, or RingoJS v0.8.0+
            freeModule.exports = punycode;
          } else {
            // in Narwhal or RingoJS v0.7.0-
            for (key in punycode) {
              punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
            }
          }
        } else {
          // in Rhino or a web browser
          root.punycode = punycode;
        }

      }(this));

    }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
  }, {}], 14: [function (require, module, exports) {
    // Copyright Joyent, Inc. and other Node contributors.
    //
    // Permission is hereby granted, free of charge, to any person obtaining a
    // copy of this software and associated documentation files (the
    // "Software"), to deal in the Software without restriction, including
    // without limitation the rights to use, copy, modify, merge, publish,
    // distribute, sublicense, and/or sell copies of the Software, and to permit
    // persons to whom the Software is furnished to do so, subject to the
    // following conditions:
    //
    // The above copyright notice and this permission notice shall be included
    // in all copies or substantial portions of the Software.
    //
    // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
    // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
    // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
    // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
    // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
    // USE OR OTHER DEALINGS IN THE SOFTWARE.

    'use strict';

    // If obj.hasOwnProperty has been overridden, then calling
    // obj.hasOwnProperty(prop) will break.
    // See: https://github.com/joyent/node/issues/1707
    function hasOwnProperty(obj, prop) {
      return Object.prototype.hasOwnProperty.call(obj, prop);
    }

    module.exports = function (qs, sep, eq, options) {
      sep = sep || '&';
      eq = eq || '=';
      var obj = {};

      if (typeof qs !== 'string' || qs.length === 0) {
        return obj;
      }

      var regexp = /\+/g;
      qs = qs.split(sep);

      var maxKeys = 1000;
      if (options && typeof options.maxKeys === 'number') {
        maxKeys = options.maxKeys;
      }

      var len = qs.length;
      // maxKeys <= 0 means that we should not limit keys count
      if (maxKeys > 0 && len > maxKeys) {
        len = maxKeys;
      }

      for (var i = 0; i < len; ++i) {
        var x = qs[i].replace(regexp, '%20'),
          idx = x.indexOf(eq),
          kstr, vstr, k, v;

        if (idx >= 0) {
          kstr = x.substr(0, idx);
          vstr = x.substr(idx + 1);
        } else {
          kstr = x;
          vstr = '';
        }

        k = decodeURIComponent(kstr);
        v = decodeURIComponent(vstr);

        if (!hasOwnProperty(obj, k)) {
          obj[k] = v;
        } else if (isArray(obj[k])) {
          obj[k].push(v);
        } else {
          obj[k] = [obj[k], v];
        }
      }

      return obj;
    };

    var isArray = Array.isArray || function (xs) {
      return Object.prototype.toString.call(xs) === '[object Array]';
    };

  }, {}], 15: [function (require, module, exports) {
    // Copyright Joyent, Inc. and other Node contributors.
    //
    // Permission is hereby granted, free of charge, to any person obtaining a
    // copy of this software and associated documentation files (the
    // "Software"), to deal in the Software without restriction, including
    // without limitation the rights to use, copy, modify, merge, publish,
    // distribute, sublicense, and/or sell copies of the Software, and to permit
    // persons to whom the Software is furnished to do so, subject to the
    // following conditions:
    //
    // The above copyright notice and this permission notice shall be included
    // in all copies or substantial portions of the Software.
    //
    // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
    // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
    // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
    // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
    // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
    // USE OR OTHER DEALINGS IN THE SOFTWARE.

    'use strict';

    var stringifyPrimitive = function (v) {
      switch (typeof v) {
        case 'string':
          return v;

        case 'boolean':
          return v ? 'true' : 'false';

        case 'number':
          return isFinite(v) ? v : '';

        default:
          return '';
      }
    };

    module.exports = function (obj, sep, eq, name) {
      sep = sep || '&';
      eq = eq || '=';
      if (obj === null) {
        obj = undefined;
      }

      if (typeof obj === 'object') {
        return map(objectKeys(obj), function (k) {
          var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
          if (isArray(obj[k])) {
            return map(obj[k], function (v) {
              return ks + encodeURIComponent(stringifyPrimitive(v));
            }).join(sep);
          } else {
            return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
          }
        }).join(sep);

      }

      if (!name) return '';
      return encodeURIComponent(stringifyPrimitive(name)) + eq +
        encodeURIComponent(stringifyPrimitive(obj));
    };

    var isArray = Array.isArray || function (xs) {
      return Object.prototype.toString.call(xs) === '[object Array]';
    };

    function map(xs, f) {
      if (xs.map) return xs.map(f);
      var res = [];
      for (var i = 0; i < xs.length; i++) {
        res.push(f(xs[i], i));
      }
      return res;
    }

    var objectKeys = Object.keys || function (obj) {
      var res = [];
      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
      }
      return res;
    };

  }, {}], 16: [function (require, module, exports) {
    'use strict';

    exports.decode = exports.parse = require('./decode');
    exports.encode = exports.stringify = require('./encode');

  }, { "./decode": 14, "./encode": 15 }], 17: [function (require, module, exports) {
    // Copyright Joyent, Inc. and other Node contributors.
    //
    // Permission is hereby granted, free of charge, to any person obtaining a
    // copy of this software and associated documentation files (the
    // "Software"), to deal in the Software without restriction, including
    // without limitation the rights to use, copy, modify, merge, publish,
    // distribute, sublicense, and/or sell copies of the Software, and to permit
    // persons to whom the Software is furnished to do so, subject to the
    // following conditions:
    //
    // The above copyright notice and this permission notice shall be included
    // in all copies or substantial portions of the Software.
    //
    // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
    // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
    // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
    // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
    // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
    // USE OR OTHER DEALINGS IN THE SOFTWARE.

    // a duplex stream is just a stream that is both readable and writable.
    // Since JS doesn't have multiple prototypal inheritance, this class
    // prototypally inherits from Readable, and then parasitically from
    // Writable.

    'use strict';

    /*<replacement>*/

    var pna = require('process-nextick-args');
    /*</replacement>*/

    /*<replacement>*/
    var objectKeys = Object.keys || function (obj) {
      var keys = [];
      for (var key in obj) {
        keys.push(key);
      } return keys;
    };
    /*</replacement>*/

    module.exports = Duplex;

    /*<replacement>*/
    var util = require('core-util-is');
    util.inherits = require('inherits');
    /*</replacement>*/

    var Readable = require('./_stream_readable');
    var Writable = require('./_stream_writable');

    util.inherits(Duplex, Readable);

    {
      // avoid scope creep, the keys array can then be collected
      var keys = objectKeys(Writable.prototype);
      for (var v = 0; v < keys.length; v++) {
        var method = keys[v];
        if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
      }
    }

    function Duplex(options) {
      if (!(this instanceof Duplex)) return new Duplex(options);

      Readable.call(this, options);
      Writable.call(this, options);

      if (options && options.readable === false) this.readable = false;

      if (options && options.writable === false) this.writable = false;

      this.allowHalfOpen = true;
      if (options && options.allowHalfOpen === false) this.allowHalfOpen = false;

      this.once('end', onend);
    }

    Object.defineProperty(Duplex.prototype, 'writableHighWaterMark', {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: function () {
        return this._writableState.highWaterMark;
      }
    });

    // the no-half-open enforcer
    function onend() {
      // if we allow half-open state, or if the writable side ended,
      // then we're ok.
      if (this.allowHalfOpen || this._writableState.ended) return;

      // no more data can be written.
      // But allow more writes to happen in this tick.
      pna.nextTick(onEndNT, this);
    }

    function onEndNT(self) {
      self.end();
    }

    Object.defineProperty(Duplex.prototype, 'destroyed', {
      get: function () {
        if (this._readableState === undefined || this._writableState === undefined) {
          return false;
        }
        return this._readableState.destroyed && this._writableState.destroyed;
      },
      set: function (value) {
        // we ignore the value if the stream
        // has not been initialized yet
        if (this._readableState === undefined || this._writableState === undefined) {
          return;
        }

        // backward compatibility, the user is explicitly
        // managing destroyed
        this._readableState.destroyed = value;
        this._writableState.destroyed = value;
      }
    });

    Duplex.prototype._destroy = function (err, cb) {
      this.push(null);
      this.end();

      pna.nextTick(cb, err);
    };
  }, { "./_stream_readable": 19, "./_stream_writable": 21, "core-util-is": 5, "inherits": 8, "process-nextick-args": 11 }], 18: [function (require, module, exports) {
    // Copyright Joyent, Inc. and other Node contributors.
    //
    // Permission is hereby granted, free of charge, to any person obtaining a
    // copy of this software and associated documentation files (the
    // "Software"), to deal in the Software without restriction, including
    // without limitation the rights to use, copy, modify, merge, publish,
    // distribute, sublicense, and/or sell copies of the Software, and to permit
    // persons to whom the Software is furnished to do so, subject to the
    // following conditions:
    //
    // The above copyright notice and this permission notice shall be included
    // in all copies or substantial portions of the Software.
    //
    // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
    // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
    // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
    // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
    // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
    // USE OR OTHER DEALINGS IN THE SOFTWARE.

    // a passthrough stream.
    // basically just the most minimal sort of Transform stream.
    // Every written chunk gets output as-is.

    'use strict';

    module.exports = PassThrough;

    var Transform = require('./_stream_transform');

    /*<replacement>*/
    var util = require('core-util-is');
    util.inherits = require('inherits');
    /*</replacement>*/

    util.inherits(PassThrough, Transform);

    function PassThrough(options) {
      if (!(this instanceof PassThrough)) return new PassThrough(options);

      Transform.call(this, options);
    }

    PassThrough.prototype._transform = function (chunk, encoding, cb) {
      cb(null, chunk);
    };
  }, { "./_stream_transform": 20, "core-util-is": 5, "inherits": 8 }], 19: [function (require, module, exports) {
    (function (process, global) {
      // Copyright Joyent, Inc. and other Node contributors.
      //
      // Permission is hereby granted, free of charge, to any person obtaining a
      // copy of this software and associated documentation files (the
      // "Software"), to deal in the Software without restriction, including
      // without limitation the rights to use, copy, modify, merge, publish,
      // distribute, sublicense, and/or sell copies of the Software, and to permit
      // persons to whom the Software is furnished to do so, subject to the
      // following conditions:
      //
      // The above copyright notice and this permission notice shall be included
      // in all copies or substantial portions of the Software.
      //
      // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
      // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
      // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
      // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
      // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
      // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
      // USE OR OTHER DEALINGS IN THE SOFTWARE.

      'use strict';

      /*<replacement>*/

      var pna = require('process-nextick-args');
      /*</replacement>*/

      module.exports = Readable;

      /*<replacement>*/
      var isArray = require('isarray');
      /*</replacement>*/

      /*<replacement>*/
      var Duplex;
      /*</replacement>*/

      Readable.ReadableState = ReadableState;

      /*<replacement>*/
      var EE = require('events').EventEmitter;

      var EElistenerCount = function (emitter, type) {
        return emitter.listeners(type).length;
      };
      /*</replacement>*/

      /*<replacement>*/
      var Stream = require('./internal/streams/stream');
      /*</replacement>*/

      /*<replacement>*/

      var Buffer = require('safe-buffer').Buffer;
      var OurUint8Array = global.Uint8Array || function () { };
      function _uint8ArrayToBuffer(chunk) {
        return Buffer.from(chunk);
      }
      function _isUint8Array(obj) {
        return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
      }

      /*</replacement>*/

      /*<replacement>*/
      var util = require('core-util-is');
      util.inherits = require('inherits');
      /*</replacement>*/

      /*<replacement>*/
      var debugUtil = require('util');
      var debug = void 0;
      if (debugUtil && debugUtil.debuglog) {
        debug = debugUtil.debuglog('stream');
      } else {
        debug = function () { };
      }
      /*</replacement>*/

      var BufferList = require('./internal/streams/BufferList');
      var destroyImpl = require('./internal/streams/destroy');
      var StringDecoder;

      util.inherits(Readable, Stream);

      var kProxyEvents = ['error', 'close', 'destroy', 'pause', 'resume'];

      function prependListener(emitter, event, fn) {
        // Sadly this is not cacheable as some libraries bundle their own
        // event emitter implementation with them.
        if (typeof emitter.prependListener === 'function') return emitter.prependListener(event, fn);

        // This is a hack to make sure that our error handler is attached before any
        // userland ones.  NEVER DO THIS. This is here only because this code needs
        // to continue to work with older versions of Node.js that do not include
        // the prependListener() method. The goal is to eventually remove this hack.
        if (!emitter._events || !emitter._events[event]) emitter.on(event, fn); else if (isArray(emitter._events[event])) emitter._events[event].unshift(fn); else emitter._events[event] = [fn, emitter._events[event]];
      }

      function ReadableState(options, stream) {
        Duplex = Duplex || require('./_stream_duplex');

        options = options || {};

        // Duplex streams are both readable and writable, but share
        // the same options object.
        // However, some cases require setting options to different
        // values for the readable and the writable sides of the duplex stream.
        // These options can be provided separately as readableXXX and writableXXX.
        var isDuplex = stream instanceof Duplex;

        // object stream flag. Used to make read(n) ignore n and to
        // make all the buffer merging and length checks go away
        this.objectMode = !!options.objectMode;

        if (isDuplex) this.objectMode = this.objectMode || !!options.readableObjectMode;

        // the point at which it stops calling _read() to fill the buffer
        // Note: 0 is a valid value, means "don't call _read preemptively ever"
        var hwm = options.highWaterMark;
        var readableHwm = options.readableHighWaterMark;
        var defaultHwm = this.objectMode ? 16 : 16 * 1024;

        if (hwm || hwm === 0) this.highWaterMark = hwm; else if (isDuplex && (readableHwm || readableHwm === 0)) this.highWaterMark = readableHwm; else this.highWaterMark = defaultHwm;

        // cast to ints.
        this.highWaterMark = Math.floor(this.highWaterMark);

        // A linked list is used to store data chunks instead of an array because the
        // linked list can remove elements from the beginning faster than
        // array.shift()
        this.buffer = new BufferList();
        this.length = 0;
        this.pipes = null;
        this.pipesCount = 0;
        this.flowing = null;
        this.ended = false;
        this.endEmitted = false;
        this.reading = false;

        // a flag to be able to tell if the event 'readable'/'data' is emitted
        // immediately, or on a later tick.  We set this to true at first, because
        // any actions that shouldn't happen until "later" should generally also
        // not happen before the first read call.
        this.sync = true;

        // whenever we return null, then we set a flag to say
        // that we're awaiting a 'readable' event emission.
        this.needReadable = false;
        this.emittedReadable = false;
        this.readableListening = false;
        this.resumeScheduled = false;

        // has it been destroyed
        this.destroyed = false;

        // Crypto is kind of old and crusty.  Historically, its default string
        // encoding is 'binary' so we have to make this configurable.
        // Everything else in the universe uses 'utf8', though.
        this.defaultEncoding = options.defaultEncoding || 'utf8';

        // the number of writers that are awaiting a drain event in .pipe()s
        this.awaitDrain = 0;

        // if true, a maybeReadMore has been scheduled
        this.readingMore = false;

        this.decoder = null;
        this.encoding = null;
        if (options.encoding) {
          if (!StringDecoder) StringDecoder = require('string_decoder/').StringDecoder;
          this.decoder = new StringDecoder(options.encoding);
          this.encoding = options.encoding;
        }
      }

      function Readable(options) {
        Duplex = Duplex || require('./_stream_duplex');

        if (!(this instanceof Readable)) return new Readable(options);

        this._readableState = new ReadableState(options, this);

        // legacy
        this.readable = true;

        if (options) {
          if (typeof options.read === 'function') this._read = options.read;

          if (typeof options.destroy === 'function') this._destroy = options.destroy;
        }

        Stream.call(this);
      }

      Object.defineProperty(Readable.prototype, 'destroyed', {
        get: function () {
          if (this._readableState === undefined) {
            return false;
          }
          return this._readableState.destroyed;
        },
        set: function (value) {
          // we ignore the value if the stream
          // has not been initialized yet
          if (!this._readableState) {
            return;
          }

          // backward compatibility, the user is explicitly
          // managing destroyed
          this._readableState.destroyed = value;
        }
      });

      Readable.prototype.destroy = destroyImpl.destroy;
      Readable.prototype._undestroy = destroyImpl.undestroy;
      Readable.prototype._destroy = function (err, cb) {
        this.push(null);
        cb(err);
      };

      // Manually shove something into the read() buffer.
      // This returns true if the highWaterMark has not been hit yet,
      // similar to how Writable.write() returns true if you should
      // write() some more.
      Readable.prototype.push = function (chunk, encoding) {
        var state = this._readableState;
        var skipChunkCheck;

        if (!state.objectMode) {
          if (typeof chunk === 'string') {
            encoding = encoding || state.defaultEncoding;
            if (encoding !== state.encoding) {
              chunk = Buffer.from(chunk, encoding);
              encoding = '';
            }
            skipChunkCheck = true;
          }
        } else {
          skipChunkCheck = true;
        }

        return readableAddChunk(this, chunk, encoding, false, skipChunkCheck);
      };

      // Unshift should *always* be something directly out of read()
      Readable.prototype.unshift = function (chunk) {
        return readableAddChunk(this, chunk, null, true, false);
      };

      function readableAddChunk(stream, chunk, encoding, addToFront, skipChunkCheck) {
        var state = stream._readableState;
        if (chunk === null) {
          state.reading = false;
          onEofChunk(stream, state);
        } else {
          var er;
          if (!skipChunkCheck) er = chunkInvalid(state, chunk);
          if (er) {
            stream.emit('error', er);
          } else if (state.objectMode || chunk && chunk.length > 0) {
            if (typeof chunk !== 'string' && !state.objectMode && Object.getPrototypeOf(chunk) !== Buffer.prototype) {
              chunk = _uint8ArrayToBuffer(chunk);
            }

            if (addToFront) {
              if (state.endEmitted) stream.emit('error', new Error('stream.unshift() after end event')); else addChunk(stream, state, chunk, true);
            } else if (state.ended) {
              stream.emit('error', new Error('stream.push() after EOF'));
            } else {
              state.reading = false;
              if (state.decoder && !encoding) {
                chunk = state.decoder.write(chunk);
                if (state.objectMode || chunk.length !== 0) addChunk(stream, state, chunk, false); else maybeReadMore(stream, state);
              } else {
                addChunk(stream, state, chunk, false);
              }
            }
          } else if (!addToFront) {
            state.reading = false;
          }
        }

        return needMoreData(state);
      }

      function addChunk(stream, state, chunk, addToFront) {
        if (state.flowing && state.length === 0 && !state.sync) {
          stream.emit('data', chunk);
          stream.read(0);
        } else {
          // update the buffer info.
          state.length += state.objectMode ? 1 : chunk.length;
          if (addToFront) state.buffer.unshift(chunk); else state.buffer.push(chunk);

          if (state.needReadable) emitReadable(stream);
        }
        maybeReadMore(stream, state);
      }

      function chunkInvalid(state, chunk) {
        var er;
        if (!_isUint8Array(chunk) && typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
          er = new TypeError('Invalid non-string/buffer chunk');
        }
        return er;
      }

      // if it's past the high water mark, we can push in some more.
      // Also, if we have no data yet, we can stand some
      // more bytes.  This is to work around cases where hwm=0,
      // such as the repl.  Also, if the push() triggered a
      // readable event, and the user called read(largeNumber) such that
      // needReadable was set, then we ought to push more, so that another
      // 'readable' event will be triggered.
      function needMoreData(state) {
        return !state.ended && (state.needReadable || state.length < state.highWaterMark || state.length === 0);
      }

      Readable.prototype.isPaused = function () {
        return this._readableState.flowing === false;
      };

      // backwards compatibility.
      Readable.prototype.setEncoding = function (enc) {
        if (!StringDecoder) StringDecoder = require('string_decoder/').StringDecoder;
        this._readableState.decoder = new StringDecoder(enc);
        this._readableState.encoding = enc;
        return this;
      };

      // Don't raise the hwm > 8MB
      var MAX_HWM = 0x800000;
      function computeNewHighWaterMark(n) {
        if (n >= MAX_HWM) {
          n = MAX_HWM;
        } else {
          // Get the next highest power of 2 to prevent increasing hwm excessively in
          // tiny amounts
          n--;
          n |= n >>> 1;
          n |= n >>> 2;
          n |= n >>> 4;
          n |= n >>> 8;
          n |= n >>> 16;
          n++;
        }
        return n;
      }

      // This function is designed to be inlinable, so please take care when making
      // changes to the function body.
      function howMuchToRead(n, state) {
        if (n <= 0 || state.length === 0 && state.ended) return 0;
        if (state.objectMode) return 1;
        if (n !== n) {
          // Only flow one buffer at a time
          if (state.flowing && state.length) return state.buffer.head.data.length; else return state.length;
        }
        // If we're asking for more than the current hwm, then raise the hwm.
        if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n);
        if (n <= state.length) return n;
        // Don't have enough
        if (!state.ended) {
          state.needReadable = true;
          return 0;
        }
        return state.length;
      }

      // you can override either this method, or the async _read(n) below.
      Readable.prototype.read = function (n) {
        debug('read', n);
        n = parseInt(n, 10);
        var state = this._readableState;
        var nOrig = n;

        if (n !== 0) state.emittedReadable = false;

        // if we're doing read(0) to trigger a readable event, but we
        // already have a bunch of data in the buffer, then just trigger
        // the 'readable' event and move on.
        if (n === 0 && state.needReadable && (state.length >= state.highWaterMark || state.ended)) {
          debug('read: emitReadable', state.length, state.ended);
          if (state.length === 0 && state.ended) endReadable(this); else emitReadable(this);
          return null;
        }

        n = howMuchToRead(n, state);

        // if we've ended, and we're now clear, then finish it up.
        if (n === 0 && state.ended) {
          if (state.length === 0) endReadable(this);
          return null;
        }

        // All the actual chunk generation logic needs to be
        // *below* the call to _read.  The reason is that in certain
        // synthetic stream cases, such as passthrough streams, _read
        // may be a completely synchronous operation which may change
        // the state of the read buffer, providing enough data when
        // before there was *not* enough.
        //
        // So, the steps are:
        // 1. Figure out what the state of things will be after we do
        // a read from the buffer.
        //
        // 2. If that resulting state will trigger a _read, then call _read.
        // Note that this may be asynchronous, or synchronous.  Yes, it is
        // deeply ugly to write APIs this way, but that still doesn't mean
        // that the Readable class should behave improperly, as streams are
        // designed to be sync/async agnostic.
        // Take note if the _read call is sync or async (ie, if the read call
        // has returned yet), so that we know whether or not it's safe to emit
        // 'readable' etc.
        //
        // 3. Actually pull the requested chunks out of the buffer and return.

        // if we need a readable event, then we need to do some reading.
        var doRead = state.needReadable;
        debug('need readable', doRead);

        // if we currently have less than the highWaterMark, then also read some
        if (state.length === 0 || state.length - n < state.highWaterMark) {
          doRead = true;
          debug('length less than watermark', doRead);
        }

        // however, if we've ended, then there's no point, and if we're already
        // reading, then it's unnecessary.
        if (state.ended || state.reading) {
          doRead = false;
          debug('reading or ended', doRead);
        } else if (doRead) {
          debug('do read');
          state.reading = true;
          state.sync = true;
          // if the length is currently zero, then we *need* a readable event.
          if (state.length === 0) state.needReadable = true;
          // call internal read method
          this._read(state.highWaterMark);
          state.sync = false;
          // If _read pushed data synchronously, then `reading` will be false,
          // and we need to re-evaluate how much data we can return to the user.
          if (!state.reading) n = howMuchToRead(nOrig, state);
        }

        var ret;
        if (n > 0) ret = fromList(n, state); else ret = null;

        if (ret === null) {
          state.needReadable = true;
          n = 0;
        } else {
          state.length -= n;
        }

        if (state.length === 0) {
          // If we have nothing in the buffer, then we want to know
          // as soon as we *do* get something into the buffer.
          if (!state.ended) state.needReadable = true;

          // If we tried to read() past the EOF, then emit end on the next tick.
          if (nOrig !== n && state.ended) endReadable(this);
        }

        if (ret !== null) this.emit('data', ret);

        return ret;
      };

      function onEofChunk(stream, state) {
        if (state.ended) return;
        if (state.decoder) {
          var chunk = state.decoder.end();
          if (chunk && chunk.length) {
            state.buffer.push(chunk);
            state.length += state.objectMode ? 1 : chunk.length;
          }
        }
        state.ended = true;

        // emit 'readable' now to make sure it gets picked up.
        emitReadable(stream);
      }

      // Don't emit readable right away in sync mode, because this can trigger
      // another read() call => stack overflow.  This way, it might trigger
      // a nextTick recursion warning, but that's not so bad.
      function emitReadable(stream) {
        var state = stream._readableState;
        state.needReadable = false;
        if (!state.emittedReadable) {
          debug('emitReadable', state.flowing);
          state.emittedReadable = true;
          if (state.sync) pna.nextTick(emitReadable_, stream); else emitReadable_(stream);
        }
      }

      function emitReadable_(stream) {
        debug('emit readable');
        stream.emit('readable');
        flow(stream);
      }

      // at this point, the user has presumably seen the 'readable' event,
      // and called read() to consume some data.  that may have triggered
      // in turn another _read(n) call, in which case reading = true if
      // it's in progress.
      // However, if we're not ended, or reading, and the length < hwm,
      // then go ahead and try to read some more preemptively.
      function maybeReadMore(stream, state) {
        if (!state.readingMore) {
          state.readingMore = true;
          pna.nextTick(maybeReadMore_, stream, state);
        }
      }

      function maybeReadMore_(stream, state) {
        var len = state.length;
        while (!state.reading && !state.flowing && !state.ended && state.length < state.highWaterMark) {
          debug('maybeReadMore read 0');
          stream.read(0);
          if (len === state.length)
            // didn't get any data, stop spinning.
            break; else len = state.length;
        }
        state.readingMore = false;
      }

      // abstract method.  to be overridden in specific implementation classes.
      // call cb(er, data) where data is <= n in length.
      // for virtual (non-string, non-buffer) streams, "length" is somewhat
      // arbitrary, and perhaps not very meaningful.
      Readable.prototype._read = function (n) {
        this.emit('error', new Error('_read() is not implemented'));
      };

      Readable.prototype.pipe = function (dest, pipeOpts) {
        var src = this;
        var state = this._readableState;

        switch (state.pipesCount) {
          case 0:
            state.pipes = dest;
            break;
          case 1:
            state.pipes = [state.pipes, dest];
            break;
          default:
            state.pipes.push(dest);
            break;
        }
        state.pipesCount += 1;
        debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);

        var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;

        var endFn = doEnd ? onend : unpipe;
        if (state.endEmitted) pna.nextTick(endFn); else src.once('end', endFn);

        dest.on('unpipe', onunpipe);
        function onunpipe(readable, unpipeInfo) {
          debug('onunpipe');
          if (readable === src) {
            if (unpipeInfo && unpipeInfo.hasUnpiped === false) {
              unpipeInfo.hasUnpiped = true;
              cleanup();
            }
          }
        }

        function onend() {
          debug('onend');
          dest.end();
        }

        // when the dest drains, it reduces the awaitDrain counter
        // on the source.  This would be more elegant with a .once()
        // handler in flow(), but adding and removing repeatedly is
        // too slow.
        var ondrain = pipeOnDrain(src);
        dest.on('drain', ondrain);

        var cleanedUp = false;
        function cleanup() {
          debug('cleanup');
          // cleanup event handlers once the pipe is broken
          dest.removeListener('close', onclose);
          dest.removeListener('finish', onfinish);
          dest.removeListener('drain', ondrain);
          dest.removeListener('error', onerror);
          dest.removeListener('unpipe', onunpipe);
          src.removeListener('end', onend);
          src.removeListener('end', unpipe);
          src.removeListener('data', ondata);

          cleanedUp = true;

          // if the reader is waiting for a drain event from this
          // specific writer, then it would cause it to never start
          // flowing again.
          // So, if this is awaiting a drain, then we just call it now.
          // If we don't know, then assume that we are waiting for one.
          if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
        }

        // If the user pushes more data while we're writing to dest then we'll end up
        // in ondata again. However, we only want to increase awaitDrain once because
        // dest will only emit one 'drain' event for the multiple writes.
        // => Introduce a guard on increasing awaitDrain.
        var increasedAwaitDrain = false;
        src.on('data', ondata);
        function ondata(chunk) {
          debug('ondata');
          increasedAwaitDrain = false;
          var ret = dest.write(chunk);
          if (false === ret && !increasedAwaitDrain) {
            // If the user unpiped during `dest.write()`, it is possible
            // to get stuck in a permanently paused state if that write
            // also returned false.
            // => Check whether `dest` is still a piping destination.
            if ((state.pipesCount === 1 && state.pipes === dest || state.pipesCount > 1 && indexOf(state.pipes, dest) !== -1) && !cleanedUp) {
              debug('false write response, pause', src._readableState.awaitDrain);
              src._readableState.awaitDrain++;
              increasedAwaitDrain = true;
            }
            src.pause();
          }
        }

        // if the dest has an error, then stop piping into it.
        // however, don't suppress the throwing behavior for this.
        function onerror(er) {
          debug('onerror', er);
          unpipe();
          dest.removeListener('error', onerror);
          if (EElistenerCount(dest, 'error') === 0) dest.emit('error', er);
        }

        // Make sure our error handler is attached before userland ones.
        prependListener(dest, 'error', onerror);

        // Both close and finish should trigger unpipe, but only once.
        function onclose() {
          dest.removeListener('finish', onfinish);
          unpipe();
        }
        dest.once('close', onclose);
        function onfinish() {
          debug('onfinish');
          dest.removeListener('close', onclose);
          unpipe();
        }
        dest.once('finish', onfinish);

        function unpipe() {
          debug('unpipe');
          src.unpipe(dest);
        }

        // tell the dest that it's being piped to
        dest.emit('pipe', src);

        // start the flow if it hasn't been started already.
        if (!state.flowing) {
          debug('pipe resume');
          src.resume();
        }

        return dest;
      };

      function pipeOnDrain(src) {
        return function () {
          var state = src._readableState;
          debug('pipeOnDrain', state.awaitDrain);
          if (state.awaitDrain) state.awaitDrain--;
          if (state.awaitDrain === 0 && EElistenerCount(src, 'data')) {
            state.flowing = true;
            flow(src);
          }
        };
      }

      Readable.prototype.unpipe = function (dest) {
        var state = this._readableState;
        var unpipeInfo = { hasUnpiped: false };

        // if we're not piping anywhere, then do nothing.
        if (state.pipesCount === 0) return this;

        // just one destination.  most common case.
        if (state.pipesCount === 1) {
          // passed in one, but it's not the right one.
          if (dest && dest !== state.pipes) return this;

          if (!dest) dest = state.pipes;

          // got a match.
          state.pipes = null;
          state.pipesCount = 0;
          state.flowing = false;
          if (dest) dest.emit('unpipe', this, unpipeInfo);
          return this;
        }

        // slow case. multiple pipe destinations.

        if (!dest) {
          // remove all.
          var dests = state.pipes;
          var len = state.pipesCount;
          state.pipes = null;
          state.pipesCount = 0;
          state.flowing = false;

          for (var i = 0; i < len; i++) {
            dests[i].emit('unpipe', this, unpipeInfo);
          } return this;
        }

        // try to find the right one.
        var index = indexOf(state.pipes, dest);
        if (index === -1) return this;

        state.pipes.splice(index, 1);
        state.pipesCount -= 1;
        if (state.pipesCount === 1) state.pipes = state.pipes[0];

        dest.emit('unpipe', this, unpipeInfo);

        return this;
      };

      // set up data events if they are asked for
      // Ensure readable listeners eventually get something
      Readable.prototype.on = function (ev, fn) {
        var res = Stream.prototype.on.call(this, ev, fn);

        if (ev === 'data') {
          // Start flowing on next tick if stream isn't explicitly paused
          if (this._readableState.flowing !== false) this.resume();
        } else if (ev === 'readable') {
          var state = this._readableState;
          if (!state.endEmitted && !state.readableListening) {
            state.readableListening = state.needReadable = true;
            state.emittedReadable = false;
            if (!state.reading) {
              pna.nextTick(nReadingNextTick, this);
            } else if (state.length) {
              emitReadable(this);
            }
          }
        }

        return res;
      };
      Readable.prototype.addListener = Readable.prototype.on;

      function nReadingNextTick(self) {
        debug('readable nexttick read 0');
        self.read(0);
      }

      // pause() and resume() are remnants of the legacy readable stream API
      // If the user uses them, then switch into old mode.
      Readable.prototype.resume = function () {
        var state = this._readableState;
        if (!state.flowing) {
          debug('resume');
          state.flowing = true;
          resume(this, state);
        }
        return this;
      };

      function resume(stream, state) {
        if (!state.resumeScheduled) {
          state.resumeScheduled = true;
          pna.nextTick(resume_, stream, state);
        }
      }

      function resume_(stream, state) {
        if (!state.reading) {
          debug('resume read 0');
          stream.read(0);
        }

        state.resumeScheduled = false;
        state.awaitDrain = 0;
        stream.emit('resume');
        flow(stream);
        if (state.flowing && !state.reading) stream.read(0);
      }

      Readable.prototype.pause = function () {
        debug('call pause flowing=%j', this._readableState.flowing);
        if (false !== this._readableState.flowing) {
          debug('pause');
          this._readableState.flowing = false;
          this.emit('pause');
        }
        return this;
      };

      function flow(stream) {
        var state = stream._readableState;
        debug('flow', state.flowing);
        while (state.flowing && stream.read() !== null) { }
      }

      // wrap an old-style stream as the async data source.
      // This is *not* part of the readable stream interface.
      // It is an ugly unfortunate mess of history.
      Readable.prototype.wrap = function (stream) {
        var _this = this;

        var state = this._readableState;
        var paused = false;

        stream.on('end', function () {
          debug('wrapped end');
          if (state.decoder && !state.ended) {
            var chunk = state.decoder.end();
            if (chunk && chunk.length) _this.push(chunk);
          }

          _this.push(null);
        });

        stream.on('data', function (chunk) {
          debug('wrapped data');
          if (state.decoder) chunk = state.decoder.write(chunk);

          // don't skip over falsy values in objectMode
          if (state.objectMode && (chunk === null || chunk === undefined)) return; else if (!state.objectMode && (!chunk || !chunk.length)) return;

          var ret = _this.push(chunk);
          if (!ret) {
            paused = true;
            stream.pause();
          }
        });

        // proxy all the other methods.
        // important when wrapping filters and duplexes.
        for (var i in stream) {
          if (this[i] === undefined && typeof stream[i] === 'function') {
            this[i] = function (method) {
              return function () {
                return stream[method].apply(stream, arguments);
              };
            }(i);
          }
        }

        // proxy certain important events.
        for (var n = 0; n < kProxyEvents.length; n++) {
          stream.on(kProxyEvents[n], this.emit.bind(this, kProxyEvents[n]));
        }

        // when we try to consume some more bytes, simply unpause the
        // underlying stream.
        this._read = function (n) {
          debug('wrapped _read', n);
          if (paused) {
            paused = false;
            stream.resume();
          }
        };

        return this;
      };

      Object.defineProperty(Readable.prototype, 'readableHighWaterMark', {
        // making it explicit this property is not enumerable
        // because otherwise some prototype manipulation in
        // userland will fail
        enumerable: false,
        get: function () {
          return this._readableState.highWaterMark;
        }
      });

      // exposed for testing purposes only.
      Readable._fromList = fromList;

      // Pluck off n bytes from an array of buffers.
      // Length is the combined lengths of all the buffers in the list.
      // This function is designed to be inlinable, so please take care when making
      // changes to the function body.
      function fromList(n, state) {
        // nothing buffered
        if (state.length === 0) return null;

        var ret;
        if (state.objectMode) ret = state.buffer.shift(); else if (!n || n >= state.length) {
          // read it all, truncate the list
          if (state.decoder) ret = state.buffer.join(''); else if (state.buffer.length === 1) ret = state.buffer.head.data; else ret = state.buffer.concat(state.length);
          state.buffer.clear();
        } else {
          // read part of list
          ret = fromListPartial(n, state.buffer, state.decoder);
        }

        return ret;
      }

      // Extracts only enough buffered data to satisfy the amount requested.
      // This function is designed to be inlinable, so please take care when making
      // changes to the function body.
      function fromListPartial(n, list, hasStrings) {
        var ret;
        if (n < list.head.data.length) {
          // slice is the same for buffers and strings
          ret = list.head.data.slice(0, n);
          list.head.data = list.head.data.slice(n);
        } else if (n === list.head.data.length) {
          // first chunk is a perfect match
          ret = list.shift();
        } else {
          // result spans more than one buffer
          ret = hasStrings ? copyFromBufferString(n, list) : copyFromBuffer(n, list);
        }
        return ret;
      }

      // Copies a specified amount of characters from the list of buffered data
      // chunks.
      // This function is designed to be inlinable, so please take care when making
      // changes to the function body.
      function copyFromBufferString(n, list) {
        var p = list.head;
        var c = 1;
        var ret = p.data;
        n -= ret.length;
        while (p = p.next) {
          var str = p.data;
          var nb = n > str.length ? str.length : n;
          if (nb === str.length) ret += str; else ret += str.slice(0, n);
          n -= nb;
          if (n === 0) {
            if (nb === str.length) {
              ++c;
              if (p.next) list.head = p.next; else list.head = list.tail = null;
            } else {
              list.head = p;
              p.data = str.slice(nb);
            }
            break;
          }
          ++c;
        }
        list.length -= c;
        return ret;
      }

      // Copies a specified amount of bytes from the list of buffered data chunks.
      // This function is designed to be inlinable, so please take care when making
      // changes to the function body.
      function copyFromBuffer(n, list) {
        var ret = Buffer.allocUnsafe(n);
        var p = list.head;
        var c = 1;
        p.data.copy(ret);
        n -= p.data.length;
        while (p = p.next) {
          var buf = p.data;
          var nb = n > buf.length ? buf.length : n;
          buf.copy(ret, ret.length - n, 0, nb);
          n -= nb;
          if (n === 0) {
            if (nb === buf.length) {
              ++c;
              if (p.next) list.head = p.next; else list.head = list.tail = null;
            } else {
              list.head = p;
              p.data = buf.slice(nb);
            }
            break;
          }
          ++c;
        }
        list.length -= c;
        return ret;
      }

      function endReadable(stream) {
        var state = stream._readableState;

        // If we get here before consuming all the bytes, then that is a
        // bug in node.  Should never happen.
        if (state.length > 0) throw new Error('"endReadable()" called on non-empty stream');

        if (!state.endEmitted) {
          state.ended = true;
          pna.nextTick(endReadableNT, state, stream);
        }
      }

      function endReadableNT(state, stream) {
        // Check that we didn't get one last unshift.
        if (!state.endEmitted && state.length === 0) {
          state.endEmitted = true;
          stream.readable = false;
          stream.emit('end');
        }
      }

      function indexOf(xs, x) {
        for (var i = 0, l = xs.length; i < l; i++) {
          if (xs[i] === x) return i;
        }
        return -1;
      }
    }).call(this, require('_process'), typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
  }, { "./_stream_duplex": 17, "./internal/streams/BufferList": 22, "./internal/streams/destroy": 23, "./internal/streams/stream": 24, "_process": 12, "core-util-is": 5, "events": 6, "inherits": 8, "isarray": 10, "process-nextick-args": 11, "safe-buffer": 27, "string_decoder/": 25, "util": 2 }], 20: [function (require, module, exports) {
    // Copyright Joyent, Inc. and other Node contributors.
    //
    // Permission is hereby granted, free of charge, to any person obtaining a
    // copy of this software and associated documentation files (the
    // "Software"), to deal in the Software without restriction, including
    // without limitation the rights to use, copy, modify, merge, publish,
    // distribute, sublicense, and/or sell copies of the Software, and to permit
    // persons to whom the Software is furnished to do so, subject to the
    // following conditions:
    //
    // The above copyright notice and this permission notice shall be included
    // in all copies or substantial portions of the Software.
    //
    // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
    // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
    // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
    // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
    // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
    // USE OR OTHER DEALINGS IN THE SOFTWARE.

    // a transform stream is a readable/writable stream where you do
    // something with the data.  Sometimes it's called a "filter",
    // but that's not a great name for it, since that implies a thing where
    // some bits pass through, and others are simply ignored.  (That would
    // be a valid example of a transform, of course.)
    //
    // While the output is causally related to the input, it's not a
    // necessarily symmetric or synchronous transformation.  For example,
    // a zlib stream might take multiple plain-text writes(), and then
    // emit a single compressed chunk some time in the future.
    //
    // Here's how this works:
    //
    // The Transform stream has all the aspects of the readable and writable
    // stream classes.  When you write(chunk), that calls _write(chunk,cb)
    // internally, and returns false if there's a lot of pending writes
    // buffered up.  When you call read(), that calls _read(n) until
    // there's enough pending readable data buffered up.
    //
    // In a transform stream, the written data is placed in a buffer.  When
    // _read(n) is called, it transforms the queued up data, calling the
    // buffered _write cb's as it consumes chunks.  If consuming a single
    // written chunk would result in multiple output chunks, then the first
    // outputted bit calls the readcb, and subsequent chunks just go into
    // the read buffer, and will cause it to emit 'readable' if necessary.
    //
    // This way, back-pressure is actually determined by the reading side,
    // since _read has to be called to start processing a new chunk.  However,
    // a pathological inflate type of transform can cause excessive buffering
    // here.  For example, imagine a stream where every byte of input is
    // interpreted as an integer from 0-255, and then results in that many
    // bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
    // 1kb of data being output.  In this case, you could write a very small
    // amount of input, and end up with a very large amount of output.  In
    // such a pathological inflating mechanism, there'd be no way to tell
    // the system to stop doing the transform.  A single 4MB write could
    // cause the system to run out of memory.
    //
    // However, even in such a pathological case, only a single written chunk
    // would be consumed, and then the rest would wait (un-transformed) until
    // the results of the previous transformed chunk were consumed.

    'use strict';

    module.exports = Transform;

    var Duplex = require('./_stream_duplex');

    /*<replacement>*/
    var util = require('core-util-is');
    util.inherits = require('inherits');
    /*</replacement>*/

    util.inherits(Transform, Duplex);

    function afterTransform(er, data) {
      var ts = this._transformState;
      ts.transforming = false;

      var cb = ts.writecb;

      if (!cb) {
        return this.emit('error', new Error('write callback called multiple times'));
      }

      ts.writechunk = null;
      ts.writecb = null;

      if (data != null) // single equals check for both `null` and `undefined`
        this.push(data);

      cb(er);

      var rs = this._readableState;
      rs.reading = false;
      if (rs.needReadable || rs.length < rs.highWaterMark) {
        this._read(rs.highWaterMark);
      }
    }

    function Transform(options) {
      if (!(this instanceof Transform)) return new Transform(options);

      Duplex.call(this, options);

      this._transformState = {
        afterTransform: afterTransform.bind(this),
        needTransform: false,
        transforming: false,
        writecb: null,
        writechunk: null,
        writeencoding: null
      };

      // start out asking for a readable event once data is transformed.
      this._readableState.needReadable = true;

      // we have implemented the _read method, and done the other things
      // that Readable wants before the first _read call, so unset the
      // sync guard flag.
      this._readableState.sync = false;

      if (options) {
        if (typeof options.transform === 'function') this._transform = options.transform;

        if (typeof options.flush === 'function') this._flush = options.flush;
      }

      // When the writable side finishes, then flush out anything remaining.
      this.on('prefinish', prefinish);
    }

    function prefinish() {
      var _this = this;

      if (typeof this._flush === 'function') {
        this._flush(function (er, data) {
          done(_this, er, data);
        });
      } else {
        done(this, null, null);
      }
    }

    Transform.prototype.push = function (chunk, encoding) {
      this._transformState.needTransform = false;
      return Duplex.prototype.push.call(this, chunk, encoding);
    };

    // This is the part where you do stuff!
    // override this function in implementation classes.
    // 'chunk' is an input chunk.
    //
    // Call `push(newChunk)` to pass along transformed output
    // to the readable side.  You may call 'push' zero or more times.
    //
    // Call `cb(err)` when you are done with this chunk.  If you pass
    // an error, then that'll put the hurt on the whole operation.  If you
    // never call cb(), then you'll never get another chunk.
    Transform.prototype._transform = function (chunk, encoding, cb) {
      throw new Error('_transform() is not implemented');
    };

    Transform.prototype._write = function (chunk, encoding, cb) {
      var ts = this._transformState;
      ts.writecb = cb;
      ts.writechunk = chunk;
      ts.writeencoding = encoding;
      if (!ts.transforming) {
        var rs = this._readableState;
        if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
      }
    };

    // Doesn't matter what the args are here.
    // _transform does all the work.
    // That we got here means that the readable side wants more data.
    Transform.prototype._read = function (n) {
      var ts = this._transformState;

      if (ts.writechunk !== null && ts.writecb && !ts.transforming) {
        ts.transforming = true;
        this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
      } else {
        // mark that we need a transform, so that any data that comes in
        // will get processed, now that we've asked for it.
        ts.needTransform = true;
      }
    };

    Transform.prototype._destroy = function (err, cb) {
      var _this2 = this;

      Duplex.prototype._destroy.call(this, err, function (err2) {
        cb(err2);
        _this2.emit('close');
      });
    };

    function done(stream, er, data) {
      if (er) return stream.emit('error', er);

      if (data != null) // single equals check for both `null` and `undefined`
        stream.push(data);

      // if there's nothing in the write buffer, then that means
      // that nothing more will ever be provided
      if (stream._writableState.length) throw new Error('Calling transform done when ws.length != 0');

      if (stream._transformState.transforming) throw new Error('Calling transform done when still transforming');

      return stream.push(null);
    }
  }, { "./_stream_duplex": 17, "core-util-is": 5, "inherits": 8 }], 21: [function (require, module, exports) {
    (function (process, global) {
      // Copyright Joyent, Inc. and other Node contributors.
      //
      // Permission is hereby granted, free of charge, to any person obtaining a
      // copy of this software and associated documentation files (the
      // "Software"), to deal in the Software without restriction, including
      // without limitation the rights to use, copy, modify, merge, publish,
      // distribute, sublicense, and/or sell copies of the Software, and to permit
      // persons to whom the Software is furnished to do so, subject to the
      // following conditions:
      //
      // The above copyright notice and this permission notice shall be included
      // in all copies or substantial portions of the Software.
      //
      // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
      // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
      // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
      // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
      // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
      // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
      // USE OR OTHER DEALINGS IN THE SOFTWARE.

      // A bit simpler than readable streams.
      // Implement an async ._write(chunk, encoding, cb), and it'll handle all
      // the drain event emission and buffering.

      'use strict';

      /*<replacement>*/

      var pna = require('process-nextick-args');
      /*</replacement>*/

      module.exports = Writable;

      /* <replacement> */
      function WriteReq(chunk, encoding, cb) {
        this.chunk = chunk;
        this.encoding = encoding;
        this.callback = cb;
        this.next = null;
      }

      // It seems a linked list but it is not
      // there will be only 2 of these for each stream
      function CorkedRequest(state) {
        var _this = this;

        this.next = null;
        this.entry = null;
        this.finish = function () {
          onCorkedFinish(_this, state);
        };
      }
      /* </replacement> */

      /*<replacement>*/
      var asyncWrite = !process.browser && ['v0.10', 'v0.9.'].indexOf(process.version.slice(0, 5)) > -1 ? setImmediate : pna.nextTick;
      /*</replacement>*/

      /*<replacement>*/
      var Duplex;
      /*</replacement>*/

      Writable.WritableState = WritableState;

      /*<replacement>*/
      var util = require('core-util-is');
      util.inherits = require('inherits');
      /*</replacement>*/

      /*<replacement>*/
      var internalUtil = {
        deprecate: require('util-deprecate')
      };
      /*</replacement>*/

      /*<replacement>*/
      var Stream = require('./internal/streams/stream');
      /*</replacement>*/

      /*<replacement>*/

      var Buffer = require('safe-buffer').Buffer;
      var OurUint8Array = global.Uint8Array || function () { };
      function _uint8ArrayToBuffer(chunk) {
        return Buffer.from(chunk);
      }
      function _isUint8Array(obj) {
        return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
      }

      /*</replacement>*/

      var destroyImpl = require('./internal/streams/destroy');

      util.inherits(Writable, Stream);

      function nop() { }

      function WritableState(options, stream) {
        Duplex = Duplex || require('./_stream_duplex');

        options = options || {};

        // Duplex streams are both readable and writable, but share
        // the same options object.
        // However, some cases require setting options to different
        // values for the readable and the writable sides of the duplex stream.
        // These options can be provided separately as readableXXX and writableXXX.
        var isDuplex = stream instanceof Duplex;

        // object stream flag to indicate whether or not this stream
        // contains buffers or objects.
        this.objectMode = !!options.objectMode;

        if (isDuplex) this.objectMode = this.objectMode || !!options.writableObjectMode;

        // the point at which write() starts returning false
        // Note: 0 is a valid value, means that we always return false if
        // the entire buffer is not flushed immediately on write()
        var hwm = options.highWaterMark;
        var writableHwm = options.writableHighWaterMark;
        var defaultHwm = this.objectMode ? 16 : 16 * 1024;

        if (hwm || hwm === 0) this.highWaterMark = hwm; else if (isDuplex && (writableHwm || writableHwm === 0)) this.highWaterMark = writableHwm; else this.highWaterMark = defaultHwm;

        // cast to ints.
        this.highWaterMark = Math.floor(this.highWaterMark);

        // if _final has been called
        this.finalCalled = false;

        // drain event flag.
        this.needDrain = false;
        // at the start of calling end()
        this.ending = false;
        // when end() has been called, and returned
        this.ended = false;
        // when 'finish' is emitted
        this.finished = false;

        // has it been destroyed
        this.destroyed = false;

        // should we decode strings into buffers before passing to _write?
        // this is here so that some node-core streams can optimize string
        // handling at a lower level.
        var noDecode = options.decodeStrings === false;
        this.decodeStrings = !noDecode;

        // Crypto is kind of old and crusty.  Historically, its default string
        // encoding is 'binary' so we have to make this configurable.
        // Everything else in the universe uses 'utf8', though.
        this.defaultEncoding = options.defaultEncoding || 'utf8';

        // not an actual buffer we keep track of, but a measurement
        // of how much we're waiting to get pushed to some underlying
        // socket or file.
        this.length = 0;

        // a flag to see when we're in the middle of a write.
        this.writing = false;

        // when true all writes will be buffered until .uncork() call
        this.corked = 0;

        // a flag to be able to tell if the onwrite cb is called immediately,
        // or on a later tick.  We set this to true at first, because any
        // actions that shouldn't happen until "later" should generally also
        // not happen before the first write call.
        this.sync = true;

        // a flag to know if we're processing previously buffered items, which
        // may call the _write() callback in the same tick, so that we don't
        // end up in an overlapped onwrite situation.
        this.bufferProcessing = false;

        // the callback that's passed to _write(chunk,cb)
        this.onwrite = function (er) {
          onwrite(stream, er);
        };

        // the callback that the user supplies to write(chunk,encoding,cb)
        this.writecb = null;

        // the amount that is being written when _write is called.
        this.writelen = 0;

        this.bufferedRequest = null;
        this.lastBufferedRequest = null;

        // number of pending user-supplied write callbacks
        // this must be 0 before 'finish' can be emitted
        this.pendingcb = 0;

        // emit prefinish if the only thing we're waiting for is _write cbs
        // This is relevant for synchronous Transform streams
        this.prefinished = false;

        // True if the error was already emitted and should not be thrown again
        this.errorEmitted = false;

        // count buffered requests
        this.bufferedRequestCount = 0;

        // allocate the first CorkedRequest, there is always
        // one allocated and free to use, and we maintain at most two
        this.corkedRequestsFree = new CorkedRequest(this);
      }

      WritableState.prototype.getBuffer = function getBuffer() {
        var current = this.bufferedRequest;
        var out = [];
        while (current) {
          out.push(current);
          current = current.next;
        }
        return out;
      };

      (function () {
        try {
          Object.defineProperty(WritableState.prototype, 'buffer', {
            get: internalUtil.deprecate(function () {
              return this.getBuffer();
            }, '_writableState.buffer is deprecated. Use _writableState.getBuffer ' + 'instead.', 'DEP0003')
          });
        } catch (_) { }
      })();

      // Test _writableState for inheritance to account for Duplex streams,
      // whose prototype chain only points to Readable.
      var realHasInstance;
      if (typeof Symbol === 'function' && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] === 'function') {
        realHasInstance = Function.prototype[Symbol.hasInstance];
        Object.defineProperty(Writable, Symbol.hasInstance, {
          value: function (object) {
            if (realHasInstance.call(this, object)) return true;
            if (this !== Writable) return false;

            return object && object._writableState instanceof WritableState;
          }
        });
      } else {
        realHasInstance = function (object) {
          return object instanceof this;
        };
      }

      function Writable(options) {
        Duplex = Duplex || require('./_stream_duplex');

        // Writable ctor is applied to Duplexes, too.
        // `realHasInstance` is necessary because using plain `instanceof`
        // would return false, as no `_writableState` property is attached.

        // Trying to use the custom `instanceof` for Writable here will also break the
        // Node.js LazyTransform implementation, which has a non-trivial getter for
        // `_writableState` that would lead to infinite recursion.
        if (!realHasInstance.call(Writable, this) && !(this instanceof Duplex)) {
          return new Writable(options);
        }

        this._writableState = new WritableState(options, this);

        // legacy.
        this.writable = true;

        if (options) {
          if (typeof options.write === 'function') this._write = options.write;

          if (typeof options.writev === 'function') this._writev = options.writev;

          if (typeof options.destroy === 'function') this._destroy = options.destroy;

          if (typeof options.final === 'function') this._final = options.final;
        }

        Stream.call(this);
      }

      // Otherwise people can pipe Writable streams, which is just wrong.
      Writable.prototype.pipe = function () {
        this.emit('error', new Error('Cannot pipe, not readable'));
      };

      function writeAfterEnd(stream, cb) {
        var er = new Error('write after end');
        // TODO: defer error events consistently everywhere, not just the cb
        stream.emit('error', er);
        pna.nextTick(cb, er);
      }

      // Checks that a user-supplied chunk is valid, especially for the particular
      // mode the stream is in. Currently this means that `null` is never accepted
      // and undefined/non-string values are only allowed in object mode.
      function validChunk(stream, state, chunk, cb) {
        var valid = true;
        var er = false;

        if (chunk === null) {
          er = new TypeError('May not write null values to stream');
        } else if (typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
          er = new TypeError('Invalid non-string/buffer chunk');
        }
        if (er) {
          stream.emit('error', er);
          pna.nextTick(cb, er);
          valid = false;
        }
        return valid;
      }

      Writable.prototype.write = function (chunk, encoding, cb) {
        var state = this._writableState;
        var ret = false;
        var isBuf = !state.objectMode && _isUint8Array(chunk);

        if (isBuf && !Buffer.isBuffer(chunk)) {
          chunk = _uint8ArrayToBuffer(chunk);
        }

        if (typeof encoding === 'function') {
          cb = encoding;
          encoding = null;
        }

        if (isBuf) encoding = 'buffer'; else if (!encoding) encoding = state.defaultEncoding;

        if (typeof cb !== 'function') cb = nop;

        if (state.ended) writeAfterEnd(this, cb); else if (isBuf || validChunk(this, state, chunk, cb)) {
          state.pendingcb++;
          ret = writeOrBuffer(this, state, isBuf, chunk, encoding, cb);
        }

        return ret;
      };

      Writable.prototype.cork = function () {
        var state = this._writableState;

        state.corked++;
      };

      Writable.prototype.uncork = function () {
        var state = this._writableState;

        if (state.corked) {
          state.corked--;

          if (!state.writing && !state.corked && !state.finished && !state.bufferProcessing && state.bufferedRequest) clearBuffer(this, state);
        }
      };

      Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
        // node::ParseEncoding() requires lower case.
        if (typeof encoding === 'string') encoding = encoding.toLowerCase();
        if (!(['hex', 'utf8', 'utf-8', 'ascii', 'binary', 'base64', 'ucs2', 'ucs-2', 'utf16le', 'utf-16le', 'raw'].indexOf((encoding + '').toLowerCase()) > -1)) throw new TypeError('Unknown encoding: ' + encoding);
        this._writableState.defaultEncoding = encoding;
        return this;
      };

      function decodeChunk(state, chunk, encoding) {
        if (!state.objectMode && state.decodeStrings !== false && typeof chunk === 'string') {
          chunk = Buffer.from(chunk, encoding);
        }
        return chunk;
      }

      Object.defineProperty(Writable.prototype, 'writableHighWaterMark', {
        // making it explicit this property is not enumerable
        // because otherwise some prototype manipulation in
        // userland will fail
        enumerable: false,
        get: function () {
          return this._writableState.highWaterMark;
        }
      });

      // if we're already writing something, then just put this
      // in the queue, and wait our turn.  Otherwise, call _write
      // If we return false, then we need a drain event, so set that flag.
      function writeOrBuffer(stream, state, isBuf, chunk, encoding, cb) {
        if (!isBuf) {
          var newChunk = decodeChunk(state, chunk, encoding);
          if (chunk !== newChunk) {
            isBuf = true;
            encoding = 'buffer';
            chunk = newChunk;
          }
        }
        var len = state.objectMode ? 1 : chunk.length;

        state.length += len;

        var ret = state.length < state.highWaterMark;
        // we must ensure that previous needDrain will not be reset to false.
        if (!ret) state.needDrain = true;

        if (state.writing || state.corked) {
          var last = state.lastBufferedRequest;
          state.lastBufferedRequest = {
            chunk: chunk,
            encoding: encoding,
            isBuf: isBuf,
            callback: cb,
            next: null
          };
          if (last) {
            last.next = state.lastBufferedRequest;
          } else {
            state.bufferedRequest = state.lastBufferedRequest;
          }
          state.bufferedRequestCount += 1;
        } else {
          doWrite(stream, state, false, len, chunk, encoding, cb);
        }

        return ret;
      }

      function doWrite(stream, state, writev, len, chunk, encoding, cb) {
        state.writelen = len;
        state.writecb = cb;
        state.writing = true;
        state.sync = true;
        if (writev) stream._writev(chunk, state.onwrite); else stream._write(chunk, encoding, state.onwrite);
        state.sync = false;
      }

      function onwriteError(stream, state, sync, er, cb) {
        --state.pendingcb;

        if (sync) {
          // defer the callback if we are being called synchronously
          // to avoid piling up things on the stack
          pna.nextTick(cb, er);
          // this can emit finish, and it will always happen
          // after error
          pna.nextTick(finishMaybe, stream, state);
          stream._writableState.errorEmitted = true;
          stream.emit('error', er);
        } else {
          // the caller expect this to happen before if
          // it is async
          cb(er);
          stream._writableState.errorEmitted = true;
          stream.emit('error', er);
          // this can emit finish, but finish must
          // always follow error
          finishMaybe(stream, state);
        }
      }

      function onwriteStateUpdate(state) {
        state.writing = false;
        state.writecb = null;
        state.length -= state.writelen;
        state.writelen = 0;
      }

      function onwrite(stream, er) {
        var state = stream._writableState;
        var sync = state.sync;
        var cb = state.writecb;

        onwriteStateUpdate(state);

        if (er) onwriteError(stream, state, sync, er, cb); else {
          // Check if we're actually ready to finish, but don't emit yet
          var finished = needFinish(state);

          if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {
            clearBuffer(stream, state);
          }

          if (sync) {
            /*<replacement>*/
            asyncWrite(afterWrite, stream, state, finished, cb);
            /*</replacement>*/
          } else {
            afterWrite(stream, state, finished, cb);
          }
        }
      }

      function afterWrite(stream, state, finished, cb) {
        if (!finished) onwriteDrain(stream, state);
        state.pendingcb--;
        cb();
        finishMaybe(stream, state);
      }

      // Must force callback to be called on nextTick, so that we don't
      // emit 'drain' before the write() consumer gets the 'false' return
      // value, and has a chance to attach a 'drain' listener.
      function onwriteDrain(stream, state) {
        if (state.length === 0 && state.needDrain) {
          state.needDrain = false;
          stream.emit('drain');
        }
      }

      // if there's something in the buffer waiting, then process it
      function clearBuffer(stream, state) {
        state.bufferProcessing = true;
        var entry = state.bufferedRequest;

        if (stream._writev && entry && entry.next) {
          // Fast case, write everything using _writev()
          var l = state.bufferedRequestCount;
          var buffer = new Array(l);
          var holder = state.corkedRequestsFree;
          holder.entry = entry;

          var count = 0;
          var allBuffers = true;
          while (entry) {
            buffer[count] = entry;
            if (!entry.isBuf) allBuffers = false;
            entry = entry.next;
            count += 1;
          }
          buffer.allBuffers = allBuffers;

          doWrite(stream, state, true, state.length, buffer, '', holder.finish);

          // doWrite is almost always async, defer these to save a bit of time
          // as the hot path ends with doWrite
          state.pendingcb++;
          state.lastBufferedRequest = null;
          if (holder.next) {
            state.corkedRequestsFree = holder.next;
            holder.next = null;
          } else {
            state.corkedRequestsFree = new CorkedRequest(state);
          }
          state.bufferedRequestCount = 0;
        } else {
          // Slow case, write chunks one-by-one
          while (entry) {
            var chunk = entry.chunk;
            var encoding = entry.encoding;
            var cb = entry.callback;
            var len = state.objectMode ? 1 : chunk.length;

            doWrite(stream, state, false, len, chunk, encoding, cb);
            entry = entry.next;
            state.bufferedRequestCount--;
            // if we didn't call the onwrite immediately, then
            // it means that we need to wait until it does.
            // also, that means that the chunk and cb are currently
            // being processed, so move the buffer counter past them.
            if (state.writing) {
              break;
            }
          }

          if (entry === null) state.lastBufferedRequest = null;
        }

        state.bufferedRequest = entry;
        state.bufferProcessing = false;
      }

      Writable.prototype._write = function (chunk, encoding, cb) {
        cb(new Error('_write() is not implemented'));
      };

      Writable.prototype._writev = null;

      Writable.prototype.end = function (chunk, encoding, cb) {
        var state = this._writableState;

        if (typeof chunk === 'function') {
          cb = chunk;
          chunk = null;
          encoding = null;
        } else if (typeof encoding === 'function') {
          cb = encoding;
          encoding = null;
        }

        if (chunk !== null && chunk !== undefined) this.write(chunk, encoding);

        // .end() fully uncorks
        if (state.corked) {
          state.corked = 1;
          this.uncork();
        }

        // ignore unnecessary end() calls.
        if (!state.ending && !state.finished) endWritable(this, state, cb);
      };

      function needFinish(state) {
        return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
      }
      function callFinal(stream, state) {
        stream._final(function (err) {
          state.pendingcb--;
          if (err) {
            stream.emit('error', err);
          }
          state.prefinished = true;
          stream.emit('prefinish');
          finishMaybe(stream, state);
        });
      }
      function prefinish(stream, state) {
        if (!state.prefinished && !state.finalCalled) {
          if (typeof stream._final === 'function') {
            state.pendingcb++;
            state.finalCalled = true;
            pna.nextTick(callFinal, stream, state);
          } else {
            state.prefinished = true;
            stream.emit('prefinish');
          }
        }
      }

      function finishMaybe(stream, state) {
        var need = needFinish(state);
        if (need) {
          prefinish(stream, state);
          if (state.pendingcb === 0) {
            state.finished = true;
            stream.emit('finish');
          }
        }
        return need;
      }

      function endWritable(stream, state, cb) {
        state.ending = true;
        finishMaybe(stream, state);
        if (cb) {
          if (state.finished) pna.nextTick(cb); else stream.once('finish', cb);
        }
        state.ended = true;
        stream.writable = false;
      }

      function onCorkedFinish(corkReq, state, err) {
        var entry = corkReq.entry;
        corkReq.entry = null;
        while (entry) {
          var cb = entry.callback;
          state.pendingcb--;
          cb(err);
          entry = entry.next;
        }
        if (state.corkedRequestsFree) {
          state.corkedRequestsFree.next = corkReq;
        } else {
          state.corkedRequestsFree = corkReq;
        }
      }

      Object.defineProperty(Writable.prototype, 'destroyed', {
        get: function () {
          if (this._writableState === undefined) {
            return false;
          }
          return this._writableState.destroyed;
        },
        set: function (value) {
          // we ignore the value if the stream
          // has not been initialized yet
          if (!this._writableState) {
            return;
          }

          // backward compatibility, the user is explicitly
          // managing destroyed
          this._writableState.destroyed = value;
        }
      });

      Writable.prototype.destroy = destroyImpl.destroy;
      Writable.prototype._undestroy = destroyImpl.undestroy;
      Writable.prototype._destroy = function (err, cb) {
        this.end();
        cb(err);
      };
    }).call(this, require('_process'), typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
  }, { "./_stream_duplex": 17, "./internal/streams/destroy": 23, "./internal/streams/stream": 24, "_process": 12, "core-util-is": 5, "inherits": 8, "process-nextick-args": 11, "safe-buffer": 27, "util-deprecate": 35 }], 22: [function (require, module, exports) {
    'use strict';

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    var Buffer = require('safe-buffer').Buffer;
    var util = require('util');

    function copyBuffer(src, target, offset) {
      src.copy(target, offset);
    }

    module.exports = function () {
      function BufferList() {
        _classCallCheck(this, BufferList);

        this.head = null;
        this.tail = null;
        this.length = 0;
      }

      BufferList.prototype.push = function push(v) {
        var entry = { data: v, next: null };
        if (this.length > 0) this.tail.next = entry; else this.head = entry;
        this.tail = entry;
        ++this.length;
      };

      BufferList.prototype.unshift = function unshift(v) {
        var entry = { data: v, next: this.head };
        if (this.length === 0) this.tail = entry;
        this.head = entry;
        ++this.length;
      };

      BufferList.prototype.shift = function shift() {
        if (this.length === 0) return;
        var ret = this.head.data;
        if (this.length === 1) this.head = this.tail = null; else this.head = this.head.next;
        --this.length;
        return ret;
      };

      BufferList.prototype.clear = function clear() {
        this.head = this.tail = null;
        this.length = 0;
      };

      BufferList.prototype.join = function join(s) {
        if (this.length === 0) return '';
        var p = this.head;
        var ret = '' + p.data;
        while (p = p.next) {
          ret += s + p.data;
        } return ret;
      };

      BufferList.prototype.concat = function concat(n) {
        if (this.length === 0) return Buffer.alloc(0);
        if (this.length === 1) return this.head.data;
        var ret = Buffer.allocUnsafe(n >>> 0);
        var p = this.head;
        var i = 0;
        while (p) {
          copyBuffer(p.data, ret, i);
          i += p.data.length;
          p = p.next;
        }
        return ret;
      };

      return BufferList;
    }();

    if (util && util.inspect && util.inspect.custom) {
      module.exports.prototype[util.inspect.custom] = function () {
        var obj = util.inspect({ length: this.length });
        return this.constructor.name + ' ' + obj;
      };
    }
  }, { "safe-buffer": 27, "util": 2 }], 23: [function (require, module, exports) {
    'use strict';

    /*<replacement>*/

    var pna = require('process-nextick-args');
    /*</replacement>*/

    // undocumented cb() API, needed for core, not for public API
    function destroy(err, cb) {
      var _this = this;

      var readableDestroyed = this._readableState && this._readableState.destroyed;
      var writableDestroyed = this._writableState && this._writableState.destroyed;

      if (readableDestroyed || writableDestroyed) {
        if (cb) {
          cb(err);
        } else if (err && (!this._writableState || !this._writableState.errorEmitted)) {
          pna.nextTick(emitErrorNT, this, err);
        }
        return this;
      }

      // we set destroyed to true before firing error callbacks in order
      // to make it re-entrance safe in case destroy() is called within callbacks

      if (this._readableState) {
        this._readableState.destroyed = true;
      }

      // if this is a duplex stream mark the writable part as destroyed as well
      if (this._writableState) {
        this._writableState.destroyed = true;
      }

      this._destroy(err || null, function (err) {
        if (!cb && err) {
          pna.nextTick(emitErrorNT, _this, err);
          if (_this._writableState) {
            _this._writableState.errorEmitted = true;
          }
        } else if (cb) {
          cb(err);
        }
      });

      return this;
    }

    function undestroy() {
      if (this._readableState) {
        this._readableState.destroyed = false;
        this._readableState.reading = false;
        this._readableState.ended = false;
        this._readableState.endEmitted = false;
      }

      if (this._writableState) {
        this._writableState.destroyed = false;
        this._writableState.ended = false;
        this._writableState.ending = false;
        this._writableState.finished = false;
        this._writableState.errorEmitted = false;
      }
    }

    function emitErrorNT(self, err) {
      self.emit('error', err);
    }

    module.exports = {
      destroy: destroy,
      undestroy: undestroy
    };
  }, { "process-nextick-args": 11 }], 24: [function (require, module, exports) {
    module.exports = require('events').EventEmitter;

  }, { "events": 6 }], 25: [function (require, module, exports) {
    // Copyright Joyent, Inc. and other Node contributors.
    //
    // Permission is hereby granted, free of charge, to any person obtaining a
    // copy of this software and associated documentation files (the
    // "Software"), to deal in the Software without restriction, including
    // without limitation the rights to use, copy, modify, merge, publish,
    // distribute, sublicense, and/or sell copies of the Software, and to permit
    // persons to whom the Software is furnished to do so, subject to the
    // following conditions:
    //
    // The above copyright notice and this permission notice shall be included
    // in all copies or substantial portions of the Software.
    //
    // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
    // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
    // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
    // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
    // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
    // USE OR OTHER DEALINGS IN THE SOFTWARE.

    'use strict';

    /*<replacement>*/

    var Buffer = require('safe-buffer').Buffer;
    /*</replacement>*/

    var isEncoding = Buffer.isEncoding || function (encoding) {
      encoding = '' + encoding;
      switch (encoding && encoding.toLowerCase()) {
        case 'hex': case 'utf8': case 'utf-8': case 'ascii': case 'binary': case 'base64': case 'ucs2': case 'ucs-2': case 'utf16le': case 'utf-16le': case 'raw':
          return true;
        default:
          return false;
      }
    };

    function _normalizeEncoding(enc) {
      if (!enc) return 'utf8';
      var retried;
      while (true) {
        switch (enc) {
          case 'utf8':
          case 'utf-8':
            return 'utf8';
          case 'ucs2':
          case 'ucs-2':
          case 'utf16le':
          case 'utf-16le':
            return 'utf16le';
          case 'latin1':
          case 'binary':
            return 'latin1';
          case 'base64':
          case 'ascii':
          case 'hex':
            return enc;
          default:
            if (retried) return; // undefined
            enc = ('' + enc).toLowerCase();
            retried = true;
        }
      }
    };

    // Do not cache `Buffer.isEncoding` when checking encoding names as some
    // modules monkey-patch it to support additional encodings
    function normalizeEncoding(enc) {
      var nenc = _normalizeEncoding(enc);
      if (typeof nenc !== 'string' && (Buffer.isEncoding === isEncoding || !isEncoding(enc))) throw new Error('Unknown encoding: ' + enc);
      return nenc || enc;
    }

    // StringDecoder provides an interface for efficiently splitting a series of
    // buffers into a series of JS strings without breaking apart multi-byte
    // characters.
    exports.StringDecoder = StringDecoder;
    function StringDecoder(encoding) {
      this.encoding = normalizeEncoding(encoding);
      var nb;
      switch (this.encoding) {
        case 'utf16le':
          this.text = utf16Text;
          this.end = utf16End;
          nb = 4;
          break;
        case 'utf8':
          this.fillLast = utf8FillLast;
          nb = 4;
          break;
        case 'base64':
          this.text = base64Text;
          this.end = base64End;
          nb = 3;
          break;
        default:
          this.write = simpleWrite;
          this.end = simpleEnd;
          return;
      }
      this.lastNeed = 0;
      this.lastTotal = 0;
      this.lastChar = Buffer.allocUnsafe(nb);
    }

    StringDecoder.prototype.write = function (buf) {
      if (buf.length === 0) return '';
      var r;
      var i;
      if (this.lastNeed) {
        r = this.fillLast(buf);
        if (r === undefined) return '';
        i = this.lastNeed;
        this.lastNeed = 0;
      } else {
        i = 0;
      }
      if (i < buf.length) return r ? r + this.text(buf, i) : this.text(buf, i);
      return r || '';
    };

    StringDecoder.prototype.end = utf8End;

    // Returns only complete characters in a Buffer
    StringDecoder.prototype.text = utf8Text;

    // Attempts to complete a partial non-UTF-8 character using bytes from a Buffer
    StringDecoder.prototype.fillLast = function (buf) {
      if (this.lastNeed <= buf.length) {
        buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed);
        return this.lastChar.toString(this.encoding, 0, this.lastTotal);
      }
      buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, buf.length);
      this.lastNeed -= buf.length;
    };

    // Checks the type of a UTF-8 byte, whether it's ASCII, a leading byte, or a
    // continuation byte. If an invalid byte is detected, -2 is returned.
    function utf8CheckByte(byte) {
      if (byte <= 0x7F) return 0; else if (byte >> 5 === 0x06) return 2; else if (byte >> 4 === 0x0E) return 3; else if (byte >> 3 === 0x1E) return 4;
      return byte >> 6 === 0x02 ? -1 : -2;
    }

    // Checks at most 3 bytes at the end of a Buffer in order to detect an
    // incomplete multi-byte UTF-8 character. The total number of bytes (2, 3, or 4)
    // needed to complete the UTF-8 character (if applicable) are returned.
    function utf8CheckIncomplete(self, buf, i) {
      var j = buf.length - 1;
      if (j < i) return 0;
      var nb = utf8CheckByte(buf[j]);
      if (nb >= 0) {
        if (nb > 0) self.lastNeed = nb - 1;
        return nb;
      }
      if (--j < i || nb === -2) return 0;
      nb = utf8CheckByte(buf[j]);
      if (nb >= 0) {
        if (nb > 0) self.lastNeed = nb - 2;
        return nb;
      }
      if (--j < i || nb === -2) return 0;
      nb = utf8CheckByte(buf[j]);
      if (nb >= 0) {
        if (nb > 0) {
          if (nb === 2) nb = 0; else self.lastNeed = nb - 3;
        }
        return nb;
      }
      return 0;
    }

    // Validates as many continuation bytes for a multi-byte UTF-8 character as
    // needed or are available. If we see a non-continuation byte where we expect
    // one, we "replace" the validated continuation bytes we've seen so far with
    // a single UTF-8 replacement character ('\ufffd'), to match v8's UTF-8 decoding
    // behavior. The continuation byte check is included three times in the case
    // where all of the continuation bytes for a character exist in the same buffer.
    // It is also done this way as a slight performance increase instead of using a
    // loop.
    function utf8CheckExtraBytes(self, buf, p) {
      if ((buf[0] & 0xC0) !== 0x80) {
        self.lastNeed = 0;
        return '\ufffd';
      }
      if (self.lastNeed > 1 && buf.length > 1) {
        if ((buf[1] & 0xC0) !== 0x80) {
          self.lastNeed = 1;
          return '\ufffd';
        }
        if (self.lastNeed > 2 && buf.length > 2) {
          if ((buf[2] & 0xC0) !== 0x80) {
            self.lastNeed = 2;
            return '\ufffd';
          }
        }
      }
    }

    // Attempts to complete a multi-byte UTF-8 character using bytes from a Buffer.
    function utf8FillLast(buf) {
      var p = this.lastTotal - this.lastNeed;
      var r = utf8CheckExtraBytes(this, buf, p);
      if (r !== undefined) return r;
      if (this.lastNeed <= buf.length) {
        buf.copy(this.lastChar, p, 0, this.lastNeed);
        return this.lastChar.toString(this.encoding, 0, this.lastTotal);
      }
      buf.copy(this.lastChar, p, 0, buf.length);
      this.lastNeed -= buf.length;
    }

    // Returns all complete UTF-8 characters in a Buffer. If the Buffer ended on a
    // partial character, the character's bytes are buffered until the required
    // number of bytes are available.
    function utf8Text(buf, i) {
      var total = utf8CheckIncomplete(this, buf, i);
      if (!this.lastNeed) return buf.toString('utf8', i);
      this.lastTotal = total;
      var end = buf.length - (total - this.lastNeed);
      buf.copy(this.lastChar, 0, end);
      return buf.toString('utf8', i, end);
    }

    // For UTF-8, a replacement character is added when ending on a partial
    // character.
    function utf8End(buf) {
      var r = buf && buf.length ? this.write(buf) : '';
      if (this.lastNeed) return r + '\ufffd';
      return r;
    }

    // UTF-16LE typically needs two bytes per character, but even if we have an even
    // number of bytes available, we need to check if we end on a leading/high
    // surrogate. In that case, we need to wait for the next two bytes in order to
    // decode the last character properly.
    function utf16Text(buf, i) {
      if ((buf.length - i) % 2 === 0) {
        var r = buf.toString('utf16le', i);
        if (r) {
          var c = r.charCodeAt(r.length - 1);
          if (c >= 0xD800 && c <= 0xDBFF) {
            this.lastNeed = 2;
            this.lastTotal = 4;
            this.lastChar[0] = buf[buf.length - 2];
            this.lastChar[1] = buf[buf.length - 1];
            return r.slice(0, -1);
          }
        }
        return r;
      }
      this.lastNeed = 1;
      this.lastTotal = 2;
      this.lastChar[0] = buf[buf.length - 1];
      return buf.toString('utf16le', i, buf.length - 1);
    }

    // For UTF-16LE we do not explicitly append special replacement characters if we
    // end on a partial character, we simply let v8 handle that.
    function utf16End(buf) {
      var r = buf && buf.length ? this.write(buf) : '';
      if (this.lastNeed) {
        var end = this.lastTotal - this.lastNeed;
        return r + this.lastChar.toString('utf16le', 0, end);
      }
      return r;
    }

    function base64Text(buf, i) {
      var n = (buf.length - i) % 3;
      if (n === 0) return buf.toString('base64', i);
      this.lastNeed = 3 - n;
      this.lastTotal = 3;
      if (n === 1) {
        this.lastChar[0] = buf[buf.length - 1];
      } else {
        this.lastChar[0] = buf[buf.length - 2];
        this.lastChar[1] = buf[buf.length - 1];
      }
      return buf.toString('base64', i, buf.length - n);
    }

    function base64End(buf) {
      var r = buf && buf.length ? this.write(buf) : '';
      if (this.lastNeed) return r + this.lastChar.toString('base64', 0, 3 - this.lastNeed);
      return r;
    }

    // Pass bytes on through for single-byte encodings (e.g. ascii, latin1, hex)
    function simpleWrite(buf) {
      return buf.toString(this.encoding);
    }

    function simpleEnd(buf) {
      return buf && buf.length ? this.write(buf) : '';
    }
  }, { "safe-buffer": 27 }], 26: [function (require, module, exports) {
    exports = module.exports = require('./lib/_stream_readable.js');
    exports.Stream = exports;
    exports.Readable = exports;
    exports.Writable = require('./lib/_stream_writable.js');
    exports.Duplex = require('./lib/_stream_duplex.js');
    exports.Transform = require('./lib/_stream_transform.js');
    exports.PassThrough = require('./lib/_stream_passthrough.js');

  }, { "./lib/_stream_duplex.js": 17, "./lib/_stream_passthrough.js": 18, "./lib/_stream_readable.js": 19, "./lib/_stream_transform.js": 20, "./lib/_stream_writable.js": 21 }], 27: [function (require, module, exports) {
    /* eslint-disable node/no-deprecated-api */
    var buffer = require('buffer')
    var Buffer = buffer.Buffer

    // alternative to using Object.keys for old browsers
    function copyProps(src, dst) {
      for (var key in src) {
        dst[key] = src[key]
      }
    }
    if (Buffer.from && Buffer.alloc && Buffer.allocUnsafe && Buffer.allocUnsafeSlow) {
      module.exports = buffer
    } else {
      // Copy properties from require('buffer')
      copyProps(buffer, exports)
      exports.Buffer = SafeBuffer
    }

    function SafeBuffer(arg, encodingOrOffset, length) {
      return Buffer(arg, encodingOrOffset, length)
    }

    // Copy static methods from Buffer
    copyProps(Buffer, SafeBuffer)

    SafeBuffer.from = function (arg, encodingOrOffset, length) {
      if (typeof arg === 'number') {
        throw new TypeError('Argument must not be a number')
      }
      return Buffer(arg, encodingOrOffset, length)
    }

    SafeBuffer.alloc = function (size, fill, encoding) {
      if (typeof size !== 'number') {
        throw new TypeError('Argument must be a number')
      }
      var buf = Buffer(size)
      if (fill !== undefined) {
        if (typeof encoding === 'string') {
          buf.fill(fill, encoding)
        } else {
          buf.fill(fill)
        }
      } else {
        buf.fill(0)
      }
      return buf
    }

    SafeBuffer.allocUnsafe = function (size) {
      if (typeof size !== 'number') {
        throw new TypeError('Argument must be a number')
      }
      return Buffer(size)
    }

    SafeBuffer.allocUnsafeSlow = function (size) {
      if (typeof size !== 'number') {
        throw new TypeError('Argument must be a number')
      }
      return buffer.SlowBuffer(size)
    }

  }, { "buffer": 3 }], 28: [function (require, module, exports) {
    (function (global) {
      var ClientRequest = require('./lib/request')
      var response = require('./lib/response')
      var extend = require('xtend')
      var statusCodes = require('builtin-status-codes')
      var url = require('url')

      var http = exports

      http.request = function (opts, cb) {
        if (typeof opts === 'string')
          opts = url.parse(opts)
        else
          opts = extend(opts)

        // Normally, the page is loaded from http or https, so not specifying a protocol
        // will result in a (valid) protocol-relative url. However, this won't work if
        // the protocol is something else, like 'file:'
        var defaultProtocol = global.location.protocol.search(/^https?:$/) === -1 ? 'http:' : ''

        var protocol = opts.protocol || defaultProtocol
        var host = opts.hostname || opts.host
        var port = opts.port
        var path = opts.path || '/'

        // Necessary for IPv6 addresses
        if (host && host.indexOf(':') !== -1)
          host = '[' + host + ']'

        // This may be a relative url. The browser should always be able to interpret it correctly.
        opts.url = (host ? (protocol + '//' + host) : '') + (port ? ':' + port : '') + path
        opts.method = (opts.method || 'GET').toUpperCase()
        opts.headers = opts.headers || {}

        // Also valid opts.auth, opts.mode

        var req = new ClientRequest(opts)
        if (cb)
          req.on('response', cb)
        return req
      }

      http.get = function get(opts, cb) {
        var req = http.request(opts, cb)
        req.end()
        return req
      }

      http.ClientRequest = ClientRequest
      http.IncomingMessage = response.IncomingMessage

      http.Agent = function () { }
      http.Agent.defaultMaxSockets = 4

      http.globalAgent = new http.Agent()

      http.STATUS_CODES = statusCodes

      http.METHODS = [
        'CHECKOUT',
        'CONNECT',
        'COPY',
        'DELETE',
        'GET',
        'HEAD',
        'LOCK',
        'M-SEARCH',
        'MERGE',
        'MKACTIVITY',
        'MKCOL',
        'MOVE',
        'NOTIFY',
        'OPTIONS',
        'PATCH',
        'POST',
        'PROPFIND',
        'PROPPATCH',
        'PURGE',
        'PUT',
        'REPORT',
        'SEARCH',
        'SUBSCRIBE',
        'TRACE',
        'UNLOCK',
        'UNSUBSCRIBE'
      ]
    }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
  }, { "./lib/request": 30, "./lib/response": 31, "builtin-status-codes": 4, "url": 33, "xtend": 36 }], 29: [function (require, module, exports) {
    (function (global) {
      exports.fetch = isFunction(global.fetch) && isFunction(global.ReadableStream)

      exports.writableStream = isFunction(global.WritableStream)

      exports.abortController = isFunction(global.AbortController)

      exports.blobConstructor = false
      try {
        new Blob([new ArrayBuffer(1)])
        exports.blobConstructor = true
      } catch (e) { }

      // The xhr request to example.com may violate some restrictive CSP configurations,
      // so if we're running in a browser that supports `fetch`, avoid calling getXHR()
      // and assume support for certain features below.
      var xhr
      function getXHR() {
        // Cache the xhr value
        if (xhr !== undefined) return xhr

        if (global.XMLHttpRequest) {
          xhr = new global.XMLHttpRequest()
          // If XDomainRequest is available (ie only, where xhr might not work
          // cross domain), use the page location. Otherwise use example.com
          // Note: this doesn't actually make an http request.
          try {
            xhr.open('GET', global.XDomainRequest ? '/' : 'https://example.com')
          } catch (e) {
            xhr = null
          }
        } else {
          // Service workers don't have XHR
          xhr = null
        }
        return xhr
      }

      function checkTypeSupport(type) {
        var xhr = getXHR()
        if (!xhr) return false
        try {
          xhr.responseType = type
          return xhr.responseType === type
        } catch (e) { }
        return false
      }

      // For some strange reason, Safari 7.0 reports typeof global.ArrayBuffer === 'object'.
      // Safari 7.1 appears to have fixed this bug.
      var haveArrayBuffer = typeof global.ArrayBuffer !== 'undefined'
      var haveSlice = haveArrayBuffer && isFunction(global.ArrayBuffer.prototype.slice)

      // If fetch is supported, then arraybuffer will be supported too. Skip calling
      // checkTypeSupport(), since that calls getXHR().
      exports.arraybuffer = exports.fetch || (haveArrayBuffer && checkTypeSupport('arraybuffer'))

      // These next two tests unavoidably show warnings in Chrome. Since fetch will always
      // be used if it's available, just return false for these to avoid the warnings.
      exports.msstream = !exports.fetch && haveSlice && checkTypeSupport('ms-stream')
      exports.mozchunkedarraybuffer = !exports.fetch && haveArrayBuffer &&
        checkTypeSupport('moz-chunked-arraybuffer')

      // If fetch is supported, then overrideMimeType will be supported too. Skip calling
      // getXHR().
      exports.overrideMimeType = exports.fetch || (getXHR() ? isFunction(getXHR().overrideMimeType) : false)

      exports.vbArray = isFunction(global.VBArray)

      function isFunction(value) {
        return typeof value === 'function'
      }

      xhr = null // Help gc

    }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
  }, {}], 30: [function (require, module, exports) {
    (function (process, global, Buffer) {
      var capability = require('./capability')
      var inherits = require('inherits')
      var response = require('./response')
      var stream = require('readable-stream')
      var toArrayBuffer = require('to-arraybuffer')

      var IncomingMessage = response.IncomingMessage
      var rStates = response.readyStates

      function decideMode(preferBinary, useFetch) {
        if (capability.fetch && useFetch) {
          return 'fetch'
        } else if (capability.mozchunkedarraybuffer) {
          return 'moz-chunked-arraybuffer'
        } else if (capability.msstream) {
          return 'ms-stream'
        } else if (capability.arraybuffer && preferBinary) {
          return 'arraybuffer'
        } else if (capability.vbArray && preferBinary) {
          return 'text:vbarray'
        } else {
          return 'text'
        }
      }

      var ClientRequest = module.exports = function (opts) {
        var self = this
        stream.Writable.call(self)

        self._opts = opts
        self._body = []
        self._headers = {}
        if (opts.auth)
          self.setHeader('Authorization', 'Basic ' + new Buffer(opts.auth).toString('base64'))
        Object.keys(opts.headers).forEach(function (name) {
          self.setHeader(name, opts.headers[name])
        })

        var preferBinary
        var useFetch = true
        if (opts.mode === 'disable-fetch' || ('requestTimeout' in opts && !capability.abortController)) {
          // If the use of XHR should be preferred. Not typically needed.
          useFetch = false
          preferBinary = true
        } else if (opts.mode === 'prefer-streaming') {
          // If streaming is a high priority but binary compatibility and
          // the accuracy of the 'content-type' header aren't
          preferBinary = false
        } else if (opts.mode === 'allow-wrong-content-type') {
          // If streaming is more important than preserving the 'content-type' header
          preferBinary = !capability.overrideMimeType
        } else if (!opts.mode || opts.mode === 'default' || opts.mode === 'prefer-fast') {
          // Use binary if text streaming may corrupt data or the content-type header, or for speed
          preferBinary = true
        } else {
          throw new Error('Invalid value for opts.mode')
        }
        self._mode = decideMode(preferBinary, useFetch)

        self.on('finish', function () {
          self._onFinish()
        })
      }

      inherits(ClientRequest, stream.Writable)

      ClientRequest.prototype.setHeader = function (name, value) {
        var self = this
        var lowerName = name.toLowerCase()
        // This check is not necessary, but it prevents warnings from browsers about setting unsafe
        // headers. To be honest I'm not entirely sure hiding these warnings is a good thing, but
        // http-browserify did it, so I will too.
        if (unsafeHeaders.indexOf(lowerName) !== -1)
          return

        self._headers[lowerName] = {
          name: name,
          value: value
        }
      }

      ClientRequest.prototype.getHeader = function (name) {
        var header = this._headers[name.toLowerCase()]
        if (header)
          return header.value
        return null
      }

      ClientRequest.prototype.removeHeader = function (name) {
        var self = this
        delete self._headers[name.toLowerCase()]
      }

      ClientRequest.prototype._onFinish = function () {
        var self = this

        if (self._destroyed)
          return
        var opts = self._opts

        var headersObj = self._headers
        var body = null
        if (opts.method !== 'GET' && opts.method !== 'HEAD') {
          if (capability.arraybuffer) {
            body = toArrayBuffer(Buffer.concat(self._body))
          } else if (capability.blobConstructor) {
            body = new global.Blob(self._body.map(function (buffer) {
              return toArrayBuffer(buffer)
            }), {
                type: (headersObj['content-type'] || {}).value || ''
              })
          } else {
            // get utf8 string
            body = Buffer.concat(self._body).toString()
          }
        }

        // create flattened list of headers
        var headersList = []
        Object.keys(headersObj).forEach(function (keyName) {
          var name = headersObj[keyName].name
          var value = headersObj[keyName].value
          if (Array.isArray(value)) {
            value.forEach(function (v) {
              headersList.push([name, v])
            })
          } else {
            headersList.push([name, value])
          }
        })

        if (self._mode === 'fetch') {
          var signal = null
          if (capability.abortController) {
            var controller = new AbortController()
            signal = controller.signal
            self._fetchAbortController = controller

            if ('requestTimeout' in opts && opts.requestTimeout !== 0) {
              global.setTimeout(function () {
                self.emit('requestTimeout')
                if (self._fetchAbortController)
                  self._fetchAbortController.abort()
              }, opts.requestTimeout)
            }
          }

          global.fetch(self._opts.url, {
            method: self._opts.method,
            headers: headersList,
            body: body || undefined,
            mode: 'cors',
            credentials: opts.withCredentials ? 'include' : 'same-origin',
            signal: signal
          }).then(function (response) {
            self._fetchResponse = response
            self._connect()
          }, function (reason) {
            self.emit('error', reason)
          })
        } else {
          var xhr = self._xhr = new global.XMLHttpRequest()
          try {
            xhr.open(self._opts.method, self._opts.url, true)
          } catch (err) {
            process.nextTick(function () {
              self.emit('error', err)
            })
            return
          }

          // Can't set responseType on really old browsers
          if ('responseType' in xhr)
            xhr.responseType = self._mode.split(':')[0]

          if ('withCredentials' in xhr)
            xhr.withCredentials = !!opts.withCredentials

          if (self._mode === 'text' && 'overrideMimeType' in xhr)
            xhr.overrideMimeType('text/plain; charset=x-user-defined')

          if ('requestTimeout' in opts) {
            xhr.timeout = opts.requestTimeout
            xhr.ontimeout = function () {
              self.emit('requestTimeout')
            }
          }

          headersList.forEach(function (header) {
            xhr.setRequestHeader(header[0], header[1])
          })

          self._response = null
          xhr.onreadystatechange = function () {
            switch (xhr.readyState) {
              case rStates.LOADING:
              case rStates.DONE:
                self._onXHRProgress()
                break
            }
          }
          // Necessary for streaming in Firefox, since xhr.response is ONLY defined
          // in onprogress, not in onreadystatechange with xhr.readyState = 3
          if (self._mode === 'moz-chunked-arraybuffer') {
            xhr.onprogress = function () {
              self._onXHRProgress()
            }
          }

          xhr.onerror = function () {
            if (self._destroyed)
              return
            self.emit('error', new Error('XHR error'))
          }

          try {
            xhr.send(body)
          } catch (err) {
            process.nextTick(function () {
              self.emit('error', err)
            })
            return
          }
        }
      }

      /**
       * Checks if xhr.status is readable and non-zero, indicating no error.
       * Even though the spec says it should be available in readyState 3,
       * accessing it throws an exception in IE8
       */
      function statusValid(xhr) {
        try {
          var status = xhr.status
          return (status !== null && status !== 0)
        } catch (e) {
          return false
        }
      }

      ClientRequest.prototype._onXHRProgress = function () {
        var self = this

        if (!statusValid(self._xhr) || self._destroyed)
          return

        if (!self._response)
          self._connect()

        self._response._onXHRProgress()
      }

      ClientRequest.prototype._connect = function () {
        var self = this

        if (self._destroyed)
          return

        self._response = new IncomingMessage(self._xhr, self._fetchResponse, self._mode)
        self._response.on('error', function (err) {
          self.emit('error', err)
        })

        self.emit('response', self._response)
      }

      ClientRequest.prototype._write = function (chunk, encoding, cb) {
        var self = this

        self._body.push(chunk)
        cb()
      }

      ClientRequest.prototype.abort = ClientRequest.prototype.destroy = function () {
        var self = this
        self._destroyed = true
        if (self._response)
          self._response._destroyed = true
        if (self._xhr)
          self._xhr.abort()
        else if (self._fetchAbortController)
          self._fetchAbortController.abort()
      }

      ClientRequest.prototype.end = function (data, encoding, cb) {
        var self = this
        if (typeof data === 'function') {
          cb = data
          data = undefined
        }

        stream.Writable.prototype.end.call(self, data, encoding, cb)
      }

      ClientRequest.prototype.flushHeaders = function () { }
      ClientRequest.prototype.setTimeout = function () { }
      ClientRequest.prototype.setNoDelay = function () { }
      ClientRequest.prototype.setSocketKeepAlive = function () { }

      // Taken from http://www.w3.org/TR/XMLHttpRequest/#the-setrequestheader%28%29-method
      var unsafeHeaders = [
        'accept-charset',
        'accept-encoding',
        'access-control-request-headers',
        'access-control-request-method',
        'connection',
        'content-length',
        'cookie',
        'cookie2',
        'date',
        'dnt',
        'expect',
        'host',
        'keep-alive',
        'origin',
        'referer',
        'te',
        'trailer',
        'transfer-encoding',
        'upgrade',
        'user-agent',
        'via'
      ]

    }).call(this, require('_process'), typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {}, require("buffer").Buffer)
  }, { "./capability": 29, "./response": 31, "_process": 12, "buffer": 3, "inherits": 8, "readable-stream": 26, "to-arraybuffer": 32 }], 31: [function (require, module, exports) {
    (function (process, global, Buffer) {
      var capability = require('./capability')
      var inherits = require('inherits')
      var stream = require('readable-stream')

      var rStates = exports.readyStates = {
        UNSENT: 0,
        OPENED: 1,
        HEADERS_RECEIVED: 2,
        LOADING: 3,
        DONE: 4
      }

      var IncomingMessage = exports.IncomingMessage = function (xhr, response, mode) {
        var self = this
        stream.Readable.call(self)

        self._mode = mode
        self.headers = {}
        self.rawHeaders = []
        self.trailers = {}
        self.rawTrailers = []

        // Fake the 'close' event, but only once 'end' fires
        self.on('end', function () {
          // The nextTick is necessary to prevent the 'request' module from causing an infinite loop
          process.nextTick(function () {
            self.emit('close')
          })
        })

        if (mode === 'fetch') {
          self._fetchResponse = response

          self.url = response.url
          self.statusCode = response.status
          self.statusMessage = response.statusText

          response.headers.forEach(function (header, key) {
            self.headers[key.toLowerCase()] = header
            self.rawHeaders.push(key, header)
          })

          if (capability.writableStream) {
            var writable = new WritableStream({
              write: function (chunk) {
                return new Promise(function (resolve, reject) {
                  if (self._destroyed) {
                    return
                  } else if (self.push(new Buffer(chunk))) {
                    resolve()
                  } else {
                    self._resumeFetch = resolve
                  }
                })
              },
              close: function () {
                if (!self._destroyed)
                  self.push(null)
              },
              abort: function (err) {
                if (!self._destroyed)
                  self.emit('error', err)
              }
            })

            try {
              response.body.pipeTo(writable)
              return
            } catch (e) { } // pipeTo method isn't defined. Can't find a better way to feature test this
          }
          // fallback for when writableStream or pipeTo aren't available
          var reader = response.body.getReader()
          function read() {
            reader.read().then(function (result) {
              if (self._destroyed)
                return
              if (result.done) {
                self.push(null)
                return
              }
              self.push(new Buffer(result.value))
              read()
            }).catch(function (err) {
              if (!self._destroyed)
                self.emit('error', err)
            })
          }
          read()
        } else {
          self._xhr = xhr
          self._pos = 0

          self.url = xhr.responseURL
          self.statusCode = xhr.status
          self.statusMessage = xhr.statusText
          var headers = xhr.getAllResponseHeaders().split(/\r?\n/)
          headers.forEach(function (header) {
            var matches = header.match(/^([^:]+):\s*(.*)/)
            if (matches) {
              var key = matches[1].toLowerCase()
              if (key === 'set-cookie') {
                if (self.headers[key] === undefined) {
                  self.headers[key] = []
                }
                self.headers[key].push(matches[2])
              } else if (self.headers[key] !== undefined) {
                self.headers[key] += ', ' + matches[2]
              } else {
                self.headers[key] = matches[2]
              }
              self.rawHeaders.push(matches[1], matches[2])
            }
          })

          self._charset = 'x-user-defined'
          if (!capability.overrideMimeType) {
            var mimeType = self.rawHeaders['mime-type']
            if (mimeType) {
              var charsetMatch = mimeType.match(/;\s*charset=([^;])(;|$)/)
              if (charsetMatch) {
                self._charset = charsetMatch[1].toLowerCase()
              }
            }
            if (!self._charset)
              self._charset = 'utf-8' // best guess
          }
        }
      }

      inherits(IncomingMessage, stream.Readable)

      IncomingMessage.prototype._read = function () {
        var self = this

        var resolve = self._resumeFetch
        if (resolve) {
          self._resumeFetch = null
          resolve()
        }
      }

      IncomingMessage.prototype._onXHRProgress = function () {
        var self = this

        var xhr = self._xhr

        var response = null
        switch (self._mode) {
          case 'text:vbarray': // For IE9
            if (xhr.readyState !== rStates.DONE)
              break
            try {
              // This fails in IE8
              response = new global.VBArray(xhr.responseBody).toArray()
            } catch (e) { }
            if (response !== null) {
              self.push(new Buffer(response))
              break
            }
          // Falls through in IE8	
          case 'text':
            try { // This will fail when readyState = 3 in IE9. Switch mode and wait for readyState = 4
              response = xhr.responseText
            } catch (e) {
              self._mode = 'text:vbarray'
              break
            }
            if (response.length > self._pos) {
              var newData = response.substr(self._pos)
              if (self._charset === 'x-user-defined') {
                var buffer = new Buffer(newData.length)
                for (var i = 0; i < newData.length; i++)
                  buffer[i] = newData.charCodeAt(i) & 0xff

                self.push(buffer)
              } else {
                self.push(newData, self._charset)
              }
              self._pos = response.length
            }
            break
          case 'arraybuffer':
            if (xhr.readyState !== rStates.DONE || !xhr.response)
              break
            response = xhr.response
            self.push(new Buffer(new Uint8Array(response)))
            break
          case 'moz-chunked-arraybuffer': // take whole
            response = xhr.response
            if (xhr.readyState !== rStates.LOADING || !response)
              break
            self.push(new Buffer(new Uint8Array(response)))
            break
          case 'ms-stream':
            response = xhr.response
            if (xhr.readyState !== rStates.LOADING)
              break
            var reader = new global.MSStreamReader()
            reader.onprogress = function () {
              if (reader.result.byteLength > self._pos) {
                self.push(new Buffer(new Uint8Array(reader.result.slice(self._pos))))
                self._pos = reader.result.byteLength
              }
            }
            reader.onload = function () {
              self.push(null)
            }
            // reader.onerror = ??? // TODO: this
            reader.readAsArrayBuffer(response)
            break
        }

        // The ms-stream case handles end separately in reader.onload()
        if (self._xhr.readyState === rStates.DONE && self._mode !== 'ms-stream') {
          self.push(null)
        }
      }

    }).call(this, require('_process'), typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {}, require("buffer").Buffer)
  }, { "./capability": 29, "_process": 12, "buffer": 3, "inherits": 8, "readable-stream": 26 }], 32: [function (require, module, exports) {
    var Buffer = require('buffer').Buffer

    module.exports = function (buf) {
      // If the buffer is backed by a Uint8Array, a faster version will work
      if (buf instanceof Uint8Array) {
        // If the buffer isn't a subarray, return the underlying ArrayBuffer
        if (buf.byteOffset === 0 && buf.byteLength === buf.buffer.byteLength) {
          return buf.buffer
        } else if (typeof buf.buffer.slice === 'function') {
          // Otherwise we need to get a proper copy
          return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
        }
      }

      if (Buffer.isBuffer(buf)) {
        // This is the slow version that will work with any Buffer
        // implementation (even in old browsers)
        var arrayCopy = new Uint8Array(buf.length)
        var len = buf.length
        for (var i = 0; i < len; i++) {
          arrayCopy[i] = buf[i]
        }
        return arrayCopy.buffer
      } else {
        throw new Error('Argument must be a Buffer')
      }
    }

  }, { "buffer": 3 }], 33: [function (require, module, exports) {
    // Copyright Joyent, Inc. and other Node contributors.
    //
    // Permission is hereby granted, free of charge, to any person obtaining a
    // copy of this software and associated documentation files (the
    // "Software"), to deal in the Software without restriction, including
    // without limitation the rights to use, copy, modify, merge, publish,
    // distribute, sublicense, and/or sell copies of the Software, and to permit
    // persons to whom the Software is furnished to do so, subject to the
    // following conditions:
    //
    // The above copyright notice and this permission notice shall be included
    // in all copies or substantial portions of the Software.
    //
    // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
    // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
    // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
    // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
    // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
    // USE OR OTHER DEALINGS IN THE SOFTWARE.

    'use strict';

    var punycode = require('punycode');
    var util = require('./util');

    exports.parse = urlParse;
    exports.resolve = urlResolve;
    exports.resolveObject = urlResolveObject;
    exports.format = urlFormat;

    exports.Url = Url;

    function Url() {
      this.protocol = null;
      this.slashes = null;
      this.auth = null;
      this.host = null;
      this.port = null;
      this.hostname = null;
      this.hash = null;
      this.search = null;
      this.query = null;
      this.pathname = null;
      this.path = null;
      this.href = null;
    }

    // Reference: RFC 3986, RFC 1808, RFC 2396

    // define these here so at least they only have to be
    // compiled once on the first module load.
    var protocolPattern = /^([a-z0-9.+-]+:)/i,
      portPattern = /:[0-9]*$/,

      // Special case for a simple path URL
      simplePathPattern = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,

      // RFC 2396: characters reserved for delimiting URLs.
      // We actually just auto-escape these.
      delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],

      // RFC 2396: characters not allowed for various reasons.
      unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims),

      // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
      autoEscape = ['\''].concat(unwise),
      // Characters that are never ever allowed in a hostname.
      // Note that any invalid chars are also handled, but these
      // are the ones that are *expected* to be seen, so we fast-path
      // them.
      nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape),
      hostEndingChars = ['/', '?', '#'],
      hostnameMaxLen = 255,
      hostnamePartPattern = /^[+a-z0-9A-Z_-]{0,63}$/,
      hostnamePartStart = /^([+a-z0-9A-Z_-]{0,63})(.*)$/,
      // protocols that can allow "unsafe" and "unwise" chars.
      unsafeProtocol = {
        'javascript': true,
        'javascript:': true
      },
      // protocols that never have a hostname.
      hostlessProtocol = {
        'javascript': true,
        'javascript:': true
      },
      // protocols that always contain a // bit.
      slashedProtocol = {
        'http': true,
        'https': true,
        'ftp': true,
        'gopher': true,
        'file': true,
        'http:': true,
        'https:': true,
        'ftp:': true,
        'gopher:': true,
        'file:': true
      },
      querystring = require('querystring');

    function urlParse(url, parseQueryString, slashesDenoteHost) {
      if (url && util.isObject(url) && url instanceof Url) return url;

      var u = new Url;
      u.parse(url, parseQueryString, slashesDenoteHost);
      return u;
    }

    Url.prototype.parse = function (url, parseQueryString, slashesDenoteHost) {
      if (!util.isString(url)) {
        throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
      }

      // Copy chrome, IE, opera backslash-handling behavior.
      // Back slashes before the query string get converted to forward slashes
      // See: https://code.google.com/p/chromium/issues/detail?id=25916
      var queryIndex = url.indexOf('?'),
        splitter =
          (queryIndex !== -1 && queryIndex < url.indexOf('#')) ? '?' : '#',
        uSplit = url.split(splitter),
        slashRegex = /\\/g;
      uSplit[0] = uSplit[0].replace(slashRegex, '/');
      url = uSplit.join(splitter);

      var rest = url;

      // trim before proceeding.
      // This is to support parse stuff like "  http://foo.com  \n"
      rest = rest.trim();

      if (!slashesDenoteHost && url.split('#').length === 1) {
        // Try fast path regexp
        var simplePath = simplePathPattern.exec(rest);
        if (simplePath) {
          this.path = rest;
          this.href = rest;
          this.pathname = simplePath[1];
          if (simplePath[2]) {
            this.search = simplePath[2];
            if (parseQueryString) {
              this.query = querystring.parse(this.search.substr(1));
            } else {
              this.query = this.search.substr(1);
            }
          } else if (parseQueryString) {
            this.search = '';
            this.query = {};
          }
          return this;
        }
      }

      var proto = protocolPattern.exec(rest);
      if (proto) {
        proto = proto[0];
        var lowerProto = proto.toLowerCase();
        this.protocol = lowerProto;
        rest = rest.substr(proto.length);
      }

      // figure out if it's got a host
      // user@server is *always* interpreted as a hostname, and url
      // resolution will treat //foo/bar as host=foo,path=bar because that's
      // how the browser resolves relative URLs.
      if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
        var slashes = rest.substr(0, 2) === '//';
        if (slashes && !(proto && hostlessProtocol[proto])) {
          rest = rest.substr(2);
          this.slashes = true;
        }
      }

      if (!hostlessProtocol[proto] &&
        (slashes || (proto && !slashedProtocol[proto]))) {

        // there's a hostname.
        // the first instance of /, ?, ;, or # ends the host.
        //
        // If there is an @ in the hostname, then non-host chars *are* allowed
        // to the left of the last @ sign, unless some host-ending character
        // comes *before* the @-sign.
        // URLs are obnoxious.
        //
        // ex:
        // http://a@b@c/ => user:a@b host:c
        // http://a@b?@c => user:a host:c path:/?@c

        // v0.12 TODO(isaacs): This is not quite how Chrome does things.
        // Review our test case against browsers more comprehensively.

        // find the first instance of any hostEndingChars
        var hostEnd = -1;
        for (var i = 0; i < hostEndingChars.length; i++) {
          var hec = rest.indexOf(hostEndingChars[i]);
          if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
            hostEnd = hec;
        }

        // at this point, either we have an explicit point where the
        // auth portion cannot go past, or the last @ char is the decider.
        var auth, atSign;
        if (hostEnd === -1) {
          // atSign can be anywhere.
          atSign = rest.lastIndexOf('@');
        } else {
          // atSign must be in auth portion.
          // http://a@b/c@d => host:b auth:a path:/c@d
          atSign = rest.lastIndexOf('@', hostEnd);
        }

        // Now we have a portion which is definitely the auth.
        // Pull that off.
        if (atSign !== -1) {
          auth = rest.slice(0, atSign);
          rest = rest.slice(atSign + 1);
          this.auth = decodeURIComponent(auth);
        }

        // the host is the remaining to the left of the first non-host char
        hostEnd = -1;
        for (var i = 0; i < nonHostChars.length; i++) {
          var hec = rest.indexOf(nonHostChars[i]);
          if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
            hostEnd = hec;
        }
        // if we still have not hit it, then the entire thing is a host.
        if (hostEnd === -1)
          hostEnd = rest.length;

        this.host = rest.slice(0, hostEnd);
        rest = rest.slice(hostEnd);

        // pull out port.
        this.parseHost();

        // we've indicated that there is a hostname,
        // so even if it's empty, it has to be present.
        this.hostname = this.hostname || '';

        // if hostname begins with [ and ends with ]
        // assume that it's an IPv6 address.
        var ipv6Hostname = this.hostname[0] === '[' &&
          this.hostname[this.hostname.length - 1] === ']';

        // validate a little.
        if (!ipv6Hostname) {
          var hostparts = this.hostname.split(/\./);
          for (var i = 0, l = hostparts.length; i < l; i++) {
            var part = hostparts[i];
            if (!part) continue;
            if (!part.match(hostnamePartPattern)) {
              var newpart = '';
              for (var j = 0, k = part.length; j < k; j++) {
                if (part.charCodeAt(j) > 127) {
                  // we replace non-ASCII char with a temporary placeholder
                  // we need this to make sure size of hostname is not
                  // broken by replacing non-ASCII by nothing
                  newpart += 'x';
                } else {
                  newpart += part[j];
                }
              }
              // we test again with ASCII char only
              if (!newpart.match(hostnamePartPattern)) {
                var validParts = hostparts.slice(0, i);
                var notHost = hostparts.slice(i + 1);
                var bit = part.match(hostnamePartStart);
                if (bit) {
                  validParts.push(bit[1]);
                  notHost.unshift(bit[2]);
                }
                if (notHost.length) {
                  rest = '/' + notHost.join('.') + rest;
                }
                this.hostname = validParts.join('.');
                break;
              }
            }
          }
        }

        if (this.hostname.length > hostnameMaxLen) {
          this.hostname = '';
        } else {
          // hostnames are always lower case.
          this.hostname = this.hostname.toLowerCase();
        }

        if (!ipv6Hostname) {
          // IDNA Support: Returns a punycoded representation of "domain".
          // It only converts parts of the domain name that
          // have non-ASCII characters, i.e. it doesn't matter if
          // you call it with a domain that already is ASCII-only.
          this.hostname = punycode.toASCII(this.hostname);
        }

        var p = this.port ? ':' + this.port : '';
        var h = this.hostname || '';
        this.host = h + p;
        this.href += this.host;

        // strip [ and ] from the hostname
        // the host field still retains them, though
        if (ipv6Hostname) {
          this.hostname = this.hostname.substr(1, this.hostname.length - 2);
          if (rest[0] !== '/') {
            rest = '/' + rest;
          }
        }
      }

      // now rest is set to the post-host stuff.
      // chop off any delim chars.
      if (!unsafeProtocol[lowerProto]) {

        // First, make 100% sure that any "autoEscape" chars get
        // escaped, even if encodeURIComponent doesn't think they
        // need to be.
        for (var i = 0, l = autoEscape.length; i < l; i++) {
          var ae = autoEscape[i];
          if (rest.indexOf(ae) === -1)
            continue;
          var esc = encodeURIComponent(ae);
          if (esc === ae) {
            esc = escape(ae);
          }
          rest = rest.split(ae).join(esc);
        }
      }


      // chop off from the tail first.
      var hash = rest.indexOf('#');
      if (hash !== -1) {
        // got a fragment string.
        this.hash = rest.substr(hash);
        rest = rest.slice(0, hash);
      }
      var qm = rest.indexOf('?');
      if (qm !== -1) {
        this.search = rest.substr(qm);
        this.query = rest.substr(qm + 1);
        if (parseQueryString) {
          this.query = querystring.parse(this.query);
        }
        rest = rest.slice(0, qm);
      } else if (parseQueryString) {
        // no query string, but parseQueryString still requested
        this.search = '';
        this.query = {};
      }
      if (rest) this.pathname = rest;
      if (slashedProtocol[lowerProto] &&
        this.hostname && !this.pathname) {
        this.pathname = '/';
      }

      //to support http.request
      if (this.pathname || this.search) {
        var p = this.pathname || '';
        var s = this.search || '';
        this.path = p + s;
      }

      // finally, reconstruct the href based on what has been validated.
      this.href = this.format();
      return this;
    };

    // format a parsed object into a url string
    function urlFormat(obj) {
      // ensure it's an object, and not a string url.
      // If it's an obj, this is a no-op.
      // this way, you can call url_format() on strings
      // to clean up potentially wonky urls.
      if (util.isString(obj)) obj = urlParse(obj);
      if (!(obj instanceof Url)) return Url.prototype.format.call(obj);
      return obj.format();
    }

    Url.prototype.format = function () {
      var auth = this.auth || '';
      if (auth) {
        auth = encodeURIComponent(auth);
        auth = auth.replace(/%3A/i, ':');
        auth += '@';
      }

      var protocol = this.protocol || '',
        pathname = this.pathname || '',
        hash = this.hash || '',
        host = false,
        query = '';

      if (this.host) {
        host = auth + this.host;
      } else if (this.hostname) {
        host = auth + (this.hostname.indexOf(':') === -1 ?
          this.hostname :
          '[' + this.hostname + ']');
        if (this.port) {
          host += ':' + this.port;
        }
      }

      if (this.query &&
        util.isObject(this.query) &&
        Object.keys(this.query).length) {
        query = querystring.stringify(this.query);
      }

      var search = this.search || (query && ('?' + query)) || '';

      if (protocol && protocol.substr(-1) !== ':') protocol += ':';

      // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
      // unless they had them to begin with.
      if (this.slashes ||
        (!protocol || slashedProtocol[protocol]) && host !== false) {
        host = '//' + (host || '');
        if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
      } else if (!host) {
        host = '';
      }

      if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
      if (search && search.charAt(0) !== '?') search = '?' + search;

      pathname = pathname.replace(/[?#]/g, function (match) {
        return encodeURIComponent(match);
      });
      search = search.replace('#', '%23');

      return protocol + host + pathname + search + hash;
    };

    function urlResolve(source, relative) {
      return urlParse(source, false, true).resolve(relative);
    }

    Url.prototype.resolve = function (relative) {
      return this.resolveObject(urlParse(relative, false, true)).format();
    };

    function urlResolveObject(source, relative) {
      if (!source) return relative;
      return urlParse(source, false, true).resolveObject(relative);
    }

    Url.prototype.resolveObject = function (relative) {
      if (util.isString(relative)) {
        var rel = new Url();
        rel.parse(relative, false, true);
        relative = rel;
      }

      var result = new Url();
      var tkeys = Object.keys(this);
      for (var tk = 0; tk < tkeys.length; tk++) {
        var tkey = tkeys[tk];
        result[tkey] = this[tkey];
      }

      // hash is always overridden, no matter what.
      // even href="" will remove it.
      result.hash = relative.hash;

      // if the relative url is empty, then there's nothing left to do here.
      if (relative.href === '') {
        result.href = result.format();
        return result;
      }

      // hrefs like //foo/bar always cut to the protocol.
      if (relative.slashes && !relative.protocol) {
        // take everything except the protocol from relative
        var rkeys = Object.keys(relative);
        for (var rk = 0; rk < rkeys.length; rk++) {
          var rkey = rkeys[rk];
          if (rkey !== 'protocol')
            result[rkey] = relative[rkey];
        }

        //urlParse appends trailing / to urls like http://www.example.com
        if (slashedProtocol[result.protocol] &&
          result.hostname && !result.pathname) {
          result.path = result.pathname = '/';
        }

        result.href = result.format();
        return result;
      }

      if (relative.protocol && relative.protocol !== result.protocol) {
        // if it's a known url protocol, then changing
        // the protocol does weird things
        // first, if it's not file:, then we MUST have a host,
        // and if there was a path
        // to begin with, then we MUST have a path.
        // if it is file:, then the host is dropped,
        // because that's known to be hostless.
        // anything else is assumed to be absolute.
        if (!slashedProtocol[relative.protocol]) {
          var keys = Object.keys(relative);
          for (var v = 0; v < keys.length; v++) {
            var k = keys[v];
            result[k] = relative[k];
          }
          result.href = result.format();
          return result;
        }

        result.protocol = relative.protocol;
        if (!relative.host && !hostlessProtocol[relative.protocol]) {
          var relPath = (relative.pathname || '').split('/');
          while (relPath.length && !(relative.host = relPath.shift()));
          if (!relative.host) relative.host = '';
          if (!relative.hostname) relative.hostname = '';
          if (relPath[0] !== '') relPath.unshift('');
          if (relPath.length < 2) relPath.unshift('');
          result.pathname = relPath.join('/');
        } else {
          result.pathname = relative.pathname;
        }
        result.search = relative.search;
        result.query = relative.query;
        result.host = relative.host || '';
        result.auth = relative.auth;
        result.hostname = relative.hostname || relative.host;
        result.port = relative.port;
        // to support http.request
        if (result.pathname || result.search) {
          var p = result.pathname || '';
          var s = result.search || '';
          result.path = p + s;
        }
        result.slashes = result.slashes || relative.slashes;
        result.href = result.format();
        return result;
      }

      var isSourceAbs = (result.pathname && result.pathname.charAt(0) === '/'),
        isRelAbs = (
          relative.host ||
          relative.pathname && relative.pathname.charAt(0) === '/'
        ),
        mustEndAbs = (isRelAbs || isSourceAbs ||
          (result.host && relative.pathname)),
        removeAllDots = mustEndAbs,
        srcPath = result.pathname && result.pathname.split('/') || [],
        relPath = relative.pathname && relative.pathname.split('/') || [],
        psychotic = result.protocol && !slashedProtocol[result.protocol];

      // if the url is a non-slashed url, then relative
      // links like ../.. should be able
      // to crawl up to the hostname, as well.  This is strange.
      // result.protocol has already been set by now.
      // Later on, put the first path part into the host field.
      if (psychotic) {
        result.hostname = '';
        result.port = null;
        if (result.host) {
          if (srcPath[0] === '') srcPath[0] = result.host;
          else srcPath.unshift(result.host);
        }
        result.host = '';
        if (relative.protocol) {
          relative.hostname = null;
          relative.port = null;
          if (relative.host) {
            if (relPath[0] === '') relPath[0] = relative.host;
            else relPath.unshift(relative.host);
          }
          relative.host = null;
        }
        mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
      }

      if (isRelAbs) {
        // it's absolute.
        result.host = (relative.host || relative.host === '') ?
          relative.host : result.host;
        result.hostname = (relative.hostname || relative.hostname === '') ?
          relative.hostname : result.hostname;
        result.search = relative.search;
        result.query = relative.query;
        srcPath = relPath;
        // fall through to the dot-handling below.
      } else if (relPath.length) {
        // it's relative
        // throw away the existing file, and take the new path instead.
        if (!srcPath) srcPath = [];
        srcPath.pop();
        srcPath = srcPath.concat(relPath);
        result.search = relative.search;
        result.query = relative.query;
      } else if (!util.isNullOrUndefined(relative.search)) {
        // just pull out the search.
        // like href='?foo'.
        // Put this after the other two cases because it simplifies the booleans
        if (psychotic) {
          result.hostname = result.host = srcPath.shift();
          //occationaly the auth can get stuck only in host
          //this especially happens in cases like
          //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
          var authInHost = result.host && result.host.indexOf('@') > 0 ?
            result.host.split('@') : false;
          if (authInHost) {
            result.auth = authInHost.shift();
            result.host = result.hostname = authInHost.shift();
          }
        }
        result.search = relative.search;
        result.query = relative.query;
        //to support http.request
        if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
          result.path = (result.pathname ? result.pathname : '') +
            (result.search ? result.search : '');
        }
        result.href = result.format();
        return result;
      }

      if (!srcPath.length) {
        // no path at all.  easy.
        // we've already handled the other stuff above.
        result.pathname = null;
        //to support http.request
        if (result.search) {
          result.path = '/' + result.search;
        } else {
          result.path = null;
        }
        result.href = result.format();
        return result;
      }

      // if a url ENDs in . or .., then it must get a trailing slash.
      // however, if it ends in anything else non-slashy,
      // then it must NOT get a trailing slash.
      var last = srcPath.slice(-1)[0];
      var hasTrailingSlash = (
        (result.host || relative.host || srcPath.length > 1) &&
        (last === '.' || last === '..') || last === '');

      // strip single dots, resolve double dots to parent dir
      // if the path tries to go above the root, `up` ends up > 0
      var up = 0;
      for (var i = srcPath.length; i >= 0; i--) {
        last = srcPath[i];
        if (last === '.') {
          srcPath.splice(i, 1);
        } else if (last === '..') {
          srcPath.splice(i, 1);
          up++;
        } else if (up) {
          srcPath.splice(i, 1);
          up--;
        }
      }

      // if the path is allowed to go above the root, restore leading ..s
      if (!mustEndAbs && !removeAllDots) {
        for (; up--; up) {
          srcPath.unshift('..');
        }
      }

      if (mustEndAbs && srcPath[0] !== '' &&
        (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
        srcPath.unshift('');
      }

      if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
        srcPath.push('');
      }

      var isAbsolute = srcPath[0] === '' ||
        (srcPath[0] && srcPath[0].charAt(0) === '/');

      // put the host back
      if (psychotic) {
        result.hostname = result.host = isAbsolute ? '' :
          srcPath.length ? srcPath.shift() : '';
        //occationaly the auth can get stuck only in host
        //this especially happens in cases like
        //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
        var authInHost = result.host && result.host.indexOf('@') > 0 ?
          result.host.split('@') : false;
        if (authInHost) {
          result.auth = authInHost.shift();
          result.host = result.hostname = authInHost.shift();
        }
      }

      mustEndAbs = mustEndAbs || (result.host && srcPath.length);

      if (mustEndAbs && !isAbsolute) {
        srcPath.unshift('');
      }

      if (!srcPath.length) {
        result.pathname = null;
        result.path = null;
      } else {
        result.pathname = srcPath.join('/');
      }

      //to support request.http
      if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
        result.path = (result.pathname ? result.pathname : '') +
          (result.search ? result.search : '');
      }
      result.auth = relative.auth || result.auth;
      result.slashes = result.slashes || relative.slashes;
      result.href = result.format();
      return result;
    };

    Url.prototype.parseHost = function () {
      var host = this.host;
      var port = portPattern.exec(host);
      if (port) {
        port = port[0];
        if (port !== ':') {
          this.port = port.substr(1);
        }
        host = host.substr(0, host.length - port.length);
      }
      if (host) this.hostname = host;
    };

  }, { "./util": 34, "punycode": 13, "querystring": 16 }], 34: [function (require, module, exports) {
    'use strict';

    module.exports = {
      isString: function (arg) {
        return typeof (arg) === 'string';
      },
      isObject: function (arg) {
        return typeof (arg) === 'object' && arg !== null;
      },
      isNull: function (arg) {
        return arg === null;
      },
      isNullOrUndefined: function (arg) {
        return arg == null;
      }
    };

  }, {}], 35: [function (require, module, exports) {
    (function (global) {

      /**
       * Module exports.
       */

      module.exports = deprecate;

      /**
       * Mark that a method should not be used.
       * Returns a modified function which warns once by default.
       *
       * If `localStorage.noDeprecation = true` is set, then it is a no-op.
       *
       * If `localStorage.throwDeprecation = true` is set, then deprecated functions
       * will throw an Error when invoked.
       *
       * If `localStorage.traceDeprecation = true` is set, then deprecated functions
       * will invoke `console.trace()` instead of `console.error()`.
       *
       * @param {Function} fn - the function to deprecate
       * @param {String} msg - the string to print to the console when `fn` is invoked
       * @returns {Function} a new "deprecated" version of `fn`
       * @api public
       */

      function deprecate(fn, msg) {
        if (config('noDeprecation')) {
          return fn;
        }

        var warned = false;
        function deprecated() {
          if (!warned) {
            if (config('throwDeprecation')) {
              throw new Error(msg);
            } else if (config('traceDeprecation')) {
              console.trace(msg);
            } else {
              console.warn(msg);
            }
            warned = true;
          }
          return fn.apply(this, arguments);
        }

        return deprecated;
      }

      /**
       * Checks `localStorage` for boolean values for the given `name`.
       *
       * @param {String} name
       * @returns {Boolean}
       * @api private
       */

      function config(name) {
        // accessing global.localStorage can trigger a DOMException in sandboxed iframes
        try {
          if (!global.localStorage) return false;
        } catch (_) {
          return false;
        }
        var val = global.localStorage[name];
        if (null == val) return false;
        return String(val).toLowerCase() === 'true';
      }

    }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
  }, {}], 36: [function (require, module, exports) {
    module.exports = extend

    var hasOwnProperty = Object.prototype.hasOwnProperty;

    function extend() {
      var target = {}

      for (var i = 0; i < arguments.length; i++) {
        var source = arguments[i]

        for (var key in source) {
          if (hasOwnProperty.call(source, key)) {
            target[key] = source[key]
          }
        }
      }

      return target
    }

  }, {}], 37: [function (require, module, exports) {
    // The file contents for the current environment will overwrite these during build.
    // The build system defaults to the dev environment which uses `environment.ts`, but if you do
    // `ng build --env=prod` then `environment.prod.ts` will be used instead.
    // The list of which env maps to which file can be found in `angular-cli.json`.
    "use strict";
    exports.__esModule = true;
    exports.environment = {
      production: false,
      monomer_server_host: 's3.amazonaws.com',
      monomer_server_port: 80,
      monomer_server_path: '/isis-monomer-library/name-symbols.json',
      public_monomer_server_host: 'http://lib.monomer.org/',
      public_monomer_server_port: 80,
      public_monomer_server_path: '',
      // monomer_server_host: 'ionprod',
      // monomer_server_port:8984,
      // monomer_server_path:'/monomer_library/load_all_monomers_as_canonical_helm_structures',
      helm_rules_host: 'ionprod',
      helm_rules_port: 8984,
      helm_rules_path: '/helm_rules/get_helm_rules_for_user',
      polymer_db_host: 'oligodb',
      polymer_db_port: 8080,
      polymer_db_path: '/oligos',
      // load_monomers:"http://ionprod:8984/monomer_library/load_all_monomers_as_canonical_helm_structures", 
      ionis_mids_to_helmstring: "http://ionprod:8888/v1/db/oligos/get_helm?ids=",
      oligo_validation: "http://oligodb:8080/oligos/helm",
      oligo_helm: "http://oligodb:8080/oligos",
      oligo_helm_host: "oligodb",
      oligo_helm_host_port: 8080
    };

  }, {}], 38: [function (require, module, exports) {
    "use strict";
    exports.__esModule = true;
    /* 
     * @name HELMMonomers
      */
    var HELMMonomers = (function () {
      function HELMMonomers() {
      }
      HELMMonomers.loadMonomers = function () {
        // if (HELMMonomers.loading){
        var a = {
          listen: function (_li) {
            _li.complete(HELMMonomers.monomers);
          }
        };
        return a;
        // }
        // else{
        //     HELMMonomers.loading = true;
        // }
        // let req = {
        //     host: environment.public_monomer_server_host,
        //     port: environment.public_monomer_server_port,
        //     path: environment.public_monomer_server_path,
        //     method: 'GET', 
        // };
        //     let li:AsyncListener;
        //     let a:AsyncIt = {
        //     listen ( _li:AsyncListener ) : void
        //     {
        //         li = _li;
        //     }
        // };        
        // console.log ( "\n\n --- loading the public monomers \n\n");
        //  request("http://lib.monomer.org/names", response => this.parse_monomer_json_data ( response, li )).end();     
        // return a;
      };
      HELMMonomers.parse_monomer_json_data = function (res, dbl) {
        console.log(" res." + res.statusCode);
        var data = '';
        var index = 0;
        res.on('data', function (chunk) {
          data += chunk;
          console.log(" data " + data);
        });
        res.on('end', function () {
          if (data != null && data.length > 0) {
            try {
              var js = JSON.parse(data);
              HELMMonomers.setMonomers(js);
              dbl.complete(js);
            }
            catch (e) {
              console.log("Failed to load the helm-monomers:  error loading monomers --> " + e);
            }
          }
        });
      };
      HELMMonomers.setMonomers = function (m) {
        console.log(" " + m.length + " monomers were loaded..... ");
        this.monomers = m;
        this.status = "Monomers are loaded";
      };
      HELMMonomers.prototype.getMonomer = function (symbol, polymerType) {
        if (HELMMonomers.monomers == null || HELMMonomers.monomers.length <= 0) {
          // // for some reason we are stuck in a loop here.. 
          // this.getMonomers().subscribe ( monomers => HELMMonomers.setMonomers ( monomers ));
          return null;
        }
        //console.log ( " helm monomer : " + HELMMonomers.monomers.length );
        for (var _i = 0, _a = HELMMonomers.monomers; _i < _a.length; _i++) {
          var m = _a[_i];
          if (m.symbol.toUpperCase() === symbol.toUpperCase() && m.polymertype.toUpperCase() === polymerType.toUpperCase()) {
            return m;
          }
        }
        return null;
      };
      return HELMMonomers;
    }());
    HELMMonomers.status = "Loading";
    HELMMonomers.loading = false;
    exports.HELMMonomers = HELMMonomers;

  }, {}], 39: [function (require, module, exports) {
    "use strict";
    function __export(m) {
      for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
    }
    exports.__esModule = true;
    __export(require("./helm-monomers"));
    __export(require("./structuredb"));
    var HELMMonomersModule = (function () {
      function HELMMonomersModule() {
      }
      return HELMMonomersModule;
    }());
    exports.HELMMonomersModule = HELMMonomersModule;

  }, { "./helm-monomers": 38, "./structuredb": 40 }], 40: [function (require, module, exports) {
    "use strict";
    exports.__esModule = true;
    var environment_1 = require("../environments/environment");
    var http_1 = require("http");
    var StructureDB = (function () {
      function StructureDB() {
      }
      StructureDB.prototype.getHELM = function (isisno) {
        var _this = this;
        var req = {
          host: environment_1.environment.oligo_helm_host,
          port: environment_1.environment.oligo_helm_host_port,
          path: "/oligos/" + isisno,
          // url: environment.oligo_helm_host + ":" +  environment.oligo_helm_host_port + "/oligos/" + isisno,
          method: 'GET',
          headers: { 'content-type': 'application/json' },
          json: true
        };
        var li = null;
        var a = {
          listen: function (_li) {
            li = _li;
          }
        };
        http_1.request(req, function (response) { return _this.oligoResponse(response, li); }).end();
        return a;
      };
      StructureDB.prototype.oligoResponse = function (res, li) {
        var data = '';
        res.on('data', function (chunk) {
          data += chunk;
        });
        res.on('end', function () {
          if (data != null && data.length > 0) {
            try {
              var js = JSON.parse(data);
              if (js.length > 0) {
                var helm = js[0]['helm'];
                li.complete(helm);
              }
            }
            catch (e) {
              console.log(e);
            }
          }
        });
      };
      StructureDB.prototype.parse_chemistry = function (response) {
        var j = response.json();
        var helm = j[0]['helm'];
        return helm;
      };
      StructureDB.prototype.setHELM = function (helm) {
      };
      return StructureDB;
    }());
    exports.StructureDB = StructureDB;

  }, { "../environments/environment": 37, "http": 28 }], 41: [function (require, module, exports) {
    "use strict";
    function __export(m) {
      for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
    }
    exports.__esModule = true;
    __export(require("./helm_connector"));
    __export(require("./helm_rule_db"));
    __export(require("./helm-structure"));
    __export(require("./rule_engine"));
    var HELMRulesModule = (function () {
      function HELMRulesModule() {
      }
      return HELMRulesModule;
    }());
    exports.HELMRulesModule = HELMRulesModule;

  }, { "./helm-structure": 42, "./helm_connector": 43, "./helm_rule_db": 44, "./rule_engine": 45 }], 42: [function (require, module, exports) {
    "use strict";
    exports.__esModule = true;
    var HELMStructure = (function () {
      function HELMStructure() {
        this.user = "";
        this.pass = "";
        this.helm = "";
      }
      return HELMStructure;
    }());
    exports.HELMStructure = HELMStructure;

  }, {}], 43: [function (require, module, exports) {
    "use strict";
    exports.__esModule = true;
    var HELMConnector = (function () {
      function HELMConnector(helm_parser) {
        this.helm_parser = helm_parser;
      }
      return HELMConnector;
    }());
    exports.HELMConnector = HELMConnector;

  }, {}], 44: [function (require, module, exports) {
    "use strict";
    exports.__esModule = true;
    require("rxjs/add/operator/map");
    var environment_1 = require("../environments/environment");
    var http_1 = require("http");
    var HELMRuleDB = (function () {
      function HELMRuleDB() {
      }
      HELMRuleDB.prototype.list = function (user) {
        var req = {
          host: environment_1.environment.helm_rules_host,
          port: environment_1.environment.helm_rules_port,
          path: environment_1.environment.helm_rules_path,
          method: 'POST',
          body: { "user_id": user },
          headers: { 'content-type': 'application/json' },
          json: true
        };
        http_1.request(req, this.list_name_response).end(JSON.stringify({ "user_id": user }));
      };
      HELMRuleDB.prototype.list_name_response = function (res) {
        var data = '';
        var index = 0;
        res.on('data', function (chunk) {
          data += chunk;
        });
        res.on('end', function () {
          if (data != null) {
            var js = JSON.parse(data);
            if (js.length > 0) {
              // let user = js[0]['user_id']
              // HELMRuleDB.cache.push ( {"user":js} );
              for (var j in js) {
                var rule = js[j];
                console.log(rule['rule_name']);
              }
            }
          }
        });
      };
      HELMRuleDB.prototype.load = function (rules_user, dblistener) {
        HELMRuleDB.dblistener = dblistener;
        var req = {
          host: environment_1.environment.helm_rules_host,
          port: environment_1.environment.helm_rules_port,
          path: environment_1.environment.helm_rules_path,
          method: 'POST',
          body: { "user_id": 'jmilton' },
          headers: { 'content-type': 'application/json' },
          json: true
        };
        http_1.request(req, this.response).end(JSON.stringify({ "user_id": rules_user }));
      };
      HELMRuleDB.prototype.loadRule = function (rules_user, rule_name) {
        var _this = this;
        var req = {
          host: environment_1.environment.helm_rules_host,
          port: environment_1.environment.helm_rules_port,
          path: environment_1.environment.helm_rules_path,
          method: 'POST',
          body: { "user_id": rules_user },
          headers: { 'content-type': 'application/json' },
          json: true
        };
        var li = null;
        var a = {
          listen: function (_li) {
            li = _li;
          }
        };
        http_1.request(req, function (response) { return _this.ruleResponse(response, rule_name, li); }).end(JSON.stringify({ "user_id": rules_user }));
        return a;
      };
      HELMRuleDB.prototype.ruleResponse = function (res, rule_name, dbl) {
        var data = '';
        var index = 0;
        res.on('data', function (chunk) {
          data += chunk;
        });
        res.on('end', function () {
          if (data != null && data.length > 0) {
            // console.log ( " data for the helm rule is " + data );
            try {
              var js = JSON.parse(data);
              if (js.length > 0) {
                var user = js[0]['user_id'];
                HELMRuleDB.cache[user] = js;
                var ruleobj = HELMRuleDB.getRuleFromCache(user, rule_name);
                dbl.complete(ruleobj);
              }
            }
            catch (e) {
              console.log(e);
              console.log(" failed to load the rule " + rule_name);
            }
          }
        });
      };
      HELMRuleDB.getRuleFromCache = function (user, user_rule_name) {
        var i = {};
        // return i;
        var userCache = HELMRuleDB.cache[user];
        if (userCache != null) {
          var keys = Object.keys(userCache);
          for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
            var key = keys_1[_i];
            var item = userCache[key];
            var rule_name = item['rule_name'];
            var rule_value = item['rule_value'];
            // console.log ( " rule name " + rule_name + " vs in name " + user_rule_name );
            if (rule_name != null && rule_name === user_rule_name) {
              return item['rule_value'];
            }
          }
          console.log("\t Failed to find the rule with name :" + user_rule_name + " in the user " + user + " rule database ");
        }
        //         console.log ( " key " + usercache );
        // }
      };
      HELMRuleDB.prototype.response = function (res) {
        // res.setEncoding("utf8");
        var data = '';
        var index = 0;
        res.on('data', function (chunk) {
          // console.log('BODY: ' + chunk);
          // console.log('BODY: ' + index++);
          // let js = JSON.parse(chunk.toString());
          // console.log ( ' json length ' + js.length );
          data += chunk;
        });
        res.on('end', function () {
          if (data != null) {
            var js = JSON.parse(data);
            if (js.length > 0) {
              var user = js[0]['user_id'];
              HELMRuleDB.cache[user] = js;
              if (HELMRuleDB.dblistener != null) {
                HELMRuleDB.dblistener.userLoaded(js);
              }
            }
          }
          // console.log ( ' js ' + js[0]['user_id'] );
          // console.log('BODY: ' + data);
        });
        // console.log ( " res " + res.read())
      };
      return HELMRuleDB;
    }());
    HELMRuleDB.cache = {};
    exports.HELMRuleDB = HELMRuleDB;

  },


  { "../environments/environment": 37, "http": 28, "rxjs/add/operator/map": 57 }], 45: [


    function (require, module, exports) {


      (function (global) {
        ; (function (root) {



          "use strict";
          exports.__esModule = true;
          var helm_parser_1 = require("../helmparser/helm-parser");
          var helm_builder_1 = require("../helmparser/helm-builder");
          var helm_monomers_1 = require("../helm-monomers/helm-monomers");
          var helm_monomers_module_1 = require("../helm-monomers/helm-monomers.module");
          var RuleEngine = (function () {
            function RuleEngine() {
              var mlib = new helm_monomers_1.HELMMonomers();
              this.helm_parser = new HELMParser(mlib);
              this.helm_builder = new HELMBuilder(this.helm_parser, new helm_monomers_module_1.StructureDB());

            }
            /**
             * Calls a blocking sync call on a helm rule.
             *
             * @param ruleType
             * @param rule
             * @param helm
             * @param input
             */
            RuleEngine.prototype.run = function (ruleType, rule, helm, input) {
              if (ruleType === 'backbone') {
                var fn = Function("backbone", "{" + rule + "};");
                var chains = this.helm_parser.parseChains(helm);
                for (var _i = 0, chains_1 = chains; _i < chains_1.length; _i++) {
                  var chain = chains_1[_i];
                  var backbone_1 = this.helm_parser.parse_backbone_sequence(chain);
                  var newbackbone = fn(backbone_1);
                  return this.apply_backbone(chain, newbackbone);
                }
              }
              else if (ruleType === 'branch') {
                var fn = Function("branch", "{" + rule + "};");
                var chains = this.helm_parser.parseChains(helm);
                for (var _a = 0, chains_2 = chains; _a < chains_2.length; _a++) {
                  var chain = chains_2[_a];
                  var branch = this.helm_parser.parse_base_from_nucleotide(helm);
                  var newbackbone = fn(branch);
                  return this.installBranchChemistry(chain, newbackbone);
                }
              }
              else if (ruleType === 'sugars') {
                var fn = Function("sugars", "{" + rule + "};");
                var chains = this.helm_parser.parseChains(helm);
                for (var _b = 0, chains_3 = chains; _b < chains_3.length; _b++) {
                  var chain = chains_3[_b];
                  var sugars = this.helm_parser.parse_sugars_sequence_from_chain(chain);
                  var newbackbone = fn(sugars);
                  // console.log ( newbackbone );
                  return newbackbone;
                  // return this.installSugarChemistry ( chain, newbackbone );
                }
              }
              else {
                if (ruleType === 'helm') {
                  var l = "";
                  if (input != null && input.length > 0) {
                    l = "\n\nvar inputvalue=\"" + input + "\";\n";
                  }
                  var function_value = "{" + l + rule + "  \nreturn helm.toString (); };";
                  // console.log ( 'l ' + function_value );
                  var fn = Function("helm", function_value);
                  this.helm_builder.setHELM(helm);
                  var newhelm = fn(this.helm_builder);
                  return newhelm;
                }
              }
              return helm;
            };
            /**
             *  Run an async helm rule
             */
            RuleEngine.prototype.runAsync = function (rule, helm, input, helm_listener) {
              var l = "";
              if (input != null && input.length > 0) {
                l = "\n\nvar inputvalue=\"" + input + "\";\n";
              }
              var function_value = "{" + l + rule + "  \nreturn helm.toString (); };";
              var fn = Function("helm", "observer", function_value);
              this.helm_builder.setHELM(helm);
              var hb = new helm_builder_1.HELMBuilder(this.helm_builder.parser, this.helm_builder.db);
              var newhelm = fn(this.helm_builder, helm_listener);
              // helm_listener.update_helm(newhelm);
            };
            RuleEngine.prototype.backbone = function (chain) {
              var backbone = this.helm_parser.parse_backbone_sequence(chain);
              return backbone;
            };
            RuleEngine.prototype.apply_backbone = function (chain, backbone) {
              var adjusted_backbone2 = backbone.replace(/[\]]/g, "] ");
              adjusted_backbone2 = adjusted_backbone2.replace(/\s\s+/g, ' ');
              // console.log ( adjusted_backbone2 );
              var bc = adjusted_backbone2.split(' ');
              var chain_start = chain.indexOf('{');
              var chain_end = chain.indexOf('}');
              var prefix = chain.substring(0, chain_start);
              chain = chain.substring(chain_start + 1, chain_end);
              var chain_c = chain.split('.');
              var new_chain = '';
              var index = 0;
              for (var _i = 0, chain_c_1 = chain_c; _i < chain_c_1.length; _i++) {
                var c = chain_c_1[_i];
                if (c.indexOf('(') > 0) {
                  var start = c.indexOf('(');
                  var end = c.indexOf(')');
                  var nuc = c.substring(start + 1, end);
                  var nv = bc[index].trim() + '(' + nuc + ')' + bc[index + 1].trim();
                  new_chain += nv + '.';
                  index += 2;
                }
                else {
                  new_chain += bc[index++] + '.';
                }
                if (index >= bc.length)
                  index = 0;
              }
              if (new_chain.endsWith('.')) {
                new_chain = new_chain.substring(0, new_chain.length - 1);
              }
              return prefix + "{" + new_chain + "}";
            };
            RuleEngine.prototype.installBranchChemistry = function (chain, backbone) {
              var bc = backbone.split('.');
              var chain_start = chain.indexOf('{');
              var chain_end = chain.indexOf('}');
              var prefix = chain.substring(0, chain_start);
              chain = chain.substring(chain_start + 1, chain_end);
              var chain_c = chain.split('.');
              var new_chain = '';
              var index = 0;
              for (var _i = 0, chain_c_2 = chain_c; _i < chain_c_2.length; _i++) {
                var c = chain_c_2[_i];
                if (c.indexOf('(') > 0) {
                  var start = c.indexOf('(');
                  var end = c.indexOf(')');
                  var post = c.substring(end + 1);
                  var pre = c.substring(0, start);
                  var nuc = c.substring(start + 1, end);
                  var nv = pre.trim() + '(' + bc[index] + ')' + post.trim();
                  new_chain += nv + '.';
                  index += 2;
                }
                if (index >= bc.length)
                  index = 0;
              }
              return prefix + "{" + new_chain + "}";
            };
            return RuleEngine;
          }());
          exports.RuleEngine = RuleEngine;




          /** Detect free variables */
          var freeExports = typeof exports == 'object' && exports &&
            !exports.nodeType && exports;
          var freeModule = typeof module == 'object' && module &&
            !module.nodeType && module;
          var freeGlobal = typeof global == 'object' && global;
          if (
            freeGlobal.global === freeGlobal ||
            freeGlobal.window === freeGlobal ||
            freeGlobal.self === freeGlobal
          ) {
            root = freeGlobal;
          }
          root.RuleEngine = RuleEngine;
          // 8888888888888888888888888888888888888888888888888888888
          //root.RuleEngine = RuleEngine;
          function backbone(chain) {
            var backbone = this.helm_parser.parse_backbone_sequence(chain);
            return backbone;
          }

        }(this));
      }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})






    }, { "../helm-monomers/helm-monomers": 38, "../helm-monomers/helm-monomers.module": 39, "../helmparser/helm-builder": 46, "../helmparser/helm-parser": 47 }], 46: [function (require, module, exports) {
      "use strict";


      (function (global) {
        ; (function (root) {



          /** Detect free variables */
          var freeExports = typeof exports == 'object' && exports &&
            !exports.nodeType && exports;
          var freeModule = typeof module == 'object' && module &&
            !module.nodeType && module;
          var freeGlobal = typeof global == 'object' && global;
          if (
            freeGlobal.global === freeGlobal ||
            freeGlobal.window === freeGlobal ||
            freeGlobal.self === freeGlobal
          ) {
            root = freeGlobal;
          }







          exports.__esModule = true;
          var HELMBuilder = (function () {
            function HELMBuilder(parser, db) {
              this.parser = parser;
              this.db = db;
              this.helm = null;
              this.errors = "";
            }
            HELMBuilder.prototype.setHELM = function (helm) {
              this.helm = helm;
            };
            HELMBuilder.prototype.applyChemistry = function (inputvalue, listener) {
              var _this = this;
              //    let c= {
              //             complete ( obj:any ): void {
              //             this.applyChemistryFromHELM (obj, listener )
              //         }
              //    }        
              this.db.getHELM(+inputvalue).listen({
                complete: function (obj) {
                  var nhelm = _this.applyChemistryFromHELM(obj);
                  listener.update_helm(nhelm);
                }
              });
            };
            HELMBuilder.prototype.applyChemistryFromHELM = function (template) {
              console.log(" apply chemistry for chain template : " + template);
              var chain_ids = this.parser.parse_chain_identifiers(template);
              var template_monomers;
              // loop to extract the template monomers 
              for (var _i = 0, chain_ids_1 = chain_ids; _i < chain_ids_1.length; _i++) {
                var ch = chain_ids_1[_i];
                if (ch === "RNA1") {
                  var ch_chain = this.parser.parseChain(ch, template);
                  var chain_template = this.parser.parse_chain_polymer(ch_chain);
                  template_monomers = this.parser.pull_monomer_sequence_from_chain("RNA", chain_template);
                }
              }
              var helm_chain = this.parser.parseChain('RNA1', this.helm);
              var helm_chain_t = this.parser.parse_chain_polymer(helm_chain);
              var helm_monomers = this.parser.pull_monomer_sequence_from_chain("RNA", helm_chain_t);
              console.log(" ----  : " + helm_chain_t);
              var nhelm_rna = [];
              for (var i = 0; i < helm_monomers.length; i++) {
                if (i >= template_monomers.length) {
                }
                else {
                  nhelm_rna[i] = template_monomers[i];
                }
              }
              var result_chain = "";
              var index = 0;
              for (var _a = 0, nhelm_rna_1 = nhelm_rna; _a < nhelm_rna_1.length; _a++) {
                var helm_monomer = nhelm_rna_1[_a];
                if (this.parser.isBranchMonomer(helm_monomer)) {
                  var original_base = helm_monomers[index];
                  if (original_base.length > 1) {
                    original_base = "[" + original_base + "]";
                  }
                  // remove this first
                  if (result_chain.endsWith(".")) {
                    result_chain = result_chain.substring(0, result_chain.length - 1);
                  }
                  result_chain += "(" + original_base + ")";
                }
                else {
                  if (helm_monomer.length > 1) {
                    helm_monomer = "[" + helm_monomer + "]";
                  }
                  result_chain += helm_monomer + ".";
                }
                index++;
              }
              if (result_chain.endsWith(".")) {
                result_chain = result_chain.substring(0, result_chain.length - 1);
              }
              result_chain = "RNA1{" + result_chain + "}";
              this.replaceChain(result_chain);
              // listener.update_helm(this.helm);
              return this.helm;
            };
            HELMBuilder.prototype.incrementConnections = function (chain_id, helm) {
              var connections_for_chain_id = this.parser.parseConnections(helm);
              if (connections_for_chain_id == null || connections_for_chain_id.length <= 0) {
                return helm;
              }
              for (var _i = 0, connections_for_chain_id_1 = connections_for_chain_id; _i < connections_for_chain_id_1.length; _i++) {
                var connection = connections_for_chain_id_1[_i];
                //     CHEM1,RNA1,1:R1-12:R2|CHEM2,RNA1,1:R1-1:R1$$$
                if (connection != null && connection.length > 0) {
                  var connection_parts = connection.split(',');
                  var monomer_connection_part = connection_parts[2]; //monomer_connection_part = "1:R1-15:R2"
                  var primary_chain_id_index = 0;
                  // find the index of the rna 
                  if (connection_parts[0] == chain_id) {
                    primary_chain_id_index = 0;
                  }
                  else {
                    primary_chain_id_index = 1;
                  }
                  // primary_chain_id_index = 1
                  var monomer_connection_partsp = monomer_connection_part.split('-');
                  //  ["1:R1", "15:R2"], monomer_connection_part = "1:R1-15:R2"
                  var primary_chain_id_connection_part = monomer_connection_partsp[primary_chain_id_index];
                  // now all we have to do is find the monomer index value
                  var primary_chain_id_connection_part_sp = primary_chain_id_connection_part.split(":");
                  // [15,R2]
                  var primary_chain_monomer_connection_number = +primary_chain_id_connection_part_sp[0];
                  primary_chain_monomer_connection_number = primary_chain_monomer_connection_number + 1;
                  var new_primary_chain_monomer_connection = primary_chain_monomer_connection_number + ":" + primary_chain_id_connection_part_sp[1];
                  // "CHEM1,RNA1,15:R2"  --> this needs to be ordered correctly                  
                  var new_connection = null;
                  if (primary_chain_id_index == 1) {
                    new_connection = connection_parts[0] + "," + connection_parts[1] + "," + monomer_connection_partsp[0] + "-" + new_primary_chain_monomer_connection;
                  }
                  else {
                    new_connection = connection_parts[0] + "," + connection_parts[1] + "," + new_primary_chain_monomer_connection + "-" + monomer_connection_partsp[1];
                  }
                  // console.log ( ' new connection ' + new_connection );
                  helm = this.replaceConnection(connection, new_connection, helm);
                }
              }
              return helm;
            };
            HELMBuilder.prototype.replaceConnection = function (original, newconnection, helm) {
              var connections = this.parser.parseConnections(helm);
              var chains = this.parser.parseChains(helm);
              var groups = this.parser.parseGroups(helm);
              var annotations = this.parser.parseAnnotations(helm);
              var newconnections = [];
              for (var _i = 0, connections_1 = connections; _i < connections_1.length; _i++) {
                var connection = connections_1[_i];
                if (connection == original) {
                  newconnections.push(newconnection);
                }
                else {
                  newconnections.push(connection);
                }
              }
              return this.concat(chains) + "$" + this.concat(newconnections) + "$" + this.concat(groups) + "$" + this.concat(annotations);
            };
            HELMBuilder.prototype.addFivePrime = function (chem_chain, connection) {
              var chains = this.parser.parseChains(this.helm);
              if (chains == null) {
                this.errors = "No chain found in the current helm object";
                return;
              }
              var helm_connections = this.parser.parseConnections(this.helm);
              var helm_groups = this.parser.parseGroups(this.helm);
              var helm_annotations = this.parser.parseAnnotations(this.helm);
              if (helm_annotations == null) {
                helm_annotations = [""];
              }
              if (helm_groups == null) {
                helm_groups = [""];
              }
              if (helm_connections == null) {
                helm_connections = [""];
              }
              var chain_type = this.parser.parse_chain_type(chem_chain);
              var chain_contents = this.parser.parse_chain_polymer(chem_chain);
              var index = 0;
              for (var _i = 0, chains_1 = chains; _i < chains_1.length; _i++) {
                var chain = chains_1[_i];
                var ctype = this.parser.parse_chain_type(chain);
                if (ctype === chain_type) {
                  var temp = this.parser.parse_chain_type_index(chain);
                  if (temp > index) {
                    index = temp;
                  }
                }
              }
              // {{ CHECK TO SEE IF THERE IS AN EXTRA PHOSPHATE ON THE END OF THE FIVE PRIME }}
              var rna_chain_contents = this.parser.parse_chain_polymer(chains[0]);
              var rna_chain_ident = this.parser.parse_chain_identifier(chains[0]);
              if (!rna_chain_contents.startsWith("p.")) {
                chains[0] = rna_chain_ident + "{p." + rna_chain_contents + "}";
                // adding a phophate linker here means we have to increment any chain connection strings 
                this.helm = this.incrementConnections(rna_chain_ident, this.helm);
                // refresh the local variables
                helm_connections = this.parser.parseConnections(this.helm);
                helm_groups = this.parser.parseGroups(this.helm);
                helm_annotations = this.parser.parseAnnotations(this.helm);
              }
              var new_chain = chain_type + (index + 1) + "{" + chain_contents + "}";
              chains.push(new_chain);
              // RNA1{p.[moe](A)[sp].[moe](G)[sp].[moe](G)[sp].[moe](A)[sp].[moe]([m5C])[sp].d(A)[sp].d(T)[sp].d(G)[sp].d([m5C])[sp].d(T)[sp].d(G)[sp].d(A)[sp].d(A)[sp].d([m5C])[sp].d([m5C])[sp].[moe](T)[sp].[moe](G)[sp].[moe](G)[sp].[moe]([m5C])[sp].[moe]([m5C])}|CHEM1{[THAGN3]}$CHEM1,RNA1,1:R1-1:R1$$$V2.0
              //RNA1{p.[moe](A)[sp].[moe](G)[sp].[moe](G)[sp].[moe](A)[sp].[moe]([m5C])[sp].d(A)[sp].d(T)[sp].d(G)[sp].d([m5C])[sp].d(T)[sp].d(G)[sp].d(A)[sp].d(A)[sp].d([m5C])[sp].d([m5C])[sp].[moe](T)[sp].[moe](G)[sp].[moe](G)[sp].[moe]([m5C])[sp].[moe]([m5C])}|CHEM1{[THAGN3]}$
              //CHEM1,RNA1,1:R1-1:R1$$$V2.0
              var connection_chain = this.parser.parse_chain_identifier(chains[0]);
              var new_connection = chain_type + (index + 1) + ',' + connection_chain + ',' + '1:R1-1:R1';
              helm_connections.push(new_connection);
              var helm_chains = this.build_chain_string(chains);
              this.helm = helm_chains + '$' + this.concat(helm_connections) + '$' + this.concat(helm_groups) + '$' + this.concat(helm_annotations) + '$';
            };
            /**
             *  This will only add to RNA1
             */
            HELMBuilder.prototype.addThreePrime = function (chem_chain, connection) {
              var chains = this.parser.parseChains(this.helm);
              if (chains == null) {
                this.errors = ' No chain found in the current helm object ';
                return;
              }
              var helm_connections = this.parser.parseConnections(this.helm);
              var helm_groups = this.parser.parseGroups(this.helm);
              var helm_annotations = this.parser.parseAnnotations(this.helm);
              if (helm_annotations == null) {
                helm_annotations = [""];
              }
              if (helm_groups == null) {
                helm_groups = [""];
              }
              if (helm_connections == null) {
                helm_connections = [""];
              }
              var chain_type = this.parser.parse_chain_type(chem_chain);
              var chem_chain_contents = this.parser.parse_chain_polymer(chem_chain);
              var index = 0;
              for (var _i = 0, chains_2 = chains; _i < chains_2.length; _i++) {
                var chain = chains_2[_i];
                var ctype = this.parser.parse_chain_type(chain);
                if (ctype === chain_type) {
                  var temp = this.parser.parse_chain_type_index(chain);
                  if (temp > index) {
                    index = temp;
                  }
                }
              }
              // {{ CHECK TO SEE IF THERE IS AN EXTRA PHOSPHATE ON THE END OF THE FIVE PRIME }}
              var rna_chain_contents = this.parser.parse_chain_polymer(chains[0]);
              var rna_chain_ident = this.parser.parse_chain_identifier(chains[0]);
              var mons = this.parser.parse_monomers_from_nucleic_acid(chains[0]);
              if (mons[mons.length - 1] != 'p' && mons[mons.length - 1] != 'sp') {
                chains[0] = rna_chain_ident + "{" + rna_chain_contents + "p}";
              }
              // if ( !rna_chain_contents.endsWith ( ")p") && (!rna_chain_contents.endsWith (")[sp]")) ){
              //     console.log ( " adjusting rna_chain_contents ");
              //     chains[0] = rna_chain_ident + "{" + rna_chain_contents + "p}";
              // }
              var new_chain = chain_type + (index + 1) + "{" + chem_chain_contents + "}";
              chains.push(new_chain);
              // RNA1{p.[moe](A)[sp].[moe](G)[sp].[moe](G)[sp].[moe](A)[sp].[moe]([m5C])[sp].d(A)[sp].d(T)[sp].d(G)[sp].d([m5C])[sp].d(T)[sp].d(G)[sp].d(A)[sp].d(A)[sp].d([m5C])[sp].d([m5C])[sp].[moe](T)[sp].[moe](G)[sp].[moe](G)[sp].[moe]([m5C])[sp].[moe]([m5C])}|CHEM1{[THAGN3]}$CHEM1,RNA1,1:R1-1:R1$$$V2.0
              //RNA1{p.[moe](A)[sp].[moe](G)[sp].[moe](G)[sp].[moe](A)[sp].[moe]([m5C])[sp].d(A)[sp].d(T)[sp].d(G)[sp].d([m5C])[sp].d(T)[sp].d(G)[sp].d(A)[sp].d(A)[sp].d([m5C])[sp].d([m5C])[sp].[moe](T)[sp].[moe](G)[sp].[moe](G)[sp].[moe]([m5C])[sp].[moe]([m5C])}|CHEM1{[THAGN3]}$
              //CHEM1,RNA1,1:R1-1:R1$$$V2.0
              var connection_chain = this.parser.parse_chain_identifier(chains[0]);
              var monomers = this.parser.parse_monomers_from_nucleic_acid(chains[0]);
              var new_connection = chain_type + (index + 1) + ',' + connection_chain + ',' + '1:R1-' + monomers.length + ':R2';
              helm_connections.push(new_connection);
              var helm_chains = this.build_chain_string(chains);
              this.helm = helm_chains + '$' + this.concat(helm_connections) + '$' + this.concat(helm_groups) + '$' + this.concat(helm_annotations) + '$';
            };
            HELMBuilder.prototype.findAndReplaceBase = function (search_monnomer, replace_monomer) {
              var chains = this.parser.parseChains(this.helm);
              var nchains = [];
              var re = new RegExp("\\(" + search_monnomer + "\\)", "gi");
              for (var _i = 0, chains_3 = chains; _i < chains_3.length; _i++) {
                var chain = chains_3[_i];
                chain = chain.replace(re, "(" + replace_monomer + ")");
                nchains.push(chain);
              }
              this.replace_chains(nchains);
            };
            HELMBuilder.prototype.getChains = function () {
              return this.parser.parse_chain_identifiers(this.helm);
            };
            HELMBuilder.prototype.findAndReplaceBaseForSugarType = function (search_monnomer, replace_monomer, sugar_monomer) {
              var chains = this.parser.parseChains(this.helm);
              if (search_monnomer != null && search_monnomer.startsWith("[")) {
                search_monnomer = search_monnomer.replace("[", "\\[");
              }
              var non_regx_sugar = sugar_monomer;
              if (non_regx_sugar.startsWith("\\")) {
                non_regx_sugar = non_regx_sugar.replace('\\', '');
                non_regx_sugar = non_regx_sugar.trim();
              }
              if (sugar_monomer != null && sugar_monomer.startsWith("[")) {
                sugar_monomer = sugar_monomer.replace("[", "\\[");
              }
              var nchains = [];
              var re = new RegExp(sugar_monomer + "\\(" + search_monnomer + "\\)", "gi");
              for (var _i = 0, chains_4 = chains; _i < chains_4.length; _i++) {
                var chain = chains_4[_i];
                chain = chain.replace(re, non_regx_sugar + "(" + replace_monomer + ")");
                nchains.push(chain);
              }
              this.replace_chains(nchains);
            };
            HELMBuilder.prototype.applyTemplate = function (template_name) {
              var chains = this.parser.parseChains(this.helm);
              var nchains = [];
              for (var _i = 0, chains_5 = chains; _i < chains_5.length; _i++) {
                var chain = chains_5[_i];
                if (template_name === "5-10-5 MOE") {
                  if (chain.toUpperCase().startsWith("RNA")) {
                    var sugars = this.parser.pull_sugar_sequence_from_chain(chain);
                    if (sugars.length != 20) {
                      this.errors = " This is not a 20mer so we cannot apply the 5-10-5 template";
                      return;
                    }
                    for (var h = 0; h < 5; h++) {
                      sugars[h] = '[MOE]';
                    }
                    for (var i = 5; i < 15; i++) {
                      sugars[i] = 'd';
                    }
                    for (var j = 15; j < 20; j++) {
                      sugars[j] = '[MOE]';
                    }
                    chain = this.replace_sugars(chain, sugars);
                    nchains.push(chain);
                  }
                  else {
                    nchains.push(chain);
                  }
                }
                else if (template_name.toLowerCase() === "3-10-3 cet") {
                  if (chain.toUpperCase().startsWith("RNA")) {
                    var sugars = this.parser.pull_sugar_sequence_from_chain(chain);
                    if (sugars.length != 16) {
                      this.errors = "This is not a 16mer so we cannot apply the 3-10-3 template";
                      return;
                    }
                    for (var h = 0; h < 3; h++) {
                      sugars[h] = '[CET]';
                    }
                    for (var i = 3; i < 13; i++) {
                      sugars[i] = 'd';
                    }
                    for (var j = 13; j < 16; j++) {
                      sugars[j] = '[CET]';
                    }
                    chain = this.replace_sugars(chain, sugars);
                    nchains.push(chain);
                  }
                  else {
                    nchains.push(chain);
                  }
                }
                else {
                  if (chain.toUpperCase().startsWith("RNA")) {
                    var sugars = this.parser.pull_sugar_sequence_from_chain(chain);
                    var template_sugar_mononers = template_name.split('');
                    var h_1 = 0;
                    for (var _a = 0, template_sugar_mononers_1 = template_sugar_mononers; _a < template_sugar_mononers_1.length; _a++) {
                      var template_monomer = template_sugar_mononers_1[_a];
                      sugars[h_1] = this.getMonomerForSimpleLeChemMonomer(template_monomer);
                      h_1++;
                    }
                    chain = this.replace_sugars(chain, sugars);
                    nchains.push(chain);
                  }
                  else {
                    nchains.push(chain);
                  }
                  this.errors = " Template type : " + template_name + " was not found. ";
                }
              }
              this.replace_chains(nchains);
            };
            HELMBuilder.prototype.getMonomerForSimpleLeChemMonomer = function (letter) {
              if (letter.toLocaleUpperCase() === 'K') {
                return "[cet]";
              }
              else if (letter.toUpperCase() === 'D') {
                return 'd';
              }
              else if (letter.toUpperCase() === 'E') {
                return "[moe]";
              }
              else if (letter.toUpperCase() === 'G') {
                return "[fhna]";
              }
              else if (letter.toUpperCase() === 'H') {
                return "[hna]";
              }
              else if (letter.toUpperCase() === 'M') {
                return "m";
              }
              else if (letter.toUpperCase() === 'L') {
                return "[lna]";
              }
              return letter;
            };
            HELMBuilder.prototype.apply_sugar_to_nucleotide = function (nuc, sugar) {
              var start_index = nuc.indexOf("(");
              var no_sugar_nuc = nuc.substring(start_index);
              return sugar.trim() + no_sugar_nuc.trim();
            };
            HELMBuilder.prototype.setSugar = function (rna, sugar) {
              if (sugar.length > 1) {
                if (!sugar.startsWith('[')) {
                  sugar = '[' + sugar + ']';
                }
              }
              var nucleotides = this.parser.parse_nucleotides(rna);
              var new_set = [];
              for (var _i = 0, nucleotides_1 = nucleotides; _i < nucleotides_1.length; _i++) {
                var n = nucleotides_1[_i];
                var monomers = this.parser.parser_monomers_from_nucleotide(n);
                for (var i = 0; i < monomers.length; i++) {
                  monomers[0] = sugar;
                }
                var new_nucleotide = this.build_nucleotide_from_monomers(monomers);
                new_set.push(new_nucleotide);
              }
              var chain_id = this.parser.parse_chain_identifier(rna);
              var new_chain = chain_id + "{" + this.connect_nucleotides(new_set) + "}";
              return new_chain;
            };
            HELMBuilder.prototype.replaceAllSugars = function (newsugar) {
              var chains = this.parser.parseChains(this.helm);
              var nchain = [];
              for (var _i = 0, chains_6 = chains; _i < chains_6.length; _i++) {
                var chain = chains_6[_i];
                var chain_type = this.parser.parse_chain_type(chain);
                if (chain_type === "RNA") {
                  nchain.push(this.setSugar(chain, newsugar));
                }
                else {
                  nchain.push(chain);
                }
              }
              this.replace_chains(nchain);
            };
            HELMBuilder.prototype.replace_sugars = function (chain, sugar_list) {
              var nucleotides = this.parser.parse_nucleotides(chain);
              var chain_id = this.parser.parse_chain_identifier(chain);
              for (var i = 0; i < nucleotides.length; i++) {
                // let sugar = this.parser.parser_sugar_from_nucleotide ( nucleotides [ i ]);
                nucleotides[i] = this.apply_sugar_to_nucleotide(nucleotides[i], sugar_list[i]);
              }
              var cnucs = this.connect_nucleotides(nucleotides);
              return chain_id + "{" + cnucs + "}";
            };
            HELMBuilder.prototype.find_and_replace_nucleotide_monomers = function (chain, queryMonomer, replaceMonomer) {
              var nucleotides = this.parser.parse_nucleotides(chain);
              var new_set = [];
              for (var _i = 0, nucleotides_2 = nucleotides; _i < nucleotides_2.length; _i++) {
                var n = nucleotides_2[_i];
                var monomers = this.parser.parser_monomers_from_nucleotide(n);
                for (var i = 0; i < monomers.length; i++) {
                  if (monomers[i] === queryMonomer) {
                    monomers[i] = replaceMonomer;
                  }
                }
                var new_nucleotide = this.build_nucleotide_from_monomers(monomers);
                new_set.push(new_nucleotide);
              }
              var chain_id = this.parser.parse_chain_identifier(chain);
              var new_chain = chain_id + "{" + this.connect_nucleotides(new_set) + "}";
              return new_chain;
            };
            HELMBuilder.prototype.build_nucleotide_from_monomers = function (list) {
              if (list.length == 3) {
                return list[0].trim() + "(" + list[1].trim() + ")" + list[2].trim();
              }
              else if (list.length == 2) {
                return list[0].trim() + "(" + list[1].trim() + ")";
              }
              else {
                return list[0].trim();
              }
            };
            HELMBuilder.prototype.reverseComplement = function () {
              var chains = this.parser.parseChains(this.helm);
              var nchains = [];
              for (var _i = 0, chains_7 = chains; _i < chains_7.length; _i++) {
                var chain = chains_7[_i];
                var nucleotides = this.parser.parse_nucleotides(chain);
                var new_set = [];
                var sequence = this.parser.pull_base_sequence(chain);
                var revCompSequence = [];
                var j = 0;
                for (var i = sequence.length - 1; i >= 0; i--) {
                  // console.log ( i + '>' + sequence[i]  + '<');
                  if (sequence[i] == 'A') {
                    revCompSequence.push('U');
                  }
                  else if (sequence[i] == '[m5C]') {
                    revCompSequence.push('G');
                  }
                  else if (sequence[i] == 'C') {
                    revCompSequence.push('G');
                  }
                  else if (sequence[i] == 'G') {
                    revCompSequence.push('C');
                  }
                  else if (sequence[i] == 'T') {
                    revCompSequence.push('A');
                  }
                  else if (sequence[i] == 'U') {
                    revCompSequence.push('A');
                  }
                  else {
                    revCompSequence[j] = '?';
                  }
                  j++;
                }
                j = 0;
                for (var _a = 0, nucleotides_3 = nucleotides; _a < nucleotides_3.length; _a++) {
                  var n = nucleotides_3[_a];
                  var monomers = this.parser.parser_monomers_from_nucleotide(n);
                  if (monomers.length >= 2) {
                    monomers[1] = revCompSequence[j++];
                  }
                  else {
                    // console.log ( " monomer was not converted : "+ monomers[0] );
                  }
                  var new_nucleotide = this.build_nucleotide_from_monomers(monomers);
                  new_set.push(new_nucleotide);
                }
                var chain_id = this.parser.parse_chain_identifier(chain);
                var new_chain = chain_id + "{" + this.connect_nucleotides(new_set) + "}";
                nchains.push(new_chain);
              }
              this.replace_chains(nchains);
            };
            HELMBuilder.prototype.uniform = function (type, monomer) {
              var chains = this.parser.parseChains(this.helm);
              var nchain = [];
              if ('sugar' == type.toLocaleLowerCase()) {
                for (var _i = 0, chains_8 = chains; _i < chains_8.length; _i++) {
                  var chain = chains_8[_i];
                  var chain_type = this.parser.parse_chain_type(chain);
                  if (chain_type === "RNA") {
                    nchain.push(this.uniformSugarInChain(chain, monomer));
                  }
                  else {
                    nchain.push(chain);
                  }
                }
              }
              else if ('linker' == type.toLocaleLowerCase()) {
                for (var _a = 0, chains_9 = chains; _a < chains_9.length; _a++) {
                  var chain = chains_9[_a];
                  var chain_type = this.parser.parse_chain_type(chain);
                  if (chain_type === "RNA") {
                    nchain.push(this.uniformLinkerInChain(chain, monomer));
                  }
                  else {
                    nchain.push(chain);
                  }
                }
              }
              else if ('base' == type.toLocaleLowerCase()) {
                for (var _b = 0, chains_10 = chains; _b < chains_10.length; _b++) {
                  var chain = chains_10[_b];
                  var chain_type = this.parser.parse_chain_type(chain);
                  if (chain_type === "RNA") {
                    nchain.push(this.uniformBaseInChain(chain, monomer));
                  }
                  else {
                    nchain.push(chain);
                  }
                }
              }
              this.replace_chains(nchain);
            };
            HELMBuilder.prototype.uniformSugarInChain = function (chain, monomer) {
              var mon = chain.split(/\./gi);
              var nmon = [];
              for (var _i = 0, mon_1 = mon; _i < mon_1.length; _i++) {
                var m = mon_1[_i];
                // console.log ( " monomer " + m );
                m = this.replaceSugarInNucleotide(m, monomer);
                // console.log ( "replaced  " + m );
                nmon.push(m);
              }
              var chain_id = this.parser.parse_chain_identifier(chain);
              var new_chain = chain_id + "{" + this.connect_monomers(nmon) + "}";
              return new_chain;
            };
            HELMBuilder.prototype.uniformLinkerInChain = function (chain, monomer) {
              var mon = chain.split(/\./gi);
              var nmon = [];
              for (var _i = 0, mon_2 = mon; _i < mon_2.length; _i++) {
                var m = mon_2[_i];
                m = this.replaceLinkerInNucleotide(m, monomer);
                nmon.push(m);
              }
              var chain_id = this.parser.parse_chain_identifier(chain);
              var new_chain = chain_id + "{" + this.connect_monomers(nmon) + "}";
              return new_chain;
            };
            HELMBuilder.prototype.uniformBaseInChain = function (chain, monomer) {
              var mon = chain.split(/\./gi);
              var nmon = [];
              for (var _i = 0, mon_3 = mon; _i < mon_3.length; _i++) {
                var m = mon_3[_i];
                m = this.replaceBaseInNucleotide(m, monomer);
                nmon.push(m);
              }
              var chain_id = this.parser.parse_chain_identifier(chain);
              var new_chain = chain_id + "{" + this.connect_monomers(nmon) + "}";
              return new_chain;
            };
            HELMBuilder.prototype.replaceSugarInNucleotide = function (nuc, monomer) {
              var i = nuc.indexOf('\(');
              if (i > 0) {
                var tem = nuc.substring(i);
                return (monomer + tem);
              }
              return nuc;
            };
            HELMBuilder.prototype.replaceBaseInNucleotide = function (nuc, monomer) {
              var j = nuc.indexOf('\(');
              var i = nuc.indexOf('\)');
              if (i > 0 && j >= 0) {
                var sugar = nuc.substring(0, j);
                var linker = nuc.substring(i + 1);
                return (sugar + "(" + monomer + ")" + linker);
              }
              return nuc;
            };
            HELMBuilder.prototype.replaceLinkerInNucleotide = function (nuc, monomer) {
              var i = nuc.indexOf('\)');
              if (i > 0) {
                var tem = nuc.substring(0, i + 1);
                return (tem + monomer);
              }
              return nuc;
            };
            //reverseComplament
            HELMBuilder.prototype.findAndReplace = function (queryMonomer, replaceMonomer) {
              var chains = this.parser.parseChains(this.helm);
              var nchain = [];
              for (var _i = 0, chains_11 = chains; _i < chains_11.length; _i++) {
                var chain = chains_11[_i];
                var chain_type = this.parser.parse_chain_type(chain);
                if (chain_type === "RNA") {
                  nchain.push(this.find_and_replace_nucleotide_monomers(chain, queryMonomer, replaceMonomer));
                }
                else if (chain_type === "CHEM" || chain_type == "PEPTIDE") {
                  nchain.push(this.find_and_replace_monomers(chain, queryMonomer, replaceMonomer));
                }
                else {
                  nchain.push(chain);
                }
              }
              this.replace_chains(nchain);
            };
            HELMBuilder.prototype.find_and_replace_monomers = function (chain, queryMonomer, replaceMonomer) {
              var mon = chain.split(/\./gi);
              var nmon = [];
              for (var _i = 0, mon_4 = mon; _i < mon_4.length; _i++) {
                var m = mon_4[_i];
                if (m === queryMonomer) {
                  m = replaceMonomer;
                }
                nmon.push(m);
              }
              var chain_id = this.parser.parse_chain_identifier(chain);
              var new_chain = chain_id + "{" + this.connect_monomers(nmon) + "}";
              return new_chain;
            };
            HELMBuilder.prototype.replace_chains = function (chains) {
              var helm_connections = this.parser.parseConnections(this.helm);
              var helm_groups = this.parser.parseGroups(this.helm);
              var helm_annotations = this.parser.parseAnnotations(this.helm);
              if (helm_annotations == null) {
                helm_annotations = [""];
              }
              if (helm_groups == null) {
                helm_groups = [""];
              }
              if (helm_connections == null) {
                helm_connections = [""];
              }
              var helm_chains = this.build_chain_string(chains);
              this.helm = helm_chains + '$' + this.concat(helm_connections) + '$' + this.concat(helm_groups) + '$' + this.concat(helm_annotations) + '$';
            };
            HELMBuilder.prototype.addChain = function (chain) {
              var helm_connections = this.parser.parseConnections(this.helm);
              var helm_groups = this.parser.parseGroups(this.helm);
              var helm_annotations = this.parser.parseAnnotations(this.helm);
              if (helm_annotations == null) {
                helm_annotations = [""];
              }
              if (helm_groups == null) {
                helm_groups = [""];
              }
              if (helm_connections == null) {
                helm_connections = [""];
              }
              var chain_type = this.parser.parse_chain_type(chain);
              var chain_contents = this.parser.parse_chain_polymer(chain);
              var index = 0;
              var chains = this.parser.parseChains(this.helm);
              for (var _i = 0, chains_12 = chains; _i < chains_12.length; _i++) {
                var chain_1 = chains_12[_i];
                var ctype = this.parser.parse_chain_type(chain_1);
                if (ctype === chain_type) {
                  var temp = this.parser.parse_chain_type_index(chain_1);
                  if (temp > index) {
                    index = temp;
                  }
                }
              }
              var new_chain = chain_type + (index + 1) + "{" + chain_contents + "}";
              chains.push(new_chain);
              var helm_chains = this.build_chain_string(chains);
              this.helm = helm_chains + '$' + this.concat(helm_connections) + '$' + this.concat(helm_groups) + '$' + this.concat(helm_annotations) + '$';
            };
            HELMBuilder.prototype.removeChain = function (chain_id) {
              var helm_connections = this.parser.parseConnections(this.helm);
              var helm_groups = this.parser.parseGroups(this.helm);
              var helm_annotations = this.parser.parseAnnotations(this.helm);
              if (helm_annotations == null) {
                helm_annotations = [""];
              }
              if (helm_groups == null) {
                helm_groups = [""];
              }
              if (helm_connections == null) {
                helm_connections = [""];
              }
              var index = 0;
              var chains = this.parser.parseChains(this.helm);
              var nchains = [];
              for (var _i = 0, chains_13 = chains; _i < chains_13.length; _i++) {
                var chain = chains_13[_i];
                var cid = this.parser.parse_chain_identifier(chain);
                if (cid.toUpperCase() != chain_id.toUpperCase()) {
                  nchains.push(chain);
                }
                else {
                  // console.log ( ' foun dit in the chains ' );
                }
              }
              var nhelm_connections = [];
              for (var _a = 0, helm_connections_1 = helm_connections; _a < helm_connections_1.length; _a++) {
                var chain_connection = helm_connections_1[_a];
                if (chain_connection != null && chain_connection.length > 0) {
                  var connection_parts = chain_connection.split(',');
                  var check = false;
                  for (var _b = 0, connection_parts_1 = connection_parts; _b < connection_parts_1.length; _b++) {
                    var jjk = connection_parts_1[_b];
                    if (chain_id.toUpperCase() == jjk.toUpperCase()) {
                      check = true;
                    }
                  }
                  if (check) {
                  }
                  else {
                    nhelm_connections.push(chain_connection);
                  }
                }
              }
              var helm_chains = this.build_chain_string(nchains);
              this.helm = helm_chains + '$' + this.concat(nhelm_connections) + '$' + this.concat(helm_groups) + '$' + this.concat(helm_annotations) + '$';
            };
            HELMBuilder.prototype.getChain = function (chain_id) {
              return this.parser.parseChain(chain_id, this.helm);
            };
            HELMBuilder.prototype.replaceChain = function (chain) {
              var chainId = this.parser.parse_chain_identifier(chain);
              var helm_connections = this.parser.parseConnections(this.helm);
              var helm_groups = this.parser.parseGroups(this.helm);
              var helm_annotations = this.parser.parseAnnotations(this.helm);
              if (helm_annotations == null) {
                helm_annotations = [""];
              }
              if (helm_groups == null) {
                helm_groups = [""];
              }
              if (helm_connections == null) {
                helm_connections = [""];
              }
              var chains = this.parser.parseChains(this.helm);
              var nchains = [];
              for (var _i = 0, chains_14 = chains; _i < chains_14.length; _i++) {
                var ch = chains_14[_i];
                var ci = this.parser.parse_chain_identifier(chain);
                if (ci.toUpperCase() == chainId.toUpperCase()) {
                  nchains.push(chain);
                }
                else {
                  nchains.push(ch);
                }
              }
              var helm_chains = this.build_chain_string(nchains);
              this.helm = helm_chains + '$' + this.concat(helm_connections) + '$' + this.concat(helm_groups) + '$' + this.concat(helm_annotations) + '$';
            };
            HELMBuilder.prototype.remove3PrimeLinkerFromChain = function (chain) {
              var nucleotides = this.parser.parse_nucleotides(chain);
              var new_set = [];
              var index = 0;
              for (var _i = 0, nucleotides_4 = nucleotides; _i < nucleotides_4.length; _i++) {
                var n = nucleotides_4[_i];
                var monomers = this.parser.parser_monomers_from_nucleotide(n);
                if ((nucleotides.length - 1) == index) {
                  if (monomers.length == 3) {
                    var temp = [];
                    temp[0] = monomers[0];
                    temp[1] = monomers[1];
                    monomers = temp;
                  }
                }
                var new_nucleotide = this.build_nucleotide_from_monomers(monomers);
                new_set.push(new_nucleotide);
                index++;
              }
              var chain_id = this.parser.parse_chain_identifier(chain);
              var new_chain = chain_id + "{" + this.connect_nucleotides(new_set) + "}";
              return new_chain;
            };
            HELMBuilder.prototype.show = function () {
              alert(this.helm);
            };
            HELMBuilder.prototype.connect_nucleotides = function (nuc) {
              var strv = "";
              for (var _i = 0, nuc_1 = nuc; _i < nuc_1.length; _i++) {
                var n = nuc_1[_i];
                strv += n + '.';
              }
              strv = strv.substring(0, strv.length - 1);
              return strv;
            };
            HELMBuilder.prototype.connect_monomers = function (monomers) {
              var strv = "";
              for (var _i = 0, monomers_1 = monomers; _i < monomers_1.length; _i++) {
                var n = monomers_1[_i];
                strv += n + '.';
              }
              strv = strv.substring(0, strv.length - 1);
              return strv;
            };
            HELMBuilder.prototype.concat = function (list) {
              var l = '';
              if (list == null || list.length <= 0) {
                return l;
              }
              for (var _i = 0, list_1 = list; _i < list_1.length; _i++) {
                var item = list_1[_i];
                if (item == null || item.length <= 0) { }
                else {
                  l += item + '|';
                }
              }
              if (l.endsWith('|')) {
                l = l.substring(0, l.length - 1);
              }
              return l;
            };
            HELMBuilder.prototype.toString = function () {
              return this.helm;
            };
            HELMBuilder.prototype.build_chain_string = function (chains) {
              var t = "";
              for (var _i = 0, chains_15 = chains; _i < chains_15.length; _i++) {
                var c = chains_15[_i];
                t += c + "|";
              }
              if (t.endsWith('|')) {
                t = t.substring(0, t.length - 1);
              }
              return t;
            };
            return HELMBuilder;
          }());
          HELMBuilder.RNA = "RNA";
          HELMBuilder.CHEM = "CHEM";
          HELMBuilder.PEPTIDE = "PEPTIDE";

          exports.HELMBuilder = HELMBuilder;
          var hb;

          root.HELMBuilder = HELMBuilder;
          hb = {
            'version': '1.4.1',
            'obj': HELMBuilder
          };


          if (
            typeof define == 'function' &&
            typeof define.amd == 'object' &&
            define.amd
          ) {
            define('hb', function () {
              return hb;
            });
          } else if (freeExports && freeModule) {
            if (module.exports == freeExports) {
              // in Node.js, io.js, or RingoJS v0.8.0+
              freeModule.exports = hb;
            } else {
              // in Narwhal or RingoJS v0.7.0-
              for (key in hb) {
                hb.hasOwnProperty(key) && (freeExports[key] = hb[key]);
              }
            }
          } else {
            // in Rhino or a web browser
            root.hb = hb;
          }








        }(this));
      }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
    }, {}],


  //--------------------------------------------------------------------------------------------------------------------------------------------------------------------
  //--------------------------------------------------------------------------------------------------------------------------------------------------------------------
  //--------------------------------------------------------------------------------------------------------------------------------------------------------------------
  //--------------------------------------------------------------------------------------------------------------------------------------------------------------------
  //--------------------------------------------------------------------------------------------------------------------------------------------------------------------
  //--------------------------------------------------------------------------------------------------------------------------------------------------------------------
  //--------------------------------------------------------------------------------------------------------------------------------------------------------------------
  //--------------------------------------------------------------------------------------------------------------------------------------------------------------------
  //--------------------------------------------------------------------------------------------------------------------------------------------------------------------
  //--------------------------------------------------------------------------------------------------------------------------------------------------------------------
  //--------------------------------------------------------------------------------------------------------------------------------------------------------------------
  //--------------------------------------------------------------------------------------------------------------------------------------------------------------------
  //--------------------------------------------------------------------------------------------------------------------------------------------------------------------
  //--------------------------------------------------------------------------------------------------------------------------------------------------------------------
  //--------------------------------------------------------------------------------------------------------------------------------------------------------------------
  //--------------------------------------------------------------------------------------------------------------------------------------------------------------------
  //--------------------------------------------------------------------------------------------------------------------------------------------------------------------
























  47: [function (require, module, exports) {
    "use strict";




    (function (global) {
      ; (function (root) {




        exports.__esModule = true;
        var HELMParser = (function () {
          function HELMParser(monomerLib) {
            this.monomerLib = monomerLib;
          }
          HELMParser.prototype.isBranchMonomer = function (monomer) {
            var monomerobject = this.monomerLib.getMonomer(monomer, "RNA");
            // console.log ( ' monomer breanch type ]' + monomerobject.monomerType );
            if (monomerobject && monomerobject.monomertype.toUpperCase() == "BRANCH") {
              return true;
            }
            else {
              return false;
            }
          };
          HELMParser.prototype.parse_chain_identifier = function (chain) {
            var i = chain.indexOf("{");
            var id = chain.substring(0, i);
            return id;
          };
          HELMParser.prototype.parse_chain_identifiers = function (helm) {
            var str = [];
            var chains = this.parseChains(helm);
            for (var _i = 0, chains_1 = chains; _i < chains_1.length; _i++) {
              var chain = chains_1[_i];
              var c = this.parse_chain_identifier(chain);
              str.push(c);
            }
            return str;
          };
          HELMParser.prototype.parse_monomers_from_nucleic_acid = function (chain_full) {
            var chain = this.parse_chain_polymer(chain_full);
            var t = chain.replace(/\./g, " ");
            t = t.replace(/\(/g, ' ');
            t = t.replace(/\)/g, ' ');
            var sp = t.split(/\s+/g);
            // console.log ( sp );
            return sp;
          };
          HELMParser.prototype.parse_5_prime_conjugate = function (primary_chain_id, helm) {
            var primary_chain = this.parseChain(primary_chain_id, helm);
            var chains = this.parseChains(helm);
            var primary_chain_monomer_list = this.pull_monomer_sequence_from_chain("RNA", primary_chain);
            // it will be the case that there are several chems on either side.  this is thec ase with 147480
            // this is now a list of chain ids
            var tpe = this.getFivePrimeConjugate(helm, primary_chain_id);
            var chain_link = Array();
            for (var _i = 0, chains_2 = chains; _i < chains_2.length; _i++) {
              var c = chains_2[_i];
              for (var _a = 0, tpe_1 = tpe; _a < tpe_1.length; _a++) {
                var t = tpe_1[_a];
                var chain_id = this.parse_chain_identifier(c);
                var monomer_list = this.parse_chain_polymer(c);
                if (t == chain_id) {
                  chain_link.push(monomer_list);
                }
              }
            }
            var l = "";
            for (var _b = 0, chain_link_1 = chain_link; _b < chain_link_1.length; _b++) {
              var m = chain_link_1[_b];
              l = m + l;
            }
            // console.log ( " chain link size " + l + " link " + chain_link.length );
            return l;
          };
          //     let fiveprime = null;
          //     // if this is a 5prime it will look like this:   CHEM1,RNA1,1:R1-1:R1
          //     let connections : string[] = this.parseConnections ( helm );
          //     for ( let con of connections ){
          //         let s : string[] = con.split  ( ",");
          //         if ( s != null && s.length > 0  ){
          //         if ( s[0].trim() == 'RNA1'){
          //             let conj :string = s[1].trim();
          //             let connection = s[2].trim();
          //             if ( connection.startsWith("1:")){
          //                 fiveprime=conj;
          //             }
          //         }else if ( s.length >= 1 && s[1] != null && s[1].trim() == 'RNA1'){
          //             let conj :string = s[0].trim();
          //             let connection = s[2].trim();
          //             if ( connection.endsWith("-1:R1")){
          //                 fiveprime=conj;
          //             }
          //         }
          //         }
          //     }
          //     return fiveprime;
          // }
          HELMParser.prototype.getConnection = function (helm, primary_chain, query_chain) {
            var connections = this.parseConnections(helm);
            for (var _i = 0, connections_1 = connections; _i < connections_1.length; _i++) {
              var con = connections_1[_i];
              var s = con.split(",");
              if (s != null && s.length > 0) {
                if (s.length >= 1 && s[1] != null) {
                  if (s.indexOf(primary_chain) > -1 && s.indexOf(query_chain) > -1) {
                    return con;
                  }
                }
              }
            }
            return null;
          };
          HELMParser.prototype.parseChain = function (chain_id, helm) {
            var chains = this.parseChains(helm);
            for (var _i = 0, chains_3 = chains; _i < chains_3.length; _i++) {
              var chain = chains_3[_i];
              if (chain.toUpperCase().startsWith(chain_id.toUpperCase())) {
                return chain;
              }
            }
            return null;
          };
          HELMParser.prototype.getFivePrimeConjugate = function (helm, pchain) {
            var chains = this.parse_chain_identifiers(helm);
            var list = new Array();
            for (var _i = 0, chains_4 = chains; _i < chains_4.length; _i++) {
              var c = chains_4[_i];
              var index = 0;
              var fiveprime_connection = +this.getFivePrimeConnectionIndex(helm, pchain, c, index);
              // console.log ( ' c ' + c + ' is ' + threeprime_connection );
              if (fiveprime_connection > 0) {
                // console.log ( ' adding ' + threeprime_connection + ' to ' + c);
                list.splice(fiveprime_connection, 0, c);
              }
            }
            return list;
          };
          HELMParser.prototype.getThreePrimeConjugate = function (helm, pchain) {
            var chains = this.parse_chain_identifiers(helm);
            // console.log ( " helm " + helm );
            var list = new Array();
            for (var _i = 0, chains_5 = chains; _i < chains_5.length; _i++) {
              var c = chains_5[_i];
              var index = 0;
              var threeprime_connection = +this.getThreePrimeConnectionIndex(helm, pchain, c, index);
              // console.log ( ' c ' + c + ' is ' + threeprime_connection );
              if (threeprime_connection > 0) {
                // console.log ( ' adding ' + threeprime_connection + ' to ' + c);
                list.splice(threeprime_connection, 0, c);
              }
            }
            return list;
          };
          /**
           *  Recursive method to determine the index of a monomer in a chain
           */
          HELMParser.prototype.getThreePrimeConnectionIndex = function (helm, pchain, chain, index) {
            if (pchain == chain) {
              return 0;
            }
            if (index < 0) {
              return index;
            }
            var connection = this.getConnection(helm, pchain, chain);
            if (connection == null) {
              var chains = this.parse_chain_identifiers(helm);
              if (index < chains.length) {
                index++;
                var v = this.getThreePrimeConnectionIndex(helm, pchain, chains[index], index);
                if (v > 0) {
                  return (+v + 1);
                }
                else {
                  return v;
                }
              }
              else {
                -1;
              }
            }
            else if (this.getConnectionOrientation(helm, pchain, chain) == 5) {
              return -1;
            }
            else {
              return 1;
            }
          };
          /**
           *  Recursive method to determine the index of a monomer in a chain
           */
          HELMParser.prototype.getFivePrimeConnectionIndex = function (helm, pchain, chain, index) {
            if (pchain == chain) {
              return 0;
            }
            if (index < 0) {
              return index;
            }
            var connection = this.getConnection(helm, pchain, chain);
            if (connection == null) {
              var chains = this.parse_chain_identifiers(helm);
              index++;
              var v = +this.getFivePrimeConnectionIndex(helm, pchain, chains[index], index);
              if (index < chains.length) {
                if (v >= 0) {
                  return (+v + 1);
                }
                else {
                  return v;
                }
              }
              else {
                -1;
              }
            }
            else if (this.getConnectionOrientation(helm, pchain, chain) == 3) {
              return -1;
            }
            else {
              return 1;
            }
          };
          HELMParser.prototype.getConnectionOrientation = function (helm, ref_chain, monomer) {
            var connection = this.getConnection(helm, ref_chain, monomer);
            if (connection != null) {
              var refindex = this.getReferenceIndex(ref_chain, connection);
              if (refindex > 1) {
                return 3;
              }
              else {
                return 5;
              }
            }
            else {
              var chains = this.parse_chain_identifiers(helm);
              var connections = this.parseConnections(helm);
              for (var _i = 0, chains_6 = chains; _i < chains_6.length; _i++) {
                var qchain = chains_6[_i];
                for (var _a = 0, connections_2 = connections; _a < connections_2.length; _a++) {
                  var con = connections_2[_a];
                  var s = con.split(",");
                  if (s != null && s.length > 0) {
                    if (s.length >= 1 && s[1] != null) {
                      if (s.indexOf(monomer) > -1 && s.indexOf(qchain) > -1) {
                        return this.getConnectionOrientation(helm, ref_chain, qchain);
                      }
                    }
                  }
                }
              }
              return -1;
            }
          };
          HELMParser.prototype.getReferenceIndex = function (ref, con) {
            var sp = con.split(",");
            if (sp[0] == ref) {
              var ssp = sp[2].split("-");
              var count = +(ssp[0].split(":")[0]);
              return count;
            }
            else if (sp[1] == ref) {
              var ssp = sp[2].split("-");
              var count = +(ssp[1].split(":")[0]);
              return count;
            }
            return -1;
          };
          /**
           * Determine if this is a three prime object
           * @param ref
           * @param con
           */
          HELMParser.prototype.isThreePrime = function (helm, ref, con) {
            var sp = con.split(",");
            if (sp[0] == ref) {
              var ssp = sp[2].split("-");
              var count = +(ssp[0].split(":")[0]);
              // console.log ( " ssp " + ssp[0] );
              // console.log ( " count" + count);
              if (count > 1) {
                return true;
              }
            }
            else if (sp[1] == ref) {
              var ssp = sp[2].split("-");
              var count = +(ssp[1].split(":")[0]);
              if (count > 1) {
                return true;
              }
            }
            return false;
          };
          HELMParser.prototype.parse_3_prime_conjugate = function (primary_chain_id, helm) {
            var three_prime_chain_id = null;
            var primary_chain = this.parseChain(primary_chain_id, helm);
            var chains = this.parseChains(helm);
            var primary_chain_monomer_list = this.pull_monomer_sequence_from_chain("RNA", primary_chain);
            // it will be the case that there are several chems on either side.  this is thec ase with 147480
            // this is now a list of chain ids
            var tpe = this.getThreePrimeConjugate(helm, primary_chain_id);
            var chain_link = Array();
            for (var _i = 0, chains_7 = chains; _i < chains_7.length; _i++) {
              var c = chains_7[_i];
              for (var _a = 0, tpe_2 = tpe; _a < tpe_2.length; _a++) {
                var t = tpe_2[_a];
                var chain_id = this.parse_chain_identifier(c);
                var monomer_list = this.parse_chain_polymer(c);
                if (t == chain_id) {
                  chain_link.push(monomer_list);
                }
              }
            }
            var l = "";
            for (var _b = 0, chain_link_2 = chain_link; _b < chain_link_2.length; _b++) {
              var m = chain_link_2[_b];
              l += m;
            }
            // console.log ( " chain link size " + l + " link " + chain_link.length );
            return l;
          };
          HELMParser.prototype.parse_rna_conjugates = function (helm) {
            var c = "";
            var chains = this.parseChains(helm);
            for (var _i = 0, chains_8 = chains; _i < chains_8.length; _i++) {
              var chain = chains_8[_i];
              var chain_type = this.parse_chain_type(chain);
              if (chain_type.startsWith("CHEM")) {
                var fivePrime = this.parse_5_prime_conjugate("RNA1", helm);
                if (chain.startsWith(fivePrime)) {
                  var chainId = this.parse_chain_identifier(chain);
                  c += chain += " 5' \t";
                }
                else {
                  c += chain += "\t";
                }
              }
            }
            return c;
          };
          HELMParser.prototype.parse_chain_type = function (chain) {
            var i = chain.indexOf("{");
            var type = chain.substring(0, i);
            if (type != null) {
              if (type.startsWith("RNA")) {
                return "RNA";
              }
              else if (type.startsWith("CHEM")) {
                return "CHEM";
              }
              else if (type.startsWith("PEPTIDE")) {
                return "PEPTIDE";
              }
              return type.trim();
            }
            return null;
          };
          HELMParser.prototype.parse_chain_type_index = function (chain) {
            var i = chain.indexOf("{");
            var type = chain.substring(0, i);
            if (type != null) {
              if (type.startsWith("RNA")) {
                return +type.substring(3);
              }
              else if (type.startsWith("CHEM")) {
                return +type.substring(4);
              }
              else if (type.startsWith("PEPTIDE")) {
                return +type.substring(7);
              }
            }
            return null;
          };
          HELMParser.prototype.parse_chain_polymer = function (chain) {
            var i = chain.indexOf("{");
            var f = chain.indexOf("}");
            var contents = chain.substring(i + 1, f);
            return contents;
          };
          HELMParser.prototype.parseChains = function (helm) {
            var t = this.pullChainGroup(helm);
            var chains = t.split('|');
            return chains;
          };
          HELMParser.prototype.parseConnections = function (helm) {
            var t = this.pullConnectionGroup(helm);
            var chains = t.split('|');
            return chains;
          };
          HELMParser.prototype.connectionContains = function (connection, chain_id) {
            var c = connection.split(",");
            for (var _i = 0, c_1 = c; _i < c_1.length; _i++) {
              var cid = c_1[_i];
              if (cid.toUpperCase() == chain_id.toUpperCase()) {
                return true;
              }
            }
            return false;
          };
          HELMParser.prototype.getConnections = function (helm, chain_id) {
            var conn_list = [];
            var conn = this.parseConnections(helm);
            for (var _i = 0, conn_1 = conn; _i < conn_1.length; _i++) {
              var connection = conn_1[_i];
              if (this.connectionContains(chain_id, connection)) {
                conn_list.push(connection);
              }
            }
            return conn_list;
          };
          HELMParser.prototype.parseGroups = function (groups) {
            return null;
          };
          HELMParser.prototype.parseAnnotations = function (annotations) {
            return null;
          };
          HELMParser.prototype.pullGroup = function (_helm) {
            //    for ( let h of _helm )
            //    {
            //     //    console.log ( h );
            //    } 
            return [''];
          };
          HELMParser.prototype.pullChainGroup = function (helm) {
            if (helm == undefined) {
              return "";
            }
            if (helm.indexOf('$') > 0) {
              var iv = helm.indexOf('$');
              var h = helm.substring(0, iv);
              return h;
            }
            else {
              return helm;
            }
          };
          HELMParser.prototype.pullAnnotations = function (helm) {
            if (helm.indexOf('$') > 0) {
              var iv = helm.lastIndexOf('$');
              var h = helm.substring(0, iv);
              return h;
            }
            else {
              return helm;
            }
          };
          HELMParser.prototype.pullConnectionGroup = function (helm) {
            if (helm == null && helm == undefined) {
              return "";
            }
            if (helm.indexOf("$") > 0) {
              var iv = helm.indexOf("$");
              var cv = helm.indexOf("$", iv + 1);
              var h = helm.substring(iv + 1, cv);
              return h;
            }
            else {
              return helm;
            }
          };
          HELMParser.prototype.pull_backbone_sequence_from_chain = function (helm) {
            var seq = "";
            var sp = helm.split(".");
            for (var s in sp) {
              var t = sp[s];
              if (t != null && t.length > 4) {
                var vs = t.indexOf('(');
                var vf = t.indexOf(')');
                while (vs >= 0 && vf > 0) {
                  var seq_val = t.substring(vs, vf + 1);
                  t = t.replace(seq_val, ' ');
                  vs = t.indexOf('(');
                  vf = t.indexOf(')');
                }
                seq += t;
              }
            }
            return seq;
          };
          HELMParser.prototype.pull_monomer_sequence_from_chain = function (chain_type, helm_chain) {
            var seq = "";
            var monomers = [];
            if (helm_chain == null) {
              return null;
            }
            // {{ FIIRST STRIP THE DECORATORS IF THERE ARE SOME }}
            if (helm_chain.indexOf("{") > 0) {
              var st = helm_chain.indexOf("{");
              var ed = helm_chain.indexOf("}");
              helm_chain = helm_chain.substring(st + 1, ed);
            }
            var mlist = [];
            var sp = helm_chain.split("\.").join(" ");
            if (sp != null && sp.length > 0) {
              sp = sp.split("\(").join(' ');
              sp = sp.split("\)").join(' ');
            }
            else {
              var monomer = helm_chain;
              monomer = this.removeBrackets(monomer);
              var mo = this.monomerLib.getMonomer(monomer, chain_type);
              if (mo != null) {
                mlist.push(mo.symbol);
              }
            }
            if (sp != null && sp.length > 0) {
              sp = sp.trim();
              var bb = sp.split(' ');
              var i = 0;
              for (var _i = 0, bb_1 = bb; _i < bb_1.length; _i++) {
                var m = bb_1[_i];
                // console.log ( " pull_monomer_sequence_from_chain " + i + ' -- ' + m);
                m = this.removeBrackets(m);
                var mo = this.monomerLib.getMonomer(m, chain_type);
                if (mo != null) {
                  mlist.push(mo.symbol);
                }
              }
            }
            return mlist;
          };
          HELMParser.prototype.pull_monomer_sequence_from_helm = function (chain_id, helm) {
            var chains = this.parseChains(helm);
            for (var _i = 0, chains_9 = chains; _i < chains_9.length; _i++) {
              var chain = chains_9[_i];
              var current_chain_id = this.parse_chain_identifier(chain);
              if (chain_id == current_chain_id) {
                var chain_type = this.parse_chain_type(chain);
                return this.pull_monomer_sequence_from_chain(chain_type, chain);
              }
            }
            return null;
          };
          HELMParser.prototype.parser_sugar_from_nucleotide = function (nucleotide) {
            var start_index = nucleotide.indexOf('(');
            var end_index = nucleotide.indexOf(')');
            if (start_index <= 0 || end_index <= 0) {
              return null;
            }
            else {
              var s = nucleotide.substring(start_index + 1, end_index);
              return s;
            }
          };
          HELMParser.prototype.pull_sugar_sequence_from_chain = function (helm_chain) {
            var seq = "";
            var mlist = [];
            var sp = helm_chain.split('\.');
            for (var _i = 0, sp_1 = sp; _i < sp_1.length; _i++) {
              var nuc = sp_1[_i];
              var bstart = nuc.indexOf('(');
              if (bstart > 0) {
                var temp = nuc.substring(0, bstart);
                mlist.push(temp.trim());
              }
            }
            return mlist;
          };
          HELMParser.prototype.parse_and_format_backbone_sequence = function (helm) {
            var s = this.parse_backbone_sequence_for_RNA(helm);
            s = s.split('[').join(' ');
            s = s.split(']').join(' ');
            return s;
          };
          HELMParser.prototype.parse_backbone_sequence_for_RNA = function (helm) {
            var chain_group = this.pullChainGroup(helm);
            var backbone = '';
            var chains = chain_group.split('|');
            for (var _i = 0, chains_10 = chains; _i < chains_10.length; _i++) {
              var chain = chains_10[_i];
              if (chain.startsWith('RNA')) {
                var start = chain.indexOf('{');
                var end = chain.indexOf('}');
                if (start >= 0 && end > 0) {
                  chain = chain.substring(start + 1, end);
                }
                backbone += this.pull_backbone_sequence_from_chain(chain);
                backbone += '|';
              }
            }
            if (backbone.endsWith('|')) {
              backbone = backbone.substring(0, backbone.length - 1);
            }
            return backbone;
          };
          HELMParser.prototype.parse_backbone_sequence = function (helm) {
            var chain_group = this.pullChainGroup(helm);
            var backbone = '';
            var chains = chain_group.split('|');
            for (var _i = 0, chains_11 = chains; _i < chains_11.length; _i++) {
              var chain = chains_11[_i];
              var start = chain.indexOf('{');
              var end = chain.indexOf('}');
              if (start >= 0 && end > 0) {
                chain = chain.substring(start + 1, end);
              }
              backbone += this.pull_backbone_sequence_from_chain(chain);
              backbone += '|';
            }
            if (backbone.endsWith('|')) {
              backbone = backbone.substring(0, backbone.length - 1);
            }
            return backbone;
          };
          HELMParser.prototype.parse_sugars_sequence_from_chain = function (chain) {
            var start = chain.indexOf('{');
            var end = chain.indexOf('}');
            if (start >= 0 && end > 0) {
              chain = chain.substring(start + 1, end);
            }
            var sugar_backbone = this.pull_sugar_sequence_from_chain(chain);
            return sugar_backbone;
          };
          HELMParser.prototype.parse_sugar_sequence = function (helm) {
            var chain_group = this.pullChainGroup(helm);
            var backbone = '';
            var chains = chain_group.split('|');
            for (var _i = 0, chains_12 = chains; _i < chains_12.length; _i++) {
              var chain = chains_12[_i];
              var start = chain.indexOf('{');
              var end = chain.indexOf('}');
              if (start >= 0 && end > 0) {
                chain = chain.substring(start + 1, end);
              }
              backbone += this.pull_backbone_sequence_from_chain(chain);
              backbone += '|';
            }
            if (backbone.endsWith('|')) {
              backbone = backbone.substring(0, backbone.length - 1);
            }
            return backbone;
          };
          HELMParser.prototype.pull_sequence = function (helm) {
            var seq = '';
            var chains = this.parseChains(helm);
            for (var _i = 0, chains_13 = chains; _i < chains_13.length; _i++) {
              var chain = chains_13[_i];
              if (chain.startsWith('RNA') || chain.startsWith('PEPTIDE')) {
                if (chain.indexOf('{') > 0) {
                  var st = chain.indexOf('{');
                  var et = chain.indexOf('}');
                  chain = chain.substring(st + 1, et);
                }
                var sp = chain.split('.');
                for (var s in sp) {
                  var t = sp[s];
                  var vs = t.indexOf('(');
                  var vf = t.indexOf(')');
                  if (vs >= 0 && vf > 0) {
                    var seq_val = t.substring(vs + 1, vf);
                    seq += ' ' + seq_val + '  ';
                  }
                  else {
                    //seq += '  ' + t + ' __ ';
                  }
                }
              }
            }
            return seq;
          };
          HELMParser.prototype.parser_monomers_from_nucleotide = function (nucleotide) {
            var t = nucleotide;
            var vs = t.indexOf('(');
            var vf = t.indexOf(')');
            var sugar = t.substring(0, vs);
            var base = t.substring(vs + 1, vf);
            var linker = t.substring(vf + 1);
            var m = [sugar, base, linker];
            return m;
          };
          HELMParser.prototype.pull_base_sequence = function (helm) {
            var seq = [];
            var sp = helm.split('.');
            for (var s in sp) {
              var t = sp[s];
              var vs = t.indexOf('(');
              var vf = t.indexOf(')');
              if (vs >= 0 && vf > 0) {
                var seq_val = t.substring(vs + 1, vf);
                seq.push(seq_val.trim());
              }
              else {
              }
            }
            return seq;
          };
          HELMParser.prototype.parse_nucleotides = function (chain) {
            var seq = '';
            if (chain.toUpperCase().startsWith('RNA')) {
              var chainindex = chain.indexOf('{');
              var echainindex = chain.indexOf('}');
              if (chainindex >= 0 && echainindex > 0) {
                chain = chain.substring(chainindex + 1, echainindex);
              }
              var sp = chain.split('.');
              return sp;
            }
            return null;
          };
          HELMParser.prototype.parse_chem = function (chain) {
            var seq = '';
            if (chain.toUpperCase().startsWith('CHEM')) {
              var chainindex = chain.indexOf('{');
              var echainindex = chain.indexOf('}');
              if (chainindex >= 0 && echainindex > 0) {
                chain = chain.substring(chainindex + 1, echainindex);
              }
              var sp = chain.split('.');
              return sp;
            }
            return null;
          };
          HELMParser.prototype.parse_sugar_from_nucleotide = function (nuc) {
            var monomer_index_marker = nuc.indexOf('.');
            if (monomer_index_marker >= 0) {
              nuc = nuc.substring(monomer_index_marker);
            }
            var vs = nuc.indexOf('(');
            if (vs >= 0) {
              var seq_val = nuc.substring(0, vs);
              return this.removeBrackets(seq_val);
            }
            return '';
          };
          HELMParser.prototype.parse_base_from_nucleotide = function (nuc) {
            var monomer_index_marker = nuc.indexOf('.');
            // console.log ( ' monomer market ' + nuc );
            if (monomer_index_marker >= 0) {
              nuc = nuc.substring(monomer_index_marker);
            }
            var vs = nuc.indexOf('(');
            var vf = nuc.indexOf(')');
            if (vs >= 0 && vf > 0) {
              var seq_val = nuc.substring(vs + 1, vf);
              return this.removeBrackets(seq_val);
            }
            else {
              return nuc;
            }
          };
          HELMParser.prototype.parse_linker_from_nucleotide = function (nuc) {
            var monomer_index_marker = nuc.indexOf('.');
            if (monomer_index_marker >= 0) {
              nuc = nuc.substring(monomer_index_marker);
            }
            var vs = nuc.indexOf(')');
            if (vs >= 0 && vs < nuc.length) {
              var seq_val = nuc.substring(vs + 1);
              return this.removeBrackets(seq_val);
            }
            return '';
          };
          HELMParser.prototype.removeBrackets = function (monomer) {
            var bindex = monomer.indexOf('[');
            var cindex = monomer.indexOf(']');
            if (bindex >= 0 && cindex >= 0) {
              return monomer.substring(bindex + 1, cindex);
            }
            else {
              return monomer;
            }
          };
          return HELMParser;
        }());
        exports.HELMParser = HELMParser;




        /** Detect free variables */
        var freeExports = typeof exports == 'object' && exports &&
          !exports.nodeType && exports;
        var freeModule = typeof module == 'object' && module &&
          !module.nodeType && module;
        var freeGlobal = typeof global == 'object' && global;
        if (
          freeGlobal.global === freeGlobal ||
          freeGlobal.window === freeGlobal ||
          freeGlobal.self === freeGlobal
        ) {
          root = freeGlobal;
        }
        root.HELMParser = HELMParser;

        // -- end helm parser 


      }(this));

    }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
  }, {}],
  48: [function (require, module, exports) {
    "use strict";
    function __export(m) {
      for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
    }
    exports.__esModule = true;
    __export(require("./helm"));
    __export(require("./helm-parser"));
    __export(require("./helm-builder"));
    var HELMParserModule = (function () {
      function HELMParserModule() {
      }
      return HELMParserModule;
    }());
    exports.HELMParserModule = HELMParserModule;

  }, { "./helm": 49, "./helm-builder": 46, "./helm-parser": 47 }], 49: [function (require, module, exports) {
    "use strict";
    exports.__esModule = true;
    var HELM = (function () {
      function HELM() {
      }
      return HELM;
    }());
    exports.HELM = HELM;

  }, {}], 50: [function (require, module, exports) {
    "use strict";
    function __export(m) {
      for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
    }
    exports.__esModule = true;
    __export(require("./helmparser/helm-parser.module"));
    __export(require("./helm-rules/helm-rules.module"));
    __export(require("./helm-monomers/helm-monomers.module"));
    __export(require("./polymers/polymers.module"));

  }, { "./helm-monomers/helm-monomers.module": 39, "./helm-rules/helm-rules.module": 41, "./helmparser/helm-parser.module": 48, "./polymers/polymers.module": 52 }], 51: [function (require, module, exports) {
    "use strict";
    exports.__esModule = true;
    require("rxjs/add/operator/map");
    var environment_1 = require("../environments/environment");
    var http_1 = require("http");
    var PolymerDB = (function () {
      function PolymerDB() {
      }
      PolymerDB.prototype.load = function (id) {
        var _this = this;
        var req = {
          host: environment_1.environment.polymer_db_host,
          port: environment_1.environment.polymer_db_port,
          path: environment_1.environment.polymer_db_path + "/" + id,
          method: 'GET'
        };
        var li = null;
        var a = {
          listen: function (_li) {
            li = _li;
          }
        };
        http_1.request(req, function (res) { return _this.polymerLoaded(li, res); }).end();
        return a;
      };
      PolymerDB.prototype.polymerLoaded = function (a, res) {
        var data = '';
        var index = 0;
        res.on('data', function (chunk) {
          data += chunk;
        });
        res.on('end', function () {
          if (data != null) {
            var js = JSON.parse(data);
            if (js.length > 0) {
              for (var j in js) {
                var rule = js[j];
                a.complete(rule['helm']);
              }
            }
          }
        });
      };
      return PolymerDB;
    }());
    exports.PolymerDB = PolymerDB;

  }, { "../environments/environment": 37, "http": 28, "rxjs/add/operator/map": 57 }], 52: [function (require, module, exports) {
    "use strict";
    function __export(m) {
      for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
    }
    exports.__esModule = true;
    __export(require("./polymerdb"));
    var PolymersModule = (function () {
      function PolymersModule() {
      }
      return PolymersModule;
    }());
    exports.PolymersModule = PolymersModule;

  }, { "./polymerdb": 51 }], 53: [function (require, module, exports) {
    "use strict";
    var root_1 = require('./util/root');
    var toSubscriber_1 = require('./util/toSubscriber');
    var observable_1 = require('./symbol/observable');
    var pipe_1 = require('./util/pipe');
    /**
     * A representation of any set of values over any amount of time. This is the most basic building block
     * of RxJS.
     *
     * @class Observable<T>
     */
    var Observable = (function () {
      /**
       * @constructor
       * @param {Function} subscribe the function that is called when the Observable is
       * initially subscribed to. This function is given a Subscriber, to which new values
       * can be `next`ed, or an `error` method can be called to raise an error, or
       * `complete` can be called to notify of a successful completion.
       */
      function Observable(subscribe) {
        this._isScalar = false;
        if (subscribe) {
          this._subscribe = subscribe;
        }
      }
      /**
       * Creates a new Observable, with this Observable as the source, and the passed
       * operator defined as the new observable's operator.
       * @method lift
       * @param {Operator} operator the operator defining the operation to take on the observable
       * @return {Observable} a new observable with the Operator applied
       */
      Observable.prototype.lift = function (operator) {
        var observable = new Observable();
        observable.source = this;
        observable.operator = operator;
        return observable;
      };
      /**
       * Invokes an execution of an Observable and registers Observer handlers for notifications it will emit.
       *
       * <span class="informal">Use it when you have all these Observables, but still nothing is happening.</span>
       *
       * `subscribe` is not a regular operator, but a method that calls Observable's internal `subscribe` function. It
       * might be for example a function that you passed to a {@link create} static factory, but most of the time it is
       * a library implementation, which defines what and when will be emitted by an Observable. This means that calling
       * `subscribe` is actually the moment when Observable starts its work, not when it is created, as it is often
       * thought.
       *
       * Apart from starting the execution of an Observable, this method allows you to listen for values
       * that an Observable emits, as well as for when it completes or errors. You can achieve this in two
       * following ways.
       *
       * The first way is creating an object that implements {@link Observer} interface. It should have methods
       * defined by that interface, but note that it should be just a regular JavaScript object, which you can create
       * yourself in any way you want (ES6 class, classic function constructor, object literal etc.). In particular do
       * not attempt to use any RxJS implementation details to create Observers - you don't need them. Remember also
       * that your object does not have to implement all methods. If you find yourself creating a method that doesn't
       * do anything, you can simply omit it. Note however, that if `error` method is not provided, all errors will
       * be left uncaught.
       *
       * The second way is to give up on Observer object altogether and simply provide callback functions in place of its methods.
       * This means you can provide three functions as arguments to `subscribe`, where first function is equivalent
       * of a `next` method, second of an `error` method and third of a `complete` method. Just as in case of Observer,
       * if you do not need to listen for something, you can omit a function, preferably by passing `undefined` or `null`,
       * since `subscribe` recognizes these functions by where they were placed in function call. When it comes
       * to `error` function, just as before, if not provided, errors emitted by an Observable will be thrown.
       *
       * Whatever style of calling `subscribe` you use, in both cases it returns a Subscription object.
       * This object allows you to call `unsubscribe` on it, which in turn will stop work that an Observable does and will clean
       * up all resources that an Observable used. Note that cancelling a subscription will not call `complete` callback
       * provided to `subscribe` function, which is reserved for a regular completion signal that comes from an Observable.
       *
       * Remember that callbacks provided to `subscribe` are not guaranteed to be called asynchronously.
       * It is an Observable itself that decides when these functions will be called. For example {@link of}
       * by default emits all its values synchronously. Always check documentation for how given Observable
       * will behave when subscribed and if its default behavior can be modified with a {@link Scheduler}.
       *
       * @example <caption>Subscribe with an Observer</caption>
       * const sumObserver = {
       *   sum: 0,
       *   next(value) {
       *     console.log('Adding: ' + value);
       *     this.sum = this.sum + value;
       *   },
       *   error() { // We actually could just remove this method,
       *   },        // since we do not really care about errors right now.
       *   complete() {
       *     console.log('Sum equals: ' + this.sum);
       *   }
       * };
       *
       * Rx.Observable.of(1, 2, 3) // Synchronously emits 1, 2, 3 and then completes.
       * .subscribe(sumObserver);
       *
       * // Logs:
       * // "Adding: 1"
       * // "Adding: 2"
       * // "Adding: 3"
       * // "Sum equals: 6"
       *
       *
       * @example <caption>Subscribe with functions</caption>
       * let sum = 0;
       *
       * Rx.Observable.of(1, 2, 3)
       * .subscribe(
       *   function(value) {
       *     console.log('Adding: ' + value);
       *     sum = sum + value;
       *   },
       *   undefined,
       *   function() {
       *     console.log('Sum equals: ' + sum);
       *   }
       * );
       *
       * // Logs:
       * // "Adding: 1"
       * // "Adding: 2"
       * // "Adding: 3"
       * // "Sum equals: 6"
       *
       *
       * @example <caption>Cancel a subscription</caption>
       * const subscription = Rx.Observable.interval(1000).subscribe(
       *   num => console.log(num),
       *   undefined,
       *   () => console.log('completed!') // Will not be called, even
       * );                                // when cancelling subscription
       *
       *
       * setTimeout(() => {
       *   subscription.unsubscribe();
       *   console.log('unsubscribed!');
       * }, 2500);
       *
       * // Logs:
       * // 0 after 1s
       * // 1 after 2s
       * // "unsubscribed!" after 2.5s
       *
       *
       * @param {Observer|Function} observerOrNext (optional) Either an observer with methods to be called,
       *  or the first of three possible handlers, which is the handler for each value emitted from the subscribed
       *  Observable.
       * @param {Function} error (optional) A handler for a terminal event resulting from an error. If no error handler is provided,
       *  the error will be thrown as unhandled.
       * @param {Function} complete (optional) A handler for a terminal event resulting from successful completion.
       * @return {ISubscription} a subscription reference to the registered handlers
       * @method subscribe
       */
      Observable.prototype.subscribe = function (observerOrNext, error, complete) {
        var operator = this.operator;
        var sink = toSubscriber_1.toSubscriber(observerOrNext, error, complete);
        if (operator) {
          operator.call(sink, this.source);
        }
        else {
          sink.add(this.source || !sink.syncErrorThrowable ? this._subscribe(sink) : this._trySubscribe(sink));
        }
        if (sink.syncErrorThrowable) {
          sink.syncErrorThrowable = false;
          if (sink.syncErrorThrown) {
            throw sink.syncErrorValue;
          }
        }
        return sink;
      };
      Observable.prototype._trySubscribe = function (sink) {
        try {
          return this._subscribe(sink);
        }
        catch (err) {
          sink.syncErrorThrown = true;
          sink.syncErrorValue = err;
          sink.error(err);
        }
      };
      /**
       * @method forEach
       * @param {Function} next a handler for each value emitted by the observable
       * @param {PromiseConstructor} [PromiseCtor] a constructor function used to instantiate the Promise
       * @return {Promise} a promise that either resolves on observable completion or
       *  rejects with the handled error
       */
      Observable.prototype.forEach = function (next, PromiseCtor) {
        var _this = this;
        if (!PromiseCtor) {
          if (root_1.root.Rx && root_1.root.Rx.config && root_1.root.Rx.config.Promise) {
            PromiseCtor = root_1.root.Rx.config.Promise;
          }
          else if (root_1.root.Promise) {
            PromiseCtor = root_1.root.Promise;
          }
        }
        if (!PromiseCtor) {
          throw new Error('no Promise impl found');
        }
        return new PromiseCtor(function (resolve, reject) {
          // Must be declared in a separate statement to avoid a RefernceError when
          // accessing subscription below in the closure due to Temporal Dead Zone.
          var subscription;
          subscription = _this.subscribe(function (value) {
            if (subscription) {
              // if there is a subscription, then we can surmise
              // the next handling is asynchronous. Any errors thrown
              // need to be rejected explicitly and unsubscribe must be
              // called manually
              try {
                next(value);
              }
              catch (err) {
                reject(err);
                subscription.unsubscribe();
              }
            }
            else {
              // if there is NO subscription, then we're getting a nexted
              // value synchronously during subscription. We can just call it.
              // If it errors, Observable's `subscribe` will ensure the
              // unsubscription logic is called, then synchronously rethrow the error.
              // After that, Promise will trap the error and send it
              // down the rejection path.
              next(value);
            }
          }, reject, resolve);
        });
      };
      Observable.prototype._subscribe = function (subscriber) {
        return this.source.subscribe(subscriber);
      };
      /**
       * An interop point defined by the es7-observable spec https://github.com/zenparsing/es-observable
       * @method Symbol.observable
       * @return {Observable} this instance of the observable
       */
      Observable.prototype[observable_1.observable] = function () {
        return this;
      };
      /* tslint:enable:max-line-length */
      /**
       * Used to stitch together functional operators into a chain.
       * @method pipe
       * @return {Observable} the Observable result of all of the operators having
       * been called in the order they were passed in.
       *
       * @example
       *
       * import { map, filter, scan } from 'rxjs/operators';
       *
       * Rx.Observable.interval(1000)
       *   .pipe(
       *     filter(x => x % 2 === 0),
       *     map(x => x + x),
       *     scan((acc, x) => acc + x)
       *   )
       *   .subscribe(x => console.log(x))
       */
      Observable.prototype.pipe = function () {
        var operations = [];
        for (var _i = 0; _i < arguments.length; _i++) {
          operations[_i - 0] = arguments[_i];
        }
        if (operations.length === 0) {
          return this;
        }
        return pipe_1.pipeFromArray(operations)(this);
      };
      /* tslint:enable:max-line-length */
      Observable.prototype.toPromise = function (PromiseCtor) {
        var _this = this;
        if (!PromiseCtor) {
          if (root_1.root.Rx && root_1.root.Rx.config && root_1.root.Rx.config.Promise) {
            PromiseCtor = root_1.root.Rx.config.Promise;
          }
          else if (root_1.root.Promise) {
            PromiseCtor = root_1.root.Promise;
          }
        }
        if (!PromiseCtor) {
          throw new Error('no Promise impl found');
        }
        return new PromiseCtor(function (resolve, reject) {
          var value;
          _this.subscribe(function (x) { return value = x; }, function (err) { return reject(err); }, function () { return resolve(value); });
        });
      };
      // HACK: Since TypeScript inherits static properties too, we have to
      // fight against TypeScript here so Subject can have a different static create signature
      /**
       * Creates a new cold Observable by calling the Observable constructor
       * @static true
       * @owner Observable
       * @method create
       * @param {Function} subscribe? the subscriber function to be passed to the Observable constructor
       * @return {Observable} a new cold observable
       */
      Observable.create = function (subscribe) {
        return new Observable(subscribe);
      };
      return Observable;
    }());
    exports.Observable = Observable;

  }, { "./symbol/observable": 60, "./util/pipe": 68, "./util/root": 69, "./util/toSubscriber": 70 }], 54: [function (require, module, exports) {
    "use strict";
    exports.empty = {
      closed: true,
      next: function (value) { },
      error: function (err) { throw err; },
      complete: function () { }
    };

  }, {}], 55: [function (require, module, exports) {
    "use strict";
    var __extends = (this && this.__extends) || function (d, b) {
      for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
      function __() { this.constructor = d; }
      d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
    var isFunction_1 = require('./util/isFunction');
    var Subscription_1 = require('./Subscription');
    var Observer_1 = require('./Observer');
    var rxSubscriber_1 = require('./symbol/rxSubscriber');
    /**
     * Implements the {@link Observer} interface and extends the
     * {@link Subscription} class. While the {@link Observer} is the public API for
     * consuming the values of an {@link Observable}, all Observers get converted to
     * a Subscriber, in order to provide Subscription-like capabilities such as
     * `unsubscribe`. Subscriber is a common type in RxJS, and crucial for
     * implementing operators, but it is rarely used as a public API.
     *
     * @class Subscriber<T>
     */
    var Subscriber = (function (_super) {
      __extends(Subscriber, _super);
      /**
       * @param {Observer|function(value: T): void} [destinationOrNext] A partially
       * defined Observer or a `next` callback function.
       * @param {function(e: ?any): void} [error] The `error` callback of an
       * Observer.
       * @param {function(): void} [complete] The `complete` callback of an
       * Observer.
       */
      function Subscriber(destinationOrNext, error, complete) {
        _super.call(this);
        this.syncErrorValue = null;
        this.syncErrorThrown = false;
        this.syncErrorThrowable = false;
        this.isStopped = false;
        switch (arguments.length) {
          case 0:
            this.destination = Observer_1.empty;
            break;
          case 1:
            if (!destinationOrNext) {
              this.destination = Observer_1.empty;
              break;
            }
            if (typeof destinationOrNext === 'object') {
              // HACK(benlesh): To resolve an issue where Node users may have multiple
              // copies of rxjs in their node_modules directory.
              if (isTrustedSubscriber(destinationOrNext)) {
                var trustedSubscriber = destinationOrNext[rxSubscriber_1.rxSubscriber]();
                this.syncErrorThrowable = trustedSubscriber.syncErrorThrowable;
                this.destination = trustedSubscriber;
                trustedSubscriber.add(this);
              }
              else {
                this.syncErrorThrowable = true;
                this.destination = new SafeSubscriber(this, destinationOrNext);
              }
              break;
            }
          default:
            this.syncErrorThrowable = true;
            this.destination = new SafeSubscriber(this, destinationOrNext, error, complete);
            break;
        }
      }
      Subscriber.prototype[rxSubscriber_1.rxSubscriber] = function () { return this; };
      /**
       * A static factory for a Subscriber, given a (potentially partial) definition
       * of an Observer.
       * @param {function(x: ?T): void} [next] The `next` callback of an Observer.
       * @param {function(e: ?any): void} [error] The `error` callback of an
       * Observer.
       * @param {function(): void} [complete] The `complete` callback of an
       * Observer.
       * @return {Subscriber<T>} A Subscriber wrapping the (partially defined)
       * Observer represented by the given arguments.
       */
      Subscriber.create = function (next, error, complete) {
        var subscriber = new Subscriber(next, error, complete);
        subscriber.syncErrorThrowable = false;
        return subscriber;
      };
      /**
       * The {@link Observer} callback to receive notifications of type `next` from
       * the Observable, with a value. The Observable may call this method 0 or more
       * times.
       * @param {T} [value] The `next` value.
       * @return {void}
       */
      Subscriber.prototype.next = function (value) {
        if (!this.isStopped) {
          this._next(value);
        }
      };
      /**
       * The {@link Observer} callback to receive notifications of type `error` from
       * the Observable, with an attached {@link Error}. Notifies the Observer that
       * the Observable has experienced an error condition.
       * @param {any} [err] The `error` exception.
       * @return {void}
       */
      Subscriber.prototype.error = function (err) {
        if (!this.isStopped) {
          this.isStopped = true;
          this._error(err);
        }
      };
      /**
       * The {@link Observer} callback to receive a valueless notification of type
       * `complete` from the Observable. Notifies the Observer that the Observable
       * has finished sending push-based notifications.
       * @return {void}
       */
      Subscriber.prototype.complete = function () {
        if (!this.isStopped) {
          this.isStopped = true;
          this._complete();
        }
      };
      Subscriber.prototype.unsubscribe = function () {
        if (this.closed) {
          return;
        }
        this.isStopped = true;
        _super.prototype.unsubscribe.call(this);
      };
      Subscriber.prototype._next = function (value) {
        this.destination.next(value);
      };
      Subscriber.prototype._error = function (err) {
        this.destination.error(err);
        this.unsubscribe();
      };
      Subscriber.prototype._complete = function () {
        this.destination.complete();
        this.unsubscribe();
      };
      Subscriber.prototype._unsubscribeAndRecycle = function () {
        var _a = this, _parent = _a._parent, _parents = _a._parents;
        this._parent = null;
        this._parents = null;
        this.unsubscribe();
        this.closed = false;
        this.isStopped = false;
        this._parent = _parent;
        this._parents = _parents;
        return this;
      };
      return Subscriber;
    }(Subscription_1.Subscription));
    exports.Subscriber = Subscriber;
    /**
     * We need this JSDoc comment for affecting ESDoc.
     * @ignore
     * @extends {Ignored}
     */
    var SafeSubscriber = (function (_super) {
      __extends(SafeSubscriber, _super);
      function SafeSubscriber(_parentSubscriber, observerOrNext, error, complete) {
        _super.call(this);
        this._parentSubscriber = _parentSubscriber;
        var next;
        var context = this;
        if (isFunction_1.isFunction(observerOrNext)) {
          next = observerOrNext;
        }
        else if (observerOrNext) {
          next = observerOrNext.next;
          error = observerOrNext.error;
          complete = observerOrNext.complete;
          if (observerOrNext !== Observer_1.empty) {
            context = Object.create(observerOrNext);
            if (isFunction_1.isFunction(context.unsubscribe)) {
              this.add(context.unsubscribe.bind(context));
            }
            context.unsubscribe = this.unsubscribe.bind(this);
          }
        }
        this._context = context;
        this._next = next;
        this._error = error;
        this._complete = complete;
      }
      SafeSubscriber.prototype.next = function (value) {
        if (!this.isStopped && this._next) {
          var _parentSubscriber = this._parentSubscriber;
          if (!_parentSubscriber.syncErrorThrowable) {
            this.__tryOrUnsub(this._next, value);
          }
          else if (this.__tryOrSetError(_parentSubscriber, this._next, value)) {
            this.unsubscribe();
          }
        }
      };
      SafeSubscriber.prototype.error = function (err) {
        if (!this.isStopped) {
          var _parentSubscriber = this._parentSubscriber;
          if (this._error) {
            if (!_parentSubscriber.syncErrorThrowable) {
              this.__tryOrUnsub(this._error, err);
              this.unsubscribe();
            }
            else {
              this.__tryOrSetError(_parentSubscriber, this._error, err);
              this.unsubscribe();
            }
          }
          else if (!_parentSubscriber.syncErrorThrowable) {
            this.unsubscribe();
            throw err;
          }
          else {
            _parentSubscriber.syncErrorValue = err;
            _parentSubscriber.syncErrorThrown = true;
            this.unsubscribe();
          }
        }
      };
      SafeSubscriber.prototype.complete = function () {
        var _this = this;
        if (!this.isStopped) {
          var _parentSubscriber = this._parentSubscriber;
          if (this._complete) {
            var wrappedComplete = function () { return _this._complete.call(_this._context); };
            if (!_parentSubscriber.syncErrorThrowable) {
              this.__tryOrUnsub(wrappedComplete);
              this.unsubscribe();
            }
            else {
              this.__tryOrSetError(_parentSubscriber, wrappedComplete);
              this.unsubscribe();
            }
          }
          else {
            this.unsubscribe();
          }
        }
      };
      SafeSubscriber.prototype.__tryOrUnsub = function (fn, value) {
        try {
          fn.call(this._context, value);
        }
        catch (err) {
          this.unsubscribe();
          throw err;
        }
      };
      SafeSubscriber.prototype.__tryOrSetError = function (parent, fn, value) {
        try {
          fn.call(this._context, value);
        }
        catch (err) {
          parent.syncErrorValue = err;
          parent.syncErrorThrown = true;
          return true;
        }
        return false;
      };
      SafeSubscriber.prototype._unsubscribe = function () {
        var _parentSubscriber = this._parentSubscriber;
        this._context = null;
        this._parentSubscriber = null;
        _parentSubscriber.unsubscribe();
      };
      return SafeSubscriber;
    }(Subscriber));
    function isTrustedSubscriber(obj) {
      return obj instanceof Subscriber || ('syncErrorThrowable' in obj && obj[rxSubscriber_1.rxSubscriber]);
    }

  }, { "./Observer": 54, "./Subscription": 56, "./symbol/rxSubscriber": 61, "./util/isFunction": 65 }], 56: [function (require, module, exports) {
    "use strict";
    var isArray_1 = require('./util/isArray');
    var isObject_1 = require('./util/isObject');
    var isFunction_1 = require('./util/isFunction');
    var tryCatch_1 = require('./util/tryCatch');
    var errorObject_1 = require('./util/errorObject');
    var UnsubscriptionError_1 = require('./util/UnsubscriptionError');
    /**
     * Represents a disposable resource, such as the execution of an Observable. A
     * Subscription has one important method, `unsubscribe`, that takes no argument
     * and just disposes the resource held by the subscription.
     *
     * Additionally, subscriptions may be grouped together through the `add()`
     * method, which will attach a child Subscription to the current Subscription.
     * When a Subscription is unsubscribed, all its children (and its grandchildren)
     * will be unsubscribed as well.
     *
     * @class Subscription
     */
    var Subscription = (function () {
      /**
       * @param {function(): void} [unsubscribe] A function describing how to
       * perform the disposal of resources when the `unsubscribe` method is called.
       */
      function Subscription(unsubscribe) {
        /**
         * A flag to indicate whether this Subscription has already been unsubscribed.
         * @type {boolean}
         */
        this.closed = false;
        this._parent = null;
        this._parents = null;
        this._subscriptions = null;
        if (unsubscribe) {
          this._unsubscribe = unsubscribe;
        }
      }
      /**
       * Disposes the resources held by the subscription. May, for instance, cancel
       * an ongoing Observable execution or cancel any other type of work that
       * started when the Subscription was created.
       * @return {void}
       */
      Subscription.prototype.unsubscribe = function () {
        var hasErrors = false;
        var errors;
        if (this.closed) {
          return;
        }
        var _a = this, _parent = _a._parent, _parents = _a._parents, _unsubscribe = _a._unsubscribe, _subscriptions = _a._subscriptions;
        this.closed = true;
        this._parent = null;
        this._parents = null;
        // null out _subscriptions first so any child subscriptions that attempt
        // to remove themselves from this subscription will noop
        this._subscriptions = null;
        var index = -1;
        var len = _parents ? _parents.length : 0;
        // if this._parent is null, then so is this._parents, and we
        // don't have to remove ourselves from any parent subscriptions.
        while (_parent) {
          _parent.remove(this);
          // if this._parents is null or index >= len,
          // then _parent is set to null, and the loop exits
          _parent = ++index < len && _parents[index] || null;
        }
        if (isFunction_1.isFunction(_unsubscribe)) {
          var trial = tryCatch_1.tryCatch(_unsubscribe).call(this);
          if (trial === errorObject_1.errorObject) {
            hasErrors = true;
            errors = errors || (errorObject_1.errorObject.e instanceof UnsubscriptionError_1.UnsubscriptionError ?
              flattenUnsubscriptionErrors(errorObject_1.errorObject.e.errors) : [errorObject_1.errorObject.e]);
          }
        }
        if (isArray_1.isArray(_subscriptions)) {
          index = -1;
          len = _subscriptions.length;
          while (++index < len) {
            var sub = _subscriptions[index];
            if (isObject_1.isObject(sub)) {
              var trial = tryCatch_1.tryCatch(sub.unsubscribe).call(sub);
              if (trial === errorObject_1.errorObject) {
                hasErrors = true;
                errors = errors || [];
                var err = errorObject_1.errorObject.e;
                if (err instanceof UnsubscriptionError_1.UnsubscriptionError) {
                  errors = errors.concat(flattenUnsubscriptionErrors(err.errors));
                }
                else {
                  errors.push(err);
                }
              }
            }
          }
        }
        if (hasErrors) {
          throw new UnsubscriptionError_1.UnsubscriptionError(errors);
        }
      };
      /**
       * Adds a tear down to be called during the unsubscribe() of this
       * Subscription.
       *
       * If the tear down being added is a subscription that is already
       * unsubscribed, is the same reference `add` is being called on, or is
       * `Subscription.EMPTY`, it will not be added.
       *
       * If this subscription is already in an `closed` state, the passed
       * tear down logic will be executed immediately.
       *
       * @param {TeardownLogic} teardown The additional logic to execute on
       * teardown.
       * @return {Subscription} Returns the Subscription used or created to be
       * added to the inner subscriptions list. This Subscription can be used with
       * `remove()` to remove the passed teardown logic from the inner subscriptions
       * list.
       */
      Subscription.prototype.add = function (teardown) {
        if (!teardown || (teardown === Subscription.EMPTY)) {
          return Subscription.EMPTY;
        }
        if (teardown === this) {
          return this;
        }
        var subscription = teardown;
        switch (typeof teardown) {
          case 'function':
            subscription = new Subscription(teardown);
          case 'object':
            if (subscription.closed || typeof subscription.unsubscribe !== 'function') {
              return subscription;
            }
            else if (this.closed) {
              subscription.unsubscribe();
              return subscription;
            }
            else if (typeof subscription._addParent !== 'function' /* quack quack */) {
              var tmp = subscription;
              subscription = new Subscription();
              subscription._subscriptions = [tmp];
            }
            break;
          default:
            throw new Error('unrecognized teardown ' + teardown + ' added to Subscription.');
        }
        var subscriptions = this._subscriptions || (this._subscriptions = []);
        subscriptions.push(subscription);
        subscription._addParent(this);
        return subscription;
      };
      /**
       * Removes a Subscription from the internal list of subscriptions that will
       * unsubscribe during the unsubscribe process of this Subscription.
       * @param {Subscription} subscription The subscription to remove.
       * @return {void}
       */
      Subscription.prototype.remove = function (subscription) {
        var subscriptions = this._subscriptions;
        if (subscriptions) {
          var subscriptionIndex = subscriptions.indexOf(subscription);
          if (subscriptionIndex !== -1) {
            subscriptions.splice(subscriptionIndex, 1);
          }
        }
      };
      Subscription.prototype._addParent = function (parent) {
        var _a = this, _parent = _a._parent, _parents = _a._parents;
        if (!_parent || _parent === parent) {
          // If we don't have a parent, or the new parent is the same as the
          // current parent, then set this._parent to the new parent.
          this._parent = parent;
        }
        else if (!_parents) {
          // If there's already one parent, but not multiple, allocate an Array to
          // store the rest of the parent Subscriptions.
          this._parents = [parent];
        }
        else if (_parents.indexOf(parent) === -1) {
          // Only add the new parent to the _parents list if it's not already there.
          _parents.push(parent);
        }
      };
      Subscription.EMPTY = (function (empty) {
        empty.closed = true;
        return empty;
      }(new Subscription()));
      return Subscription;
    }());
    exports.Subscription = Subscription;
    function flattenUnsubscriptionErrors(errors) {
      return errors.reduce(function (errs, err) { return errs.concat((err instanceof UnsubscriptionError_1.UnsubscriptionError) ? err.errors : err); }, []);
    }

  }, { "./util/UnsubscriptionError": 62, "./util/errorObject": 63, "./util/isArray": 64, "./util/isFunction": 65, "./util/isObject": 66, "./util/tryCatch": 71 }], 57: [function (require, module, exports) {
    "use strict";
    var Observable_1 = require('../../Observable');
    var map_1 = require('../../operator/map');
    Observable_1.Observable.prototype.map = map_1.map;

  }, { "../../Observable": 53, "../../operator/map": 58 }], 58: [function (require, module, exports) {
    "use strict";
    var map_1 = require('../operators/map');
    /**
     * Applies a given `project` function to each value emitted by the source
     * Observable, and emits the resulting values as an Observable.
     *
     * <span class="informal">Like [Array.prototype.map()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map),
     * it passes each source value through a transformation function to get
     * corresponding output values.</span>
     *
     * <img src="./img/map.png" width="100%">
     *
     * Similar to the well known `Array.prototype.map` function, this operator
     * applies a projection to each value and emits that projection in the output
     * Observable.
     *
     * @example <caption>Map every click to the clientX position of that click</caption>
     * var clicks = Rx.Observable.fromEvent(document, 'click');
     * var positions = clicks.map(ev => ev.clientX);
     * positions.subscribe(x => console.log(x));
     *
     * @see {@link mapTo}
     * @see {@link pluck}
     *
     * @param {function(value: T, index: number): R} project The function to apply
     * to each `value` emitted by the source Observable. The `index` parameter is
     * the number `i` for the i-th emission that has happened since the
     * subscription, starting from the number `0`.
     * @param {any} [thisArg] An optional argument to define what `this` is in the
     * `project` function.
     * @return {Observable<R>} An Observable that emits the values from the source
     * Observable transformed by the given `project` function.
     * @method map
     * @owner Observable
     */
    function map(project, thisArg) {
      return map_1.map(project, thisArg)(this);
    }
    exports.map = map;

  }, { "../operators/map": 59 }], 59: [function (require, module, exports) {
    "use strict";
    var __extends = (this && this.__extends) || function (d, b) {
      for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
      function __() { this.constructor = d; }
      d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
    var Subscriber_1 = require('../Subscriber');
    /**
     * Applies a given `project` function to each value emitted by the source
     * Observable, and emits the resulting values as an Observable.
     *
     * <span class="informal">Like [Array.prototype.map()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map),
     * it passes each source value through a transformation function to get
     * corresponding output values.</span>
     *
     * <img src="./img/map.png" width="100%">
     *
     * Similar to the well known `Array.prototype.map` function, this operator
     * applies a projection to each value and emits that projection in the output
     * Observable.
     *
     * @example <caption>Map every click to the clientX position of that click</caption>
     * var clicks = Rx.Observable.fromEvent(document, 'click');
     * var positions = clicks.map(ev => ev.clientX);
     * positions.subscribe(x => console.log(x));
     *
     * @see {@link mapTo}
     * @see {@link pluck}
     *
     * @param {function(value: T, index: number): R} project The function to apply
     * to each `value` emitted by the source Observable. The `index` parameter is
     * the number `i` for the i-th emission that has happened since the
     * subscription, starting from the number `0`.
     * @param {any} [thisArg] An optional argument to define what `this` is in the
     * `project` function.
     * @return {Observable<R>} An Observable that emits the values from the source
     * Observable transformed by the given `project` function.
     * @method map
     * @owner Observable
     */
    function map(project, thisArg) {
      return function mapOperation(source) {
        if (typeof project !== 'function') {
          throw new TypeError('argument is not a function. Are you looking for `mapTo()`?');
        }
        return source.lift(new MapOperator(project, thisArg));
      };
    }
    exports.map = map;
    var MapOperator = (function () {
      function MapOperator(project, thisArg) {
        this.project = project;
        this.thisArg = thisArg;
      }
      MapOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new MapSubscriber(subscriber, this.project, this.thisArg));
      };
      return MapOperator;
    }());
    exports.MapOperator = MapOperator;
    /**
     * We need this JSDoc comment for affecting ESDoc.
     * @ignore
     * @extends {Ignored}
     */
    var MapSubscriber = (function (_super) {
      __extends(MapSubscriber, _super);
      function MapSubscriber(destination, project, thisArg) {
        _super.call(this, destination);
        this.project = project;
        this.count = 0;
        this.thisArg = thisArg || this;
      }
      // NOTE: This looks unoptimized, but it's actually purposefully NOT
      // using try/catch optimizations.
      MapSubscriber.prototype._next = function (value) {
        var result;
        try {
          result = this.project.call(this.thisArg, value, this.count++);
        }
        catch (err) {
          this.destination.error(err);
          return;
        }
        this.destination.next(result);
      };
      return MapSubscriber;
    }(Subscriber_1.Subscriber));

  }, { "../Subscriber": 55 }], 60: [function (require, module, exports) {
    "use strict";
    var root_1 = require('../util/root');
    function getSymbolObservable(context) {
      var $$observable;
      var Symbol = context.Symbol;
      if (typeof Symbol === 'function') {
        if (Symbol.observable) {
          $$observable = Symbol.observable;
        }
        else {
          $$observable = Symbol('observable');
          Symbol.observable = $$observable;
        }
      }
      else {
        $$observable = '@@observable';
      }
      return $$observable;
    }
    exports.getSymbolObservable = getSymbolObservable;
    exports.observable = getSymbolObservable(root_1.root);
    /**
     * @deprecated use observable instead
     */
    exports.$$observable = exports.observable;

  }, { "../util/root": 69 }], 61: [function (require, module, exports) {
    "use strict";
    var root_1 = require('../util/root');
    var Symbol = root_1.root.Symbol;
    exports.rxSubscriber = (typeof Symbol === 'function' && typeof Symbol.for === 'function') ?
      Symbol.for('rxSubscriber') : '@@rxSubscriber';
    /**
     * @deprecated use rxSubscriber instead
     */
    exports.$$rxSubscriber = exports.rxSubscriber;

  }, { "../util/root": 69 }], 62: [function (require, module, exports) {
    "use strict";
    var __extends = (this && this.__extends) || function (d, b) {
      for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
      function __() { this.constructor = d; }
      d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
    /**
     * An error thrown when one or more errors have occurred during the
     * `unsubscribe` of a {@link Subscription}.
     */
    var UnsubscriptionError = (function (_super) {
      __extends(UnsubscriptionError, _super);
      function UnsubscriptionError(errors) {
        _super.call(this);
        this.errors = errors;
        var err = Error.call(this, errors ?
          errors.length + " errors occurred during unsubscription:\n  " + errors.map(function (err, i) { return ((i + 1) + ") " + err.toString()); }).join('\n  ') : '');
        this.name = err.name = 'UnsubscriptionError';
        this.stack = err.stack;
        this.message = err.message;
      }
      return UnsubscriptionError;
    }(Error));
    exports.UnsubscriptionError = UnsubscriptionError;

  }, {}], 63: [function (require, module, exports) {
    "use strict";
    // typeof any so that it we don't have to cast when comparing a result to the error object
    exports.errorObject = { e: {} };

  }, {}], 64: [function (require, module, exports) {
    "use strict";
    exports.isArray = Array.isArray || (function (x) { return x && typeof x.length === 'number'; });

  }, {}], 65: [function (require, module, exports) {
    "use strict";
    function isFunction(x) {
      return typeof x === 'function';
    }
    exports.isFunction = isFunction;

  }, {}], 66: [function (require, module, exports) {
    "use strict";
    function isObject(x) {
      return x != null && typeof x === 'object';
    }
    exports.isObject = isObject;

  }, {}], 67: [function (require, module, exports) {
    "use strict";
    /* tslint:disable:no-empty */
    function noop() { }
    exports.noop = noop;

  }, {}], 68: [function (require, module, exports) {
    "use strict";
    var noop_1 = require('./noop');
    /* tslint:enable:max-line-length */
    function pipe() {
      var fns = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        fns[_i - 0] = arguments[_i];
      }
      return pipeFromArray(fns);
    }
    exports.pipe = pipe;
    /* @internal */
    function pipeFromArray(fns) {
      if (!fns) {
        return noop_1.noop;
      }
      if (fns.length === 1) {
        return fns[0];
      }
      return function piped(input) {
        return fns.reduce(function (prev, fn) { return fn(prev); }, input);
      };
    }
    exports.pipeFromArray = pipeFromArray;

  }, { "./noop": 67 }], 69: [function (require, module, exports) {
    (function (global) {
      "use strict";
      // CommonJS / Node have global context exposed as "global" variable.
      // We don't want to include the whole node.d.ts this this compilation unit so we'll just fake
      // the global "global" var for now.
      var __window = typeof window !== 'undefined' && window;
      var __self = typeof self !== 'undefined' && typeof WorkerGlobalScope !== 'undefined' &&
        self instanceof WorkerGlobalScope && self;
      var __global = typeof global !== 'undefined' && global;
      var _root = __window || __global || __self;
      exports.root = _root;
      // Workaround Closure Compiler restriction: The body of a goog.module cannot use throw.
      // This is needed when used with angular/tsickle which inserts a goog.module statement.
      // Wrap in IIFE
      (function () {
        if (!_root) {
          throw new Error('RxJS could not find any global context (window, self, global)');
        }
      })();

    }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
  }, {}], 70: [function (require, module, exports) {
    "use strict";
    var Subscriber_1 = require('../Subscriber');
    var rxSubscriber_1 = require('../symbol/rxSubscriber');
    var Observer_1 = require('../Observer');
    function toSubscriber(nextOrObserver, error, complete) {
      if (nextOrObserver) {
        if (nextOrObserver instanceof Subscriber_1.Subscriber) {
          return nextOrObserver;
        }
        if (nextOrObserver[rxSubscriber_1.rxSubscriber]) {
          return nextOrObserver[rxSubscriber_1.rxSubscriber]();
        }
      }
      if (!nextOrObserver && !error && !complete) {
        return new Subscriber_1.Subscriber(Observer_1.empty);
      }
      return new Subscriber_1.Subscriber(nextOrObserver, error, complete);
    }
    exports.toSubscriber = toSubscriber;

  }, { "../Observer": 54, "../Subscriber": 55, "../symbol/rxSubscriber": 61 }], 71: [function (require, module, exports) {
    "use strict";
    var errorObject_1 = require('./errorObject');
    var tryCatchTarget;
    function tryCatcher() {
      try {
        return tryCatchTarget.apply(this, arguments);
      }
      catch (e) {
        errorObject_1.errorObject.e = e;
        return errorObject_1.errorObject;
      }
    }
    function tryCatch(fn) {
      tryCatchTarget = fn;
      return tryCatcher;
    }
    exports.tryCatch = tryCatch;
    ;

  }, { "./errorObject": 63 }]
}, {}, [50]);









var getJSON = function (url, callback) {
  // var xhr = new XMLHttpRequest();
  // // xhr.responseType = 'json';
  // xhr.open('GET', url, false);
  // xhr.onload = function () {
  //   var status = xhr.status;
  //   if (status == 200) {
  //     callback(null, xhr.response);
  //   } else {
  //     callback(status);
  //   }
  // };
  // xhr.send();
};


function pause(milliseconds) {
  var dt = new Date();
  while ((new Date()) - dt <= milliseconds) { /* Do nothing */ }
}


var OligoFactory = class OligoFactory {
  constructor(monomerdb) {
    this.monomerdb = monomerdb;
  }
  //let chainstring = "RNA/3:cet-10:d-3:cet";

  create(chain, sequence) {
    let chain_list = [];
    var index = chain.indexOf('/');
    var polymer_type = chain.substring(0, index);

    var rchain = chain.substring(index + 1);
    rchain = rchain.trim();
    polymer_type = polymer_type.toUpperCase();
    if (rchain.indexOf('-') > 0) {
      let sett = rchain.split('-');
      for (let s of sett) {
        let ind = s.indexOf(":");
        if (ind > 0) {
          var count = s.substring(0, ind);
          var monomer = s.substring(ind + 1);
          let mset = this.createMonomerSet(polymer_type, monomer, count);
          for (let msetob of mset) {
            console.log(" m " + msetob.id);
            chain_list.push(msetob);
          }
        }
      }
    }
    return new OligoChain(polymer_type, chain_list);
  }
  createMonomerSet(polymer_type, monomer_id, count) {
    let mset = [];
    for (var i = 0; i < count; i++) {
      let monomer = this.monomerdb.getMonomer(polymer_type, monomer_id);
      mset.push(monomer);
    }
    return mset;
  }
};
// the oligo chain object 
var OligoChain = class OligoChain {

  constructor(type, monomers, sequence) {
    this.type = type;
    this.monomers = monomers;
    this.sequence = sequence;
  }

  toHELM() {
    if (this.type === 'RNA') {
      var helm = this.type + "1{";
      let index = 0;

      let seqc = [];
      if (this.sequence) {
        seqc = sequence.split('');
      }
      for (let mon of this.monomers) {
        let base = '*';
        if (index < seqc.length) {
          base = this.seqc[index++];
        }
        helm += this.mangae_symbol_char(mon.symbol) + "(" + base + ")p.";
      }
      if (helm.endsWith(".")) {
        helm = helm.substring(0, helm.length - 1);

      }
      return helm + "}$$$$";
    }
  }
  mangae_symbol_char(t) {
    if (t.length > 1) {
      return '[' + t + ']';
    } else
      return t;
  }
}

var DNA = class DNA {
  constructor(sequence) {
    var c = '';
    for (var i = 0; i < sequence.length; i++) {
      c += 'd(' + sequence[i] + ')';
      if (i + 1 < sequence.length) {
        c += "p.";
      }
    }
    this.helm = "RNA1{" + c + "}$$$$";
  }
  toHELM() {
    return this.helm;
  }
}




var MonomerDB = class MonomerDB {

  constructor(url) {
    this.url = url;
    getJSON(this.url, function (err, data) {
      if (err != null) {
        console.error(err);
      } else {
        console.log("-data- ");
        MonomerDB.db = JSON.parse(data);
      }
    });
  }

  getNaturalAnalog(polymertype, monmoerid) {
    if (MonomerDB.db) {
      for (let i = 0; i < MonomerDB.db.length; i++) {
        let ob = MonomerDB.db[i];
        if (ob['id'] === polymertype + '/' + monmoerid) {
          return ob['naturalanalog'];
        }
      }
      console.log(" failed to find the monomer " + polymertype + '/' + monmoerid);
      return null;
    } else {
      // var loading = true;
      console.log(" loading monomers still... ");
      return null;
      var id = setInterval(function () {
        console.log(' check ');
        if (MonomerDB.db) {
          clearInterval(id);
          loading = false;
          for (let i = 0; i < MonomerDB.db.length; i++) {
            let ob = MonomerDB.db[i];
            if (ob['id'].trim() === polymertype + '/' + monmoerid) {
              return ob['naturalanalog'];
            }
          }
        }
      }, 1000);
    }
  }

  getMonomer(polymertype, monmoerid) {
    if (MonomerDB.db) {
      console.log('\tMonomerDB size: \t ' + MonomerDB.db.length);
      for (let i = 0; i < MonomerDB.db.length; i++) {
        let ob = MonomerDB.db[i];
        if (ob['id'] === polymertype + '/' + monmoerid) {
          return ob;
        }
      }
      console.log(" failed to find the monomer " + polymertype + '/' + monmoerid);
      return null;
    } else {
      // var loading = true;
      console.log(" loading monomers still... ");
      return null;
      var id = setInterval(function () {
        console.log(' check ');
        if (MonomerDB.db) {
          clearInterval(id);
          loading = false;
          for (let i = 0; i < MonomerDB.db.length; i++) {
            let ob = MonomerDB.db[i];
            if (ob['id'].trim() === polymertype + '/' + monmoerid) {
              return ob;
            }
          }
        }
      }, 1000);
    }
  }


  isLoaded() {
    if (MonomerDB.db) {
      return true;
    } else {
      return false;
    }
  }

  printDB() {
    if (!MonomerDB.db) {
      var id = setInterval(function () {
        if (MonomerDB.db != null) {
          for (var i = 0; i < MonomerDB.db.length; i++) {
            console.log(" i  " + JSON.stringify(MonomerDB.db[i]));
          }
          clearInterval(id);
          return;

        }
      }, 1000);
    } else {
      for (var i = 0; i < MonomerDB.db.length; i++) {
        console.log(" item  " + MonomerDB.db[i].toString());
      }
    }
  }
};


var RNAChain = class RNAChain {
  constructor(id, sequence) {
    this.id = id;
    this.sequence = sequence;
  }
};
// public static remote_host:string = 'http://ionprod:8984'
// public static host:string = URLs.remote_host;
// public static load_helm_rule_for_user = URLs.host + "/helm_rules/get_helm_rules_for_user";
// public static save_helm_rule_for_user:string = URLs.host + "/helm_rules/save_helm_rule";
// public static delete_helm_rule_for_user:string = URLs.host + "/helm_rules/delete_helm_rule";
var HELMRuleDB = class HELMRuleDB {


  static load(user, rule) {

    let data = null;
    let url = "http://ionprod:8984/helm_rules/get_helm_rule";
    var xhr = new XMLHttpRequest();
    // xhr.responseType = 'json';
    // xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

    let js = {
      "user_id": user,
      "rule_name": rule
    };

    xhr.open('POST', url, false);
    // xhr.setRequestHeader("Content-type", "application/json");
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

    xhr.onload = function () {
      var status = xhr.status;
      if (status == 200) {
        data = xhr.response;
      } else {
        //callback(status);
        return " failed to load " + status;
      }
    };
    xhr.send(JSON.stringify(js));
    let helm_rule_object = JSON.parse(data);
    return helm_rule_object;
  }
};


let OligoDB = class OligoDB {

  static load(oligoid) {
    let data = null;
    let url = "http://oligodb:8080/oligos/" + oligoid;
    var xhr = new XMLHttpRequest();
    // xhr.responseType = 'json';
    // xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    // xhr.setRequestHeader("Content-type", "application/json");
    console.log(" url " + url);
    xhr.open("GET", url, false);
    // xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

    xhr.onload = function () {
      var status = xhr.status;
      if (status == 200) {
        data = xhr.response;
      } else {
        //callback(status);
        return " failed to load " + status;
      }
    };

    xhr.send();
    let obj = JSON.parse(data);
    if (obj && obj.length > 0)
      return obj[0];
    else
      return null;
  }





};


let OligoManager = class OligoManager {
  constructor(monomerLib) {
    this.monmerLib = monomerLib;
    this.helm_parser = new HELMParser(this.monmerLib);
  }
  getSequence(helm) {
    let helm_monomer_sequence = this.helm_parser.pull_sequence(helm);
    let hs = helm_monomer_sequence.split(' ');
    let na = [];
    for (let monomer of hs) {

      let m = this.helm_parser.removeBrackets(monomer);
      if (m && m.length > 0) {
        na.push(this.monmerLib.getNaturalAnalog('RNA', m));
      }
    }
    let seq = '';
    for (let n of na) {
      seq += n;
    }
    return seq;
  }
};


let Genome = class Genome {

  constructor(build) {
    this.build = build;
  }


  lsc(sequence, gene) {


    let data = null;

    let url = "htt://ionprod:8701/v1/genome/lsc-hits?sequence=" + sequence + "&path=/human";
    
    if ( gene ){

    }

    var xhr = new XMLHttpRequest();
    xhr.ontimeout = function () { alert("Genome Timed out"); }

    console.log(" url " + url);
    xhr.open("GET", url, false);
    xhr.onload = function () {
      var status = xhr.status;
      if (status == 200) {
        data = xhr.response;
      } else {
        //callback(status);
        return " failed to load " + status;
      }
    };

    xhr.send();
    let obj = JSON.parse(data);
    return obj;
  }





};



let PanModels = class PanModels {
  run(id, helm, lsc) {
    let data = null;
    this.msg = "Running calculation... ";
    setTimeout(() => {
      if (lsc == null || lsc.length < 499) {
        this.pan_msg = " Cannot calculate activity for " + id + "; no LSC found.";
      }
      // console.log(" lsc " + lsc);
      let params = {
        'lsc': lsc,
        'helm': helm,
        'id': id
      }
      var body = JSON.stringify(params);
      let headers = new Headers({ 'Content-Type': 'application/json' });
      // console.log(' json body ' + JSON.stringify(params));
      let url = 'http://ionprod:8701/v1/genome/pan-scores';
      var xhr = new XMLHttpRequest();
      xhr.ontimeout = function () { alert("Genome Timed out"); }
      // console.log("pan url " + url);
      xhr.open("POST", url, false);
      xhr.setRequestHeader("Content-type", "application/json");
      xhr.onload = function () {
        var status = xhr.status;
        console.log(' data ' + status);
        if (status == 200) {
          data = xhr.response;
        } else {
          //callback(status);
          return " failed to load " + status;
        }
      };
      xhr.send(body);
      let strs = data;
      strs = strs.split("NaN").join("-1");
      console.log(" re " + strs);
      let results = JSON.parse(strs);
      return results;
    }, 1000);
  }
};


function readFile ( path ) {


  if ( path.startsWith ( '/')){
    path = path.substring ( 1 );
  }
  let ind = path.indexOf ( '/' );
  let bucket = path.substring ( 0, ind);
  path = path.substring ( ind+1 );




    let url = 'http://ionprod:8000/files/s3get?bucket={bucket}&path={path}';

    url = url.replace ( "{bucket}", bucket );
    url = url.replace ( "{path}", path );
    
    var xhr = new XMLHttpRequest();
    xhr.ontimeout = function () { alert("Timed out"); }
    console.log(" url " + url);
    xhr.open("GET", url, false);
    xhr.onload = function () {
      var status = xhr.status;
      if (status == 200) {
        data = xhr.response;
      } else {
        //callback(status);
        return " failed to load " + status;
      }
    };

    xhr.send();
    return data;
}

let Ribogreen = class Ribogreen {


    


}

