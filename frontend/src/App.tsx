import { Routes, Route } from 'react-router-dom';
import { Container } from '@mantine/core';

import { HomePage } from '@/views/HomePage';
import { Footer } from '@/components/Footer/Footer';
import { Header } from '@/components/Header/Header';

function App() {
  return (
    <>
      <Header />
      <Container className="maincontainer" my="md">
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </Container>
      <Footer />
    </>
  );
}

export default App;
