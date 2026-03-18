import React from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import AppRoutes from './AppRoutes'

const App = () => {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-slate-50">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.08),_transparent_45%)]" />
      <Header />
      <main className="relative z-10 flex-1">
        <AppRoutes />
      </main>
      <Footer />
    </div>
  )
}

export default App
