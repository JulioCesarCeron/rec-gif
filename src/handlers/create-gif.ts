export const createGif = async (blob: Blob) => {
  document.querySelector("video")?.remove()

  const video = document.createElement("video")
  video.setAttribute("controls", "true")
  video.style.width = "900px"

  document.body.appendChild(video)

  video.src = URL.createObjectURL(blob)
  await video.play()

  video.onloadeddata = () => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    video.addEventListener("timeupdate", () => {
      ctx?.drawImage(video, 0, 0)
    })

    video.onended = () => {
      console.log("Video ended")
    }
  }
}
