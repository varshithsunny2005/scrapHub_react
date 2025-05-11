import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import EditProfile from './components/EditProfile';
import SearchResults from './components/SearchResults';
import OfferPage from './components/OfferPage';
import ProfilePage from './components/ProfilePage';
import OffersManagement from './components/OffersManagement';
import AcceptedOffersPage from './components/AcceptedOffersPage'; // Import the AcceptedOffersPage component

function App() {
  return (
    <div className="w-screen h-screen bg-gradient-animation bg-400 animate-gradient-x">
      <Router>
        <Routes>
          <Route path="/" element={<AuthPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* Remove the standalone EditProfile route since it's now part of ProfilePage */}
          {/* <Route path="/profile" element={<EditProfile />} /> */}
          
          <Route path="/search" element={<SearchResults />} />
          <Route path="/offer/:productId/:userId" element={<OfferPage />} />
          
          {/* Profile page with nested routes */}
          <Route path="/profile/*" element={<ProfilePage />}>
            <Route path="edit" element={<EditProfile />} />
            <Route path="offers" element={<OffersManagement />} />
            <Route path="orders" element={<AcceptedOffersPage />} /> {/* Add AcceptedOffersPage here */}
          </Route>
        </Routes>
      </Router>
    </div>
  );
}

export default App;