import { defineConfig } from "vite"
import react from "@vitejs/plugin-react-swc"
import { viteStaticCopy } from "vite-plugin-static-copy"

// https://vitejs.dev/config/
export default defineConfig({
  base: "/",
  plugins: [
    react(),
    {
      name: "configure-response-headers",
      configureServer: (server) => {
        server.middlewares.use((_req, res, next) => {
          res.setHeader("Cross-Origin-Embedder-Policy", "require-corp")
          res.setHeader("Cross-Origin-Opener-Policy", "same-origin")
          next()
        })
      },
    },
    viteStaticCopy({
      targets: [
        {
          src: "_headers",
          dest: ".",
        },
      ],
    }),
  ],
  optimizeDeps: {
    exclude: ["@ffmpeg/util", "@ffmpeg/ffmpeg"],
  },
})
