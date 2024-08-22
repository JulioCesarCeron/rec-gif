import { useNavigate } from "react-router-dom"

export const Home = () => {
  const navigate = useNavigate()

  return (
    <>
      <h1>
        REC <span className="rec-pin">๏</span> GIF
      </h1>
      <div className="card">
        <button onClick={() => navigate("/record")}>
          Start recording your GIF
        </button>
        <p>Recording a GIF of your screen</p>
      </div>
      <p className="read-the-docs">This is a client-side web app</p>
    </>
  )
}
