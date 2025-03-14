import { randomUUID } from 'crypto';
import { readFileSync, writeFileSync, statSync } from 'fs';
import { f as fileTypeFromFile, i as imageSize } from './index-DJxZd_UQ.js';
import { parentPort } from 'worker_threads';

var __defProp = Object.defineProperty;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty, __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value, __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    __hasOwnProp.call(b, prop) && __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b))
      __propIsEnum.call(b, prop) && __defNormalProp(a, prop, b[prop]);
  return a;
};
var __publicField = (obj, key, value) => (__defNormalProp(obj, typeof key != "symbol" ? key + "" : key, value), value);
var __async = (__this, __arguments, generator) => new Promise((resolve, reject) => {
  var fulfilled = (value) => {
    try {
      step(generator.next(value));
    } catch (e) {
      reject(e);
    }
  }, rejected = (value) => {
    try {
      step(generator.throw(value));
    } catch (e) {
      reject(e);
    }
  }, step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
  step((generator = generator.apply(__this, __arguments)).next());
});

// package.json
var version = "0.13.1";

// src/options.ts
var defaultInitOptions = {
  core: "@ffmpeg.wasm/core-mt",
  coreOptions: {},
  defaultArgs: ["-nostdin", "-y", "-hide_banner"],
  log: false,
  logger: (level, ...msg) => {
    var _a;
    return level !== "debug" || ((_a = process == null ? void 0 : process.env) == null ? void 0 : _a.NODE_ENV) === "development" && console[level](`[${level}] `, ...msg);
  }
};

// src/utils/importCore.ts
var importCore = (core, logger) => __async(void 0, null, function* () {
  switch (typeof core) {
    case "string":
      return logger("debug", `Import '${core}' with esm dynamic import()`), (yield import(core)).default;
    case "function":
      return logger("debug", "FFmpeg core constructor detected, use it directly"), core;
    default:
      throw new Error(
        `Invalid type of option core: ${typeof core}, expect string or function`
      );
  }
});

// src/utils/logError.ts
var logError = (err, args, logger) => {
  let reason = err instanceof Error ? err == null ? void 0 : err.message : err;
  logger("error", `Failed to execute '${args.join(" ")}': `, reason);
};

// src/utils/parseVersion.ts
var coreVersionRegExp = /^ffmpeg\sversion\s([^\s]+)/m, configurationRegExp = /^\s*configuration:\s(.+)$/m, libsRegExp = /^\s*(\w+)\s*(\d+)\.\s*(\d+)\.\s*(\d+)\s*\/.*$/gm;
function parseVersion(output) {
  var _a, _b, _c, _d;
  return {
    version: (_b = (_a = output.match(coreVersionRegExp)) == null ? void 0 : _a[1]) != null ? _b : "unknown",
    configuration: (_d = (_c = output.match(configurationRegExp)) == null ? void 0 : _c[1]) != null ? _d : "",
    libs: Object.fromEntries(
      [...output.matchAll(libsRegExp)].map(([, name, major, minor, patch]) => [
        name,
        `${major}.${minor}.${patch}`
      ])
    ),
    raw: output
  };
}

// src/utils/writeArgs.ts
var writeArgs = (core, args) => {
  let argsPtr = core._malloc(args.length * Uint32Array.BYTES_PER_ELEMENT);
  return args.forEach((arg, idx) => {
    let strLength = core.lengthBytesUTF8(arg) + 1, buf = core._malloc(strLength);
    core.stringToUTF8(arg, buf, strLength), core.setValue(argsPtr + Uint32Array.BYTES_PER_ELEMENT * idx, buf, "i32");
  }), argsPtr;
};

// src/index.ts
var VERSION_ARGS = ["ffmpeg", "-version"], FFmpeg = class _FFmpeg {
  /**
   * Don't use this constructor direct, use FFmpeg.create() instead!
   * @see {@link create}
   * @param core FFmpeg.wasm core
   * @param options init options
   */
  constructor(core, options, coreVersion) {
    __publicField(this, "flags");
    /** Memory file system API */
    __publicField(this, "fs");
    /** Versions of FFmpeg.wasm */
    __publicField(this, "version");
    __publicField(this, "core");
    __publicField(this, "_exited", false);
    __publicField(this, "exec");
    __publicField(this, "execAsync");
    __publicField(this, "options");
    __publicField(this, "tasks", /* @__PURE__ */ new Map());
    this.core = core, this.options = options, this.version = { main: version, core: coreVersion };
    let { simd, thread, wasi } = core;
    this.flags = { simd, thread, wasi }, this.exec = core.cwrap("exec", "number", ["number", "number"]), this.execAsync = core.cwrap("execAsync", "number", [
      "number",
      "number",
      "number",
      "number"
    ]), this.fs = core.FS;
  }
  /**
   * Has the core exited
   * @readonly
   */
  get exited() {
    return this._exited;
  }
  /**
   * Create a new FFmpeg instance
   * @param _options init options
   * @returns created instance
   */
  static create() {
    return __async(this, arguments, function* (_options = {}) {
      var _a;
      let options = __spreadValues(__spreadValues({}, defaultInitOptions), _options);
      ((_a = options.coreOptions).locateFile) != null || (_a.locateFile = (url, prefix) => options.coreOptions.wasmPath && url.endsWith(".wasm") ? options.coreOptions.wasmPath : options.coreOptions.workerPath && url.endsWith(".js") ? options.coreOptions.workerPath : `${prefix}${url}`);
      let { log, logger } = options, output = "";
      options.log = true, options.logger = (level, msg) => {
        level === "info" && (output += `${String(msg)}
`);
      };
      let core = yield (yield importCore(options.core, logger))({
        arguments: VERSION_ARGS,
        locateFile: options.coreOptions.locateFile,
        noExitRuntime: true,
        print(msg) {
          options.log && options.logger("info", msg);
        },
        printErr(msg) {
          options.log && options.logger("error", msg);
        }
      }), coreVersion = parseVersion(output);
      return options.log = log, options.logger = logger, new _FFmpeg(core, options, coreVersion);
    });
  }
  /**
   * Execute FFmpeg like CLI (stdin is not available)
   * @param _args array of parameters, same as CLI
   * @returns promise with exit code
   */
  run(..._args) {
    return __async(this, null, function* () {
      var _a;
      if (this._exited)
        throw new Error("FFmpeg core has already been exited!");
      let args = ["ffmpeg", ...this.options.defaultArgs, ..._args], handle = Symbol(
        ((_a = process == null ? void 0 : process.env) == null ? void 0 : _a.NODE_ENV) === "development" ? `FFmpeg convert ${args.join(" ")}` : ""
      ), argsPtr, resloveCallbackPtr, rejectCallbackPtr;
      try {
        let promise = new Promise((resolve, reject) => {
          argsPtr = writeArgs(this.core, args), resloveCallbackPtr = this.core.addFunction(resolve, "vi"), rejectCallbackPtr = this.core.addFunction(reject, "vi"), this.core.thread ? (this.execAsync(
            args.length,
            argsPtr,
            resloveCallbackPtr,
            rejectCallbackPtr
          ) || reject("Failed to add task into queue!"), this.tasks.set(handle, {
            // can only be accessed after initialisation
            get promise() {
              return promise;
            },
            reject
          })) : resolve(this.exec(args.length, argsPtr));
        });
        return yield promise;
      } catch (err) {
        throw logError(err, args, this.options.logger), err;
      } finally {
        this.tasks.delete(handle), argsPtr && this.core._free(argsPtr);
      }
    });
  }
  /**
   * Force FFmpeg to run synchronously (same behaviour as ffmpeg.run() in single-thread core)
   * @param _args array of parameters, same as CLI
   * @returns exit code
   */
  runSync(..._args) {
    if (this._exited)
      throw new Error("FFmpeg core has already been exited!");
    let args = ["ffmpeg", ..._args], argsPtr = writeArgs(this.core, args);
    try {
      return this.exec(args.length, argsPtr);
    } catch (err) {
      throw logError(err, args, this.options.logger), err;
    } finally {
      this.core._free(argsPtr);
    }
  }
  exit(handleInProgress = "kill") {
    switch (this._exited = true, handleInProgress) {
      case "wait":
        return Promise.allSettled(
          Array.from(this.tasks.values()).map(({ promise }) => promise)
        ).then(() => this.core.exit());
      case "kill":
        this.tasks.forEach(({ reject }) => reject("ffmpeg core has exited!"));
        break;
      default:
        if (this.tasks.size !== 0)
          return this.options.logger("warn", "Task list is not empty, break."), false;
        break;
    }
    return this.core.exit();
  }
  setLogging(enbaled) {
    this.options.log = enbaled;
  }
  /**
   * Replace logger
   * @param logger logger function
   */
  setLogger(logger) {
    this.options.logger = logger;
  }
};

function recvTask(cb) {
  parentPort?.on("message", async (taskData) => {
    try {
      let ret = await cb(taskData);
      parentPort?.postMessage(ret);
    } catch (error) {
      parentPort?.postMessage({ error: error.message });
    }
  });
}
class FFmpegService {
  static async extractThumbnail(videoPath, thumbnailPath) {
    const ffmpegInstance = await FFmpeg.create({ core: "@ffmpeg.wasm/core-mt" });
    const videoFileName = `${randomUUID()}.mp4`;
    const outputFileName = `${randomUUID()}.jpg`;
    try {
      ffmpegInstance.fs.writeFile(videoFileName, readFileSync(videoPath));
      const code = await ffmpegInstance.run("-i", videoFileName, "-ss", "00:00:01.000", "-vframes", "1", outputFileName);
      if (code !== 0) {
        throw new Error("Error extracting thumbnail: FFmpeg process exited with code " + code);
      }
      const thumbnail = ffmpegInstance.fs.readFile(outputFileName);
      writeFileSync(thumbnailPath, thumbnail);
    } catch (error) {
      console.error("Error extracting thumbnail:", error);
      throw error;
    } finally {
      try {
        ffmpegInstance.fs.unlink(outputFileName);
      } catch (unlinkError) {
        console.error("Error unlinking output file:", unlinkError);
      }
      try {
        ffmpegInstance.fs.unlink(videoFileName);
      } catch (unlinkError) {
        console.error("Error unlinking video file:", unlinkError);
      }
    }
  }
  static async convertFile(inputFile, outputFile, format) {
    const ffmpegInstance = await FFmpeg.create({ core: "@ffmpeg.wasm/core-mt" });
    const inputFileName = `${randomUUID()}.pcm`;
    const outputFileName = `${randomUUID()}.${format}`;
    try {
      ffmpegInstance.fs.writeFile(inputFileName, readFileSync(inputFile));
      const params = format === "amr" ? ["-f", "s16le", "-ar", "24000", "-ac", "1", "-i", inputFileName, "-ar", "8000", "-b:a", "12.2k", outputFileName] : ["-f", "s16le", "-ar", "24000", "-ac", "1", "-i", inputFileName, outputFileName];
      const code = await ffmpegInstance.run(...params);
      if (code !== 0) {
        throw new Error("Error extracting thumbnail: FFmpeg process exited with code " + code);
      }
      const outputData = ffmpegInstance.fs.readFile(outputFileName);
      writeFileSync(outputFile, outputData);
    } catch (error) {
      console.error("Error converting file:", error);
      throw error;
    } finally {
      try {
        ffmpegInstance.fs.unlink(outputFileName);
      } catch (unlinkError) {
        console.error("Error unlinking output file:", unlinkError);
      }
      try {
        ffmpegInstance.fs.unlink(inputFileName);
      } catch (unlinkError) {
        console.error("Error unlinking input file:", unlinkError);
      }
    }
  }
  static async convert(filePath, pcmPath) {
    const ffmpegInstance = await FFmpeg.create({ core: "@ffmpeg.wasm/core-mt" });
    const inputFileName = `${randomUUID()}.input`;
    const outputFileName = `${randomUUID()}.pcm`;
    try {
      ffmpegInstance.fs.writeFile(inputFileName, readFileSync(filePath));
      const params = ["-y", "-i", inputFileName, "-ar", "24000", "-ac", "1", "-f", "s16le", outputFileName];
      const code = await ffmpegInstance.run(...params);
      if (code !== 0) {
        throw new Error("FFmpeg process exited with code " + code);
      }
      const outputData = ffmpegInstance.fs.readFile(outputFileName);
      writeFileSync(pcmPath, outputData);
      return Buffer.from(outputData);
    } catch (error) {
      throw new Error("FFmpeg处理转换出错: " + error.message);
    } finally {
      try {
        ffmpegInstance.fs.unlink(outputFileName);
      } catch (unlinkError) {
        console.error("Error unlinking output file:", unlinkError);
      }
      try {
        ffmpegInstance.fs.unlink(inputFileName);
      } catch (unlinkError) {
        console.error("Error unlinking output file:", unlinkError);
      }
    }
  }
  static async getVideoInfo(videoPath, thumbnailPath) {
    await FFmpegService.extractThumbnail(videoPath, thumbnailPath);
    const fileType = (await fileTypeFromFile(videoPath))?.ext ?? "mp4";
    const inputFileName = `${randomUUID()}.${fileType}`;
    const ffmpegInstance = await FFmpeg.create({ core: "@ffmpeg.wasm/core-mt" });
    ffmpegInstance.fs.writeFile(inputFileName, readFileSync(videoPath));
    ffmpegInstance.setLogging(true);
    let duration = 60;
    ffmpegInstance.setLogger((_level, ...msg) => {
      const message = msg.join(" ");
      const durationMatch = message.match(/Duration: (\d+):(\d+):(\d+\.\d+)/);
      if (durationMatch) {
        const hours = parseInt(durationMatch[1] ?? "0", 10);
        const minutes = parseInt(durationMatch[2] ?? "0", 10);
        const seconds = parseFloat(durationMatch[3] ?? "0");
        duration = hours * 3600 + minutes * 60 + seconds;
      }
    });
    await ffmpegInstance.run("-i", inputFileName);
    const image = imageSize(thumbnailPath);
    ffmpegInstance.fs.unlink(inputFileName);
    const fileSize = statSync(videoPath).size;
    return {
      width: image.width ?? 100,
      height: image.height ?? 100,
      time: duration,
      format: fileType,
      size: fileSize,
      filePath: videoPath
    };
  }
}
async function handleFFmpegTask({ method, args }) {
  switch (method) {
    case "extractThumbnail":
      return await FFmpegService.extractThumbnail(...args);
    case "convertFile":
      return await FFmpegService.convertFile(...args);
    case "convert":
      return await FFmpegService.convert(...args);
    case "getVideoInfo":
      return await FFmpegService.getVideoInfo(...args);
    default:
      throw new Error(`Unknown method: ${method}`);
  }
}
recvTask(async ({ method, args }) => {
  return await handleFFmpegTask({ method, args });
});

export { handleFFmpegTask as default, recvTask };
