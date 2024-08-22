import "./App.css"
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import { Home } from "./pages/home"
import { Record } from "./pages/record"
import { ErrorPage } from "./pages/error-page"

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/record",
    element: <Record />,
  },
])

function App() {
  return <RouterProvider router={router} />
}

export default App
