import { useCallback, useRef, useState } from "react"
import type { GifWasmModule } from "../types/wasm"

export function useGifRecoreder(wasm: GifWasmModule | null) {
  const [isRecording, setIsRecording] = useState(false)
  const [gifUrl, setGifUrl] = useState<string | null>(null)

  const framesRef = useRef<Uint8Array[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timeoutRef = useRef<number | null>(null)
  const recordingRef = useRef(false)

  const metadataRef = useRef({
    width: 0,
    height: 0,
    fps: 15,
  })

  const startRecording = async () => {
    if (!wasm) return

    framesRef.current = []
    recordingRef.current = true
    setGifUrl(null)

    const fps = metadataRef.current.fps

    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: fps },
    })

    streamRef.current = stream

    const video = document.createElement("video")
    video.srcObject = stream
    await video.play()

    metadataRef.current.width = video.videoWidth
    metadataRef.current.height = video.videoHeight

    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext("2d", { willReadFrequently: true })

    if (!ctx) {
      return
    }

    setIsRecording(true)

    const captureFrame = () => {
      if (!recordingRef.current) {
        return
      }

      ctx.drawImage(video, 0, 0)
      const frameData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      framesRef.current.push(new Uint8Array(frameData.data))
      timeoutRef.current = window.setTimeout(captureFrame, 1000 / fps)
    }

    captureFrame()
  }

  const stopRecording = useCallback(() => {
    recordingRef.current = false
    setIsRecording(false)

    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    streamRef.current?.getTracks().forEach((track) => {
      track.stop()
    })

    if (!wasm) return

    const frames = framesRef.current
    const { height, width, fps } = metadataRef.current

    if (!frames.length || !width || !height) return

    const frameSize = width * height * 4
    const totalSize = frames.length * frameSize
    const memoryPointer = wasm._malloc(totalSize)

    let offset = 0

    for (const frame of frames) {
      wasm.HEAPU8.set(frame, memoryPointer + offset)
      offset += frame.length
    }

    const integerMemoryPointerSize = wasm._malloc(4)
    const delay = Math.round(100 / fps)

    const gifPtr = wasm._process_frames(
      memoryPointer,
      frames.length,
      width,
      height,
      delay,
      integerMemoryPointerSize
    )

    const gifSize = wasm.HEAP32[integerMemoryPointerSize >> 2]

    // const gifData = new Uint8Array(wasm.HEAPU8.buffer, gifPtr, gifSize)
    const gifData = wasm.HEAPU8.slice(gifPtr, gifPtr + gifSize)

    const blob = new Blob([gifData], { type: "image/gif" })
    setGifUrl(URL.createObjectURL(blob))

    wasm._free(memoryPointer)
    wasm._free(integerMemoryPointerSize)
  }, [wasm])

  return {
    startRecording,
    stopRecording,
    isRecording,
    gifUrl,
  }
}
