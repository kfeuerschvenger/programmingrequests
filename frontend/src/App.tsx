import { Routes, Route } from 'react-router-dom';

import { HomePage } from '@/views/HomePage';
import { Footer } from '@/components/Footer/Footer';
import { Header } from '@/components/Header/Header';
import { Scene } from '@/components/Scene/Scene';

function App() {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to the quest board
      </a>
      <Scene footer={<Footer />}>
        <Header />
        <main id="main" tabIndex={-1}>
          <Routes>
            <Route path="/" element={<HomePage />} />
          </Routes>
        </main>
      </Scene>
    </>
  );
}

export default App;
