import { createVideoComponent } from "./create-video-component"

export const createGif = async (blob: Blob) => {
  await createVideoComponent(blob)
}
