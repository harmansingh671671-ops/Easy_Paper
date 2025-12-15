import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { PaperProvider } from './contexts/PaperContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PaperProvider>
      <App />
    </PaperProvider>    
  </StrictMode>,
)