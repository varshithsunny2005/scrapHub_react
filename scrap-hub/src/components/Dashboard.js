import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
  const navigate = useNavigate();
  const userType = localStorage.getItem('userType');
  const jwt = localStorage.getItem('token'); // if you prefer to keep it as 'token'


  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    if (!searchText.trim()) return;
  
    try {
      const url = `http://localhost:8080/api/search/${userType === 'seller' ? 'consumers' : 'sellers'}/${searchText}`;
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
  
      if (res.data && Array.isArray(res.data)) {
        // ✅ Save results to localStorage
        localStorage.setItem('searchResults', JSON.stringify(res.data));
        console.log('Before navigating to search');
        navigate('/search');
        console.log('After navigating to search');
        
      } else {
        console.warn('No results returned or invalid format.');
      }
    } catch (error) {
      console.error('Search failed:', error);
    }
  };
  
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* Navbar */}
      <div className="flex items-center justify-between px-8 py-6 shadow-md sticky top-0 bg-white z-50 h-[90px]">
        <div className="w-1/3">
          <button
            onClick={() => navigate('/profile')}
            className="bg-green-600 text-white font-bold px-4 py-2 rounded-md hover:bg-green-700 transition"
          >
            Profile
          </button>
        </div>

        <div className="w-1/3 flex justify-center">
          <div className="text-4xl font-extrabold text-green-600 tracking-wide">
            ScrapHub<span className="text-blue-600">.in</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="w-1/3 flex justify-end gap-2">
          <input
            type="text"
            placeholder="Search Scrap Items..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
            className="w-64 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm font-medium"
          />
          <button
            onClick={handleSearch}
            className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700"
          >
            Search
          </button>
        </div>
      </div>

      {/* Welcome Section */}
      <div className="px-6 py-10 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
        <h2 className="text-4xl font-extrabold mb-2 text-gray-800">
          Welcome {userType === 'seller' ? 'Seller' : 'Consumer'} 👋
        </h2>
        <p className="text-gray-700 text-lg font-semibold">
          Manage your scrap pickups, requests, and offers with ease.
        </p>
      </div>

      {/* About Section */}
      <div className="px-6 py-10 bg-white">
        <h3 className="text-3xl font-bold text-green-700 mb-4">About ScrapHub</h3>
        <p className="text-gray-800 max-w-3xl leading-relaxed text-[16px] font-medium">
          <strong>ScrapHub.in</strong> is an eco-friendly platform...
        </p>
      </div>

      {/* Reviews Section */}
      <div className="px-6 py-10 bg-gray-50 border-t border-gray-200">
        <h3 className="text-3xl font-bold text-blue-600 mb-6">What Our Users Say 💬</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[ 
            { text: "Scheduling a pickup...", name: "Neha, Consumer" },
            { text: "I get regular seller leads...", name: "Rajesh, Seller" },
            { text: "It’s so easy to use...", name: "Aarti, Consumer" },
            { text: "Finally a platform that helps...", name: "Imran, Seller" }
          ].map((review, index) => (
            <div key={index} className="bg-white p-5 rounded-lg shadow hover:shadow-md transition">
              <p className="text-gray-800 text-[15px] font-semibold">“{review.text}”</p>
              <p className="text-sm text-gray-500 mt-2 font-bold">— {review.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
