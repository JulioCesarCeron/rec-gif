import packageJson from "../../package.json"
import "./version.css"

const Version = () => {
  return (
    <div className="version">
      <p className="version-text">Version {packageJson.version}</p>
    </div>
  )
}

export default Version
