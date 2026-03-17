import React from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import AppRoutes from './AppRoutes'

const App = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <AppRoutes />
      </main>
      <Footer />
    </div>
  );
};

export default App;