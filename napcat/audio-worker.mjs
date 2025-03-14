import { encode } from 'silk-wasm';
import { parentPort } from 'worker_threads';

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
recvTask(async ({ input, sampleRate }) => {
  return await encode(input, sampleRate);
});

export { recvTask };
