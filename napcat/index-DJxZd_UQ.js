import { ReadableStream } from 'node:stream/web';
import { Readable, PassThrough, pipeline } from 'node:stream';
import { open, stat } from 'node:fs/promises';
import { createRequire } from 'module';
import fs__default from 'fs';
import path__default from 'path';
import require$$0 from 'events';

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

function getAugmentedNamespace(n) {
  if (Object.prototype.hasOwnProperty.call(n, '__esModule')) return n;
  var f = n.default;
	if (typeof f == "function") {
		var a = function a () {
			if (this instanceof a) {
        return Reflect.construct(f, arguments, this.constructor);
			}
			return f.apply(this, arguments);
		};
		a.prototype = f.prototype;
  } else a = {};
  Object.defineProperty(a, '__esModule', {value: true});
	Object.keys(n).forEach(function (k) {
		var d = Object.getOwnPropertyDescriptor(n, k);
		Object.defineProperty(a, k, d.get ? d : {
			enumerable: true,
			get: function () {
				return n[k];
			}
		});
	});
	return a;
}

/**
 * Helpers.
 */

var ms;
var hasRequiredMs;

function requireMs () {
	if (hasRequiredMs) return ms;
	hasRequiredMs = 1;
	var s = 1000;
	var m = s * 60;
	var h = m * 60;
	var d = h * 24;
	var w = d * 7;
	var y = d * 365.25;

	/**
	 * Parse or format the given `val`.
	 *
	 * Options:
	 *
	 *  - `long` verbose formatting [false]
	 *
	 * @param {String|Number} val
	 * @param {Object} [options]
	 * @throws {Error} throw an error if val is not a non-empty string or a number
	 * @return {String|Number}
	 * @api public
	 */

	ms = function (val, options) {
	  options = options || {};
	  var type = typeof val;
	  if (type === 'string' && val.length > 0) {
	    return parse(val);
	  } else if (type === 'number' && isFinite(val)) {
	    return options.long ? fmtLong(val) : fmtShort(val);
	  }
	  throw new Error(
	    'val is not a non-empty string or a valid number. val=' +
	      JSON.stringify(val)
	  );
	};

	/**
	 * Parse the given `str` and return milliseconds.
	 *
	 * @param {String} str
	 * @return {Number}
	 * @api private
	 */

	function parse(str) {
	  str = String(str);
	  if (str.length > 100) {
	    return;
	  }
	  var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
	    str
	  );
	  if (!match) {
	    return;
	  }
	  var n = parseFloat(match[1]);
	  var type = (match[2] || 'ms').toLowerCase();
	  switch (type) {
	    case 'years':
	    case 'year':
	    case 'yrs':
	    case 'yr':
	    case 'y':
	      return n * y;
	    case 'weeks':
	    case 'week':
	    case 'w':
	      return n * w;
	    case 'days':
	    case 'day':
	    case 'd':
	      return n * d;
	    case 'hours':
	    case 'hour':
	    case 'hrs':
	    case 'hr':
	    case 'h':
	      return n * h;
	    case 'minutes':
	    case 'minute':
	    case 'mins':
	    case 'min':
	    case 'm':
	      return n * m;
	    case 'seconds':
	    case 'second':
	    case 'secs':
	    case 'sec':
	    case 's':
	      return n * s;
	    case 'milliseconds':
	    case 'millisecond':
	    case 'msecs':
	    case 'msec':
	    case 'ms':
	      return n;
	    default:
	      return undefined;
	  }
	}

	/**
	 * Short format for `ms`.
	 *
	 * @param {Number} ms
	 * @return {String}
	 * @api private
	 */

	function fmtShort(ms) {
	  var msAbs = Math.abs(ms);
	  if (msAbs >= d) {
	    return Math.round(ms / d) + 'd';
	  }
	  if (msAbs >= h) {
	    return Math.round(ms / h) + 'h';
	  }
	  if (msAbs >= m) {
	    return Math.round(ms / m) + 'm';
	  }
	  if (msAbs >= s) {
	    return Math.round(ms / s) + 's';
	  }
	  return ms + 'ms';
	}

	/**
	 * Long format for `ms`.
	 *
	 * @param {Number} ms
	 * @return {String}
	 * @api private
	 */

	function fmtLong(ms) {
	  var msAbs = Math.abs(ms);
	  if (msAbs >= d) {
	    return plural(ms, msAbs, d, 'day');
	  }
	  if (msAbs >= h) {
	    return plural(ms, msAbs, h, 'hour');
	  }
	  if (msAbs >= m) {
	    return plural(ms, msAbs, m, 'minute');
	  }
	  if (msAbs >= s) {
	    return plural(ms, msAbs, s, 'second');
	  }
	  return ms + ' ms';
	}

	/**
	 * Pluralization helper.
	 */

	function plural(ms, msAbs, n, name) {
	  var isPlural = msAbs >= n * 1.5;
	  return Math.round(ms / n) + ' ' + name + (isPlural ? 's' : '');
	}
	return ms;
}

var inherits_browser = {exports: {}};

var hasRequiredInherits_browser;

function requireInherits_browser () {
	if (hasRequiredInherits_browser) return inherits_browser.exports;
	hasRequiredInherits_browser = 1;
	if (typeof Object.create === 'function') {
	  // implementation from standard node.js 'util' module
	  inherits_browser.exports = function inherits(ctor, superCtor) {
	    if (superCtor) {
	      ctor.super_ = superCtor;
	      ctor.prototype = Object.create(superCtor.prototype, {
	        constructor: {
	          value: ctor,
	          enumerable: false,
	          writable: true,
	          configurable: true
	        }
	      });
	    }
	  };
	} else {
	  // old school shim for old browsers
	  inherits_browser.exports = function inherits(ctor, superCtor) {
	    if (superCtor) {
	      ctor.super_ = superCtor;
	      var TempCtor = function () {};
	      TempCtor.prototype = superCtor.prototype;
	      ctor.prototype = new TempCtor();
	      ctor.prototype.constructor = ctor;
	    }
	  };
	}
	return inherits_browser.exports;
}

const defaultMessages = 'End-Of-Stream';
/**
 * Thrown on read operation of the end of file or stream has been reached
 */
class EndOfStreamError extends Error {
    constructor() {
        super(defaultMessages);
        this.name = "EndOfStreamError";
    }
}
class AbortError extends Error {
    constructor(message = "The operation was aborted") {
        super(message);
        this.name = "AbortError";
    }
}

class Deferred {
    constructor() {
        this.resolve = () => null;
        this.reject = () => null;
        this.promise = new Promise((resolve, reject) => {
            this.reject = reject;
            this.resolve = resolve;
        });
    }
}

class AbstractStreamReader {
    constructor() {
        this.endOfStream = false;
        this.interrupted = false;
        /**
         * Store peeked data
         * @type {Array}
         */
        this.peekQueue = [];
    }
    async peek(uint8Array, mayBeLess = false) {
        const bytesRead = await this.read(uint8Array, mayBeLess);
        this.peekQueue.push(uint8Array.subarray(0, bytesRead)); // Put read data back to peek buffer
        return bytesRead;
    }
    async read(buffer, mayBeLess = false) {
        if (buffer.length === 0) {
            return 0;
        }
        let bytesRead = this.readFromPeekBuffer(buffer);
        if (!this.endOfStream) {
            bytesRead += await this.readRemainderFromStream(buffer.subarray(bytesRead), mayBeLess);
        }
        if (bytesRead === 0) {
            throw new EndOfStreamError();
        }
        return bytesRead;
    }
    /**
     * Read chunk from stream
     * @param buffer - Target Uint8Array (or Buffer) to store data read from stream in
     * @returns Number of bytes read
     */
    readFromPeekBuffer(buffer) {
        let remaining = buffer.length;
        let bytesRead = 0;
        // consume peeked data first
        while (this.peekQueue.length > 0 && remaining > 0) {
            const peekData = this.peekQueue.pop(); // Front of queue
            if (!peekData)
                throw new Error('peekData should be defined');
            const lenCopy = Math.min(peekData.length, remaining);
            buffer.set(peekData.subarray(0, lenCopy), bytesRead);
            bytesRead += lenCopy;
            remaining -= lenCopy;
            if (lenCopy < peekData.length) {
                // remainder back to queue
                this.peekQueue.push(peekData.subarray(lenCopy));
            }
        }
        return bytesRead;
    }
    async readRemainderFromStream(buffer, mayBeLess) {
        let bytesRead = 0;
        // Continue reading from stream if required
        while (bytesRead < buffer.length && !this.endOfStream) {
            if (this.interrupted) {
                throw new AbortError();
            }
            const chunkLen = await this.readFromStream(buffer.subarray(bytesRead), mayBeLess);
            if (chunkLen === 0)
                break;
            bytesRead += chunkLen;
        }
        if (!mayBeLess && bytesRead < buffer.length) {
            throw new EndOfStreamError();
        }
        return bytesRead;
    }
}

/**
 * Node.js Readable Stream Reader
 * Ref: https://nodejs.org/api/stream.html#readable-streams
 */
class StreamReader extends AbstractStreamReader {
    constructor(s) {
        super();
        this.s = s;
        /**
         * Deferred used for postponed read request (as not data is yet available to read)
         */
        this.deferred = null;
        if (!s.read || !s.once) {
            throw new Error('Expected an instance of stream.Readable');
        }
        this.s.once('end', () => {
            this.endOfStream = true;
            if (this.deferred) {
                this.deferred.resolve(0);
            }
        });
        this.s.once('error', err => this.reject(err));
        this.s.once('close', () => this.abort());
    }
    /**
     * Read chunk from stream
     * @param buffer Target Uint8Array (or Buffer) to store data read from stream in
     * @param mayBeLess - If true, may fill the buffer partially
     * @returns Number of bytes read
     */
    async readFromStream(buffer, mayBeLess) {
        if (buffer.length === 0)
            return 0;
        const readBuffer = this.s.read(buffer.length);
        if (readBuffer) {
            buffer.set(readBuffer);
            return readBuffer.length;
        }
        const request = {
            buffer,
            mayBeLess,
            deferred: new Deferred()
        };
        this.deferred = request.deferred;
        this.s.once('readable', () => {
            this.readDeferred(request);
        });
        return request.deferred.promise;
    }
    /**
     * Process deferred read request
     * @param request Deferred read request
     */
    readDeferred(request) {
        const readBuffer = this.s.read(request.buffer.length);
        if (readBuffer) {
            request.buffer.set(readBuffer);
            request.deferred.resolve(readBuffer.length);
            this.deferred = null;
        }
        else {
            this.s.once('readable', () => {
                this.readDeferred(request);
            });
        }
    }
    reject(err) {
        this.interrupted = true;
        if (this.deferred) {
            this.deferred.reject(err);
            this.deferred = null;
        }
    }
    async abort() {
        this.reject(new AbortError());
    }
    async close() {
        return this.abort();
    }
}

class WebStreamReader extends AbstractStreamReader {
    constructor(reader) {
        super();
        this.reader = reader;
    }
    async abort() {
        return this.close();
    }
    async close() {
        this.reader.releaseLock();
    }
}

/**
 * Read from a WebStream using a BYOB reader
 * Reference: https://nodejs.org/api/webstreams.html#class-readablestreambyobreader
 */
class WebStreamByobReader extends WebStreamReader {
    /**
     * Read from stream
     * @param buffer - Target Uint8Array (or Buffer) to store data read from stream in
     * @param mayBeLess - If true, may fill the buffer partially
     * @protected Bytes read
     */
    async readFromStream(buffer, mayBeLess) {
        if (buffer.length === 0)
            return 0;
        // @ts-ignore
        const result = await this.reader.read(new Uint8Array(buffer.length), { min: mayBeLess ? undefined : buffer.length });
        if (result.done) {
            this.endOfStream = result.done;
        }
        if (result.value) {
            buffer.set(result.value);
            return result.value.length;
        }
        return 0;
    }
}

class WebStreamDefaultReader extends AbstractStreamReader {
    constructor(reader) {
        super();
        this.reader = reader;
        this.buffer = null; // Internal buffer to store excess data
    }
    /**
     * Copy chunk to target, and store the remainder in this.buffer
     */
    writeChunk(target, chunk) {
        const written = Math.min(chunk.length, target.length);
        target.set(chunk.subarray(0, written));
        // Adjust the remainder of the buffer
        if (written < chunk.length) {
            this.buffer = chunk.subarray(written);
        }
        else {
            this.buffer = null;
        }
        return written;
    }
    /**
     * Read from stream
     * @param buffer - Target Uint8Array (or Buffer) to store data read from stream in
     * @param mayBeLess - If true, may fill the buffer partially
     * @protected Bytes read
     */
    async readFromStream(buffer, mayBeLess) {
        if (buffer.length === 0)
            return 0;
        let totalBytesRead = 0;
        // Serve from the internal buffer first
        if (this.buffer) {
            totalBytesRead += this.writeChunk(buffer, this.buffer);
        }
        // Continue reading from the stream if more data is needed
        while (totalBytesRead < buffer.length && !this.endOfStream) {
            const result = await this.reader.read();
            if (result.done) {
                this.endOfStream = true;
                break;
            }
            if (result.value) {
                totalBytesRead += this.writeChunk(buffer.subarray(totalBytesRead), result.value);
            }
        }
        if (totalBytesRead === 0 && this.endOfStream) {
            throw new EndOfStreamError();
        }
        return totalBytesRead;
    }
    abort() {
        this.interrupted = true;
        return this.reader.cancel();
    }
    async close() {
        await this.abort();
        this.reader.releaseLock();
    }
}

function makeWebStreamReader(stream) {
    try {
        const reader = stream.getReader({ mode: "byob" });
        if (reader instanceof ReadableStreamDefaultReader) {
            // Fallback to default reader in case `mode: byob` is ignored
            return new WebStreamDefaultReader(reader);
        }
        return new WebStreamByobReader(reader);
    }
    catch (error) {
        if (error instanceof TypeError) {
            // Fallback to default reader in case `mode: byob` rejected by a `TypeError`
            return new WebStreamDefaultReader(stream.getReader());
        }
        throw error;
    }
}

/**
 * Core tokenizer
 */
class AbstractTokenizer {
    /**
     * Constructor
     * @param options Tokenizer options
     * @protected
     */
    constructor(options) {
        this.numBuffer = new Uint8Array(8);
        /**
         * Tokenizer-stream position
         */
        this.position = 0;
        this.onClose = options?.onClose;
        if (options?.abortSignal) {
            options.abortSignal.addEventListener('abort', () => {
                this.abort();
            });
        }
    }
    /**
     * Read a token from the tokenizer-stream
     * @param token - The token to read
     * @param position - If provided, the desired position in the tokenizer-stream
     * @returns Promise with token data
     */
    async readToken(token, position = this.position) {
        const uint8Array = new Uint8Array(token.len);
        const len = await this.readBuffer(uint8Array, { position });
        if (len < token.len)
            throw new EndOfStreamError();
        return token.get(uint8Array, 0);
    }
    /**
     * Peek a token from the tokenizer-stream.
     * @param token - Token to peek from the tokenizer-stream.
     * @param position - Offset where to begin reading within the file. If position is null, data will be read from the current file position.
     * @returns Promise with token data
     */
    async peekToken(token, position = this.position) {
        const uint8Array = new Uint8Array(token.len);
        const len = await this.peekBuffer(uint8Array, { position });
        if (len < token.len)
            throw new EndOfStreamError();
        return token.get(uint8Array, 0);
    }
    /**
     * Read a numeric token from the stream
     * @param token - Numeric token
     * @returns Promise with number
     */
    async readNumber(token) {
        const len = await this.readBuffer(this.numBuffer, { length: token.len });
        if (len < token.len)
            throw new EndOfStreamError();
        return token.get(this.numBuffer, 0);
    }
    /**
     * Read a numeric token from the stream
     * @param token - Numeric token
     * @returns Promise with number
     */
    async peekNumber(token) {
        const len = await this.peekBuffer(this.numBuffer, { length: token.len });
        if (len < token.len)
            throw new EndOfStreamError();
        return token.get(this.numBuffer, 0);
    }
    /**
     * Ignore number of bytes, advances the pointer in under tokenizer-stream.
     * @param length - Number of bytes to ignore
     * @return resolves the number of bytes ignored, equals length if this available, otherwise the number of bytes available
     */
    async ignore(length) {
        if (this.fileInfo.size !== undefined) {
            const bytesLeft = this.fileInfo.size - this.position;
            if (length > bytesLeft) {
                this.position += bytesLeft;
                return bytesLeft;
            }
        }
        this.position += length;
        return length;
    }
    async close() {
        await this.abort();
        await this.onClose?.();
    }
    normalizeOptions(uint8Array, options) {
        if (!this.supportsRandomAccess() && options && options.position !== undefined && options.position < this.position) {
            throw new Error('`options.position` must be equal or greater than `tokenizer.position`');
        }
        return {
            ...{
                mayBeLess: false,
                offset: 0,
                length: uint8Array.length,
                position: this.position
            }, ...options
        };
    }
    abort() {
        return Promise.resolve(); // Ignore abort signal
    }
}

const maxBufferSize = 256000;
class ReadStreamTokenizer extends AbstractTokenizer {
    /**
     * Constructor
     * @param streamReader stream-reader to read from
     * @param options Tokenizer options
     */
    constructor(streamReader, options) {
        super(options);
        this.streamReader = streamReader;
        this.fileInfo = options?.fileInfo ?? {};
    }
    /**
     * Read buffer from tokenizer
     * @param uint8Array - Target Uint8Array to fill with data read from the tokenizer-stream
     * @param options - Read behaviour options
     * @returns Promise with number of bytes read
     */
    async readBuffer(uint8Array, options) {
        const normOptions = this.normalizeOptions(uint8Array, options);
        const skipBytes = normOptions.position - this.position;
        if (skipBytes > 0) {
            await this.ignore(skipBytes);
            return this.readBuffer(uint8Array, options);
        }
        if (skipBytes < 0) {
            throw new Error('`options.position` must be equal or greater than `tokenizer.position`');
        }
        if (normOptions.length === 0) {
            return 0;
        }
        const bytesRead = await this.streamReader.read(uint8Array.subarray(0, normOptions.length), normOptions.mayBeLess);
        this.position += bytesRead;
        if ((!options || !options.mayBeLess) && bytesRead < normOptions.length) {
            throw new EndOfStreamError();
        }
        return bytesRead;
    }
    /**
     * Peek (read ahead) buffer from tokenizer
     * @param uint8Array - Uint8Array (or Buffer) to write data to
     * @param options - Read behaviour options
     * @returns Promise with number of bytes peeked
     */
    async peekBuffer(uint8Array, options) {
        const normOptions = this.normalizeOptions(uint8Array, options);
        let bytesRead = 0;
        if (normOptions.position) {
            const skipBytes = normOptions.position - this.position;
            if (skipBytes > 0) {
                const skipBuffer = new Uint8Array(normOptions.length + skipBytes);
                bytesRead = await this.peekBuffer(skipBuffer, { mayBeLess: normOptions.mayBeLess });
                uint8Array.set(skipBuffer.subarray(skipBytes));
                return bytesRead - skipBytes;
            }
            if (skipBytes < 0) {
                throw new Error('Cannot peek from a negative offset in a stream');
            }
        }
        if (normOptions.length > 0) {
            try {
                bytesRead = await this.streamReader.peek(uint8Array.subarray(0, normOptions.length), normOptions.mayBeLess);
            }
            catch (err) {
                if (options?.mayBeLess && err instanceof EndOfStreamError) {
                    return 0;
                }
                throw err;
            }
            if ((!normOptions.mayBeLess) && bytesRead < normOptions.length) {
                throw new EndOfStreamError();
            }
        }
        return bytesRead;
    }
    async ignore(length) {
        // debug(`ignore ${this.position}...${this.position + length - 1}`);
        const bufSize = Math.min(maxBufferSize, length);
        const buf = new Uint8Array(bufSize);
        let totBytesRead = 0;
        while (totBytesRead < length) {
            const remaining = length - totBytesRead;
            const bytesRead = await this.readBuffer(buf, { length: Math.min(bufSize, remaining) });
            if (bytesRead < 0) {
                return bytesRead;
            }
            totBytesRead += bytesRead;
        }
        return totBytesRead;
    }
    abort() {
        return this.streamReader.abort();
    }
    async close() {
        return this.streamReader.close();
    }
    supportsRandomAccess() {
        return false;
    }
}

class BufferTokenizer extends AbstractTokenizer {
    /**
     * Construct BufferTokenizer
     * @param uint8Array - Uint8Array to tokenize
     * @param options Tokenizer options
     */
    constructor(uint8Array, options) {
        super(options);
        this.uint8Array = uint8Array;
        this.fileInfo = { ...options?.fileInfo ?? {}, ...{ size: uint8Array.length } };
    }
    /**
     * Read buffer from tokenizer
     * @param uint8Array - Uint8Array to tokenize
     * @param options - Read behaviour options
     * @returns {Promise<number>}
     */
    async readBuffer(uint8Array, options) {
        if (options?.position) {
            this.position = options.position;
        }
        const bytesRead = await this.peekBuffer(uint8Array, options);
        this.position += bytesRead;
        return bytesRead;
    }
    /**
     * Peek (read ahead) buffer from tokenizer
     * @param uint8Array
     * @param options - Read behaviour options
     * @returns {Promise<number>}
     */
    async peekBuffer(uint8Array, options) {
        const normOptions = this.normalizeOptions(uint8Array, options);
        const bytes2read = Math.min(this.uint8Array.length - normOptions.position, normOptions.length);
        if ((!normOptions.mayBeLess) && bytes2read < normOptions.length) {
            throw new EndOfStreamError();
        }
        uint8Array.set(this.uint8Array.subarray(normOptions.position, normOptions.position + bytes2read));
        return bytes2read;
    }
    close() {
        return super.close();
    }
    supportsRandomAccess() {
        return true;
    }
    setPosition(position) {
        this.position = position;
    }
}

/**
 * Construct ReadStreamTokenizer from given Stream.
 * Will set fileSize, if provided given Stream has set the .path property/
 * @param stream - Read from Node.js Stream.Readable
 * @param options - Tokenizer options
 * @returns ReadStreamTokenizer
 */
function fromStream$1(stream, options) {
    const streamReader = new StreamReader(stream);
    const _options = options ?? {};
    const chainedClose = _options.onClose;
    _options.onClose = async () => {
        await streamReader.close();
        if (chainedClose) {
            return chainedClose();
        }
    };
    return new ReadStreamTokenizer(streamReader, _options);
}
/**
 * Construct ReadStreamTokenizer from given ReadableStream (WebStream API).
 * Will set fileSize, if provided given Stream has set the .path property/
 * @param webStream - Read from Node.js Stream.Readable (must be a byte stream)
 * @param options - Tokenizer options
 * @returns ReadStreamTokenizer
 */
function fromWebStream(webStream, options) {
    const webStreamReader = makeWebStreamReader(webStream);
    const _options = options ?? {};
    const chainedClose = _options.onClose;
    _options.onClose = async () => {
        await webStreamReader.close();
        if (chainedClose) {
            return chainedClose();
        }
    };
    return new ReadStreamTokenizer(webStreamReader, _options);
}
/**
 * Construct ReadStreamTokenizer from given Buffer.
 * @param uint8Array - Uint8Array to tokenize
 * @param options - Tokenizer options
 * @returns BufferTokenizer
 */
function fromBuffer(uint8Array, options) {
    return new BufferTokenizer(uint8Array, options);
}

class FileTokenizer extends AbstractTokenizer {
    /**
     * Create tokenizer from provided file path
     * @param sourceFilePath File path
     */
    static async fromFile(sourceFilePath) {
        const fileHandle = await open(sourceFilePath, 'r');
        const stat = await fileHandle.stat();
        return new FileTokenizer(fileHandle, { fileInfo: { path: sourceFilePath, size: stat.size } });
    }
    constructor(fileHandle, options) {
        super(options);
        this.fileHandle = fileHandle;
        this.fileInfo = options.fileInfo;
    }
    /**
     * Read buffer from file
     * @param uint8Array - Uint8Array to write result to
     * @param options - Read behaviour options
     * @returns Promise number of bytes read
     */
    async readBuffer(uint8Array, options) {
        const normOptions = this.normalizeOptions(uint8Array, options);
        this.position = normOptions.position;
        if (normOptions.length === 0)
            return 0;
        const res = await this.fileHandle.read(uint8Array, 0, normOptions.length, normOptions.position);
        this.position += res.bytesRead;
        if (res.bytesRead < normOptions.length && (!options || !options.mayBeLess)) {
            throw new EndOfStreamError();
        }
        return res.bytesRead;
    }
    /**
     * Peek buffer from file
     * @param uint8Array - Uint8Array (or Buffer) to write data to
     * @param options - Read behaviour options
     * @returns Promise number of bytes read
     */
    async peekBuffer(uint8Array, options) {
        const normOptions = this.normalizeOptions(uint8Array, options);
        const res = await this.fileHandle.read(uint8Array, 0, normOptions.length, normOptions.position);
        if ((!normOptions.mayBeLess) && res.bytesRead < normOptions.length) {
            throw new EndOfStreamError();
        }
        return res.bytesRead;
    }
    async close() {
        await this.fileHandle.close();
        return super.close();
    }
    setPosition(position) {
        this.position = position;
    }
    supportsRandomAccess() {
        return true;
    }
}

/**
 * Construct ReadStreamTokenizer from given Stream.
 * Will set fileSize, if provided given Stream has set the .path property.
 * @param stream - Node.js Stream.Readable
 * @param options - Pass additional file information to the tokenizer
 * @returns Tokenizer
 */
async function fromStream(stream, options) {
    const rst = fromStream$1(stream, options);
    if (stream.path) {
        const stat$1 = await stat(stream.path);
        rst.fileInfo.path = stream.path;
        rst.fileInfo.size = stat$1.size;
    }
    return rst;
}
const fromFile = FileTokenizer.fromFile;

var ieee754 = {};

/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */

var hasRequiredIeee754;

function requireIeee754 () {
	if (hasRequiredIeee754) return ieee754;
	hasRequiredIeee754 = 1;
	ieee754.read = function (buffer, offset, isLE, mLen, nBytes) {
	  var e, m;
	  var eLen = (nBytes * 8) - mLen - 1;
	  var eMax = (1 << eLen) - 1;
	  var eBias = eMax >> 1;
	  var nBits = -7;
	  var i = isLE ? (nBytes - 1) : 0;
	  var d = isLE ? -1 : 1;
	  var s = buffer[offset + i];

	  i += d;

	  e = s & ((1 << (-nBits)) - 1);
	  s >>= (-nBits);
	  nBits += eLen;
	  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

	  m = e & ((1 << (-nBits)) - 1);
	  e >>= (-nBits);
	  nBits += mLen;
	  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

	  if (e === 0) {
	    e = 1 - eBias;
	  } else if (e === eMax) {
	    return m ? NaN : ((s ? -1 : 1) * Infinity)
	  } else {
	    m = m + Math.pow(2, mLen);
	    e = e - eBias;
	  }
	  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
	};

	ieee754.write = function (buffer, value, offset, isLE, mLen, nBytes) {
	  var e, m, c;
	  var eLen = (nBytes * 8) - mLen - 1;
	  var eMax = (1 << eLen) - 1;
	  var eBias = eMax >> 1;
	  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0);
	  var i = isLE ? 0 : (nBytes - 1);
	  var d = isLE ? 1 : -1;
	  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

	  value = Math.abs(value);

	  if (isNaN(value) || value === Infinity) {
	    m = isNaN(value) ? 1 : 0;
	    e = eMax;
	  } else {
	    e = Math.floor(Math.log(value) / Math.LN2);
	    if (value * (c = Math.pow(2, -e)) < 1) {
	      e--;
	      c *= 2;
	    }
	    if (e + eBias >= 1) {
	      value += rt / c;
	    } else {
	      value += rt * Math.pow(2, 1 - eBias);
	    }
	    if (value * c >= 2) {
	      e++;
	      c /= 2;
	    }

	    if (e + eBias >= eMax) {
	      m = 0;
	      e = eMax;
	    } else if (e + eBias >= 1) {
	      m = ((value * c) - 1) * Math.pow(2, mLen);
	      e = e + eBias;
	    } else {
	      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
	      e = 0;
	    }
	  }

	  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

	  e = (e << mLen) | m;
	  eLen += mLen;
	  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

	  buffer[offset + i - d] |= s * 128;
	};
	return ieee754;
}

requireIeee754();

// Primitive types
function dv(array) {
    return new DataView(array.buffer, array.byteOffset);
}
/**
 * 8-bit unsigned integer
 */
const UINT8 = {
    len: 1,
    get(array, offset) {
        return dv(array).getUint8(offset);
    },
    put(array, offset, value) {
        dv(array).setUint8(offset, value);
        return offset + 1;
    }
};
/**
 * 16-bit unsigned integer, Little Endian byte order
 */
const UINT16_LE = {
    len: 2,
    get(array, offset) {
        return dv(array).getUint16(offset, true);
    },
    put(array, offset, value) {
        dv(array).setUint16(offset, value, true);
        return offset + 2;
    }
};
/**
 * 16-bit unsigned integer, Big Endian byte order
 */
const UINT16_BE = {
    len: 2,
    get(array, offset) {
        return dv(array).getUint16(offset);
    },
    put(array, offset, value) {
        dv(array).setUint16(offset, value);
        return offset + 2;
    }
};
/**
 * 32-bit unsigned integer, Little Endian byte order
 */
const UINT32_LE = {
    len: 4,
    get(array, offset) {
        return dv(array).getUint32(offset, true);
    },
    put(array, offset, value) {
        dv(array).setUint32(offset, value, true);
        return offset + 4;
    }
};
/**
 * 32-bit unsigned integer, Big Endian byte order
 */
const UINT32_BE = {
    len: 4,
    get(array, offset) {
        return dv(array).getUint32(offset);
    },
    put(array, offset, value) {
        dv(array).setUint32(offset, value);
        return offset + 4;
    }
};
/**
 * 32-bit signed integer, Big Endian byte order
 */
const INT32_BE = {
    len: 4,
    get(array, offset) {
        return dv(array).getInt32(offset);
    },
    put(array, offset, value) {
        dv(array).setInt32(offset, value);
        return offset + 4;
    }
};
/**
 * 64-bit unsigned integer, Little Endian byte order
 */
const UINT64_LE = {
    len: 8,
    get(array, offset) {
        return dv(array).getBigUint64(offset, true);
    },
    put(array, offset, value) {
        dv(array).setBigUint64(offset, value, true);
        return offset + 8;
    }
};
/**
 * Consume a fixed number of bytes from the stream and return a string with a specified encoding.
 */
class StringType {
    constructor(len, encoding) {
        this.len = len;
        this.encoding = encoding;
        this.textDecoder = new TextDecoder(encoding);
    }
    get(uint8Array, offset) {
        return this.textDecoder.decode(uint8Array.subarray(offset, offset + this.len));
    }
}

var require = createRequire('/');
// DEFLATE is a complex format; to read this code, you should probably check the RFC first:
// https://tools.ietf.org/html/rfc1951
// You may also wish to take a look at the guide I made about this program:
// https://gist.github.com/101arrowz/253f31eb5abc3d9275ab943003ffecad
// Some of the following code is similar to that of UZIP.js:
// https://github.com/photopea/UZIP.js
// However, the vast majority of the codebase has diverged from UZIP.js to increase performance and reduce bundle size.
// Sometimes 0 will appear where -1 would be more appropriate. This is because using a uint
// is better for memory in most engines (I *think*).
// Mediocre shim
var Worker;
try {
    Worker = require('worker_threads').Worker;
}
catch (e) {
}

// aliases for shorter compressed code (most minifers don't do this)
var u8 = Uint8Array, u16 = Uint16Array, i32 = Int32Array;
// fixed length extra bits
var fleb = new u8([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0, /* unused */ 0, 0, /* impossible */ 0]);
// fixed distance extra bits
var fdeb = new u8([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, /* unused */ 0, 0]);
// code length index map
var clim = new u8([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
// get base, reverse index map from extra bits
var freb = function (eb, start) {
    var b = new u16(31);
    for (var i = 0; i < 31; ++i) {
        b[i] = start += 1 << eb[i - 1];
    }
    // numbers here are at max 18 bits
    var r = new i32(b[30]);
    for (var i = 1; i < 30; ++i) {
        for (var j = b[i]; j < b[i + 1]; ++j) {
            r[j] = ((j - b[i]) << 5) | i;
        }
    }
    return { b: b, r: r };
};
var _a = freb(fleb, 2), fl = _a.b, revfl = _a.r;
// we can ignore the fact that the other numbers are wrong; they never happen anyway
fl[28] = 258, revfl[258] = 28;
var _b = freb(fdeb, 0), fd = _b.b;
// map of value to reverse (assuming 16 bits)
var rev = new u16(32768);
for (var i = 0; i < 32768; ++i) {
    // reverse table algorithm from SO
    var x = ((i & 0xAAAA) >> 1) | ((i & 0x5555) << 1);
    x = ((x & 0xCCCC) >> 2) | ((x & 0x3333) << 2);
    x = ((x & 0xF0F0) >> 4) | ((x & 0x0F0F) << 4);
    rev[i] = (((x & 0xFF00) >> 8) | ((x & 0x00FF) << 8)) >> 1;
}
// create huffman tree from u8 "map": index -> code length for code index
// mb (max bits) must be at most 15
// TODO: optimize/split up?
var hMap = (function (cd, mb, r) {
    var s = cd.length;
    // index
    var i = 0;
    // u16 "map": index -> # of codes with bit length = index
    var l = new u16(mb);
    // length of cd must be 288 (total # of codes)
    for (; i < s; ++i) {
        if (cd[i])
            ++l[cd[i] - 1];
    }
    // u16 "map": index -> minimum code for bit length = index
    var le = new u16(mb);
    for (i = 1; i < mb; ++i) {
        le[i] = (le[i - 1] + l[i - 1]) << 1;
    }
    var co;
    if (r) {
        // u16 "map": index -> number of actual bits, symbol for code
        co = new u16(1 << mb);
        // bits to remove for reverser
        var rvb = 15 - mb;
        for (i = 0; i < s; ++i) {
            // ignore 0 lengths
            if (cd[i]) {
                // num encoding both symbol and bits read
                var sv = (i << 4) | cd[i];
                // free bits
                var r_1 = mb - cd[i];
                // start value
                var v = le[cd[i] - 1]++ << r_1;
                // m is end value
                for (var m = v | ((1 << r_1) - 1); v <= m; ++v) {
                    // every 16 bit value starting with the code yields the same result
                    co[rev[v] >> rvb] = sv;
                }
            }
        }
    }
    else {
        co = new u16(s);
        for (i = 0; i < s; ++i) {
            if (cd[i]) {
                co[i] = rev[le[cd[i] - 1]++] >> (15 - cd[i]);
            }
        }
    }
    return co;
});
// fixed length tree
var flt = new u8(288);
for (var i = 0; i < 144; ++i)
    flt[i] = 8;
for (var i = 144; i < 256; ++i)
    flt[i] = 9;
for (var i = 256; i < 280; ++i)
    flt[i] = 7;
for (var i = 280; i < 288; ++i)
    flt[i] = 8;
// fixed distance tree
var fdt = new u8(32);
for (var i = 0; i < 32; ++i)
    fdt[i] = 5;
// fixed length map
var flrm = /*#__PURE__*/ hMap(flt, 9, 1);
// fixed distance map
var fdrm = /*#__PURE__*/ hMap(fdt, 5, 1);
// find max of array
var max = function (a) {
    var m = a[0];
    for (var i = 1; i < a.length; ++i) {
        if (a[i] > m)
            m = a[i];
    }
    return m;
};
// read d, starting at bit p and mask with m
var bits = function (d, p, m) {
    var o = (p / 8) | 0;
    return ((d[o] | (d[o + 1] << 8)) >> (p & 7)) & m;
};
// read d, starting at bit p continuing for at least 16 bits
var bits16 = function (d, p) {
    var o = (p / 8) | 0;
    return ((d[o] | (d[o + 1] << 8) | (d[o + 2] << 16)) >> (p & 7));
};
// get end of byte
var shft = function (p) { return ((p + 7) / 8) | 0; };
// typed array slice - allows garbage collector to free original reference,
// while being more compatible than .slice
var slc = function (v, s, e) {
    if (e == null || e > v.length)
        e = v.length;
    // can't use .constructor in case user-supplied
    return new u8(v.subarray(s, e));
};
// error codes
var ec = [
    'unexpected EOF',
    'invalid block type',
    'invalid length/literal',
    'invalid distance',
    'stream finished',
    'no stream handler',
    ,
    'no callback',
    'invalid UTF-8 data',
    'extra field too long',
    'date not in range 1980-2099',
    'filename too long',
    'stream finishing',
    'invalid zip data'
    // determined by unknown compression method
];
var err = function (ind, msg, nt) {
    var e = new Error(msg || ec[ind]);
    e.code = ind;
    if (Error.captureStackTrace)
        Error.captureStackTrace(e, err);
    if (!nt)
        throw e;
    return e;
};
// expands raw DEFLATE data
var inflt = function (dat, st, buf, dict) {
    // source length       dict length
    var sl = dat.length, dl = 0;
    if (!sl || st.f && !st.l)
        return buf || new u8(0);
    var noBuf = !buf;
    // have to estimate size
    var resize = noBuf || st.i != 2;
    // no state
    var noSt = st.i;
    // Assumes roughly 33% compression ratio average
    if (noBuf)
        buf = new u8(sl * 3);
    // ensure buffer can fit at least l elements
    var cbuf = function (l) {
        var bl = buf.length;
        // need to increase size to fit
        if (l > bl) {
            // Double or set to necessary, whichever is greater
            var nbuf = new u8(Math.max(bl * 2, l));
            nbuf.set(buf);
            buf = nbuf;
        }
    };
    //  last chunk         bitpos           bytes
    var final = st.f || 0, pos = st.p || 0, bt = st.b || 0, lm = st.l, dm = st.d, lbt = st.m, dbt = st.n;
    // total bits
    var tbts = sl * 8;
    do {
        if (!lm) {
            // BFINAL - this is only 1 when last chunk is next
            final = bits(dat, pos, 1);
            // type: 0 = no compression, 1 = fixed huffman, 2 = dynamic huffman
            var type = bits(dat, pos + 1, 3);
            pos += 3;
            if (!type) {
                // go to end of byte boundary
                var s = shft(pos) + 4, l = dat[s - 4] | (dat[s - 3] << 8), t = s + l;
                if (t > sl) {
                    if (noSt)
                        err(0);
                    break;
                }
                // ensure size
                if (resize)
                    cbuf(bt + l);
                // Copy over uncompressed data
                buf.set(dat.subarray(s, t), bt);
                // Get new bitpos, update byte count
                st.b = bt += l, st.p = pos = t * 8, st.f = final;
                continue;
            }
            else if (type == 1)
                lm = flrm, dm = fdrm, lbt = 9, dbt = 5;
            else if (type == 2) {
                //  literal                            lengths
                var hLit = bits(dat, pos, 31) + 257, hcLen = bits(dat, pos + 10, 15) + 4;
                var tl = hLit + bits(dat, pos + 5, 31) + 1;
                pos += 14;
                // length+distance tree
                var ldt = new u8(tl);
                // code length tree
                var clt = new u8(19);
                for (var i = 0; i < hcLen; ++i) {
                    // use index map to get real code
                    clt[clim[i]] = bits(dat, pos + i * 3, 7);
                }
                pos += hcLen * 3;
                // code lengths bits
                var clb = max(clt), clbmsk = (1 << clb) - 1;
                // code lengths map
                var clm = hMap(clt, clb, 1);
                for (var i = 0; i < tl;) {
                    var r = clm[bits(dat, pos, clbmsk)];
                    // bits read
                    pos += r & 15;
                    // symbol
                    var s = r >> 4;
                    // code length to copy
                    if (s < 16) {
                        ldt[i++] = s;
                    }
                    else {
                        //  copy   count
                        var c = 0, n = 0;
                        if (s == 16)
                            n = 3 + bits(dat, pos, 3), pos += 2, c = ldt[i - 1];
                        else if (s == 17)
                            n = 3 + bits(dat, pos, 7), pos += 3;
                        else if (s == 18)
                            n = 11 + bits(dat, pos, 127), pos += 7;
                        while (n--)
                            ldt[i++] = c;
                    }
                }
                //    length tree                 distance tree
                var lt = ldt.subarray(0, hLit), dt = ldt.subarray(hLit);
                // max length bits
                lbt = max(lt);
                // max dist bits
                dbt = max(dt);
                lm = hMap(lt, lbt, 1);
                dm = hMap(dt, dbt, 1);
            }
            else
                err(1);
            if (pos > tbts) {
                if (noSt)
                    err(0);
                break;
            }
        }
        // Make sure the buffer can hold this + the largest possible addition
        // Maximum chunk size (practically, theoretically infinite) is 2^17
        if (resize)
            cbuf(bt + 131072);
        var lms = (1 << lbt) - 1, dms = (1 << dbt) - 1;
        var lpos = pos;
        for (;; lpos = pos) {
            // bits read, code
            var c = lm[bits16(dat, pos) & lms], sym = c >> 4;
            pos += c & 15;
            if (pos > tbts) {
                if (noSt)
                    err(0);
                break;
            }
            if (!c)
                err(2);
            if (sym < 256)
                buf[bt++] = sym;
            else if (sym == 256) {
                lpos = pos, lm = null;
                break;
            }
            else {
                var add = sym - 254;
                // no extra bits needed if less
                if (sym > 264) {
                    // index
                    var i = sym - 257, b = fleb[i];
                    add = bits(dat, pos, (1 << b) - 1) + fl[i];
                    pos += b;
                }
                // dist
                var d = dm[bits16(dat, pos) & dms], dsym = d >> 4;
                if (!d)
                    err(3);
                pos += d & 15;
                var dt = fd[dsym];
                if (dsym > 3) {
                    var b = fdeb[dsym];
                    dt += bits16(dat, pos) & (1 << b) - 1, pos += b;
                }
                if (pos > tbts) {
                    if (noSt)
                        err(0);
                    break;
                }
                if (resize)
                    cbuf(bt + 131072);
                var end = bt + add;
                if (bt < dt) {
                    var shift = dl - dt, dend = Math.min(dt, end);
                    if (shift + bt < 0)
                        err(3);
                    for (; bt < dend; ++bt)
                        buf[bt] = dict[shift + bt];
                }
                for (; bt < end; ++bt)
                    buf[bt] = buf[bt - dt];
            }
        }
        st.l = lm, st.p = lpos, st.b = bt, st.f = final;
        if (lm)
            final = 1, st.m = lbt, st.d = dm, st.n = dbt;
    } while (!final);
    // don't reallocate for streams or user buffers
    return bt != buf.length && noBuf ? slc(buf, 0, bt) : buf.subarray(0, bt);
};
// empty
var et = /*#__PURE__*/ new u8(0);
// gzip footer: -8 to -4 = CRC, -4 to -0 is length
// gzip start
var gzs = function (d) {
    if (d[0] != 31 || d[1] != 139 || d[2] != 8)
        err(6, 'invalid gzip data');
    var flg = d[3];
    var st = 10;
    if (flg & 4)
        st += (d[10] | d[11] << 8) + 2;
    for (var zs = (flg >> 3 & 1) + (flg >> 4 & 1); zs > 0; zs -= !d[st++])
        ;
    return st + (flg & 2);
};
// gzip length
var gzl = function (d) {
    var l = d.length;
    return (d[l - 4] | d[l - 3] << 8 | d[l - 2] << 16 | d[l - 1] << 24) >>> 0;
};
// zlib start
var zls = function (d, dict) {
    if ((d[0] & 15) != 8 || (d[0] >> 4) > 7 || ((d[0] << 8 | d[1]) % 31))
        err(6, 'invalid zlib data');
    if ((d[1] >> 5 & 1) == 1)
        err(6, 'invalid zlib data: ' + (d[1] & 32 ? 'need' : 'unexpected') + ' dictionary');
    return (d[1] >> 3 & 4) + 2;
};
/**
 * Expands DEFLATE data with no wrapper
 * @param data The data to decompress
 * @param opts The decompression options
 * @returns The decompressed version of the data
 */
function inflateSync(data, opts) {
    return inflt(data, { i: 2 }, opts, opts);
}
/**
 * Expands GZIP data
 * @param data The data to decompress
 * @param opts The decompression options
 * @returns The decompressed version of the data
 */
function gunzipSync(data, opts) {
    var st = gzs(data);
    if (st + 8 > data.length)
        err(6, 'invalid gzip data');
    return inflt(data.subarray(st, -8), { i: 2 }, new u8(gzl(data)), opts);
}
/**
 * Expands Zlib data
 * @param data The data to decompress
 * @param opts The decompression options
 * @returns The decompressed version of the data
 */
function unzlibSync(data, opts) {
    return inflt(data.subarray(zls(data), -4), { i: 2 }, opts, opts);
}
/**
 * Expands compressed GZIP, Zlib, or raw DEFLATE data, automatically detecting the format
 * @param data The data to decompress
 * @param opts The decompression options
 * @returns The decompressed version of the data
 */
function decompressSync(data, opts) {
    return (data[0] == 31 && data[1] == 139 && data[2] == 8)
        ? gunzipSync(data, opts)
        : ((data[0] & 15) != 8 || (data[0] >> 4) > 7 || ((data[0] << 8 | data[1]) % 31))
            ? inflateSync(data, opts)
            : unzlibSync(data, opts);
}
// text decoder
var td = typeof TextDecoder != 'undefined' && /*#__PURE__*/ new TextDecoder();
// text decoder stream
var tds = 0;
try {
    td.decode(et, { stream: true });
    tds = 1;
}
catch (e) { }

var browser = {exports: {}};

var common;
var hasRequiredCommon;

function requireCommon () {
	if (hasRequiredCommon) return common;
	hasRequiredCommon = 1;
	/**
	 * This is the common logic for both the Node.js and web browser
	 * implementations of `debug()`.
	 */

	function setup(env) {
		createDebug.debug = createDebug;
		createDebug.default = createDebug;
		createDebug.coerce = coerce;
		createDebug.disable = disable;
		createDebug.enable = enable;
		createDebug.enabled = enabled;
		createDebug.humanize = requireMs();
		createDebug.destroy = destroy;

		Object.keys(env).forEach(key => {
			createDebug[key] = env[key];
		});

		/**
		* The currently active debug mode names, and names to skip.
		*/

		createDebug.names = [];
		createDebug.skips = [];

		/**
		* Map of special "%n" handling functions, for the debug "format" argument.
		*
		* Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
		*/
		createDebug.formatters = {};

		/**
		* Selects a color for a debug namespace
		* @param {String} namespace The namespace string for the debug instance to be colored
		* @return {Number|String} An ANSI color code for the given namespace
		* @api private
		*/
		function selectColor(namespace) {
			let hash = 0;

			for (let i = 0; i < namespace.length; i++) {
				hash = ((hash << 5) - hash) + namespace.charCodeAt(i);
				hash |= 0; // Convert to 32bit integer
			}

			return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
		}
		createDebug.selectColor = selectColor;

		/**
		* Create a debugger with the given `namespace`.
		*
		* @param {String} namespace
		* @return {Function}
		* @api public
		*/
		function createDebug(namespace) {
			let prevTime;
			let enableOverride = null;
			let namespacesCache;
			let enabledCache;

			function debug(...args) {
				// Disabled?
				if (!debug.enabled) {
					return;
				}

				const self = debug;

				// Set `diff` timestamp
				const curr = Number(new Date());
				const ms = curr - (prevTime || curr);
				self.diff = ms;
				self.prev = prevTime;
				self.curr = curr;
				prevTime = curr;

				args[0] = createDebug.coerce(args[0]);

				if (typeof args[0] !== 'string') {
					// Anything else let's inspect with %O
					args.unshift('%O');
				}

				// Apply any `formatters` transformations
				let index = 0;
				args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
					// If we encounter an escaped % then don't increase the array index
					if (match === '%%') {
						return '%';
					}
					index++;
					const formatter = createDebug.formatters[format];
					if (typeof formatter === 'function') {
						const val = args[index];
						match = formatter.call(self, val);

						// Now we need to remove `args[index]` since it's inlined in the `format`
						args.splice(index, 1);
						index--;
					}
					return match;
				});

				// Apply env-specific formatting (colors, etc.)
				createDebug.formatArgs.call(self, args);

				const logFn = self.log || createDebug.log;
				logFn.apply(self, args);
			}

			debug.namespace = namespace;
			debug.useColors = createDebug.useColors();
			debug.color = createDebug.selectColor(namespace);
			debug.extend = extend;
			debug.destroy = createDebug.destroy; // XXX Temporary. Will be removed in the next major release.

			Object.defineProperty(debug, 'enabled', {
				enumerable: true,
				configurable: false,
				get: () => {
					if (enableOverride !== null) {
						return enableOverride;
					}
					if (namespacesCache !== createDebug.namespaces) {
						namespacesCache = createDebug.namespaces;
						enabledCache = createDebug.enabled(namespace);
					}

					return enabledCache;
				},
				set: v => {
					enableOverride = v;
				}
			});

			// Env-specific initialization logic for debug instances
			if (typeof createDebug.init === 'function') {
				createDebug.init(debug);
			}

			return debug;
		}

		function extend(namespace, delimiter) {
			const newDebug = createDebug(this.namespace + (typeof delimiter === 'undefined' ? ':' : delimiter) + namespace);
			newDebug.log = this.log;
			return newDebug;
		}

		/**
		* Enables a debug mode by namespaces. This can include modes
		* separated by a colon and wildcards.
		*
		* @param {String} namespaces
		* @api public
		*/
		function enable(namespaces) {
			createDebug.save(namespaces);
			createDebug.namespaces = namespaces;

			createDebug.names = [];
			createDebug.skips = [];

			const split = (typeof namespaces === 'string' ? namespaces : '')
				.trim()
				.replace(' ', ',')
				.split(',')
				.filter(Boolean);

			for (const ns of split) {
				if (ns[0] === '-') {
					createDebug.skips.push(ns.slice(1));
				} else {
					createDebug.names.push(ns);
				}
			}
		}

		/**
		 * Checks if the given string matches a namespace template, honoring
		 * asterisks as wildcards.
		 *
		 * @param {String} search
		 * @param {String} template
		 * @return {Boolean}
		 */
		function matchesTemplate(search, template) {
			let searchIndex = 0;
			let templateIndex = 0;
			let starIndex = -1;
			let matchIndex = 0;

			while (searchIndex < search.length) {
				if (templateIndex < template.length && (template[templateIndex] === search[searchIndex] || template[templateIndex] === '*')) {
					// Match character or proceed with wildcard
					if (template[templateIndex] === '*') {
						starIndex = templateIndex;
						matchIndex = searchIndex;
						templateIndex++; // Skip the '*'
					} else {
						searchIndex++;
						templateIndex++;
					}
				} else if (starIndex !== -1) { // eslint-disable-line no-negated-condition
					// Backtrack to the last '*' and try to match more characters
					templateIndex = starIndex + 1;
					matchIndex++;
					searchIndex = matchIndex;
				} else {
					return false; // No match
				}
			}

			// Handle trailing '*' in template
			while (templateIndex < template.length && template[templateIndex] === '*') {
				templateIndex++;
			}

			return templateIndex === template.length;
		}

		/**
		* Disable debug output.
		*
		* @return {String} namespaces
		* @api public
		*/
		function disable() {
			const namespaces = [
				...createDebug.names,
				...createDebug.skips.map(namespace => '-' + namespace)
			].join(',');
			createDebug.enable('');
			return namespaces;
		}

		/**
		* Returns true if the given mode name is enabled, false otherwise.
		*
		* @param {String} name
		* @return {Boolean}
		* @api public
		*/
		function enabled(name) {
			for (const skip of createDebug.skips) {
				if (matchesTemplate(name, skip)) {
					return false;
				}
			}

			for (const ns of createDebug.names) {
				if (matchesTemplate(name, ns)) {
					return true;
				}
			}

			return false;
		}

		/**
		* Coerce `val`.
		*
		* @param {Mixed} val
		* @return {Mixed}
		* @api private
		*/
		function coerce(val) {
			if (val instanceof Error) {
				return val.stack || val.message;
			}
			return val;
		}

		/**
		* XXX DO NOT USE. This is a temporary stub function.
		* XXX It WILL be removed in the next major release.
		*/
		function destroy() {
			console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
		}

		createDebug.enable(createDebug.load());

		return createDebug;
	}

	common = setup;
	return common;
}

/* eslint-env browser */

var hasRequiredBrowser;

function requireBrowser () {
	if (hasRequiredBrowser) return browser.exports;
	hasRequiredBrowser = 1;
	(function (module, exports) {
		/**
		 * This is the web browser implementation of `debug()`.
		 */

		exports.formatArgs = formatArgs;
		exports.save = save;
		exports.load = load;
		exports.useColors = useColors;
		exports.storage = localstorage();
		exports.destroy = (() => {
			let warned = false;

			return () => {
				if (!warned) {
					warned = true;
					console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
				}
			};
		})();

		/**
		 * Colors.
		 */

		exports.colors = [
			'#0000CC',
			'#0000FF',
			'#0033CC',
			'#0033FF',
			'#0066CC',
			'#0066FF',
			'#0099CC',
			'#0099FF',
			'#00CC00',
			'#00CC33',
			'#00CC66',
			'#00CC99',
			'#00CCCC',
			'#00CCFF',
			'#3300CC',
			'#3300FF',
			'#3333CC',
			'#3333FF',
			'#3366CC',
			'#3366FF',
			'#3399CC',
			'#3399FF',
			'#33CC00',
			'#33CC33',
			'#33CC66',
			'#33CC99',
			'#33CCCC',
			'#33CCFF',
			'#6600CC',
			'#6600FF',
			'#6633CC',
			'#6633FF',
			'#66CC00',
			'#66CC33',
			'#9900CC',
			'#9900FF',
			'#9933CC',
			'#9933FF',
			'#99CC00',
			'#99CC33',
			'#CC0000',
			'#CC0033',
			'#CC0066',
			'#CC0099',
			'#CC00CC',
			'#CC00FF',
			'#CC3300',
			'#CC3333',
			'#CC3366',
			'#CC3399',
			'#CC33CC',
			'#CC33FF',
			'#CC6600',
			'#CC6633',
			'#CC9900',
			'#CC9933',
			'#CCCC00',
			'#CCCC33',
			'#FF0000',
			'#FF0033',
			'#FF0066',
			'#FF0099',
			'#FF00CC',
			'#FF00FF',
			'#FF3300',
			'#FF3333',
			'#FF3366',
			'#FF3399',
			'#FF33CC',
			'#FF33FF',
			'#FF6600',
			'#FF6633',
			'#FF9900',
			'#FF9933',
			'#FFCC00',
			'#FFCC33'
		];

		/**
		 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
		 * and the Firebug extension (any Firefox version) are known
		 * to support "%c" CSS customizations.
		 *
		 * TODO: add a `localStorage` variable to explicitly enable/disable colors
		 */

		// eslint-disable-next-line complexity
		function useColors() {
			// NB: In an Electron preload script, document will be defined but not fully
			// initialized. Since we know we're in Chrome, we'll just detect this case
			// explicitly
			if (typeof window !== 'undefined' && window.process && (window.process.type === 'renderer' || window.process.__nwjs)) {
				return true;
			}

			// Internet Explorer and Edge do not support colors.
			if (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
				return false;
			}

			let m;

			// Is webkit? http://stackoverflow.com/a/16459606/376773
			// document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
			// eslint-disable-next-line no-return-assign
			return (typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance) ||
				// Is firebug? http://stackoverflow.com/a/398120/376773
				(typeof window !== 'undefined' && window.console && (window.console.firebug || (window.console.exception && window.console.table))) ||
				// Is firefox >= v31?
				// https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
				(typeof navigator !== 'undefined' && navigator.userAgent && (m = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(m[1], 10) >= 31) ||
				// Double check webkit in userAgent just in case we are in a worker
				(typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
		}

		/**
		 * Colorize log arguments if enabled.
		 *
		 * @api public
		 */

		function formatArgs(args) {
			args[0] = (this.useColors ? '%c' : '') +
				this.namespace +
				(this.useColors ? ' %c' : ' ') +
				args[0] +
				(this.useColors ? '%c ' : ' ') +
				'+' + module.exports.humanize(this.diff);

			if (!this.useColors) {
				return;
			}

			const c = 'color: ' + this.color;
			args.splice(1, 0, c, 'color: inherit');

			// The final "%c" is somewhat tricky, because there could be other
			// arguments passed either before or after the %c, so we need to
			// figure out the correct index to insert the CSS into
			let index = 0;
			let lastC = 0;
			args[0].replace(/%[a-zA-Z%]/g, match => {
				if (match === '%%') {
					return;
				}
				index++;
				if (match === '%c') {
					// We only are interested in the *last* %c
					// (the user may have provided their own)
					lastC = index;
				}
			});

			args.splice(lastC, 0, c);
		}

		/**
		 * Invokes `console.debug()` when available.
		 * No-op when `console.debug` is not a "function".
		 * If `console.debug` is not available, falls back
		 * to `console.log`.
		 *
		 * @api public
		 */
		exports.log = console.debug || console.log || (() => {});

		/**
		 * Save `namespaces`.
		 *
		 * @param {String} namespaces
		 * @api private
		 */
		function save(namespaces) {
			try {
				if (namespaces) {
					exports.storage.setItem('debug', namespaces);
				} else {
					exports.storage.removeItem('debug');
				}
			} catch (error) {
				// Swallow
				// XXX (@Qix-) should we be logging these?
			}
		}

		/**
		 * Load `namespaces`.
		 *
		 * @return {String} returns the previously persisted debug modes
		 * @api private
		 */
		function load() {
			let r;
			try {
				r = exports.storage.getItem('debug');
			} catch (error) {
				// Swallow
				// XXX (@Qix-) should we be logging these?
			}

			// If debug isn't set in LS, and we're in Electron, try to load $DEBUG
			if (!r && typeof process !== 'undefined' && 'env' in process) {
				r = process.env.DEBUG;
			}

			return r;
		}

		/**
		 * Localstorage attempts to return the localstorage.
		 *
		 * This is necessary because safari throws
		 * when a user disables cookies/localstorage
		 * and you attempt to access it.
		 *
		 * @return {LocalStorage}
		 * @api private
		 */

		function localstorage() {
			try {
				// TVMLKit (Apple TV JS Runtime) does not have a window object, just localStorage in the global context
				// The Browser also has localStorage in the global context.
				return localStorage;
			} catch (error) {
				// Swallow
				// XXX (@Qix-) should we be logging these?
			}
		}

		module.exports = requireCommon()(exports);

		const {formatters} = module.exports;

		/**
		 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
		 */

		formatters.j = function (v) {
			try {
				return JSON.stringify(v);
			} catch (error) {
				return '[UnexpectedJSONParseError]: ' + error.message;
			}
		}; 
	} (browser, browser.exports));
	return browser.exports;
}

var browserExports = requireBrowser();
const initDebug = /*@__PURE__*/getDefaultExportFromCjs(browserExports);

/**
 * Ref https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT
 */
const Signature = {
    LocalFileHeader: 0x04034b50,
    DataDescriptor: 0x08074b50,
    CentralFileHeader: 0x02014b50,
    EndOfCentralDirectory: 0x06054b50
};
const DataDescriptor = {
    get(array) {
        UINT16_LE.get(array, 6);
        return {
            signature: UINT32_LE.get(array, 0),
            compressedSize: UINT32_LE.get(array, 8),
            uncompressedSize: UINT32_LE.get(array, 12),
        };
    }, len: 16
};
/**
 * First part of the ZIP Local File Header
 * Offset | Bytes| Description
 * -------|------+-------------------------------------------------------------------
 *      0 |    4 | Signature (0x04034b50)
 *      4 |    2 | Minimum version needed to extract
 *      6 |    2 | Bit flag
 *      8 |    2 | Compression method
 *     10 |    2 | File last modification time (MS-DOS format)
 *     12 |    2 | File last modification date (MS-DOS format)
 *     14 |    4 | CRC-32 of uncompressed data
 *     18 |    4 | Compressed size
 *     22 |    4 | Uncompressed size
 *     26 |    2 | File name length (n)
 *     28 |    2 | Extra field length (m)
 *     30 |    n | File name
 * 30 + n |    m | Extra field
 */
const LocalFileHeaderToken = {
    get(array) {
        const flags = UINT16_LE.get(array, 6);
        return {
            signature: UINT32_LE.get(array, 0),
            minVersion: UINT16_LE.get(array, 4),
            dataDescriptor: !!(flags & 0x0008),
            compressedMethod: UINT16_LE.get(array, 8),
            compressedSize: UINT32_LE.get(array, 18),
            uncompressedSize: UINT32_LE.get(array, 22),
            filenameLength: UINT16_LE.get(array, 26),
            extraFieldLength: UINT16_LE.get(array, 28),
            filename: null
        };
    }, len: 30
};
/**
 * 4.3.16  End of central directory record:
 *  end of central dir signature (0x06064b50)                                      4 bytes
 *  number of this disk                                                            2 bytes
 *  number of the disk with the start of the central directory                     2 bytes
 *  total number of entries in the central directory on this disk                  2 bytes
 *  total number of entries in the size of the central directory                   2 bytes
 *  sizeOfTheCentralDirectory                                                      4 bytes
 *  offset of start of central directory with respect to the starting disk number  4 bytes
 *  .ZIP file comment length                                                       2 bytes
 *  .ZIP file comment       (variable size)
 */
const EndOfCentralDirectoryRecordToken = {
    get(array) {
        return {
            signature: UINT32_LE.get(array, 0),
            nrOfThisDisk: UINT16_LE.get(array, 4),
            nrOfThisDiskWithTheStart: UINT16_LE.get(array, 6),
            nrOfEntriesOnThisDisk: UINT16_LE.get(array, 8),
            nrOfEntriesOfSize: UINT16_LE.get(array, 10),
            sizeOfCd: UINT32_LE.get(array, 12),
            offsetOfStartOfCd: UINT32_LE.get(array, 16),
            zipFileCommentLength: UINT16_LE.get(array, 20),
        };
    }, len: 22
};
/**
 * File header:
 *    central file header signature   4 bytes   0 (0x02014b50)
 *    version made by                 2 bytes   4
 *    version needed to extract       2 bytes   6
 *    general purpose bit flag        2 bytes   8
 *    compression method              2 bytes  10
 *    last mod file time              2 bytes  12
 *    last mod file date              2 bytes  14
 *    crc-32                          4 bytes  16
 *    compressed size                 4 bytes  20
 *    uncompressed size               4 bytes  24
 *    file name length                2 bytes  28
 *    extra field length              2 bytes  30
 *    file comment length             2 bytes  32
 *    disk number start               2 bytes  34
 *    internal file attributes        2 bytes  36
 *    external file attributes        4 bytes  38
 *    relative offset of local header 4 bytes  42
 */
const FileHeader = {
    get(array) {
        const flags = UINT16_LE.get(array, 8);
        return {
            signature: UINT32_LE.get(array, 0),
            minVersion: UINT16_LE.get(array, 6),
            dataDescriptor: !!(flags & 0x0008),
            compressedMethod: UINT16_LE.get(array, 10),
            compressedSize: UINT32_LE.get(array, 20),
            uncompressedSize: UINT32_LE.get(array, 24),
            filenameLength: UINT16_LE.get(array, 28),
            extraFieldLength: UINT16_LE.get(array, 30),
            fileCommentLength: UINT16_LE.get(array, 32),
            relativeOffsetOfLocalHeader: UINT32_LE.get(array, 42),
            filename: null
        };
    }, len: 46
};

function signatureToArray(signature) {
    const signatureBytes = new Uint8Array(UINT32_LE.len);
    UINT32_LE.put(signatureBytes, 0, signature);
    return signatureBytes;
}
const debug = initDebug('tokenizer:inflate');
const syncBufferSize = 256 * 1024;
const ddSignatureArray = signatureToArray(Signature.DataDescriptor);
const eocdSignatureBytes = signatureToArray(Signature.EndOfCentralDirectory);
class ZipHandler {
    constructor(tokenizer) {
        this.tokenizer = tokenizer;
        this.syncBuffer = new Uint8Array(syncBufferSize);
    }
    async isZip() {
        return await this.peekSignature() === Signature.LocalFileHeader;
    }
    peekSignature() {
        return this.tokenizer.peekToken(UINT32_LE);
    }
    async findEndOfCentralDirectoryLocator() {
        const randomReadTokenizer = this.tokenizer;
        const chunkLength = Math.min(16 * 1024, randomReadTokenizer.fileInfo.size);
        const buffer = this.syncBuffer.subarray(0, chunkLength);
        await this.tokenizer.readBuffer(buffer, { position: randomReadTokenizer.fileInfo.size - chunkLength });
        // Search the buffer from end to beginning for EOCD signature
        // const signature = 0x06054b50;
        for (let i = buffer.length - 4; i >= 0; i--) {
            // Compare 4 bytes directly without calling readUInt32LE
            if (buffer[i] === eocdSignatureBytes[0] &&
                buffer[i + 1] === eocdSignatureBytes[1] &&
                buffer[i + 2] === eocdSignatureBytes[2] &&
                buffer[i + 3] === eocdSignatureBytes[3]) {
                return randomReadTokenizer.fileInfo.size - chunkLength + i;
            }
        }
        return -1;
    }
    async readCentralDirectory() {
        if (!this.tokenizer.supportsRandomAccess()) {
            debug('Cannot reading central-directory without random-read support');
            return;
        }
        debug('Reading central-directory...');
        const pos = this.tokenizer.position;
        const offset = await this.findEndOfCentralDirectoryLocator();
        if (offset > 0) {
            debug('Central-directory 32-bit signature found');
            const eocdHeader = await this.tokenizer.readToken(EndOfCentralDirectoryRecordToken, offset);
            const files = [];
            this.tokenizer.setPosition(eocdHeader.offsetOfStartOfCd);
            for (let n = 0; n < eocdHeader.nrOfEntriesOfSize; ++n) {
                const entry = await this.tokenizer.readToken(FileHeader);
                if (entry.signature !== Signature.CentralFileHeader) {
                    throw new Error('Expected Central-File-Header signature');
                }
                entry.filename = await this.tokenizer.readToken(new StringType(entry.filenameLength, 'utf-8'));
                await this.tokenizer.ignore(entry.extraFieldLength);
                await this.tokenizer.ignore(entry.fileCommentLength);
                files.push(entry);
                debug(`Add central-directory file-entry: n=${n + 1}/${files.length}: filename=${files[n].filename}`);
            }
            this.tokenizer.setPosition(pos);
            return files;
        }
        this.tokenizer.setPosition(pos);
    }
    async unzip(fileCb) {
        const entries = await this.readCentralDirectory();
        if (entries) {
            // Use Central Directory to iterate over files
            return this.iterateOverCentralDirectory(entries, fileCb);
        }
        // Scan Zip files for local-file-header
        let stop = false;
        do {
            const zipHeader = await this.readLocalFileHeader();
            if (!zipHeader)
                break;
            const next = fileCb(zipHeader);
            stop = !!next.stop;
            let fileData = undefined;
            await this.tokenizer.ignore(zipHeader.extraFieldLength);
            if (zipHeader.dataDescriptor && zipHeader.compressedSize === 0) {
                const chunks = [];
                let len = syncBufferSize;
                debug('Compressed-file-size unknown, scanning for next data-descriptor-signature....');
                let nextHeaderIndex = -1;
                while (nextHeaderIndex < 0 && len === syncBufferSize) {
                    len = await this.tokenizer.peekBuffer(this.syncBuffer, { mayBeLess: true });
                    nextHeaderIndex = indexOf$1(this.syncBuffer.subarray(0, len), ddSignatureArray);
                    const size = nextHeaderIndex >= 0 ? nextHeaderIndex : len;
                    if (next.handler) {
                        const data = new Uint8Array(size);
                        await this.tokenizer.readBuffer(data);
                        chunks.push(data);
                    }
                    else {
                        // Move position to the next header if found, skip the whole buffer otherwise
                        await this.tokenizer.ignore(size);
                    }
                }
                debug(`Found data-descriptor-signature at pos=${this.tokenizer.position}`);
                if (next.handler) {
                    await this.inflate(zipHeader, mergeArrays(chunks), next.handler);
                }
            }
            else {
                if (next.handler) {
                    debug(`Reading compressed-file-data: ${zipHeader.compressedSize} bytes`);
                    fileData = new Uint8Array(zipHeader.compressedSize);
                    await this.tokenizer.readBuffer(fileData);
                    await this.inflate(zipHeader, fileData, next.handler);
                }
                else {
                    debug(`Ignoring compressed-file-data: ${zipHeader.compressedSize} bytes`);
                    await this.tokenizer.ignore(zipHeader.compressedSize);
                }
            }
            debug(`Reading data-descriptor at pos=${this.tokenizer.position}`);
            if (zipHeader.dataDescriptor) {
                // await this.tokenizer.ignore(DataDescriptor.len);
                const dataDescriptor = await this.tokenizer.readToken(DataDescriptor);
                if (dataDescriptor.signature !== 0x08074b50) {
                    throw new Error(`Expected data-descriptor-signature at position ${this.tokenizer.position - DataDescriptor.len}`);
                }
            }
        } while (!stop);
    }
    async iterateOverCentralDirectory(entries, fileCb) {
        for (const fileHeader of entries) {
            const next = fileCb(fileHeader);
            if (next.handler) {
                this.tokenizer.setPosition(fileHeader.relativeOffsetOfLocalHeader);
                const zipHeader = await this.readLocalFileHeader();
                if (zipHeader) {
                    await this.tokenizer.ignore(zipHeader.extraFieldLength);
                    const fileData = new Uint8Array(fileHeader.compressedSize);
                    await this.tokenizer.readBuffer(fileData);
                    await this.inflate(zipHeader, fileData, next.handler);
                }
            }
            if (next.stop)
                break;
        }
    }
    inflate(zipHeader, fileData, cb) {
        if (zipHeader.compressedMethod === 0) {
            return cb(fileData);
        }
        debug(`Decompress filename=${zipHeader.filename}, compressed-size=${fileData.length}`);
        const uncompressedData = decompressSync(fileData);
        return cb(uncompressedData);
    }
    async readLocalFileHeader() {
        const signature = await this.tokenizer.peekToken(UINT32_LE);
        if (signature === Signature.LocalFileHeader) {
            const header = await this.tokenizer.readToken(LocalFileHeaderToken);
            header.filename = await this.tokenizer.readToken(new StringType(header.filenameLength, 'utf-8'));
            return header;
        }
        if (signature === Signature.CentralFileHeader) {
            return false;
        }
        if (signature === 0xE011CFD0) {
            throw new Error('Encrypted ZIP');
        }
        throw new Error('Unexpected signature');
    }
}
function indexOf$1(buffer, portion) {
    const bufferLength = buffer.length;
    const portionLength = portion.length;
    // Return -1 if the portion is longer than the buffer
    if (portionLength > bufferLength)
        return -1;
    // Search for the portion in the buffer
    for (let i = 0; i <= bufferLength - portionLength; i++) {
        let found = true;
        for (let j = 0; j < portionLength; j++) {
            if (buffer[i + j] !== portion[j]) {
                found = false;
                break;
            }
        }
        if (found) {
            return i; // Return the starting offset
        }
    }
    return -1; // Not found
}
function mergeArrays(chunks) {
    // Concatenate chunks into a single Uint8Array
    const totalLength = chunks.reduce((acc, curr) => acc + curr.length, 0);
    const mergedArray = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
        mergedArray.set(chunk, offset);
        offset += chunk.length;
    }
    return mergedArray;
}

({
	utf8: new globalThis.TextDecoder('utf8'),
});

new globalThis.TextEncoder();

Array.from({length: 256}, (_, index) => index.toString(16).padStart(2, '0'));

/**
@param {DataView} view
@returns {number}
*/
function getUintBE(view) {
	const {byteLength} = view;

	if (byteLength === 6) {
		return (view.getUint16(0) * (2 ** 32)) + view.getUint32(2);
	}

	if (byteLength === 5) {
		return (view.getUint8(0) * (2 ** 32)) + view.getUint32(1);
	}

	if (byteLength === 4) {
		return view.getUint32(0);
	}

	if (byteLength === 3) {
		return (view.getUint8(0) * (2 ** 16)) + view.getUint16(1);
	}

	if (byteLength === 2) {
		return view.getUint16(0);
	}

	if (byteLength === 1) {
		return view.getUint8(0);
	}
}

/**
@param {Uint8Array} array
@param {Uint8Array} value
@returns {number}
*/
function indexOf(array, value) {
	const arrayLength = array.length;
	const valueLength = value.length;

	if (valueLength === 0) {
		return -1;
	}

	if (valueLength > arrayLength) {
		return -1;
	}

	const validOffsetLength = arrayLength - valueLength;

	for (let index = 0; index <= validOffsetLength; index++) {
		let isMatch = true;
		for (let index2 = 0; index2 < valueLength; index2++) {
			if (array[index + index2] !== value[index2]) {
				isMatch = false;
				break;
			}
		}

		if (isMatch) {
			return index;
		}
	}

	return -1;
}

/**
@param {Uint8Array} array
@param {Uint8Array} value
@returns {boolean}
*/
function includes(array, value) {
	return indexOf(array, value) !== -1;
}

function stringToBytes(string) {
	return [...string].map(character => character.charCodeAt(0)); // eslint-disable-line unicorn/prefer-code-point
}

/**
Checks whether the TAR checksum is valid.

@param {Uint8Array} arrayBuffer - The TAR header `[offset ... offset + 512]`.
@param {number} offset - TAR header offset.
@returns {boolean} `true` if the TAR checksum is valid, otherwise `false`.
*/
function tarHeaderChecksumMatches(arrayBuffer, offset = 0) {
	const readSum = Number.parseInt(new StringType(6).get(arrayBuffer, 148).replace(/\0.*$/, '').trim(), 8); // Read sum in header
	if (Number.isNaN(readSum)) {
		return false;
	}

	let sum = 8 * 0x20; // Initialize signed bit sum

	for (let index = offset; index < offset + 148; index++) {
		sum += arrayBuffer[index];
	}

	for (let index = offset + 156; index < offset + 512; index++) {
		sum += arrayBuffer[index];
	}

	return readSum === sum;
}

/**
ID3 UINT32 sync-safe tokenizer token.
28 bits (representing up to 256MB) integer, the msb is 0 to avoid "false syncsignals".
*/
const uint32SyncSafeToken = {
	get: (buffer, offset) => (buffer[offset + 3] & 0x7F) | ((buffer[offset + 2]) << 7) | ((buffer[offset + 1]) << 14) | ((buffer[offset]) << 21),
	len: 4,
};

const extensions = [
	'jpg',
	'png',
	'apng',
	'gif',
	'webp',
	'flif',
	'xcf',
	'cr2',
	'cr3',
	'orf',
	'arw',
	'dng',
	'nef',
	'rw2',
	'raf',
	'tif',
	'bmp',
	'icns',
	'jxr',
	'psd',
	'indd',
	'zip',
	'tar',
	'rar',
	'gz',
	'bz2',
	'7z',
	'dmg',
	'mp4',
	'mid',
	'mkv',
	'webm',
	'mov',
	'avi',
	'mpg',
	'mp2',
	'mp3',
	'm4a',
	'oga',
	'ogg',
	'ogv',
	'opus',
	'flac',
	'wav',
	'spx',
	'amr',
	'pdf',
	'epub',
	'elf',
	'macho',
	'exe',
	'swf',
	'rtf',
	'wasm',
	'woff',
	'woff2',
	'eot',
	'ttf',
	'otf',
	'ttc',
	'ico',
	'flv',
	'ps',
	'xz',
	'sqlite',
	'nes',
	'crx',
	'xpi',
	'cab',
	'deb',
	'ar',
	'rpm',
	'Z',
	'lz',
	'cfb',
	'mxf',
	'mts',
	'blend',
	'bpg',
	'docx',
	'pptx',
	'xlsx',
	'3gp',
	'3g2',
	'j2c',
	'jp2',
	'jpm',
	'jpx',
	'mj2',
	'aif',
	'qcp',
	'odt',
	'ods',
	'odp',
	'xml',
	'mobi',
	'heic',
	'cur',
	'ktx',
	'ape',
	'wv',
	'dcm',
	'ics',
	'glb',
	'pcap',
	'dsf',
	'lnk',
	'alias',
	'voc',
	'ac3',
	'm4v',
	'm4p',
	'm4b',
	'f4v',
	'f4p',
	'f4b',
	'f4a',
	'mie',
	'asf',
	'ogm',
	'ogx',
	'mpc',
	'arrow',
	'shp',
	'aac',
	'mp1',
	'it',
	's3m',
	'xm',
	'ai',
	'skp',
	'avif',
	'eps',
	'lzh',
	'pgp',
	'asar',
	'stl',
	'chm',
	'3mf',
	'zst',
	'jxl',
	'vcf',
	'jls',
	'pst',
	'dwg',
	'parquet',
	'class',
	'arj',
	'cpio',
	'ace',
	'avro',
	'icc',
	'fbx',
	'vsdx',
	'vtt',
	'apk',
	'drc',
	'lz4',
	'potx',
	'xltx',
	'dotx',
	'xltm',
	'ott',
	'ots',
	'otp',
	'odg',
	'otg',
	'xlsm',
	'docm',
	'dotm',
	'potm',
	'pptm',
	'jar',
	'rm',
];

const mimeTypes = [
	'image/jpeg',
	'image/png',
	'image/gif',
	'image/webp',
	'image/flif',
	'image/x-xcf',
	'image/x-canon-cr2',
	'image/x-canon-cr3',
	'image/tiff',
	'image/bmp',
	'image/vnd.ms-photo',
	'image/vnd.adobe.photoshop',
	'application/x-indesign',
	'application/epub+zip',
	'application/x-xpinstall',
	'application/vnd.oasis.opendocument.text',
	'application/vnd.oasis.opendocument.spreadsheet',
	'application/vnd.oasis.opendocument.presentation',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	'application/vnd.openxmlformats-officedocument.presentationml.presentation',
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	'application/zip',
	'application/x-tar',
	'application/x-rar-compressed',
	'application/gzip',
	'application/x-bzip2',
	'application/x-7z-compressed',
	'application/x-apple-diskimage',
	'application/x-apache-arrow',
	'video/mp4',
	'audio/midi',
	'video/x-matroska',
	'video/webm',
	'video/quicktime',
	'video/vnd.avi',
	'audio/wav',
	'audio/qcelp',
	'audio/x-ms-asf',
	'video/x-ms-asf',
	'application/vnd.ms-asf',
	'video/mpeg',
	'video/3gpp',
	'audio/mpeg',
	'audio/mp4', // RFC 4337
	'video/ogg',
	'audio/ogg',
	'audio/ogg; codecs=opus',
	'application/ogg',
	'audio/x-flac',
	'audio/ape',
	'audio/wavpack',
	'audio/amr',
	'application/pdf',
	'application/x-elf',
	'application/x-mach-binary',
	'application/x-msdownload',
	'application/x-shockwave-flash',
	'application/rtf',
	'application/wasm',
	'font/woff',
	'font/woff2',
	'application/vnd.ms-fontobject',
	'font/ttf',
	'font/otf',
	'font/collection',
	'image/x-icon',
	'video/x-flv',
	'application/postscript',
	'application/eps',
	'application/x-xz',
	'application/x-sqlite3',
	'application/x-nintendo-nes-rom',
	'application/x-google-chrome-extension',
	'application/vnd.ms-cab-compressed',
	'application/x-deb',
	'application/x-unix-archive',
	'application/x-rpm',
	'application/x-compress',
	'application/x-lzip',
	'application/x-cfb',
	'application/x-mie',
	'application/mxf',
	'video/mp2t',
	'application/x-blender',
	'image/bpg',
	'image/j2c',
	'image/jp2',
	'image/jpx',
	'image/jpm',
	'image/mj2',
	'audio/aiff',
	'application/xml',
	'application/x-mobipocket-ebook',
	'image/heif',
	'image/heif-sequence',
	'image/heic',
	'image/heic-sequence',
	'image/icns',
	'image/ktx',
	'application/dicom',
	'audio/x-musepack',
	'text/calendar',
	'text/vcard',
	'text/vtt',
	'model/gltf-binary',
	'application/vnd.tcpdump.pcap',
	'audio/x-dsf', // Non-standard
	'application/x.ms.shortcut', // Invented by us
	'application/x.apple.alias', // Invented by us
	'audio/x-voc',
	'audio/vnd.dolby.dd-raw',
	'audio/x-m4a',
	'image/apng',
	'image/x-olympus-orf',
	'image/x-sony-arw',
	'image/x-adobe-dng',
	'image/x-nikon-nef',
	'image/x-panasonic-rw2',
	'image/x-fujifilm-raf',
	'video/x-m4v',
	'video/3gpp2',
	'application/x-esri-shape',
	'audio/aac',
	'audio/x-it',
	'audio/x-s3m',
	'audio/x-xm',
	'video/MP1S',
	'video/MP2P',
	'application/vnd.sketchup.skp',
	'image/avif',
	'application/x-lzh-compressed',
	'application/pgp-encrypted',
	'application/x-asar',
	'model/stl',
	'application/vnd.ms-htmlhelp',
	'model/3mf',
	'image/jxl',
	'application/zstd',
	'image/jls',
	'application/vnd.ms-outlook',
	'image/vnd.dwg',
	'application/x-parquet',
	'application/java-vm',
	'application/x-arj',
	'application/x-cpio',
	'application/x-ace-compressed',
	'application/avro',
	'application/vnd.iccprofile',
	'application/x.autodesk.fbx', // Invented by us
	'application/vnd.visio',
	'application/vnd.android.package-archive',
	'application/vnd.google.draco', // Invented by us
	'application/x-lz4', // Invented by us
	'application/vnd.openxmlformats-officedocument.presentationml.template',
	'application/vnd.openxmlformats-officedocument.spreadsheetml.template',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.template',
	'application/vnd.ms-excel.template.macroenabled.12',
	'application/vnd.oasis.opendocument.text-template',
	'application/vnd.oasis.opendocument.spreadsheet-template',
	'application/vnd.oasis.opendocument.presentation-template',
	'application/vnd.oasis.opendocument.graphics',
	'application/vnd.oasis.opendocument.graphics-template',
	'application/vnd.ms-excel.sheet.macroEnabled.12',
	'application/vnd.ms-word.document.macroEnabled.12',
	'application/vnd.ms-word.template.macroEnabled.12',
	'application/vnd.ms-powerpoint.template.macroEnabled.12',
	'application/vnd.ms-powerpoint.presentation.macroEnabled.12',
	'application/java-archive',
	'application/vnd.rn-realmedia',
];

/**
Primary entry point, Node.js specific entry point is index.js
*/


const reasonableDetectionSizeInBytes = 4100; // A fair amount of file-types are detectable within this range.

function getFileTypeFromMimeType(mimeType) {
	switch (mimeType) {
		case 'application/epub+zip':
			return {
				ext: 'epub',
				mime: 'application/epub+zip',
			};
		case 'application/vnd.oasis.opendocument.text':
			return {
				ext: 'odt',
				mime: 'application/vnd.oasis.opendocument.text',
			};
		case 'application/vnd.oasis.opendocument.text-template':
			return {
				ext: 'ott',
				mime: 'application/vnd.oasis.opendocument.text-template',
			};
		case 'application/vnd.oasis.opendocument.spreadsheet':
			return {
				ext: 'ods',
				mime: 'application/vnd.oasis.opendocument.spreadsheet',
			};
		case 'application/vnd.oasis.opendocument.spreadsheet-template':
			return {
				ext: 'ots',
				mime: 'application/vnd.oasis.opendocument.spreadsheet-template',
			};
		case 'application/vnd.oasis.opendocument.presentation':
			return {
				ext: 'odp',
				mime: 'application/vnd.oasis.opendocument.presentation',
			};
		case 'application/vnd.oasis.opendocument.presentation-template':
			return {
				ext: 'otp',
				mime: 'application/vnd.oasis.opendocument.presentation-template',
			};
		case 'application/vnd.oasis.opendocument.graphics':
			return {
				ext: 'odg',
				mime: 'application/vnd.oasis.opendocument.graphics',
			};
		case 'application/vnd.oasis.opendocument.graphics-template':
			return {
				ext: 'otg',
				mime: 'application/vnd.oasis.opendocument.graphics-template',
			};
		case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
			return {
				ext: 'xlsx',
				mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			};
		case 'application/vnd.ms-excel.sheet.macroEnabled':
			return {
				ext: 'xlsm',
				mime: 'application/vnd.ms-excel.sheet.macroEnabled.12',
			};
		case 'application/vnd.openxmlformats-officedocument.spreadsheetml.template':
			return {
				ext: 'xltx',
				mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.template',
			};
		case 'application/vnd.ms-excel.template.macroEnabled':
			return {
				ext: 'xltm',
				mime: 'application/vnd.ms-excel.template.macroenabled.12',
			};
		case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
			return {
				ext: 'docx',
				mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			};
		case 'application/vnd.ms-word.document.macroEnabled':
			return {
				ext: 'docm',
				mime: 'application/vnd.ms-word.document.macroEnabled.12',
			};
		case 'application/vnd.openxmlformats-officedocument.wordprocessingml.template':
			return {
				ext: 'dotx',
				mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.template',
			};
		case 'application/vnd.ms-word.template.macroEnabledTemplate':
			return {
				ext: 'dotm',
				mime: 'application/vnd.ms-word.template.macroEnabled.12',
			};
		case 'application/vnd.openxmlformats-officedocument.presentationml.template':
			return {
				ext: 'potx',
				mime: 'application/vnd.openxmlformats-officedocument.presentationml.template',
			};
		case 'application/vnd.ms-powerpoint.template.macroEnabled':
			return {
				ext: 'potm',
				mime: 'application/vnd.ms-powerpoint.template.macroEnabled.12',
			};
		case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
			return {
				ext: 'pptx',
				mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
			};
		case 'application/vnd.ms-powerpoint.presentation.macroEnabled':
			return {
				ext: 'pptm',
				mime: 'application/vnd.ms-powerpoint.presentation.macroEnabled.12',
			};
		case 'application/vnd.ms-visio.drawing':
			return {
				ext: 'vsdx',
				mime: 'application/vnd.visio',
			};
		case 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml':
			return {
				ext: '3mf',
				mime: 'model/3mf',
			};
	}
}

function _check(buffer, headers, options) {
	options = {
		offset: 0,
		...options,
	};

	for (const [index, header] of headers.entries()) {
		// If a bitmask is set
		if (options.mask) {
			// If header doesn't equal `buf` with bits masked off
			if (header !== (options.mask[index] & buffer[index + options.offset])) {
				return false;
			}
		} else if (header !== buffer[index + options.offset]) {
			return false;
		}
	}

	return true;
}

let FileTypeParser$1 = class FileTypeParser {
	constructor(options) {
		this.detectors = [...(options?.customDetectors ?? []),
			{id: 'core', detect: this.detectConfident},
			{id: 'core.imprecise', detect: this.detectImprecise}];
		this.tokenizerOptions = {
			abortSignal: options?.signal,
		};
	}

	async fromTokenizer(tokenizer) {
		const initialPosition = tokenizer.position;

		// Iterate through all file-type detectors
		for (const detector of this.detectors) {
			const fileType = await detector.detect(tokenizer);
			if (fileType) {
				return fileType;
			}

			if (initialPosition !== tokenizer.position) {
				return undefined; // Cannot proceed scanning of the tokenizer is at an arbitrary position
			}
		}
	}

	async fromBuffer(input) {
		if (!(input instanceof Uint8Array || input instanceof ArrayBuffer)) {
			throw new TypeError(`Expected the \`input\` argument to be of type \`Uint8Array\` or \`ArrayBuffer\`, got \`${typeof input}\``);
		}

		const buffer = input instanceof Uint8Array ? input : new Uint8Array(input);

		if (!(buffer?.length > 1)) {
			return;
		}

		return this.fromTokenizer(fromBuffer(buffer, this.tokenizerOptions));
	}

	async fromBlob(blob) {
		return this.fromStream(blob.stream());
	}

	async fromStream(stream) {
		const tokenizer = await fromWebStream(stream, this.tokenizerOptions);
		try {
			return await this.fromTokenizer(tokenizer);
		} finally {
			await tokenizer.close();
		}
	}

	async toDetectionStream(stream, options) {
		const {sampleSize = reasonableDetectionSizeInBytes} = options;
		let detectedFileType;
		let firstChunk;

		const reader = stream.getReader({mode: 'byob'});
		try {
			// Read the first chunk from the stream
			const {value: chunk, done} = await reader.read(new Uint8Array(sampleSize));
			firstChunk = chunk;
			if (!done && chunk) {
				try {
					// Attempt to detect the file type from the chunk
					detectedFileType = await this.fromBuffer(chunk.slice(0, sampleSize));
				} catch (error) {
					if (!(error instanceof EndOfStreamError)) {
						throw error; // Re-throw non-EndOfStreamError
					}

					detectedFileType = undefined;
				}
			}

			firstChunk = chunk;
		} finally {
			reader.releaseLock(); // Ensure the reader is released
		}

		// Create a new ReadableStream to manage locking issues
		const transformStream = new TransformStream({
			async start(controller) {
				controller.enqueue(firstChunk); // Enqueue the initial chunk
			},
			transform(chunk, controller) {
				// Pass through the chunks without modification
				controller.enqueue(chunk);
			},
		});

		const newStream = stream.pipeThrough(transformStream);
		newStream.fileType = detectedFileType;

		return newStream;
	}

	check(header, options) {
		return _check(this.buffer, header, options);
	}

	checkString(header, options) {
		return this.check(stringToBytes(header), options);
	}

	// Detections with a high degree of certainty in identifying the correct file type
	detectConfident = async tokenizer => {
		this.buffer = new Uint8Array(reasonableDetectionSizeInBytes);

		// Keep reading until EOF if the file size is unknown.
		if (tokenizer.fileInfo.size === undefined) {
			tokenizer.fileInfo.size = Number.MAX_SAFE_INTEGER;
		}

		this.tokenizer = tokenizer;

		await tokenizer.peekBuffer(this.buffer, {length: 12, mayBeLess: true});

		// -- 2-byte signatures --

		if (this.check([0x42, 0x4D])) {
			return {
				ext: 'bmp',
				mime: 'image/bmp',
			};
		}

		if (this.check([0x0B, 0x77])) {
			return {
				ext: 'ac3',
				mime: 'audio/vnd.dolby.dd-raw',
			};
		}

		if (this.check([0x78, 0x01])) {
			return {
				ext: 'dmg',
				mime: 'application/x-apple-diskimage',
			};
		}

		if (this.check([0x4D, 0x5A])) {
			return {
				ext: 'exe',
				mime: 'application/x-msdownload',
			};
		}

		if (this.check([0x25, 0x21])) {
			await tokenizer.peekBuffer(this.buffer, {length: 24, mayBeLess: true});

			if (
				this.checkString('PS-Adobe-', {offset: 2})
				&& this.checkString(' EPSF-', {offset: 14})
			) {
				return {
					ext: 'eps',
					mime: 'application/eps',
				};
			}

			return {
				ext: 'ps',
				mime: 'application/postscript',
			};
		}

		if (
			this.check([0x1F, 0xA0])
			|| this.check([0x1F, 0x9D])
		) {
			return {
				ext: 'Z',
				mime: 'application/x-compress',
			};
		}

		if (this.check([0xC7, 0x71])) {
			return {
				ext: 'cpio',
				mime: 'application/x-cpio',
			};
		}

		if (this.check([0x60, 0xEA])) {
			return {
				ext: 'arj',
				mime: 'application/x-arj',
			};
		}

		// -- 3-byte signatures --

		if (this.check([0xEF, 0xBB, 0xBF])) { // UTF-8-BOM
			// Strip off UTF-8-BOM
			this.tokenizer.ignore(3);
			return this.detectConfident(tokenizer);
		}

		if (this.check([0x47, 0x49, 0x46])) {
			return {
				ext: 'gif',
				mime: 'image/gif',
			};
		}

		if (this.check([0x49, 0x49, 0xBC])) {
			return {
				ext: 'jxr',
				mime: 'image/vnd.ms-photo',
			};
		}

		if (this.check([0x1F, 0x8B, 0x8])) {
			return {
				ext: 'gz',
				mime: 'application/gzip',
			};
		}

		if (this.check([0x42, 0x5A, 0x68])) {
			return {
				ext: 'bz2',
				mime: 'application/x-bzip2',
			};
		}

		if (this.checkString('ID3')) {
			await tokenizer.ignore(6); // Skip ID3 header until the header size
			const id3HeaderLength = await tokenizer.readToken(uint32SyncSafeToken);
			if (tokenizer.position + id3HeaderLength > tokenizer.fileInfo.size) {
				// Guess file type based on ID3 header for backward compatibility
				return {
					ext: 'mp3',
					mime: 'audio/mpeg',
				};
			}

			await tokenizer.ignore(id3HeaderLength);
			return this.fromTokenizer(tokenizer); // Skip ID3 header, recursion
		}

		// Musepack, SV7
		if (this.checkString('MP+')) {
			return {
				ext: 'mpc',
				mime: 'audio/x-musepack',
			};
		}

		if (
			(this.buffer[0] === 0x43 || this.buffer[0] === 0x46)
			&& this.check([0x57, 0x53], {offset: 1})
		) {
			return {
				ext: 'swf',
				mime: 'application/x-shockwave-flash',
			};
		}

		// -- 4-byte signatures --

		// Requires a sample size of 4 bytes
		if (this.check([0xFF, 0xD8, 0xFF])) {
			if (this.check([0xF7], {offset: 3})) { // JPG7/SOF55, indicating a ISO/IEC 14495 / JPEG-LS file
				return {
					ext: 'jls',
					mime: 'image/jls',
				};
			}

			return {
				ext: 'jpg',
				mime: 'image/jpeg',
			};
		}

		if (this.check([0x4F, 0x62, 0x6A, 0x01])) {
			return {
				ext: 'avro',
				mime: 'application/avro',
			};
		}

		if (this.checkString('FLIF')) {
			return {
				ext: 'flif',
				mime: 'image/flif',
			};
		}

		if (this.checkString('8BPS')) {
			return {
				ext: 'psd',
				mime: 'image/vnd.adobe.photoshop',
			};
		}

		// Musepack, SV8
		if (this.checkString('MPCK')) {
			return {
				ext: 'mpc',
				mime: 'audio/x-musepack',
			};
		}

		if (this.checkString('FORM')) {
			return {
				ext: 'aif',
				mime: 'audio/aiff',
			};
		}

		if (this.checkString('icns', {offset: 0})) {
			return {
				ext: 'icns',
				mime: 'image/icns',
			};
		}

		// Zip-based file formats
		// Need to be before the `zip` check
		if (this.check([0x50, 0x4B, 0x3, 0x4])) { // Local file header signature
			let fileType;
			await new ZipHandler(tokenizer).unzip(zipHeader => {
				switch (zipHeader.filename) {
					case 'META-INF/mozilla.rsa':
						fileType = {
							ext: 'xpi',
							mime: 'application/x-xpinstall',
						};
						return {
							stop: true,
						};
					case 'META-INF/MANIFEST.MF':
						fileType = {
							ext: 'jar',
							mime: 'application/java-archive',
						};
						return {
							stop: true,
						};
					case 'mimetype':
						return {
							async handler(fileData) {
								// Use TextDecoder to decode the UTF-8 encoded data
								const mimeType = new TextDecoder('utf-8').decode(fileData).trim();
								fileType = getFileTypeFromMimeType(mimeType);
							},
							stop: true,
						};

					case '[Content_Types].xml':
						return {
							async handler(fileData) {
								// Use TextDecoder to decode the UTF-8 encoded data
								let xmlContent = new TextDecoder('utf-8').decode(fileData);
								const endPos = xmlContent.indexOf('.main+xml"');
								if (endPos === -1) {
									const mimeType = 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml';
									if (xmlContent.includes(`ContentType="${mimeType}"`)) {
										fileType = getFileTypeFromMimeType(mimeType);
									}
								} else {
									xmlContent = xmlContent.slice(0, Math.max(0, endPos));
									const firstPos = xmlContent.lastIndexOf('"');
									const mimeType = xmlContent.slice(Math.max(0, firstPos + 1));
									fileType = getFileTypeFromMimeType(mimeType);
								}
							},
							stop: true,
						};
					default:
						if (/classes\d*\.dex/.test(zipHeader.filename)) {
							fileType = {
								ext: 'apk',
								mime: 'application/vnd.android.package-archive',
							};
							return {stop: true};
						}

						return {};
				}
			});

			return fileType ?? {
				ext: 'zip',
				mime: 'application/zip',
			};
		}

		if (this.checkString('OggS')) {
			// This is an OGG container
			await tokenizer.ignore(28);
			const type = new Uint8Array(8);
			await tokenizer.readBuffer(type);

			// Needs to be before `ogg` check
			if (_check(type, [0x4F, 0x70, 0x75, 0x73, 0x48, 0x65, 0x61, 0x64])) {
				return {
					ext: 'opus',
					mime: 'audio/ogg; codecs=opus',
				};
			}

			// If ' theora' in header.
			if (_check(type, [0x80, 0x74, 0x68, 0x65, 0x6F, 0x72, 0x61])) {
				return {
					ext: 'ogv',
					mime: 'video/ogg',
				};
			}

			// If '\x01video' in header.
			if (_check(type, [0x01, 0x76, 0x69, 0x64, 0x65, 0x6F, 0x00])) {
				return {
					ext: 'ogm',
					mime: 'video/ogg',
				};
			}

			// If ' FLAC' in header  https://xiph.org/flac/faq.html
			if (_check(type, [0x7F, 0x46, 0x4C, 0x41, 0x43])) {
				return {
					ext: 'oga',
					mime: 'audio/ogg',
				};
			}

			// 'Speex  ' in header https://en.wikipedia.org/wiki/Speex
			if (_check(type, [0x53, 0x70, 0x65, 0x65, 0x78, 0x20, 0x20])) {
				return {
					ext: 'spx',
					mime: 'audio/ogg',
				};
			}

			// If '\x01vorbis' in header
			if (_check(type, [0x01, 0x76, 0x6F, 0x72, 0x62, 0x69, 0x73])) {
				return {
					ext: 'ogg',
					mime: 'audio/ogg',
				};
			}

			// Default OGG container https://www.iana.org/assignments/media-types/application/ogg
			return {
				ext: 'ogx',
				mime: 'application/ogg',
			};
		}

		if (
			this.check([0x50, 0x4B])
			&& (this.buffer[2] === 0x3 || this.buffer[2] === 0x5 || this.buffer[2] === 0x7)
			&& (this.buffer[3] === 0x4 || this.buffer[3] === 0x6 || this.buffer[3] === 0x8)
		) {
			return {
				ext: 'zip',
				mime: 'application/zip',
			};
		}

		if (this.checkString('MThd')) {
			return {
				ext: 'mid',
				mime: 'audio/midi',
			};
		}

		if (
			this.checkString('wOFF')
			&& (
				this.check([0x00, 0x01, 0x00, 0x00], {offset: 4})
				|| this.checkString('OTTO', {offset: 4})
			)
		) {
			return {
				ext: 'woff',
				mime: 'font/woff',
			};
		}

		if (
			this.checkString('wOF2')
			&& (
				this.check([0x00, 0x01, 0x00, 0x00], {offset: 4})
				|| this.checkString('OTTO', {offset: 4})
			)
		) {
			return {
				ext: 'woff2',
				mime: 'font/woff2',
			};
		}

		if (this.check([0xD4, 0xC3, 0xB2, 0xA1]) || this.check([0xA1, 0xB2, 0xC3, 0xD4])) {
			return {
				ext: 'pcap',
				mime: 'application/vnd.tcpdump.pcap',
			};
		}

		// Sony DSD Stream File (DSF)
		if (this.checkString('DSD ')) {
			return {
				ext: 'dsf',
				mime: 'audio/x-dsf', // Non-standard
			};
		}

		if (this.checkString('LZIP')) {
			return {
				ext: 'lz',
				mime: 'application/x-lzip',
			};
		}

		if (this.checkString('fLaC')) {
			return {
				ext: 'flac',
				mime: 'audio/x-flac',
			};
		}

		if (this.check([0x42, 0x50, 0x47, 0xFB])) {
			return {
				ext: 'bpg',
				mime: 'image/bpg',
			};
		}

		if (this.checkString('wvpk')) {
			return {
				ext: 'wv',
				mime: 'audio/wavpack',
			};
		}

		if (this.checkString('%PDF')) {
			try {
				const skipBytes = 1350;
				if (skipBytes === await tokenizer.ignore(skipBytes)) {
					const maxBufferSize = 10 * 1024 * 1024;
					const buffer = new Uint8Array(Math.min(maxBufferSize, tokenizer.fileInfo.size - skipBytes));
					await tokenizer.readBuffer(buffer, {mayBeLess: true});

					// Check if this is an Adobe Illustrator file
					if (includes(buffer, new TextEncoder().encode('AIPrivateData'))) {
						return {
							ext: 'ai',
							mime: 'application/postscript',
						};
					}
				}
			} catch (error) {
				// Swallow end of stream error if file is too small for the Adobe AI check
				if (!(error instanceof EndOfStreamError)) {
					throw error;
				}
			}

			// Assume this is just a normal PDF
			return {
				ext: 'pdf',
				mime: 'application/pdf',
			};
		}

		if (this.check([0x00, 0x61, 0x73, 0x6D])) {
			return {
				ext: 'wasm',
				mime: 'application/wasm',
			};
		}

		// TIFF, little-endian type
		if (this.check([0x49, 0x49])) {
			const fileType = await this.readTiffHeader(false);
			if (fileType) {
				return fileType;
			}
		}

		// TIFF, big-endian type
		if (this.check([0x4D, 0x4D])) {
			const fileType = await this.readTiffHeader(true);
			if (fileType) {
				return fileType;
			}
		}

		if (this.checkString('MAC ')) {
			return {
				ext: 'ape',
				mime: 'audio/ape',
			};
		}

		// https://github.com/file/file/blob/master/magic/Magdir/matroska
		if (this.check([0x1A, 0x45, 0xDF, 0xA3])) { // Root element: EBML
			async function readField() {
				const msb = await tokenizer.peekNumber(UINT8);
				let mask = 0x80;
				let ic = 0; // 0 = A, 1 = B, 2 = C, 3 = D

				while ((msb & mask) === 0 && mask !== 0) {
					++ic;
					mask >>= 1;
				}

				const id = new Uint8Array(ic + 1);
				await tokenizer.readBuffer(id);
				return id;
			}

			async function readElement() {
				const idField = await readField();
				const lengthField = await readField();

				lengthField[0] ^= 0x80 >> (lengthField.length - 1);
				const nrLength = Math.min(6, lengthField.length); // JavaScript can max read 6 bytes integer

				const idView = new DataView(idField.buffer);
				const lengthView = new DataView(lengthField.buffer, lengthField.length - nrLength, nrLength);

				return {
					id: getUintBE(idView),
					len: getUintBE(lengthView),
				};
			}

			async function readChildren(children) {
				while (children > 0) {
					const element = await readElement();
					if (element.id === 0x42_82) {
						const rawValue = await tokenizer.readToken(new StringType(element.len));
						return rawValue.replaceAll(/\00.*$/g, ''); // Return DocType
					}

					await tokenizer.ignore(element.len); // ignore payload
					--children;
				}
			}

			const re = await readElement();
			const documentType = await readChildren(re.len);

			switch (documentType) {
				case 'webm':
					return {
						ext: 'webm',
						mime: 'video/webm',
					};

				case 'matroska':
					return {
						ext: 'mkv',
						mime: 'video/x-matroska',
					};

				default:
					return;
			}
		}

		if (this.checkString('SQLi')) {
			return {
				ext: 'sqlite',
				mime: 'application/x-sqlite3',
			};
		}

		if (this.check([0x4E, 0x45, 0x53, 0x1A])) {
			return {
				ext: 'nes',
				mime: 'application/x-nintendo-nes-rom',
			};
		}

		if (this.checkString('Cr24')) {
			return {
				ext: 'crx',
				mime: 'application/x-google-chrome-extension',
			};
		}

		if (
			this.checkString('MSCF')
			|| this.checkString('ISc(')
		) {
			return {
				ext: 'cab',
				mime: 'application/vnd.ms-cab-compressed',
			};
		}

		if (this.check([0xED, 0xAB, 0xEE, 0xDB])) {
			return {
				ext: 'rpm',
				mime: 'application/x-rpm',
			};
		}

		if (this.check([0xC5, 0xD0, 0xD3, 0xC6])) {
			return {
				ext: 'eps',
				mime: 'application/eps',
			};
		}

		if (this.check([0x28, 0xB5, 0x2F, 0xFD])) {
			return {
				ext: 'zst',
				mime: 'application/zstd',
			};
		}

		if (this.check([0x7F, 0x45, 0x4C, 0x46])) {
			return {
				ext: 'elf',
				mime: 'application/x-elf',
			};
		}

		if (this.check([0x21, 0x42, 0x44, 0x4E])) {
			return {
				ext: 'pst',
				mime: 'application/vnd.ms-outlook',
			};
		}

		if (this.checkString('PAR1')) {
			return {
				ext: 'parquet',
				mime: 'application/x-parquet',
			};
		}

		if (this.checkString('ttcf')) {
			return {
				ext: 'ttc',
				mime: 'font/collection',
			};
		}

		if (this.check([0xCF, 0xFA, 0xED, 0xFE])) {
			return {
				ext: 'macho',
				mime: 'application/x-mach-binary',
			};
		}

		if (this.check([0x04, 0x22, 0x4D, 0x18])) {
			return {
				ext: 'lz4',
				mime: 'application/x-lz4', // Invented by us
			};
		}

		// -- 5-byte signatures --

		if (this.check([0x4F, 0x54, 0x54, 0x4F, 0x00])) {
			return {
				ext: 'otf',
				mime: 'font/otf',
			};
		}

		if (this.checkString('#!AMR')) {
			return {
				ext: 'amr',
				mime: 'audio/amr',
			};
		}

		if (this.checkString('{\\rtf')) {
			return {
				ext: 'rtf',
				mime: 'application/rtf',
			};
		}

		if (this.check([0x46, 0x4C, 0x56, 0x01])) {
			return {
				ext: 'flv',
				mime: 'video/x-flv',
			};
		}

		if (this.checkString('IMPM')) {
			return {
				ext: 'it',
				mime: 'audio/x-it',
			};
		}

		if (
			this.checkString('-lh0-', {offset: 2})
			|| this.checkString('-lh1-', {offset: 2})
			|| this.checkString('-lh2-', {offset: 2})
			|| this.checkString('-lh3-', {offset: 2})
			|| this.checkString('-lh4-', {offset: 2})
			|| this.checkString('-lh5-', {offset: 2})
			|| this.checkString('-lh6-', {offset: 2})
			|| this.checkString('-lh7-', {offset: 2})
			|| this.checkString('-lzs-', {offset: 2})
			|| this.checkString('-lz4-', {offset: 2})
			|| this.checkString('-lz5-', {offset: 2})
			|| this.checkString('-lhd-', {offset: 2})
		) {
			return {
				ext: 'lzh',
				mime: 'application/x-lzh-compressed',
			};
		}

		// MPEG program stream (PS or MPEG-PS)
		if (this.check([0x00, 0x00, 0x01, 0xBA])) {
			//  MPEG-PS, MPEG-1 Part 1
			if (this.check([0x21], {offset: 4, mask: [0xF1]})) {
				return {
					ext: 'mpg', // May also be .ps, .mpeg
					mime: 'video/MP1S',
				};
			}

			// MPEG-PS, MPEG-2 Part 1
			if (this.check([0x44], {offset: 4, mask: [0xC4]})) {
				return {
					ext: 'mpg', // May also be .mpg, .m2p, .vob or .sub
					mime: 'video/MP2P',
				};
			}
		}

		if (this.checkString('ITSF')) {
			return {
				ext: 'chm',
				mime: 'application/vnd.ms-htmlhelp',
			};
		}

		if (this.check([0xCA, 0xFE, 0xBA, 0xBE])) {
			return {
				ext: 'class',
				mime: 'application/java-vm',
			};
		}

		if (this.checkString('.RMF')) {
			return {
				ext: 'rm',
				mime: 'application/vnd.rn-realmedia',
			};
		}

		// -- 5-byte signatures --

		if (this.checkString('DRACO')) {
			return {
				ext: 'drc',
				mime: 'application/vnd.google.draco', // Invented by us
			};
		}

		// -- 6-byte signatures --

		if (this.check([0xFD, 0x37, 0x7A, 0x58, 0x5A, 0x00])) {
			return {
				ext: 'xz',
				mime: 'application/x-xz',
			};
		}

		if (this.checkString('<?xml ')) {
			return {
				ext: 'xml',
				mime: 'application/xml',
			};
		}

		if (this.check([0x37, 0x7A, 0xBC, 0xAF, 0x27, 0x1C])) {
			return {
				ext: '7z',
				mime: 'application/x-7z-compressed',
			};
		}

		if (
			this.check([0x52, 0x61, 0x72, 0x21, 0x1A, 0x7])
			&& (this.buffer[6] === 0x0 || this.buffer[6] === 0x1)
		) {
			return {
				ext: 'rar',
				mime: 'application/x-rar-compressed',
			};
		}

		if (this.checkString('solid ')) {
			return {
				ext: 'stl',
				mime: 'model/stl',
			};
		}

		if (this.checkString('AC')) {
			const version = new StringType(4, 'latin1').get(this.buffer, 2);
			if (version.match('^d*') && version >= 1000 && version <= 1050) {
				return {
					ext: 'dwg',
					mime: 'image/vnd.dwg',
				};
			}
		}

		if (this.checkString('070707')) {
			return {
				ext: 'cpio',
				mime: 'application/x-cpio',
			};
		}

		// -- 7-byte signatures --

		if (this.checkString('BLENDER')) {
			return {
				ext: 'blend',
				mime: 'application/x-blender',
			};
		}

		if (this.checkString('!<arch>')) {
			await tokenizer.ignore(8);
			const string = await tokenizer.readToken(new StringType(13, 'ascii'));
			if (string === 'debian-binary') {
				return {
					ext: 'deb',
					mime: 'application/x-deb',
				};
			}

			return {
				ext: 'ar',
				mime: 'application/x-unix-archive',
			};
		}

		if (
			this.checkString('WEBVTT')
			&&	(
				// One of LF, CR, tab, space, or end of file must follow "WEBVTT" per the spec (see `fixture/fixture-vtt-*.vtt` for examples). Note that `\0` is technically the null character (there is no such thing as an EOF character). However, checking for `\0` gives us the same result as checking for the end of the stream.
				(['\n', '\r', '\t', ' ', '\0'].some(char7 => this.checkString(char7, {offset: 6}))))
		) {
			return {
				ext: 'vtt',
				mime: 'text/vtt',
			};
		}

		// -- 8-byte signatures --

		if (this.check([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])) {
			// APNG format (https://wiki.mozilla.org/APNG_Specification)
			// 1. Find the first IDAT (image data) chunk (49 44 41 54)
			// 2. Check if there is an "acTL" chunk before the IDAT one (61 63 54 4C)

			// Offset calculated as follows:
			// - 8 bytes: PNG signature
			// - 4 (length) + 4 (chunk type) + 13 (chunk data) + 4 (CRC): IHDR chunk

			await tokenizer.ignore(8); // ignore PNG signature

			async function readChunkHeader() {
				return {
					length: await tokenizer.readToken(INT32_BE),
					type: await tokenizer.readToken(new StringType(4, 'latin1')),
				};
			}

			do {
				const chunk = await readChunkHeader();
				if (chunk.length < 0) {
					return; // Invalid chunk length
				}

				switch (chunk.type) {
					case 'IDAT':
						return {
							ext: 'png',
							mime: 'image/png',
						};
					case 'acTL':
						return {
							ext: 'apng',
							mime: 'image/apng',
						};
					default:
						await tokenizer.ignore(chunk.length + 4); // Ignore chunk-data + CRC
				}
			} while (tokenizer.position + 8 < tokenizer.fileInfo.size);

			return {
				ext: 'png',
				mime: 'image/png',
			};
		}

		if (this.check([0x41, 0x52, 0x52, 0x4F, 0x57, 0x31, 0x00, 0x00])) {
			return {
				ext: 'arrow',
				mime: 'application/x-apache-arrow',
			};
		}

		if (this.check([0x67, 0x6C, 0x54, 0x46, 0x02, 0x00, 0x00, 0x00])) {
			return {
				ext: 'glb',
				mime: 'model/gltf-binary',
			};
		}

		// `mov` format variants
		if (
			this.check([0x66, 0x72, 0x65, 0x65], {offset: 4}) // `free`
			|| this.check([0x6D, 0x64, 0x61, 0x74], {offset: 4}) // `mdat` MJPEG
			|| this.check([0x6D, 0x6F, 0x6F, 0x76], {offset: 4}) // `moov`
			|| this.check([0x77, 0x69, 0x64, 0x65], {offset: 4}) // `wide`
		) {
			return {
				ext: 'mov',
				mime: 'video/quicktime',
			};
		}

		// -- 9-byte signatures --

		if (this.check([0x49, 0x49, 0x52, 0x4F, 0x08, 0x00, 0x00, 0x00, 0x18])) {
			return {
				ext: 'orf',
				mime: 'image/x-olympus-orf',
			};
		}

		if (this.checkString('gimp xcf ')) {
			return {
				ext: 'xcf',
				mime: 'image/x-xcf',
			};
		}

		// File Type Box (https://en.wikipedia.org/wiki/ISO_base_media_file_format)
		// It's not required to be first, but it's recommended to be. Almost all ISO base media files start with `ftyp` box.
		// `ftyp` box must contain a brand major identifier, which must consist of ISO 8859-1 printable characters.
		// Here we check for 8859-1 printable characters (for simplicity, it's a mask which also catches one non-printable character).
		if (
			this.checkString('ftyp', {offset: 4})
			&& (this.buffer[8] & 0x60) !== 0x00 // Brand major, first character ASCII?
		) {
			// They all can have MIME `video/mp4` except `application/mp4` special-case which is hard to detect.
			// For some cases, we're specific, everything else falls to `video/mp4` with `mp4` extension.
			const brandMajor = new StringType(4, 'latin1').get(this.buffer, 8).replace('\0', ' ').trim();
			switch (brandMajor) {
				case 'avif':
				case 'avis':
					return {ext: 'avif', mime: 'image/avif'};
				case 'mif1':
					return {ext: 'heic', mime: 'image/heif'};
				case 'msf1':
					return {ext: 'heic', mime: 'image/heif-sequence'};
				case 'heic':
				case 'heix':
					return {ext: 'heic', mime: 'image/heic'};
				case 'hevc':
				case 'hevx':
					return {ext: 'heic', mime: 'image/heic-sequence'};
				case 'qt':
					return {ext: 'mov', mime: 'video/quicktime'};
				case 'M4V':
				case 'M4VH':
				case 'M4VP':
					return {ext: 'm4v', mime: 'video/x-m4v'};
				case 'M4P':
					return {ext: 'm4p', mime: 'video/mp4'};
				case 'M4B':
					return {ext: 'm4b', mime: 'audio/mp4'};
				case 'M4A':
					return {ext: 'm4a', mime: 'audio/x-m4a'};
				case 'F4V':
					return {ext: 'f4v', mime: 'video/mp4'};
				case 'F4P':
					return {ext: 'f4p', mime: 'video/mp4'};
				case 'F4A':
					return {ext: 'f4a', mime: 'audio/mp4'};
				case 'F4B':
					return {ext: 'f4b', mime: 'audio/mp4'};
				case 'crx':
					return {ext: 'cr3', mime: 'image/x-canon-cr3'};
				default:
					if (brandMajor.startsWith('3g')) {
						if (brandMajor.startsWith('3g2')) {
							return {ext: '3g2', mime: 'video/3gpp2'};
						}

						return {ext: '3gp', mime: 'video/3gpp'};
					}

					return {ext: 'mp4', mime: 'video/mp4'};
			}
		}

		// -- 12-byte signatures --

		// RIFF file format which might be AVI, WAV, QCP, etc
		if (this.check([0x52, 0x49, 0x46, 0x46])) {
			if (this.checkString('WEBP', {offset: 8})) {
				return {
					ext: 'webp',
					mime: 'image/webp',
				};
			}

			if (this.check([0x41, 0x56, 0x49], {offset: 8})) {
				return {
					ext: 'avi',
					mime: 'video/vnd.avi',
				};
			}

			if (this.check([0x57, 0x41, 0x56, 0x45], {offset: 8})) {
				return {
					ext: 'wav',
					mime: 'audio/wav',
				};
			}

			// QLCM, QCP file
			if (this.check([0x51, 0x4C, 0x43, 0x4D], {offset: 8})) {
				return {
					ext: 'qcp',
					mime: 'audio/qcelp',
				};
			}
		}

		if (this.check([0x49, 0x49, 0x55, 0x00, 0x18, 0x00, 0x00, 0x00, 0x88, 0xE7, 0x74, 0xD8])) {
			return {
				ext: 'rw2',
				mime: 'image/x-panasonic-rw2',
			};
		}

		// ASF_Header_Object first 80 bytes
		if (this.check([0x30, 0x26, 0xB2, 0x75, 0x8E, 0x66, 0xCF, 0x11, 0xA6, 0xD9])) {
			async function readHeader() {
				const guid = new Uint8Array(16);
				await tokenizer.readBuffer(guid);
				return {
					id: guid,
					size: Number(await tokenizer.readToken(UINT64_LE)),
				};
			}

			await tokenizer.ignore(30);
			// Search for header should be in first 1KB of file.
			while (tokenizer.position + 24 < tokenizer.fileInfo.size) {
				const header = await readHeader();
				let payload = header.size - 24;
				if (_check(header.id, [0x91, 0x07, 0xDC, 0xB7, 0xB7, 0xA9, 0xCF, 0x11, 0x8E, 0xE6, 0x00, 0xC0, 0x0C, 0x20, 0x53, 0x65])) {
					// Sync on Stream-Properties-Object (B7DC0791-A9B7-11CF-8EE6-00C00C205365)
					const typeId = new Uint8Array(16);
					payload -= await tokenizer.readBuffer(typeId);

					if (_check(typeId, [0x40, 0x9E, 0x69, 0xF8, 0x4D, 0x5B, 0xCF, 0x11, 0xA8, 0xFD, 0x00, 0x80, 0x5F, 0x5C, 0x44, 0x2B])) {
						// Found audio:
						return {
							ext: 'asf',
							mime: 'audio/x-ms-asf',
						};
					}

					if (_check(typeId, [0xC0, 0xEF, 0x19, 0xBC, 0x4D, 0x5B, 0xCF, 0x11, 0xA8, 0xFD, 0x00, 0x80, 0x5F, 0x5C, 0x44, 0x2B])) {
						// Found video:
						return {
							ext: 'asf',
							mime: 'video/x-ms-asf',
						};
					}

					break;
				}

				await tokenizer.ignore(payload);
			}

			// Default to ASF generic extension
			return {
				ext: 'asf',
				mime: 'application/vnd.ms-asf',
			};
		}

		if (this.check([0xAB, 0x4B, 0x54, 0x58, 0x20, 0x31, 0x31, 0xBB, 0x0D, 0x0A, 0x1A, 0x0A])) {
			return {
				ext: 'ktx',
				mime: 'image/ktx',
			};
		}

		if ((this.check([0x7E, 0x10, 0x04]) || this.check([0x7E, 0x18, 0x04])) && this.check([0x30, 0x4D, 0x49, 0x45], {offset: 4})) {
			return {
				ext: 'mie',
				mime: 'application/x-mie',
			};
		}

		if (this.check([0x27, 0x0A, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], {offset: 2})) {
			return {
				ext: 'shp',
				mime: 'application/x-esri-shape',
			};
		}

		if (this.check([0xFF, 0x4F, 0xFF, 0x51])) {
			return {
				ext: 'j2c',
				mime: 'image/j2c',
			};
		}

		if (this.check([0x00, 0x00, 0x00, 0x0C, 0x6A, 0x50, 0x20, 0x20, 0x0D, 0x0A, 0x87, 0x0A])) {
			// JPEG-2000 family

			await tokenizer.ignore(20);
			const type = await tokenizer.readToken(new StringType(4, 'ascii'));
			switch (type) {
				case 'jp2 ':
					return {
						ext: 'jp2',
						mime: 'image/jp2',
					};
				case 'jpx ':
					return {
						ext: 'jpx',
						mime: 'image/jpx',
					};
				case 'jpm ':
					return {
						ext: 'jpm',
						mime: 'image/jpm',
					};
				case 'mjp2':
					return {
						ext: 'mj2',
						mime: 'image/mj2',
					};
				default:
					return;
			}
		}

		if (
			this.check([0xFF, 0x0A])
			|| this.check([0x00, 0x00, 0x00, 0x0C, 0x4A, 0x58, 0x4C, 0x20, 0x0D, 0x0A, 0x87, 0x0A])
		) {
			return {
				ext: 'jxl',
				mime: 'image/jxl',
			};
		}

		if (this.check([0xFE, 0xFF])) { // UTF-16-BOM-LE
			if (this.check([0, 60, 0, 63, 0, 120, 0, 109, 0, 108], {offset: 2})) {
				return {
					ext: 'xml',
					mime: 'application/xml',
				};
			}

			return undefined; // Some unknown text based format
		}

		if (this.check([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1])) {
			// Detected Microsoft Compound File Binary File (MS-CFB) Format.
			return {
				ext: 'cfb',
				mime: 'application/x-cfb',
			};
		}

		// Increase sample size from 12 to 256.
		await tokenizer.peekBuffer(this.buffer, {length: Math.min(256, tokenizer.fileInfo.size), mayBeLess: true});

		if (this.check([0x61, 0x63, 0x73, 0x70], {offset: 36})) {
			return {
				ext: 'icc',
				mime: 'application/vnd.iccprofile',
			};
		}

		// ACE: requires 14 bytes in the buffer
		if (this.checkString('**ACE', {offset: 7}) && this.checkString('**', {offset: 12})) {
			return {
				ext: 'ace',
				mime: 'application/x-ace-compressed',
			};
		}

		// -- 15-byte signatures --

		if (this.checkString('BEGIN:')) {
			if (this.checkString('VCARD', {offset: 6})) {
				return {
					ext: 'vcf',
					mime: 'text/vcard',
				};
			}

			if (this.checkString('VCALENDAR', {offset: 6})) {
				return {
					ext: 'ics',
					mime: 'text/calendar',
				};
			}
		}

		// `raf` is here just to keep all the raw image detectors together.
		if (this.checkString('FUJIFILMCCD-RAW')) {
			return {
				ext: 'raf',
				mime: 'image/x-fujifilm-raf',
			};
		}

		if (this.checkString('Extended Module:')) {
			return {
				ext: 'xm',
				mime: 'audio/x-xm',
			};
		}

		if (this.checkString('Creative Voice File')) {
			return {
				ext: 'voc',
				mime: 'audio/x-voc',
			};
		}

		if (this.check([0x04, 0x00, 0x00, 0x00]) && this.buffer.length >= 16) { // Rough & quick check Pickle/ASAR
			const jsonSize = new DataView(this.buffer.buffer).getUint32(12, true);

			if (jsonSize > 12 && this.buffer.length >= jsonSize + 16) {
				try {
					const header = new TextDecoder().decode(this.buffer.slice(16, jsonSize + 16));
					const json = JSON.parse(header);
					// Check if Pickle is ASAR
					if (json.files) { // Final check, assuring Pickle/ASAR format
						return {
							ext: 'asar',
							mime: 'application/x-asar',
						};
					}
				} catch {}
			}
		}

		if (this.check([0x06, 0x0E, 0x2B, 0x34, 0x02, 0x05, 0x01, 0x01, 0x0D, 0x01, 0x02, 0x01, 0x01, 0x02])) {
			return {
				ext: 'mxf',
				mime: 'application/mxf',
			};
		}

		if (this.checkString('SCRM', {offset: 44})) {
			return {
				ext: 's3m',
				mime: 'audio/x-s3m',
			};
		}

		// Raw MPEG-2 transport stream (188-byte packets)
		if (this.check([0x47]) && this.check([0x47], {offset: 188})) {
			return {
				ext: 'mts',
				mime: 'video/mp2t',
			};
		}

		// Blu-ray Disc Audio-Video (BDAV) MPEG-2 transport stream has 4-byte TP_extra_header before each 188-byte packet
		if (this.check([0x47], {offset: 4}) && this.check([0x47], {offset: 196})) {
			return {
				ext: 'mts',
				mime: 'video/mp2t',
			};
		}

		if (this.check([0x42, 0x4F, 0x4F, 0x4B, 0x4D, 0x4F, 0x42, 0x49], {offset: 60})) {
			return {
				ext: 'mobi',
				mime: 'application/x-mobipocket-ebook',
			};
		}

		if (this.check([0x44, 0x49, 0x43, 0x4D], {offset: 128})) {
			return {
				ext: 'dcm',
				mime: 'application/dicom',
			};
		}

		if (this.check([0x4C, 0x00, 0x00, 0x00, 0x01, 0x14, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0xC0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x46])) {
			return {
				ext: 'lnk',
				mime: 'application/x.ms.shortcut', // Invented by us
			};
		}

		if (this.check([0x62, 0x6F, 0x6F, 0x6B, 0x00, 0x00, 0x00, 0x00, 0x6D, 0x61, 0x72, 0x6B, 0x00, 0x00, 0x00, 0x00])) {
			return {
				ext: 'alias',
				mime: 'application/x.apple.alias', // Invented by us
			};
		}

		if (this.checkString('Kaydara FBX Binary  \u0000')) {
			return {
				ext: 'fbx',
				mime: 'application/x.autodesk.fbx', // Invented by us
			};
		}

		if (
			this.check([0x4C, 0x50], {offset: 34})
			&& (
				this.check([0x00, 0x00, 0x01], {offset: 8})
				|| this.check([0x01, 0x00, 0x02], {offset: 8})
				|| this.check([0x02, 0x00, 0x02], {offset: 8})
			)
		) {
			return {
				ext: 'eot',
				mime: 'application/vnd.ms-fontobject',
			};
		}

		if (this.check([0x06, 0x06, 0xED, 0xF5, 0xD8, 0x1D, 0x46, 0xE5, 0xBD, 0x31, 0xEF, 0xE7, 0xFE, 0x74, 0xB7, 0x1D])) {
			return {
				ext: 'indd',
				mime: 'application/x-indesign',
			};
		}

		// Increase sample size from 256 to 512
		await tokenizer.peekBuffer(this.buffer, {length: Math.min(512, tokenizer.fileInfo.size), mayBeLess: true});

		// Requires a buffer size of 512 bytes
		if (tarHeaderChecksumMatches(this.buffer)) {
			return {
				ext: 'tar',
				mime: 'application/x-tar',
			};
		}

		if (this.check([0xFF, 0xFE])) { // UTF-16-BOM-BE
			if (this.check([60, 0, 63, 0, 120, 0, 109, 0, 108, 0], {offset: 2})) {
				return {
					ext: 'xml',
					mime: 'application/xml',
				};
			}

			if (this.check([0xFF, 0x0E, 0x53, 0x00, 0x6B, 0x00, 0x65, 0x00, 0x74, 0x00, 0x63, 0x00, 0x68, 0x00, 0x55, 0x00, 0x70, 0x00, 0x20, 0x00, 0x4D, 0x00, 0x6F, 0x00, 0x64, 0x00, 0x65, 0x00, 0x6C, 0x00], {offset: 2})) {
				return {
					ext: 'skp',
					mime: 'application/vnd.sketchup.skp',
				};
			}

			return undefined; // Some text based format
		}

		if (this.checkString('-----BEGIN PGP MESSAGE-----')) {
			return {
				ext: 'pgp',
				mime: 'application/pgp-encrypted',
			};
		}
	};
	// Detections with limited supporting data, resulting in a higher likelihood of false positives
	detectImprecise = async tokenizer => {
		this.buffer = new Uint8Array(reasonableDetectionSizeInBytes);

		// Read initial sample size of 8 bytes
		await tokenizer.peekBuffer(this.buffer, {length: Math.min(8, tokenizer.fileInfo.size), mayBeLess: true});

		if (
			this.check([0x0, 0x0, 0x1, 0xBA])
			|| this.check([0x0, 0x0, 0x1, 0xB3])
		) {
			return {
				ext: 'mpg',
				mime: 'video/mpeg',
			};
		}

		if (this.check([0x00, 0x01, 0x00, 0x00, 0x00])) {
			return {
				ext: 'ttf',
				mime: 'font/ttf',
			};
		}

		if (this.check([0x00, 0x00, 0x01, 0x00])) {
			return {
				ext: 'ico',
				mime: 'image/x-icon',
			};
		}

		if (this.check([0x00, 0x00, 0x02, 0x00])) {
			return {
				ext: 'cur',
				mime: 'image/x-icon',
			};
		}

		// Check MPEG 1 or 2 Layer 3 header, or 'layer 0' for ADTS (MPEG sync-word 0xFFE)
		if (this.buffer.length >= 2 && this.check([0xFF, 0xE0], {offset: 0, mask: [0xFF, 0xE0]})) {
			if (this.check([0x10], {offset: 1, mask: [0x16]})) {
				// Check for (ADTS) MPEG-2
				if (this.check([0x08], {offset: 1, mask: [0x08]})) {
					return {
						ext: 'aac',
						mime: 'audio/aac',
					};
				}

				// Must be (ADTS) MPEG-4
				return {
					ext: 'aac',
					mime: 'audio/aac',
				};
			}

			// MPEG 1 or 2 Layer 3 header
			// Check for MPEG layer 3
			if (this.check([0x02], {offset: 1, mask: [0x06]})) {
				return {
					ext: 'mp3',
					mime: 'audio/mpeg',
				};
			}

			// Check for MPEG layer 2
			if (this.check([0x04], {offset: 1, mask: [0x06]})) {
				return {
					ext: 'mp2',
					mime: 'audio/mpeg',
				};
			}

			// Check for MPEG layer 1
			if (this.check([0x06], {offset: 1, mask: [0x06]})) {
				return {
					ext: 'mp1',
					mime: 'audio/mpeg',
				};
			}
		}
	};

	async readTiffTag(bigEndian) {
		const tagId = await this.tokenizer.readToken(bigEndian ? UINT16_BE : UINT16_LE);
		this.tokenizer.ignore(10);
		switch (tagId) {
			case 50_341:
				return {
					ext: 'arw',
					mime: 'image/x-sony-arw',
				};
			case 50_706:
				return {
					ext: 'dng',
					mime: 'image/x-adobe-dng',
				};
		}
	}

	async readTiffIFD(bigEndian) {
		const numberOfTags = await this.tokenizer.readToken(bigEndian ? UINT16_BE : UINT16_LE);
		for (let n = 0; n < numberOfTags; ++n) {
			const fileType = await this.readTiffTag(bigEndian);
			if (fileType) {
				return fileType;
			}
		}
	}

	async readTiffHeader(bigEndian) {
		const version = (bigEndian ? UINT16_BE : UINT16_LE).get(this.buffer, 2);
		const ifdOffset = (bigEndian ? UINT32_BE : UINT32_LE).get(this.buffer, 4);

		if (version === 42) {
			// TIFF file header
			if (ifdOffset >= 6) {
				if (this.checkString('CR', {offset: 8})) {
					return {
						ext: 'cr2',
						mime: 'image/x-canon-cr2',
					};
				}

				if (ifdOffset >= 8) {
					const someId1 = (bigEndian ? UINT16_BE : UINT16_LE).get(this.buffer, 8);
					const someId2 = (bigEndian ? UINT16_BE : UINT16_LE).get(this.buffer, 10);

					if (
						(someId1 === 0x1C && someId2 === 0xFE)
						|| (someId1 === 0x1F && someId2 === 0x0B)) {
						return {
							ext: 'nef',
							mime: 'image/x-nikon-nef',
						};
					}
				}
			}

			await this.tokenizer.ignore(ifdOffset);
			const fileType = await this.readTiffIFD(bigEndian);
			return fileType ?? {
				ext: 'tif',
				mime: 'image/tiff',
			};
		}

		if (version === 43) {	// Big TIFF file header
			return {
				ext: 'tif',
				mime: 'image/tiff',
			};
		}
	}
};

new Set(extensions);
new Set(mimeTypes);

/**
Node.js specific entry point.
*/


class FileTypeParser extends FileTypeParser$1 {
	async fromStream(stream) {
		const tokenizer = await (stream instanceof ReadableStream ? fromWebStream(stream, this.tokenizerOptions) : fromStream(stream, this.tokenizerOptions));
		try {
			return await super.fromTokenizer(tokenizer);
		} finally {
			await tokenizer.close();
		}
	}

	async fromFile(path) {
		const tokenizer = await fromFile(path);
		try {
			return await super.fromTokenizer(tokenizer);
		} finally {
			await tokenizer.close();
		}
	}

	async toDetectionStream(readableStream, options = {}) {
		if (!(readableStream instanceof Readable)) {
			return super.toDetectionStream(readableStream, options);
		}

		const {sampleSize = reasonableDetectionSizeInBytes} = options;

		return new Promise((resolve, reject) => {
			readableStream.on('error', reject);

			readableStream.once('readable', () => {
				(async () => {
					try {
						// Set up output stream
						const pass = new PassThrough();
						const outputStream = pipeline ? pipeline(readableStream, pass, () => {}) : readableStream.pipe(pass);

						// Read the input stream and detect the filetype
						const chunk = readableStream.read(sampleSize) ?? readableStream.read() ?? new Uint8Array(0);
						try {
							pass.fileType = await this.fromBuffer(chunk);
						} catch (error) {
							if (error instanceof EndOfStreamError) {
								pass.fileType = undefined;
							} else {
								reject(error);
							}
						}

						resolve(outputStream);
					} catch (error) {
						reject(error);
					}
				})();
			});
		});
	}
}

async function fileTypeFromFile(path, fileTypeOptions) {
	return (new FileTypeParser(fileTypeOptions)).fromFile(path, fileTypeOptions);
}

var dist = {exports: {}};

var queue = {exports: {}};

var hasRequiredQueue;

function requireQueue () {
	if (hasRequiredQueue) return queue.exports;
	hasRequiredQueue = 1;
	var inherits = requireInherits_browser();
	var EventEmitter = require$$0.EventEmitter;

	queue.exports = Queue;
	queue.exports.default = Queue;

	function Queue (options) {
	  if (!(this instanceof Queue)) {
	    return new Queue(options)
	  }

	  EventEmitter.call(this);
	  options = options || {};
	  this.concurrency = options.concurrency || Infinity;
	  this.timeout = options.timeout || 0;
	  this.autostart = options.autostart || false;
	  this.results = options.results || null;
	  this.pending = 0;
	  this.session = 0;
	  this.running = false;
	  this.jobs = [];
	  this.timers = {};
	}
	inherits(Queue, EventEmitter);

	var arrayMethods = [
	  'pop',
	  'shift',
	  'indexOf',
	  'lastIndexOf'
	];

	arrayMethods.forEach(function (method) {
	  Queue.prototype[method] = function () {
	    return Array.prototype[method].apply(this.jobs, arguments)
	  };
	});

	Queue.prototype.slice = function (begin, end) {
	  this.jobs = this.jobs.slice(begin, end);
	  return this
	};

	Queue.prototype.reverse = function () {
	  this.jobs.reverse();
	  return this
	};

	var arrayAddMethods = [
	  'push',
	  'unshift',
	  'splice'
	];

	arrayAddMethods.forEach(function (method) {
	  Queue.prototype[method] = function () {
	    var methodResult = Array.prototype[method].apply(this.jobs, arguments);
	    if (this.autostart) {
	      this.start();
	    }
	    return methodResult
	  };
	});

	Object.defineProperty(Queue.prototype, 'length', {
	  get: function () {
	    return this.pending + this.jobs.length
	  }
	});

	Queue.prototype.start = function (cb) {
	  if (cb) {
	    callOnErrorOrEnd.call(this, cb);
	  }

	  this.running = true;

	  if (this.pending >= this.concurrency) {
	    return
	  }

	  if (this.jobs.length === 0) {
	    if (this.pending === 0) {
	      done.call(this);
	    }
	    return
	  }

	  var self = this;
	  var job = this.jobs.shift();
	  var once = true;
	  var session = this.session;
	  var timeoutId = null;
	  var didTimeout = false;
	  var resultIndex = null;
	  var timeout = job.hasOwnProperty('timeout') ? job.timeout : this.timeout;

	  function next (err, result) {
	    if (once && self.session === session) {
	      once = false;
	      self.pending--;
	      if (timeoutId !== null) {
	        delete self.timers[timeoutId];
	        clearTimeout(timeoutId);
	      }

	      if (err) {
	        self.emit('error', err, job);
	      } else if (didTimeout === false) {
	        if (resultIndex !== null) {
	          self.results[resultIndex] = Array.prototype.slice.call(arguments, 1);
	        }
	        self.emit('success', result, job);
	      }

	      if (self.session === session) {
	        if (self.pending === 0 && self.jobs.length === 0) {
	          done.call(self);
	        } else if (self.running) {
	          self.start();
	        }
	      }
	    }
	  }

	  if (timeout) {
	    timeoutId = setTimeout(function () {
	      didTimeout = true;
	      if (self.listeners('timeout').length > 0) {
	        self.emit('timeout', next, job);
	      } else {
	        next();
	      }
	    }, timeout);
	    this.timers[timeoutId] = timeoutId;
	  }

	  if (this.results) {
	    resultIndex = this.results.length;
	    this.results[resultIndex] = null;
	  }

	  this.pending++;
	  self.emit('start', job);
	  var promise = job(next);
	  if (promise && promise.then && typeof promise.then === 'function') {
	    promise.then(function (result) {
	      return next(null, result)
	    }).catch(function (err) {
	      return next(err || true)
	    });
	  }

	  if (this.running && this.jobs.length > 0) {
	    this.start();
	  }
	};

	Queue.prototype.stop = function () {
	  this.running = false;
	};

	Queue.prototype.end = function (err) {
	  clearTimers.call(this);
	  this.jobs.length = 0;
	  this.pending = 0;
	  done.call(this, err);
	};

	function clearTimers () {
	  for (var key in this.timers) {
	    var timeoutId = this.timers[key];
	    delete this.timers[key];
	    clearTimeout(timeoutId);
	  }
	}

	function callOnErrorOrEnd (cb) {
	  var self = this;
	  this.on('error', onerror);
	  this.on('end', onend);

	  function onerror (err) { self.end(err); }
	  function onend (err) {
	    self.removeListener('error', onerror);
	    self.removeListener('end', onend);
	    cb(err, this.results);
	  }
	}

	function done (err) {
	  this.session++;
	  this.running = false;
	  this.emit('end', err);
	}
	return queue.exports;
}

var types = {};

var bmp = {};

var utils = {};

var hasRequiredUtils;

function requireUtils () {
	if (hasRequiredUtils) return utils;
	hasRequiredUtils = 1;
	(function (exports) {
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.findBox = exports.readUInt = exports.readUInt32LE = exports.readUInt32BE = exports.readInt32LE = exports.readUInt24LE = exports.readUInt16LE = exports.readUInt16BE = exports.readInt16LE = exports.toHexString = exports.toUTF8String = void 0;
		const decoder = new TextDecoder();
		const toUTF8String = (input, start = 0, end = input.length) => decoder.decode(input.slice(start, end));
		exports.toUTF8String = toUTF8String;
		const toHexString = (input, start = 0, end = input.length) => input
		    .slice(start, end)
		    .reduce((memo, i) => memo + ('0' + i.toString(16)).slice(-2), '');
		exports.toHexString = toHexString;
		const readInt16LE = (input, offset = 0) => {
		    const val = input[offset] + input[offset + 1] * 2 ** 8;
		    return val | ((val & (2 ** 15)) * 0x1fffe);
		};
		exports.readInt16LE = readInt16LE;
		const readUInt16BE = (input, offset = 0) => input[offset] * 2 ** 8 + input[offset + 1];
		exports.readUInt16BE = readUInt16BE;
		const readUInt16LE = (input, offset = 0) => input[offset] + input[offset + 1] * 2 ** 8;
		exports.readUInt16LE = readUInt16LE;
		const readUInt24LE = (input, offset = 0) => input[offset] + input[offset + 1] * 2 ** 8 + input[offset + 2] * 2 ** 16;
		exports.readUInt24LE = readUInt24LE;
		const readInt32LE = (input, offset = 0) => input[offset] +
		    input[offset + 1] * 2 ** 8 +
		    input[offset + 2] * 2 ** 16 +
		    (input[offset + 3] << 24);
		exports.readInt32LE = readInt32LE;
		const readUInt32BE = (input, offset = 0) => input[offset] * 2 ** 24 +
		    input[offset + 1] * 2 ** 16 +
		    input[offset + 2] * 2 ** 8 +
		    input[offset + 3];
		exports.readUInt32BE = readUInt32BE;
		const readUInt32LE = (input, offset = 0) => input[offset] +
		    input[offset + 1] * 2 ** 8 +
		    input[offset + 2] * 2 ** 16 +
		    input[offset + 3] * 2 ** 24;
		exports.readUInt32LE = readUInt32LE;
		// Abstract reading multi-byte unsigned integers
		const methods = {
		    readUInt16BE: exports.readUInt16BE,
		    readUInt16LE: exports.readUInt16LE,
		    readUInt32BE: exports.readUInt32BE,
		    readUInt32LE: exports.readUInt32LE,
		};
		function readUInt(input, bits, offset, isBigEndian) {
		    offset = offset || 0;
		    const endian = isBigEndian ? 'BE' : 'LE';
		    const methodName = ('readUInt' + bits + endian);
		    return methods[methodName](input, offset);
		}
		exports.readUInt = readUInt;
		function readBox(input, offset) {
		    if (input.length - offset < 4)
		        return;
		    const boxSize = (0, exports.readUInt32BE)(input, offset);
		    if (input.length - offset < boxSize)
		        return;
		    return {
		        name: (0, exports.toUTF8String)(input, 4 + offset, 8 + offset),
		        offset,
		        size: boxSize,
		    };
		}
		function findBox(input, boxName, offset) {
		    while (offset < input.length) {
		        const box = readBox(input, offset);
		        if (!box)
		            break;
		        if (box.name === boxName)
		            return box;
		        offset += box.size;
		    }
		}
		exports.findBox = findBox; 
	} (utils));
	return utils;
}

var hasRequiredBmp;

function requireBmp () {
	if (hasRequiredBmp) return bmp;
	hasRequiredBmp = 1;
	Object.defineProperty(bmp, "__esModule", { value: true });
	bmp.BMP = void 0;
	const utils_1 = requireUtils();
	bmp.BMP = {
	    validate: (input) => (0, utils_1.toUTF8String)(input, 0, 2) === 'BM',
	    calculate: (input) => ({
	        height: Math.abs((0, utils_1.readInt32LE)(input, 22)),
	        width: (0, utils_1.readUInt32LE)(input, 18),
	    }),
	};
	return bmp;
}

var cur = {};

var ico = {};

var hasRequiredIco;

function requireIco () {
	if (hasRequiredIco) return ico;
	hasRequiredIco = 1;
	Object.defineProperty(ico, "__esModule", { value: true });
	ico.ICO = void 0;
	const utils_1 = requireUtils();
	const TYPE_ICON = 1;
	/**
	 * ICON Header
	 *
	 * | Offset | Size | Purpose |
	 * | 0	    | 2    | Reserved. Must always be 0.  |
	 * | 2      | 2    | Image type: 1 for icon (.ICO) image, 2 for cursor (.CUR) image. Other values are invalid. |
	 * | 4      | 2    | Number of images in the file. |
	 *
	 */
	const SIZE_HEADER = 2 + 2 + 2; // 6
	/**
	 * Image Entry
	 *
	 * | Offset | Size | Purpose |
	 * | 0	    | 1    | Image width in pixels. Can be any number between 0 and 255. Value 0 means width is 256 pixels. |
	 * | 1      | 1    | Image height in pixels. Can be any number between 0 and 255. Value 0 means height is 256 pixels. |
	 * | 2      | 1    | Number of colors in the color palette. Should be 0 if the image does not use a color palette. |
	 * | 3      | 1    | Reserved. Should be 0. |
	 * | 4      | 2    | ICO format: Color planes. Should be 0 or 1. |
	 * |        |      | CUR format: The horizontal coordinates of the hotspot in number of pixels from the left. |
	 * | 6      | 2    | ICO format: Bits per pixel. |
	 * |        |      | CUR format: The vertical coordinates of the hotspot in number of pixels from the top. |
	 * | 8      | 4    | The size of the image's data in bytes |
	 * | 12     | 4    | The offset of BMP or PNG data from the beginning of the ICO/CUR file |
	 *
	 */
	const SIZE_IMAGE_ENTRY = 1 + 1 + 1 + 1 + 2 + 2 + 4 + 4; // 16
	function getSizeFromOffset(input, offset) {
	    const value = input[offset];
	    return value === 0 ? 256 : value;
	}
	function getImageSize(input, imageIndex) {
	    const offset = SIZE_HEADER + imageIndex * SIZE_IMAGE_ENTRY;
	    return {
	        height: getSizeFromOffset(input, offset + 1),
	        width: getSizeFromOffset(input, offset),
	    };
	}
	ico.ICO = {
	    validate(input) {
	        const reserved = (0, utils_1.readUInt16LE)(input, 0);
	        const imageCount = (0, utils_1.readUInt16LE)(input, 4);
	        if (reserved !== 0 || imageCount === 0)
	            return false;
	        const imageType = (0, utils_1.readUInt16LE)(input, 2);
	        return imageType === TYPE_ICON;
	    },
	    calculate(input) {
	        const nbImages = (0, utils_1.readUInt16LE)(input, 4);
	        const imageSize = getImageSize(input, 0);
	        if (nbImages === 1)
	            return imageSize;
	        const imgs = [imageSize];
	        for (let imageIndex = 1; imageIndex < nbImages; imageIndex += 1) {
	            imgs.push(getImageSize(input, imageIndex));
	        }
	        return {
	            height: imageSize.height,
	            images: imgs,
	            width: imageSize.width,
	        };
	    },
	};
	return ico;
}

var hasRequiredCur;

function requireCur () {
	if (hasRequiredCur) return cur;
	hasRequiredCur = 1;
	Object.defineProperty(cur, "__esModule", { value: true });
	cur.CUR = void 0;
	const ico_1 = requireIco();
	const utils_1 = requireUtils();
	const TYPE_CURSOR = 2;
	cur.CUR = {
	    validate(input) {
	        const reserved = (0, utils_1.readUInt16LE)(input, 0);
	        const imageCount = (0, utils_1.readUInt16LE)(input, 4);
	        if (reserved !== 0 || imageCount === 0)
	            return false;
	        const imageType = (0, utils_1.readUInt16LE)(input, 2);
	        return imageType === TYPE_CURSOR;
	    },
	    calculate: (input) => ico_1.ICO.calculate(input),
	};
	return cur;
}

var dds = {};

var hasRequiredDds;

function requireDds () {
	if (hasRequiredDds) return dds;
	hasRequiredDds = 1;
	Object.defineProperty(dds, "__esModule", { value: true });
	dds.DDS = void 0;
	const utils_1 = requireUtils();
	dds.DDS = {
	    validate: (input) => (0, utils_1.readUInt32LE)(input, 0) === 0x20534444,
	    calculate: (input) => ({
	        height: (0, utils_1.readUInt32LE)(input, 12),
	        width: (0, utils_1.readUInt32LE)(input, 16),
	    }),
	};
	return dds;
}

var gif = {};

var hasRequiredGif;

function requireGif () {
	if (hasRequiredGif) return gif;
	hasRequiredGif = 1;
	Object.defineProperty(gif, "__esModule", { value: true });
	gif.GIF = void 0;
	const utils_1 = requireUtils();
	const gifRegexp = /^GIF8[79]a/;
	gif.GIF = {
	    validate: (input) => gifRegexp.test((0, utils_1.toUTF8String)(input, 0, 6)),
	    calculate: (input) => ({
	        height: (0, utils_1.readUInt16LE)(input, 8),
	        width: (0, utils_1.readUInt16LE)(input, 6),
	    }),
	};
	return gif;
}

var heif = {};

var hasRequiredHeif;

function requireHeif () {
	if (hasRequiredHeif) return heif;
	hasRequiredHeif = 1;
	Object.defineProperty(heif, "__esModule", { value: true });
	heif.HEIF = void 0;
	const utils_1 = requireUtils();
	const brandMap = {
	    avif: 'avif',
	    mif1: 'heif',
	    msf1: 'heif', // heif-sequence
	    heic: 'heic',
	    heix: 'heic',
	    hevc: 'heic', // heic-sequence
	    hevx: 'heic', // heic-sequence
	};
	heif.HEIF = {
	    validate(input) {
	        const boxType = (0, utils_1.toUTF8String)(input, 4, 8);
	        if (boxType !== 'ftyp')
	            return false;
	        const ftypBox = (0, utils_1.findBox)(input, 'ftyp', 0);
	        if (!ftypBox)
	            return false;
	        const brand = (0, utils_1.toUTF8String)(input, ftypBox.offset + 8, ftypBox.offset + 12);
	        return brand in brandMap;
	    },
	    calculate(input) {
	        // Based on https://nokiatech.github.io/heif/technical.html
	        const metaBox = (0, utils_1.findBox)(input, 'meta', 0);
	        const iprpBox = metaBox && (0, utils_1.findBox)(input, 'iprp', metaBox.offset + 12);
	        const ipcoBox = iprpBox && (0, utils_1.findBox)(input, 'ipco', iprpBox.offset + 8);
	        const ispeBox = ipcoBox && (0, utils_1.findBox)(input, 'ispe', ipcoBox.offset + 8);
	        if (ispeBox) {
	            return {
	                height: (0, utils_1.readUInt32BE)(input, ispeBox.offset + 16),
	                width: (0, utils_1.readUInt32BE)(input, ispeBox.offset + 12),
	                type: (0, utils_1.toUTF8String)(input, 8, 12),
	            };
	        }
	        throw new TypeError('Invalid HEIF, no size found');
	    },
	};
	return heif;
}

var icns = {};

var hasRequiredIcns;

function requireIcns () {
	if (hasRequiredIcns) return icns;
	hasRequiredIcns = 1;
	Object.defineProperty(icns, "__esModule", { value: true });
	icns.ICNS = void 0;
	const utils_1 = requireUtils();
	/**
	 * ICNS Header
	 *
	 * | Offset | Size | Purpose                                                |
	 * | 0	    | 4    | Magic literal, must be "icns" (0x69, 0x63, 0x6e, 0x73) |
	 * | 4      | 4    | Length of file, in bytes, msb first.                   |
	 *
	 */
	const SIZE_HEADER = 4 + 4; // 8
	const FILE_LENGTH_OFFSET = 4; // MSB => BIG ENDIAN
	/**
	 * Image Entry
	 *
	 * | Offset | Size | Purpose                                                          |
	 * | 0	    | 4    | Icon type, see OSType below.                                     |
	 * | 4      | 4    | Length of data, in bytes (including type and length), msb first. |
	 * | 8      | n    | Icon data                                                        |
	 */
	const ENTRY_LENGTH_OFFSET = 4; // MSB => BIG ENDIAN
	const ICON_TYPE_SIZE = {
	    ICON: 32,
	    'ICN#': 32,
	    // m => 16 x 16
	    'icm#': 16,
	    icm4: 16,
	    icm8: 16,
	    // s => 16 x 16
	    'ics#': 16,
	    ics4: 16,
	    ics8: 16,
	    is32: 16,
	    s8mk: 16,
	    icp4: 16,
	    // l => 32 x 32
	    icl4: 32,
	    icl8: 32,
	    il32: 32,
	    l8mk: 32,
	    icp5: 32,
	    ic11: 32,
	    // h => 48 x 48
	    ich4: 48,
	    ich8: 48,
	    ih32: 48,
	    h8mk: 48,
	    // . => 64 x 64
	    icp6: 64,
	    ic12: 32,
	    // t => 128 x 128
	    it32: 128,
	    t8mk: 128,
	    ic07: 128,
	    // . => 256 x 256
	    ic08: 256,
	    ic13: 256,
	    // . => 512 x 512
	    ic09: 512,
	    ic14: 512,
	    // . => 1024 x 1024
	    ic10: 1024,
	};
	function readImageHeader(input, imageOffset) {
	    const imageLengthOffset = imageOffset + ENTRY_LENGTH_OFFSET;
	    return [
	        (0, utils_1.toUTF8String)(input, imageOffset, imageLengthOffset),
	        (0, utils_1.readUInt32BE)(input, imageLengthOffset),
	    ];
	}
	function getImageSize(type) {
	    const size = ICON_TYPE_SIZE[type];
	    return { width: size, height: size, type };
	}
	icns.ICNS = {
	    validate: (input) => (0, utils_1.toUTF8String)(input, 0, 4) === 'icns',
	    calculate(input) {
	        const inputLength = input.length;
	        const fileLength = (0, utils_1.readUInt32BE)(input, FILE_LENGTH_OFFSET);
	        let imageOffset = SIZE_HEADER;
	        let imageHeader = readImageHeader(input, imageOffset);
	        let imageSize = getImageSize(imageHeader[0]);
	        imageOffset += imageHeader[1];
	        if (imageOffset === fileLength)
	            return imageSize;
	        const result = {
	            height: imageSize.height,
	            images: [imageSize],
	            width: imageSize.width,
	        };
	        while (imageOffset < fileLength && imageOffset < inputLength) {
	            imageHeader = readImageHeader(input, imageOffset);
	            imageSize = getImageSize(imageHeader[0]);
	            imageOffset += imageHeader[1];
	            result.images.push(imageSize);
	        }
	        return result;
	    },
	};
	return icns;
}

var j2c = {};

var hasRequiredJ2c;

function requireJ2c () {
	if (hasRequiredJ2c) return j2c;
	hasRequiredJ2c = 1;
	Object.defineProperty(j2c, "__esModule", { value: true });
	j2c.J2C = void 0;
	const utils_1 = requireUtils();
	j2c.J2C = {
	    // TODO: this doesn't seem right. SIZ marker doesn't have to be right after the SOC
	    validate: (input) => (0, utils_1.readUInt32BE)(input, 0) === 0xff4fff51,
	    calculate: (input) => ({
	        height: (0, utils_1.readUInt32BE)(input, 12),
	        width: (0, utils_1.readUInt32BE)(input, 8),
	    }),
	};
	return j2c;
}

var jp2 = {};

var hasRequiredJp2;

function requireJp2 () {
	if (hasRequiredJp2) return jp2;
	hasRequiredJp2 = 1;
	Object.defineProperty(jp2, "__esModule", { value: true });
	jp2.JP2 = void 0;
	const utils_1 = requireUtils();
	jp2.JP2 = {
	    validate(input) {
	        const boxType = (0, utils_1.toUTF8String)(input, 4, 8);
	        if (boxType !== 'jP  ')
	            return false;
	        const ftypBox = (0, utils_1.findBox)(input, 'ftyp', 0);
	        if (!ftypBox)
	            return false;
	        const brand = (0, utils_1.toUTF8String)(input, ftypBox.offset + 8, ftypBox.offset + 12);
	        return brand === 'jp2 ';
	    },
	    calculate(input) {
	        const jp2hBox = (0, utils_1.findBox)(input, 'jp2h', 0);
	        const ihdrBox = jp2hBox && (0, utils_1.findBox)(input, 'ihdr', jp2hBox.offset + 8);
	        if (ihdrBox) {
	            return {
	                height: (0, utils_1.readUInt32BE)(input, ihdrBox.offset + 8),
	                width: (0, utils_1.readUInt32BE)(input, ihdrBox.offset + 12),
	            };
	        }
	        throw new TypeError('Unsupported JPEG 2000 format');
	    },
	};
	return jp2;
}

var jpg = {};

var hasRequiredJpg;

function requireJpg () {
	if (hasRequiredJpg) return jpg;
	hasRequiredJpg = 1;
	// NOTE: we only support baseline and progressive JPGs here
	// due to the structure of the loader class, we only get a buffer
	// with a maximum size of 4096 bytes. so if the SOF marker is outside
	// if this range we can't detect the file size correctly.
	Object.defineProperty(jpg, "__esModule", { value: true });
	jpg.JPG = void 0;
	const utils_1 = requireUtils();
	const EXIF_MARKER = '45786966';
	const APP1_DATA_SIZE_BYTES = 2;
	const EXIF_HEADER_BYTES = 6;
	const TIFF_BYTE_ALIGN_BYTES = 2;
	const BIG_ENDIAN_BYTE_ALIGN = '4d4d';
	const LITTLE_ENDIAN_BYTE_ALIGN = '4949';
	// Each entry is exactly 12 bytes
	const IDF_ENTRY_BYTES = 12;
	const NUM_DIRECTORY_ENTRIES_BYTES = 2;
	function isEXIF(input) {
	    return (0, utils_1.toHexString)(input, 2, 6) === EXIF_MARKER;
	}
	function extractSize(input, index) {
	    return {
	        height: (0, utils_1.readUInt16BE)(input, index),
	        width: (0, utils_1.readUInt16BE)(input, index + 2),
	    };
	}
	function extractOrientation(exifBlock, isBigEndian) {
	    // TODO: assert that this contains 0x002A
	    // let STATIC_MOTOROLA_TIFF_HEADER_BYTES = 2
	    // let TIFF_IMAGE_FILE_DIRECTORY_BYTES = 4
	    // TODO: derive from TIFF_IMAGE_FILE_DIRECTORY_BYTES
	    const idfOffset = 8;
	    // IDF osset works from right after the header bytes
	    // (so the offset includes the tiff byte align)
	    const offset = EXIF_HEADER_BYTES + idfOffset;
	    const idfDirectoryEntries = (0, utils_1.readUInt)(exifBlock, 16, offset, isBigEndian);
	    for (let directoryEntryNumber = 0; directoryEntryNumber < idfDirectoryEntries; directoryEntryNumber++) {
	        const start = offset +
	            NUM_DIRECTORY_ENTRIES_BYTES +
	            directoryEntryNumber * IDF_ENTRY_BYTES;
	        const end = start + IDF_ENTRY_BYTES;
	        // Skip on corrupt EXIF blocks
	        if (start > exifBlock.length) {
	            return;
	        }
	        const block = exifBlock.slice(start, end);
	        const tagNumber = (0, utils_1.readUInt)(block, 16, 0, isBigEndian);
	        // 0x0112 (decimal: 274) is the `orientation` tag ID
	        if (tagNumber === 274) {
	            const dataFormat = (0, utils_1.readUInt)(block, 16, 2, isBigEndian);
	            if (dataFormat !== 3) {
	                return;
	            }
	            // unsinged int has 2 bytes per component
	            // if there would more than 4 bytes in total it's a pointer
	            const numberOfComponents = (0, utils_1.readUInt)(block, 32, 4, isBigEndian);
	            if (numberOfComponents !== 1) {
	                return;
	            }
	            return (0, utils_1.readUInt)(block, 16, 8, isBigEndian);
	        }
	    }
	}
	function validateExifBlock(input, index) {
	    // Skip APP1 Data Size
	    const exifBlock = input.slice(APP1_DATA_SIZE_BYTES, index);
	    // Consider byte alignment
	    const byteAlign = (0, utils_1.toHexString)(exifBlock, EXIF_HEADER_BYTES, EXIF_HEADER_BYTES + TIFF_BYTE_ALIGN_BYTES);
	    // Ignore Empty EXIF. Validate byte alignment
	    const isBigEndian = byteAlign === BIG_ENDIAN_BYTE_ALIGN;
	    const isLittleEndian = byteAlign === LITTLE_ENDIAN_BYTE_ALIGN;
	    if (isBigEndian || isLittleEndian) {
	        return extractOrientation(exifBlock, isBigEndian);
	    }
	}
	function validateInput(input, index) {
	    // index should be within buffer limits
	    if (index > input.length) {
	        throw new TypeError('Corrupt JPG, exceeded buffer limits');
	    }
	}
	jpg.JPG = {
	    validate: (input) => (0, utils_1.toHexString)(input, 0, 2) === 'ffd8',
	    calculate(input) {
	        // Skip 4 chars, they are for signature
	        input = input.slice(4);
	        let orientation;
	        let next;
	        while (input.length) {
	            // read length of the next block
	            const i = (0, utils_1.readUInt16BE)(input, 0);
	            // Every JPEG block must begin with a 0xFF
	            if (input[i] !== 0xff) {
	                input = input.slice(1);
	                continue;
	            }
	            if (isEXIF(input)) {
	                orientation = validateExifBlock(input, i);
	            }
	            // ensure correct format
	            validateInput(input, i);
	            // 0xFFC0 is baseline standard(SOF)
	            // 0xFFC1 is baseline optimized(SOF)
	            // 0xFFC2 is progressive(SOF2)
	            next = input[i + 1];
	            if (next === 0xc0 || next === 0xc1 || next === 0xc2) {
	                const size = extractSize(input, i + 5);
	                // TODO: is orientation=0 a valid answer here?
	                if (!orientation) {
	                    return size;
	                }
	                return {
	                    height: size.height,
	                    orientation,
	                    width: size.width,
	                };
	            }
	            // move to the next block
	            input = input.slice(i + 2);
	        }
	        throw new TypeError('Invalid JPG, no size found');
	    },
	};
	return jpg;
}

var jxl = {};

var jxlStream = {};

var bitReader = {};

var hasRequiredBitReader;

function requireBitReader () {
	if (hasRequiredBitReader) return bitReader;
	hasRequiredBitReader = 1;
	Object.defineProperty(bitReader, "__esModule", { value: true });
	bitReader.BitReader = void 0;
	/** This class helps read Uint8Array bit-by-bit */
	class BitReader {
	    constructor(input, endianness) {
	        this.input = input;
	        this.endianness = endianness;
	        // Skip the first 16 bits (2 bytes) of signature
	        this.byteOffset = 2;
	        this.bitOffset = 0;
	    }
	    /** Reads a specified number of bits, and move the offset */
	    getBits(length = 1) {
	        let result = 0;
	        let bitsRead = 0;
	        while (bitsRead < length) {
	            if (this.byteOffset >= this.input.length) {
	                throw new Error('Reached end of input');
	            }
	            const currentByte = this.input[this.byteOffset];
	            const bitsLeft = 8 - this.bitOffset;
	            const bitsToRead = Math.min(length - bitsRead, bitsLeft);
	            if (this.endianness === 'little-endian') {
	                const mask = (1 << bitsToRead) - 1;
	                const bits = (currentByte >> this.bitOffset) & mask;
	                result |= bits << bitsRead;
	            }
	            else {
	                const mask = ((1 << bitsToRead) - 1) << (8 - this.bitOffset - bitsToRead);
	                const bits = (currentByte & mask) >> (8 - this.bitOffset - bitsToRead);
	                result = (result << bitsToRead) | bits;
	            }
	            bitsRead += bitsToRead;
	            this.bitOffset += bitsToRead;
	            if (this.bitOffset === 8) {
	                this.byteOffset++;
	                this.bitOffset = 0;
	            }
	        }
	        return result;
	    }
	}
	bitReader.BitReader = BitReader;
	return bitReader;
}

var hasRequiredJxlStream;

function requireJxlStream () {
	if (hasRequiredJxlStream) return jxlStream;
	hasRequiredJxlStream = 1;
	Object.defineProperty(jxlStream, "__esModule", { value: true });
	jxlStream.JXLStream = void 0;
	const utils_1 = requireUtils();
	const bit_reader_1 = requireBitReader();
	function calculateImageDimension(reader, isSmallImage) {
	    if (isSmallImage) {
	        // Small images are multiples of 8 pixels, up to 256 pixels
	        return 8 * (1 + reader.getBits(5));
	    }
	    else {
	        // Larger images use a variable bit-length encoding
	        const sizeClass = reader.getBits(2);
	        const extraBits = [9, 13, 18, 30][sizeClass];
	        return 1 + reader.getBits(extraBits);
	    }
	}
	function calculateImageWidth(reader, isSmallImage, widthMode, height) {
	    if (isSmallImage && widthMode === 0) {
	        // Small square images
	        return 8 * (1 + reader.getBits(5));
	    }
	    else if (widthMode === 0) {
	        // Non-small images with explicitly coded width
	        return calculateImageDimension(reader, false);
	    }
	    else {
	        // Images with width derived from height and aspect ratio
	        const aspectRatios = [1, 1.2, 4 / 3, 1.5, 16 / 9, 5 / 4, 2];
	        return Math.floor(height * aspectRatios[widthMode - 1]);
	    }
	}
	jxlStream.JXLStream = {
	    validate: (input) => {
	        return (0, utils_1.toHexString)(input, 0, 2) === 'ff0a';
	    },
	    calculate(input) {
	        const reader = new bit_reader_1.BitReader(input, 'little-endian');
	        const isSmallImage = reader.getBits(1) === 1;
	        const height = calculateImageDimension(reader, isSmallImage);
	        const widthMode = reader.getBits(3);
	        const width = calculateImageWidth(reader, isSmallImage, widthMode, height);
	        return { width, height };
	    },
	};
	return jxlStream;
}

var hasRequiredJxl;

function requireJxl () {
	if (hasRequiredJxl) return jxl;
	hasRequiredJxl = 1;
	Object.defineProperty(jxl, "__esModule", { value: true });
	jxl.JXL = void 0;
	const utils_1 = requireUtils();
	const jxl_stream_1 = requireJxlStream();
	/** Extracts the codestream from a containerized JPEG XL image */
	function extractCodestream(input) {
	    const jxlcBox = (0, utils_1.findBox)(input, 'jxlc', 0);
	    if (jxlcBox) {
	        return input.slice(jxlcBox.offset + 8, jxlcBox.offset + jxlcBox.size);
	    }
	    const partialStreams = extractPartialStreams(input);
	    if (partialStreams.length > 0) {
	        return concatenateCodestreams(partialStreams);
	    }
	    return undefined;
	}
	/** Extracts partial codestreams from jxlp boxes */
	function extractPartialStreams(input) {
	    const partialStreams = [];
	    let offset = 0;
	    while (offset < input.length) {
	        const jxlpBox = (0, utils_1.findBox)(input, 'jxlp', offset);
	        if (!jxlpBox)
	            break;
	        partialStreams.push(input.slice(jxlpBox.offset + 12, jxlpBox.offset + jxlpBox.size));
	        offset = jxlpBox.offset + jxlpBox.size;
	    }
	    return partialStreams;
	}
	/** Concatenates partial codestreams into a single codestream */
	function concatenateCodestreams(partialCodestreams) {
	    const totalLength = partialCodestreams.reduce((acc, curr) => acc + curr.length, 0);
	    const codestream = new Uint8Array(totalLength);
	    let position = 0;
	    for (const partial of partialCodestreams) {
	        codestream.set(partial, position);
	        position += partial.length;
	    }
	    return codestream;
	}
	jxl.JXL = {
	    validate: (input) => {
	        const boxType = (0, utils_1.toUTF8String)(input, 4, 8);
	        if (boxType !== 'JXL ')
	            return false;
	        const ftypBox = (0, utils_1.findBox)(input, 'ftyp', 0);
	        if (!ftypBox)
	            return false;
	        const brand = (0, utils_1.toUTF8String)(input, ftypBox.offset + 8, ftypBox.offset + 12);
	        return brand === 'jxl ';
	    },
	    calculate(input) {
	        const codestream = extractCodestream(input);
	        if (codestream)
	            return jxl_stream_1.JXLStream.calculate(codestream);
	        throw new Error('No codestream found in JXL container');
	    },
	};
	return jxl;
}

var ktx = {};

var hasRequiredKtx;

function requireKtx () {
	if (hasRequiredKtx) return ktx;
	hasRequiredKtx = 1;
	Object.defineProperty(ktx, "__esModule", { value: true });
	ktx.KTX = void 0;
	const utils_1 = requireUtils();
	ktx.KTX = {
	    validate: (input) => {
	        const signature = (0, utils_1.toUTF8String)(input, 1, 7);
	        return ['KTX 11', 'KTX 20'].includes(signature);
	    },
	    calculate: (input) => {
	        const type = input[5] === 0x31 ? 'ktx' : 'ktx2';
	        const offset = type === 'ktx' ? 36 : 20;
	        return {
	            height: (0, utils_1.readUInt32LE)(input, offset + 4),
	            width: (0, utils_1.readUInt32LE)(input, offset),
	            type,
	        };
	    },
	};
	return ktx;
}

var png = {};

var hasRequiredPng;

function requirePng () {
	if (hasRequiredPng) return png;
	hasRequiredPng = 1;
	Object.defineProperty(png, "__esModule", { value: true });
	png.PNG = void 0;
	const utils_1 = requireUtils();
	const pngSignature = 'PNG\r\n\x1a\n';
	const pngImageHeaderChunkName = 'IHDR';
	// Used to detect "fried" png's: http://www.jongware.com/pngdefry.html
	const pngFriedChunkName = 'CgBI';
	png.PNG = {
	    validate(input) {
	        if (pngSignature === (0, utils_1.toUTF8String)(input, 1, 8)) {
	            let chunkName = (0, utils_1.toUTF8String)(input, 12, 16);
	            if (chunkName === pngFriedChunkName) {
	                chunkName = (0, utils_1.toUTF8String)(input, 28, 32);
	            }
	            if (chunkName !== pngImageHeaderChunkName) {
	                throw new TypeError('Invalid PNG');
	            }
	            return true;
	        }
	        return false;
	    },
	    calculate(input) {
	        if ((0, utils_1.toUTF8String)(input, 12, 16) === pngFriedChunkName) {
	            return {
	                height: (0, utils_1.readUInt32BE)(input, 36),
	                width: (0, utils_1.readUInt32BE)(input, 32),
	            };
	        }
	        return {
	            height: (0, utils_1.readUInt32BE)(input, 20),
	            width: (0, utils_1.readUInt32BE)(input, 16),
	        };
	    },
	};
	return png;
}

var pnm = {};

var hasRequiredPnm;

function requirePnm () {
	if (hasRequiredPnm) return pnm;
	hasRequiredPnm = 1;
	Object.defineProperty(pnm, "__esModule", { value: true });
	pnm.PNM = void 0;
	const utils_1 = requireUtils();
	const PNMTypes = {
	    P1: 'pbm/ascii',
	    P2: 'pgm/ascii',
	    P3: 'ppm/ascii',
	    P4: 'pbm',
	    P5: 'pgm',
	    P6: 'ppm',
	    P7: 'pam',
	    PF: 'pfm',
	};
	const handlers = {
	    default: (lines) => {
	        let dimensions = [];
	        while (lines.length > 0) {
	            const line = lines.shift();
	            if (line[0] === '#') {
	                continue;
	            }
	            dimensions = line.split(' ');
	            break;
	        }
	        if (dimensions.length === 2) {
	            return {
	                height: parseInt(dimensions[1], 10),
	                width: parseInt(dimensions[0], 10),
	            };
	        }
	        else {
	            throw new TypeError('Invalid PNM');
	        }
	    },
	    pam: (lines) => {
	        const size = {};
	        while (lines.length > 0) {
	            const line = lines.shift();
	            if (line.length > 16 || line.charCodeAt(0) > 128) {
	                continue;
	            }
	            const [key, value] = line.split(' ');
	            if (key && value) {
	                size[key.toLowerCase()] = parseInt(value, 10);
	            }
	            if (size.height && size.width) {
	                break;
	            }
	        }
	        if (size.height && size.width) {
	            return {
	                height: size.height,
	                width: size.width,
	            };
	        }
	        else {
	            throw new TypeError('Invalid PAM');
	        }
	    },
	};
	pnm.PNM = {
	    validate: (input) => (0, utils_1.toUTF8String)(input, 0, 2) in PNMTypes,
	    calculate(input) {
	        const signature = (0, utils_1.toUTF8String)(input, 0, 2);
	        const type = PNMTypes[signature];
	        // TODO: this probably generates garbage. move to a stream based parser
	        const lines = (0, utils_1.toUTF8String)(input, 3).split(/[\r\n]+/);
	        const handler = handlers[type] || handlers.default;
	        return handler(lines);
	    },
	};
	return pnm;
}

var psd = {};

var hasRequiredPsd;

function requirePsd () {
	if (hasRequiredPsd) return psd;
	hasRequiredPsd = 1;
	Object.defineProperty(psd, "__esModule", { value: true });
	psd.PSD = void 0;
	const utils_1 = requireUtils();
	psd.PSD = {
	    validate: (input) => (0, utils_1.toUTF8String)(input, 0, 4) === '8BPS',
	    calculate: (input) => ({
	        height: (0, utils_1.readUInt32BE)(input, 14),
	        width: (0, utils_1.readUInt32BE)(input, 18),
	    }),
	};
	return psd;
}

var svg = {};

var hasRequiredSvg;

function requireSvg () {
	if (hasRequiredSvg) return svg;
	hasRequiredSvg = 1;
	Object.defineProperty(svg, "__esModule", { value: true });
	svg.SVG = void 0;
	const utils_1 = requireUtils();
	const svgReg = /<svg\s([^>"']|"[^"]*"|'[^']*')*>/;
	const extractorRegExps = {
	    height: /\sheight=(['"])([^%]+?)\1/,
	    root: svgReg,
	    viewbox: /\sviewBox=(['"])(.+?)\1/i,
	    width: /\swidth=(['"])([^%]+?)\1/,
	};
	const INCH_CM = 2.54;
	const units = {
	    in: 96,
	    cm: 96 / INCH_CM,
	    em: 16,
	    ex: 8,
	    m: (96 / INCH_CM) * 100,
	    mm: 96 / INCH_CM / 10,
	    pc: 96 / 72 / 12,
	    pt: 96 / 72,
	    px: 1,
	};
	const unitsReg = new RegExp(`^([0-9.]+(?:e\\d+)?)(${Object.keys(units).join('|')})?$`);
	function parseLength(len) {
	    const m = unitsReg.exec(len);
	    if (!m) {
	        return undefined;
	    }
	    return Math.round(Number(m[1]) * (units[m[2]] || 1));
	}
	function parseViewbox(viewbox) {
	    const bounds = viewbox.split(' ');
	    return {
	        height: parseLength(bounds[3]),
	        width: parseLength(bounds[2]),
	    };
	}
	function parseAttributes(root) {
	    const width = root.match(extractorRegExps.width);
	    const height = root.match(extractorRegExps.height);
	    const viewbox = root.match(extractorRegExps.viewbox);
	    return {
	        height: height && parseLength(height[2]),
	        viewbox: viewbox && parseViewbox(viewbox[2]),
	        width: width && parseLength(width[2]),
	    };
	}
	function calculateByDimensions(attrs) {
	    return {
	        height: attrs.height,
	        width: attrs.width,
	    };
	}
	function calculateByViewbox(attrs, viewbox) {
	    const ratio = viewbox.width / viewbox.height;
	    if (attrs.width) {
	        return {
	            height: Math.floor(attrs.width / ratio),
	            width: attrs.width,
	        };
	    }
	    if (attrs.height) {
	        return {
	            height: attrs.height,
	            width: Math.floor(attrs.height * ratio),
	        };
	    }
	    return {
	        height: viewbox.height,
	        width: viewbox.width,
	    };
	}
	svg.SVG = {
	    // Scan only the first kilo-byte to speed up the check on larger files
	    validate: (input) => svgReg.test((0, utils_1.toUTF8String)(input, 0, 1000)),
	    calculate(input) {
	        const root = (0, utils_1.toUTF8String)(input).match(extractorRegExps.root);
	        if (root) {
	            const attrs = parseAttributes(root[0]);
	            if (attrs.width && attrs.height) {
	                return calculateByDimensions(attrs);
	            }
	            if (attrs.viewbox) {
	                return calculateByViewbox(attrs, attrs.viewbox);
	            }
	        }
	        throw new TypeError('Invalid SVG');
	    },
	};
	return svg;
}

var tga = {};

var hasRequiredTga;

function requireTga () {
	if (hasRequiredTga) return tga;
	hasRequiredTga = 1;
	Object.defineProperty(tga, "__esModule", { value: true });
	tga.TGA = void 0;
	const utils_1 = requireUtils();
	tga.TGA = {
	    validate(input) {
	        return (0, utils_1.readUInt16LE)(input, 0) === 0 && (0, utils_1.readUInt16LE)(input, 4) === 0;
	    },
	    calculate(input) {
	        return {
	            height: (0, utils_1.readUInt16LE)(input, 14),
	            width: (0, utils_1.readUInt16LE)(input, 12),
	        };
	    },
	};
	return tga;
}

var tiff = {};

var hasRequiredTiff;

function requireTiff () {
	if (hasRequiredTiff) return tiff;
	hasRequiredTiff = 1;
	Object.defineProperty(tiff, "__esModule", { value: true });
	tiff.TIFF = void 0;
	// based on http://www.compix.com/fileformattif.htm
	// TO-DO: support big-endian as well
	const fs = fs__default;
	const utils_1 = requireUtils();
	// Read IFD (image-file-directory) into a buffer
	function readIFD(input, filepath, isBigEndian) {
	    const ifdOffset = (0, utils_1.readUInt)(input, 32, 4, isBigEndian);
	    // read only till the end of the file
	    let bufferSize = 1024;
	    const fileSize = fs.statSync(filepath).size;
	    if (ifdOffset + bufferSize > fileSize) {
	        bufferSize = fileSize - ifdOffset - 10;
	    }
	    // populate the buffer
	    const endBuffer = new Uint8Array(bufferSize);
	    const descriptor = fs.openSync(filepath, 'r');
	    fs.readSync(descriptor, endBuffer, 0, bufferSize, ifdOffset);
	    fs.closeSync(descriptor);
	    return endBuffer.slice(2);
	}
	// TIFF values seem to be messed up on Big-Endian, this helps
	function readValue(input, isBigEndian) {
	    const low = (0, utils_1.readUInt)(input, 16, 8, isBigEndian);
	    const high = (0, utils_1.readUInt)(input, 16, 10, isBigEndian);
	    return (high << 16) + low;
	}
	// move to the next tag
	function nextTag(input) {
	    if (input.length > 24) {
	        return input.slice(12);
	    }
	}
	// Extract IFD tags from TIFF metadata
	function extractTags(input, isBigEndian) {
	    const tags = {};
	    let temp = input;
	    while (temp && temp.length) {
	        const code = (0, utils_1.readUInt)(temp, 16, 0, isBigEndian);
	        const type = (0, utils_1.readUInt)(temp, 16, 2, isBigEndian);
	        const length = (0, utils_1.readUInt)(temp, 32, 4, isBigEndian);
	        // 0 means end of IFD
	        if (code === 0) {
	            break;
	        }
	        else {
	            // 256 is width, 257 is height
	            // if (code === 256 || code === 257) {
	            if (length === 1 && (type === 3 || type === 4)) {
	                tags[code] = readValue(temp, isBigEndian);
	            }
	            // move to the next tag
	            temp = nextTag(temp);
	        }
	    }
	    return tags;
	}
	// Test if the TIFF is Big Endian or Little Endian
	function determineEndianness(input) {
	    const signature = (0, utils_1.toUTF8String)(input, 0, 2);
	    if ('II' === signature) {
	        return 'LE';
	    }
	    else if ('MM' === signature) {
	        return 'BE';
	    }
	}
	const signatures = [
	    // '492049', // currently not supported
	    '49492a00', // Little endian
	    '4d4d002a', // Big Endian
	    // '4d4d002a', // BigTIFF > 4GB. currently not supported
	];
	tiff.TIFF = {
	    validate: (input) => signatures.includes((0, utils_1.toHexString)(input, 0, 4)),
	    calculate(input, filepath) {
	        if (!filepath) {
	            throw new TypeError("Tiff doesn't support buffer");
	        }
	        // Determine BE/LE
	        const isBigEndian = determineEndianness(input) === 'BE';
	        // read the IFD
	        const ifdBuffer = readIFD(input, filepath, isBigEndian);
	        // extract the tags from the IFD
	        const tags = extractTags(ifdBuffer, isBigEndian);
	        const width = tags[256];
	        const height = tags[257];
	        if (!width || !height) {
	            throw new TypeError('Invalid Tiff. Missing tags');
	        }
	        return { height, width };
	    },
	};
	return tiff;
}

var webp = {};

var hasRequiredWebp;

function requireWebp () {
	if (hasRequiredWebp) return webp;
	hasRequiredWebp = 1;
	Object.defineProperty(webp, "__esModule", { value: true });
	webp.WEBP = void 0;
	const utils_1 = requireUtils();
	function calculateExtended(input) {
	    return {
	        height: 1 + (0, utils_1.readUInt24LE)(input, 7),
	        width: 1 + (0, utils_1.readUInt24LE)(input, 4),
	    };
	}
	function calculateLossless(input) {
	    return {
	        height: 1 +
	            (((input[4] & 0xf) << 10) | (input[3] << 2) | ((input[2] & 0xc0) >> 6)),
	        width: 1 + (((input[2] & 0x3f) << 8) | input[1]),
	    };
	}
	function calculateLossy(input) {
	    // `& 0x3fff` returns the last 14 bits
	    // TO-DO: include webp scaling in the calculations
	    return {
	        height: (0, utils_1.readInt16LE)(input, 8) & 0x3fff,
	        width: (0, utils_1.readInt16LE)(input, 6) & 0x3fff,
	    };
	}
	webp.WEBP = {
	    validate(input) {
	        const riffHeader = 'RIFF' === (0, utils_1.toUTF8String)(input, 0, 4);
	        const webpHeader = 'WEBP' === (0, utils_1.toUTF8String)(input, 8, 12);
	        const vp8Header = 'VP8' === (0, utils_1.toUTF8String)(input, 12, 15);
	        return riffHeader && webpHeader && vp8Header;
	    },
	    calculate(input) {
	        const chunkHeader = (0, utils_1.toUTF8String)(input, 12, 16);
	        input = input.slice(20, 30);
	        // Extended webp stream signature
	        if (chunkHeader === 'VP8X') {
	            const extendedHeader = input[0];
	            const validStart = (extendedHeader & 0xc0) === 0;
	            const validEnd = (extendedHeader & 0x01) === 0;
	            if (validStart && validEnd) {
	                return calculateExtended(input);
	            }
	            else {
	                // TODO: breaking change
	                throw new TypeError('Invalid WebP');
	            }
	        }
	        // Lossless webp stream signature
	        if (chunkHeader === 'VP8 ' && input[0] !== 0x2f) {
	            return calculateLossy(input);
	        }
	        // Lossy webp stream signature
	        const signature = (0, utils_1.toHexString)(input, 3, 6);
	        if (chunkHeader === 'VP8L' && signature !== '9d012a') {
	            return calculateLossless(input);
	        }
	        throw new TypeError('Invalid WebP');
	    },
	};
	return webp;
}

var hasRequiredTypes;

function requireTypes () {
	if (hasRequiredTypes) return types;
	hasRequiredTypes = 1;
	Object.defineProperty(types, "__esModule", { value: true });
	types.typeHandlers = void 0;
	// load all available handlers explicitly for browserify support
	const bmp_1 = requireBmp();
	const cur_1 = requireCur();
	const dds_1 = requireDds();
	const gif_1 = requireGif();
	const heif_1 = requireHeif();
	const icns_1 = requireIcns();
	const ico_1 = requireIco();
	const j2c_1 = requireJ2c();
	const jp2_1 = requireJp2();
	const jpg_1 = requireJpg();
	const jxl_1 = requireJxl();
	const jxl_stream_1 = requireJxlStream();
	const ktx_1 = requireKtx();
	const png_1 = requirePng();
	const pnm_1 = requirePnm();
	const psd_1 = requirePsd();
	const svg_1 = requireSvg();
	const tga_1 = requireTga();
	const tiff_1 = requireTiff();
	const webp_1 = requireWebp();
	types.typeHandlers = {
	    bmp: bmp_1.BMP,
	    cur: cur_1.CUR,
	    dds: dds_1.DDS,
	    gif: gif_1.GIF,
	    heif: heif_1.HEIF,
	    icns: icns_1.ICNS,
	    ico: ico_1.ICO,
	    j2c: j2c_1.J2C,
	    jp2: jp2_1.JP2,
	    jpg: jpg_1.JPG,
	    jxl: jxl_1.JXL,
	    'jxl-stream': jxl_stream_1.JXLStream,
	    ktx: ktx_1.KTX,
	    png: png_1.PNG,
	    pnm: pnm_1.PNM,
	    psd: psd_1.PSD,
	    svg: svg_1.SVG,
	    tga: tga_1.TGA,
	    tiff: tiff_1.TIFF,
	    webp: webp_1.WEBP,
	};
	return types;
}

var detector = {};

var hasRequiredDetector;

function requireDetector () {
	if (hasRequiredDetector) return detector;
	hasRequiredDetector = 1;
	Object.defineProperty(detector, "__esModule", { value: true });
	detector.detector = void 0;
	const index_1 = requireTypes();
	const keys = Object.keys(index_1.typeHandlers);
	// This map helps avoid validating for every single image type
	const firstBytes = {
	    0x38: 'psd',
	    0x42: 'bmp',
	    0x44: 'dds',
	    0x47: 'gif',
	    0x49: 'tiff',
	    0x4d: 'tiff',
	    0x52: 'webp',
	    0x69: 'icns',
	    0x89: 'png',
	    0xff: 'jpg',
	};
	function detector$1(input) {
	    const byte = input[0];
	    if (byte in firstBytes) {
	        const type = firstBytes[byte];
	        if (type && index_1.typeHandlers[type].validate(input)) {
	            return type;
	        }
	    }
	    const finder = (key) => index_1.typeHandlers[key].validate(input);
	    return keys.find(finder);
	}
	detector.detector = detector$1;
	return detector;
}

var hasRequiredDist;

function requireDist () {
	if (hasRequiredDist) return dist.exports;
	hasRequiredDist = 1;
	(function (module, exports) {
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.types = exports.setConcurrency = exports.disableTypes = exports.disableFS = exports.imageSize = void 0;
		const fs = fs__default;
		const path = path__default;
		const queue_1 = requireQueue();
		const index_1 = requireTypes();
		const detector_1 = requireDetector();
		// Maximum input size, with a default of 512 kilobytes.
		// TO-DO: make this adaptive based on the initial signature of the image
		const MaxInputSize = 512 * 1024;
		// This queue is for async `fs` operations, to avoid reaching file-descriptor limits
		const queue = new queue_1.default({ concurrency: 100, autostart: true });
		const globalOptions = {
		    disabledFS: false,
		    disabledTypes: [],
		};
		/**
		 * Return size information based on an Uint8Array
		 *
		 * @param {Uint8Array} input
		 * @param {String} filepath
		 * @returns {Object}
		 */
		function lookup(input, filepath) {
		    // detect the file type.. don't rely on the extension
		    const type = (0, detector_1.detector)(input);
		    if (typeof type !== 'undefined') {
		        if (globalOptions.disabledTypes.indexOf(type) > -1) {
		            throw new TypeError('disabled file type: ' + type);
		        }
		        // find an appropriate handler for this file type
		        if (type in index_1.typeHandlers) {
		            const size = index_1.typeHandlers[type].calculate(input, filepath);
		            if (size !== undefined) {
		                size.type = size.type ?? type;
		                return size;
		            }
		        }
		    }
		    // throw up, if we don't understand the file
		    throw new TypeError('unsupported file type: ' + type + ' (file: ' + filepath + ')');
		}
		/**
		 * Reads a file into an Uint8Array.
		 * @param {String} filepath
		 * @returns {Promise<Uint8Array>}
		 */
		async function readFileAsync(filepath) {
		    const handle = await fs.promises.open(filepath, 'r');
		    try {
		        const { size } = await handle.stat();
		        if (size <= 0) {
		            throw new Error('Empty file');
		        }
		        const inputSize = Math.min(size, MaxInputSize);
		        const input = new Uint8Array(inputSize);
		        await handle.read(input, 0, inputSize, 0);
		        return input;
		    }
		    finally {
		        await handle.close();
		    }
		}
		/**
		 * Synchronously reads a file into an Uint8Array, blocking the nodejs process.
		 *
		 * @param {String} filepath
		 * @returns {Uint8Array}
		 */
		function readFileSync(filepath) {
		    // read from the file, synchronously
		    const descriptor = fs.openSync(filepath, 'r');
		    try {
		        const { size } = fs.fstatSync(descriptor);
		        if (size <= 0) {
		            throw new Error('Empty file');
		        }
		        const inputSize = Math.min(size, MaxInputSize);
		        const input = new Uint8Array(inputSize);
		        fs.readSync(descriptor, input, 0, inputSize, 0);
		        return input;
		    }
		    finally {
		        fs.closeSync(descriptor);
		    }
		}
		// eslint-disable-next-line @typescript-eslint/no-use-before-define
		module.exports = exports = imageSize; // backwards compatibility
		exports.default = imageSize;
		/**
		 * @param {Uint8Array|string} input - Uint8Array or relative/absolute path of the image file
		 * @param {Function=} [callback] - optional function for async detection
		 */
		function imageSize(input, callback) {
		    // Handle Uint8Array input
		    if (input instanceof Uint8Array) {
		        return lookup(input);
		    }
		    // input should be a string at this point
		    if (typeof input !== 'string' || globalOptions.disabledFS) {
		        throw new TypeError('invalid invocation. input should be a Uint8Array');
		    }
		    // resolve the file path
		    const filepath = path.resolve(input);
		    if (typeof callback === 'function') {
		        queue.push(() => readFileAsync(filepath)
		            .then((input) => process.nextTick(callback, null, lookup(input, filepath)))
		            .catch(callback));
		    }
		    else {
		        const input = readFileSync(filepath);
		        return lookup(input, filepath);
		    }
		}
		exports.imageSize = imageSize;
		const disableFS = (v) => {
		    globalOptions.disabledFS = v;
		};
		exports.disableFS = disableFS;
		const disableTypes = (types) => {
		    globalOptions.disabledTypes = types;
		};
		exports.disableTypes = disableTypes;
		const setConcurrency = (c) => {
		    queue.concurrency = c;
		};
		exports.setConcurrency = setConcurrency;
		exports.types = Object.keys(index_1.typeHandlers); 
	} (dist, dist.exports));
	return dist.exports;
}

var distExports = requireDist();
const imageSize = /*@__PURE__*/getDefaultExportFromCjs(distExports);

export { requireInherits_browser as a, getDefaultExportFromCjs as b, commonjsGlobal as c, fileTypeFromFile as f, getAugmentedNamespace as g, imageSize as i, requireMs as r };
