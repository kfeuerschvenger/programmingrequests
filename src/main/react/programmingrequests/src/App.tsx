import '@mantine/core/styles.css';

import { Routes, Route } from 'react-router-dom';
import { Container } from '@mantine/core';

import { HomePage, PixelArtPage } from '@/views';
import { Footer, Header } from '@/components';

function App() {
  return (
    <>
      <Header />
      <Container className="maincontainer" my="md">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/pixel-art" element={<PixelArtPage />} />
        </Routes>
      </Container>
      <Footer />
    </>
  );
}

export default App;
