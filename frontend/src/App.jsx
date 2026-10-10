import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Results from './pages/Results';
import Performance from './pages/Performance';
import Dataset from './pages/Dataset';
import About from './pages/About';
import Flow from './pages/Flow';
import DocumentViewer from './pages/DocumentViewer';
import AlgorithmLab from './pages/AlgorithmLab';

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/results" element={<Results />} />
          <Route path="/document/:id" element={<DocumentViewer />} />
          <Route path="/algorithms" element={<AlgorithmLab />} />
          <Route path="/performance" element={<Performance />} />
          <Route path="/flow" element={<Flow />} />
          <Route path="/dataset" element={<Dataset />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  );
}
