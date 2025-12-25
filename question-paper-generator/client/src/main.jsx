import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom' // Import BrowserRouter
import 'katex/dist/katex.min.css'
import './index.css'
import App from './App.jsx'
import { ClerkProvider } from '@clerk/clerk-react'
import { AuthProvider } from './contexts/AuthContext'

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY. Please add it to your .env file.')
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider publishableKey={clerkPubKey}>
      <AuthProvider>
        {/* We wrap App in BrowserRouter here to fix the future flag warning.
          Make sure to REMOVE <BrowserRouter> from App.jsx if it exists there.
        */}
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <App />
        </BrowserRouter>
      </AuthProvider>
    </ClerkProvider>
  </StrictMode>,
)