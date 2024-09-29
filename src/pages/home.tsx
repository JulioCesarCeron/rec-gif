import { useEffect, useMemo, useRef, useState } from "react"
import { createGif } from "../handlers/create-gif"
import { FFmpeg } from "@ffmpeg/ffmpeg"
import { getFFmpegLoadConfig } from "../config/ffmpegLoadConfig"
import Version from "../components/version"

let recorder: MediaRecorder

export const Home = () => {
  const [recording, setRecording] = useState(false)
  const [ready, setReady] = useState(false)
  const ffmpegRef = useRef(new FFmpeg())
  const [videoBlobUrl, setVideoBlobUrl] = useState<string>()
  const [gifBlobUrl, setGifBlobUrl] = useState<string>()

  const onRecordGif = async () => {
    setRecording(true)

    const stream = await navigator.mediaDevices
      .getDisplayMedia({
        video: {
          width: { ideal: 9999, max: 9999 },
          height: { ideal: 9999, max: 9999 },
        },
      })
      .catch(() => {
        setRecording(false)
      })

    if (!stream) {
      return
    }

    recorder = new MediaRecorder(stream)

    const chunks: Blob[] = []

    recorder.ondataavailable = (e) => chunks.push(e.data)
    recorder.onstop = async () => {
      const completeBlob = new Blob(chunks, { type: chunks[0].type })
      setVideoBlobUrl(URL.createObjectURL(completeBlob))
      const blobUrlGif = await createGif(completeBlob, ffmpegRef.current)
      setGifBlobUrl(blobUrlGif)
    }

    recorder.onerror = (e) => {
      console.log("error", e)
    }

    recorder.start()
  }

  const handleStop = () => {
    setRecording(false)
    recorder.stop()
  }

  const load = async () => {
    const ffmpeg = ffmpegRef.current

    ffmpeg.on("log", ({ type, message }) => {
      console.log(`${type} - ${message}`)
    })

    await ffmpeg.load(await getFFmpegLoadConfig())

    setReady(true)
  }

  useEffect(() => {
    void load()
  }, [])

  const hasVideo = useMemo(() => !!videoBlobUrl, [videoBlobUrl])

  return (
    <>
      <div className="content">
        <div className="rec-controls">
          <h1>
            REC <span className="rec-pin">๏</span> GIF
          </h1>

          <div className="card">
            {recording ? (
              <button className="stop-rec" onClick={handleStop}>
                Stop recording
              </button>
            ) : (
              <button
                onClick={() => {
                  void onRecordGif()
                }}
                disabled={!ready}
              >
                {ready ? "Start recording" : "Loading..."}
              </button>
            )}
            <p>Recording a GIF of your screen</p>
          </div>
          <p className="read-the-docs">This is a client-side web app</p>
        </div>
        {hasVideo && (
          <div className="wrapper-medias">
            <div className="rec-media">
              <h1>Video.mp4</h1>
              <video
                className="media-raw-video"
                src={videoBlobUrl}
                loop
                autoPlay
              >
                <track
                  kind="captions"
                  srcLang="en"
                  label="English captions"
                  default
                />
              </video>
            </div>
            <div className="rec-media">
              <h1>Gif</h1>
              {gifBlobUrl ? (
                <img src={gifBlobUrl} alt="recorded-gif" />
              ) : (
                <p>Processing...</p>
              )}
            </div>
          </div>
        )}
      </div>
      <footer className="footer">
        <Version />
      </footer>
    </>
  )
}
