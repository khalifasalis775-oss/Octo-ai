import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import Chat from './pages/Chat';
import Code from './pages/Code';
import Image from './pages/Image';
import Video from './pages/Video';
import Ad from './pages/Ad';
import Projects from './pages/Projects';
import Settings from './pages/Settings';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Chat />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/code" element={<Code />} />
          <Route path="/image" element={<Image />} />
          <Route path="/video" element={<Video />} />
          <Route path="/ad" element={<Ad />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
