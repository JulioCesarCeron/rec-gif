import { useState } from "react"
import { createGif } from "../handlers/create-gif"

let recorder: MediaRecorder

export const Home = () => {
  const [recording, setRecording] = useState(false)

  const handleShare = async () => {
    setRecording(true)

    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        width: { ideal: 9999, max: 9999 },
        height: { ideal: 9999, max: 9999 },
      },
    })

    recorder = new MediaRecorder(stream)

    const chunks: Blob[] = []

    recorder.ondataavailable = (e) => chunks.push(e.data)
    recorder.onstop = async () => {
      const completeBlob = new Blob(chunks, { type: chunks[0].type })
      await createGif(completeBlob)
    }

    recorder.start()

    // navigate("/record")
  }

  const handleStop = () => {
    setRecording(false)
    recorder.stop()
  }

  return (
    <>
      <h1>
        REC <span className="rec-pin">๏</span> GIF
      </h1>
      <div className="card">
        {recording ? (
          <button onClick={handleStop}>Stop recording</button>
        ) : (
          <button
            onClick={() => {
              void handleShare()
            }}
          >
            Start recording
          </button>
        )}
        <p>Recording a GIF of your screen</p>
      </div>
      <p className="read-the-docs">This is a client-side web app</p>
    </>
  )
}
