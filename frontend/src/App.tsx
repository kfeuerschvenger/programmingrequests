import { Routes, Route } from 'react-router-dom';

import { HomePage } from '@/views/HomePage';
import { Footer } from '@/components/Footer/Footer';
import { Header } from '@/components/Header/Header';

function App() {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to the quest board
      </a>
      <Header />
      <main id="main" tabIndex={-1} className="main">
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}

export default App;
