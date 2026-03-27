import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import QRAdmin from './components/QRAdmin';
import CharacterWelcome from './components/CharacterWelcome';
import Home from './pages/Home';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin/qr" element={<QRAdmin />} />
        <Route path="/campaign/:code/" element={<CharacterWelcome />} />
      </Routes>
    </Router>
  );
}
