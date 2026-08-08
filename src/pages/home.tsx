import { useEffect, useState } from "react"
import Version from "../components/version"
import type { GifWasmModule } from "../types/wasm"
import { useGifRecorder } from "../hooks/useGifRecorder"
import initWasm from "../wasm/gif_wasm"

export const Home = () => {
  const [wasm, setWasm] = useState<GifWasmModule | null>(null)
  console.log('wasm', wasm);

  useEffect(() => {
    initWasm().then(setWasm).catch(console.error)
  }, [])

  const { startRecording, stopRecording, isRecording, gifUrl } =
    useGifRecorder(wasm)

  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>
        GIF Screen Capture <small>(TS + WASM)</small>
      </h1>

      <div style={{ marginBottom: "1rem" }}>
        {!isRecording ? (
          <button onClick={startRecording} disabled={!wasm}>
            🚀 Iniciar Gravação
          </button>
        ) : (
          <button
            onClick={stopRecording}
            style={{ background: "#ff4d4d", color: "white" }}
          >
            ⏹️ Parar Gravação
          </button>
        )}
      </div>

      {gifUrl && (
        <section>
          <h3>Seu GIF está pronto:</h3>
          <img
            src={gifUrl}
            alt="Preview"
            style={{ border: "2px solid #ddd", borderRadius: "8px", width: "1500px", height: "auto" }}
          />
          <p>
            <a href={gifUrl} download="screen-capture.gif">
              ⬇️ Baixar GIF
            </a>
          </p>
        </section>
      )}

      <footer className="footer">
        <Version />
      </footer>
    </main>
  )
}
