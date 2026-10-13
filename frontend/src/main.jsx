import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import SmoothScroll from './components/SmoothScroll'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SmoothScroll/>
    <App />
  </StrictMode>,
)
