import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import EditProfile from './EditProfile';
import OffersManagement from './OffersManagement';
import SuccessfulOrders from './AcceptedOffersPage';
import { ExitIcon } from '@radix-ui/react-icons'; // or any other logout icon you prefer

const ProfilePage = () => {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    // Clear all user data from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    localStorage.removeItem('phoneNumber');
    localStorage.removeItem('name');
    
    // Redirect to login page or home page
    navigate('/'); // Change this to your login route
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Profile Header */}
          <div className="bg-blue-600 px-6 py-8 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="mr-6">
                  <div className="h-24 w-24 rounded-full bg-white flex items-center justify-center text-blue-600 text-3xl font-bold">
                    {localStorage.getItem('name')?.charAt(0) || 'U'}
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{localStorage.getItem('name') || 'User'}</h1>
                  <p className="opacity-90">{localStorage.getItem('phoneNumber') || ''}</p>
                  <p className="mt-1 text-blue-100">
                    {localStorage.getItem('userType') === 'consumer' ? 'Consumer' : 'Seller'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
              >
                <ExitIcon /> {/* Or use another icon of your choice */}
                Logout
              </button>
            </div>
          </div>
          
          {/* Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => navigate('/profile/edit')}
                className="mr-8 py-4 px-1 border-b-2 border-blue-500 font-medium text-sm text-blue-600"
              >
                Edit Profile
              </button>
              <button
                onClick={() => navigate('/profile/offers')}
                className="mr-8 py-4 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300"
              >
                Offers Management
              </button>
              <button
                onClick={() => navigate('/profile/orders')}
                className="mr-8 py-4 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300"
              >
                Successful Orders
              </button>
            </nav>
          </div>
          
          {/* Content Area */}
          <div className="p-6">
            <Routes>
              <Route path="edit" element={<EditProfile />} />
              <Route path="offers" element={<OffersManagement />} />
              <Route path="orders" element={<SuccessfulOrders />} />
              <Route index element={<EditProfile />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;