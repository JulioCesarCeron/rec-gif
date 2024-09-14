import { toBlobURL } from "@ffmpeg/util"
import { FFMessageLoadConfig } from "./ffmpegLoadConfig.types"

const baseURL = "https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm"

export const getFFmpegLoadConfig = async (): Promise<FFMessageLoadConfig> => {
  const ffmpegLoadConfig: FFMessageLoadConfig = {
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    workerURL: await toBlobURL(
      `${baseURL}/ffmpeg-core.worker.js`,
      "text/javascript"
    ),
  }

  return ffmpegLoadConfig
}
