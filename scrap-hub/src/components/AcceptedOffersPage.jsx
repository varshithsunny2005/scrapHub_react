import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';
import axios from 'axios';
import { Snackbar, Alert, CircularProgress } from '@mui/material';

const AcceptedOffersPage = () => {
  const token = localStorage.getItem('token');
  const userType = localStorage.getItem('userType');
  const phoneNumber = localStorage.getItem('phoneNumber');
  
  const [acceptedOffers, setAcceptedOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Status badges with appropriate colors
  const statusBadges = {
    PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: <Clock size={16} /> },
    COMPLETED: { color: 'bg-green-100 text-green-800', icon: <CheckCircle size={16} /> },
    CANCELLED: { color: 'bg-red-100 text-red-800', icon: <XCircle size={16} /> }
  };

  // Helper function to get formatted date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Fetch accepted offers
  const fetchAcceptedOffers = async () => {
    try {
      if (!phoneNumber || !userType) {
        throw new Error('User information not found. Please log in again.');
      }

      setLoading(true);
      setError(null);

      const endpoint = userType === 'seller' 
        ? `http://localhost:8080/api/${userType}/accepted-offers`
        : `http://localhost:8080/api/${userType}/accepted-offers`;

      console.log(`Fetching accepted offers from: ${endpoint}`);
      
      const response = await axios.get(endpoint, {
        params: { phoneNumber },
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Accepted offers response:', response.data);
      
      if (!Array.isArray(response.data)) {
        throw new Error('Received invalid data format from server');
      }

      setAcceptedOffers(response.data);
    } catch (err) {
      console.error('Error fetching accepted offers:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load accepted offers');
    } finally {
      setLoading(false);
    }
  };

  // Update offer status
  const updateOfferStatus = async (offerId, newStatus) => {
    try {
      setLoading(true);
      setError(null);

      const endpoint = userType === 'seller'
        ? `http://localhost:8080/api/${userType}/update-offer-status`
        : `http://localhost:8080/api/${userType}/update-offer-status`;

      console.log(`Updating offer status at: ${endpoint}`);
      
      const response = await axios.post(
        endpoint,
        { phoneNumber, offerId, status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('Update status response:', response.data);
      
      // Update local state to reflect the change
      setAcceptedOffers(current => 
        current.map(offer => 
          offer.id === offerId ? { ...offer, status: newStatus } : offer
        )
      );
      
      setSuccessMessage(`Offer status updated to ${newStatus}`);
      setSuccess(true);
    } catch (err) {
      console.error('Error updating offer status:', err);
      setError(err.response?.data?.message || err.message || 'Failed to update offer status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAcceptedOffers();
  }, []);

  // Filter and sort offers
  const filteredAndSortedOffers = React.useMemo(() => {
    let result = [...acceptedOffers];
    
    // Apply status filter
    if (statusFilter !== 'ALL') {
      result = result.filter(offer => offer.status === statusFilter);
    }
    
    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(offer => 
        offer.wasteName?.toLowerCase().includes(term) ||
        (userType === 'seller' 
          ? offer.buyerName?.toLowerCase().includes(term)
          : offer.sellerName?.toLowerCase().includes(term))
      );
    }
    
    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'product':
          return sortOrder === 'asc' 
            ? (a.wasteName || '').localeCompare(b.wasteName || '')
            : (b.wasteName || '').localeCompare(a.wasteName || '');
        case 'price':
          return sortOrder === 'asc' 
            ? (a.price || 0) - (b.price || 0)
            : (b.price || 0) - (a.price || 0);
        case 'date':
        default:
          return sortOrder === 'asc' 
            ? new Date(a.acceptedDate || 0) - new Date(b.acceptedDate || 0)
            : new Date(b.acceptedDate || 0) - new Date(a.acceptedDate || 0);
      }
    });
    
    return result;
  }, [acceptedOffers, statusFilter, searchTerm, sortBy, sortOrder, userType]);

  // Toggle sort order
  const toggleSortOrder = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const clearError = () => setError(null);
  const closeSuccessAlert = () => setSuccess(false);

  if (loading && acceptedOffers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <CircularProgress color="primary" />
        <p className="mt-4 text-gray-600">Loading accepted offers...</p>
      </div>
    );
  }

  if (!phoneNumber || !userType) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
        <p className="font-bold">Authentication Error</p>
        <p>User information not found. Please log in again.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Accepted Offers</h1>
        <button 
          onClick={fetchAcceptedOffers}
          disabled={loading}
          className="flex items-center bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <RefreshCw size={16} className="mr-2" />
          Refresh
        </button>
      </div>

      {error && (
        <Alert severity="error" className="mb-4" onClose={clearError}>
          {error}
        </Alert>
      )}

      <Snackbar
        open={success}
        autoHideDuration={4000}
        onClose={closeSuccessAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={closeSuccessAlert} severity="success">
          {successMessage}
        </Alert>
      </Snackbar>

      {/* Debug information - can be removed in production */}
      <div className="bg-blue-50 p-4 mb-4 rounded-md text-sm">
        <p><strong>Debug Info:</strong> User: {phoneNumber} ({userType})</p>
        <p>Total offers: {acceptedOffers.length} | Showing: {filteredAndSortedOffers.length}</p>
      </div>

      {/* Filters and Search */}
      <div className="bg-gray-50 rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-md ${statusFilter === 'ALL' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}`}
            >
              All
            </button>
            <button 
              onClick={() => setStatusFilter('PENDING')}
              className={`px-3 py-1 rounded-md flex items-center ${statusFilter === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100'}`}
            >
              <Clock size={16} className="mr-1" /> Pending
            </button>
            <button 
              onClick={() => setStatusFilter('COMPLETED')}
              className={`px-3 py-1 rounded-md flex items-center ${statusFilter === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}
            >
              <CheckCircle size={16} className="mr-1" /> Completed
            </button>
            <button 
              onClick={() => setStatusFilter('CANCELLED')}
              className={`px-3 py-1 rounded-md flex items-center ${statusFilter === 'CANCELLED' ? 'bg-red-100 text-red-800' : 'bg-gray-100'}`}
            >
              <XCircle size={16} className="mr-1" /> Cancelled
            </button>
          </div>
          
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Search by name or product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Offers Table */}
      {filteredAndSortedOffers.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => toggleSortOrder('date')}
                  >
                    Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => toggleSortOrder('product')}
                  >
                    Product {sortBy === 'product' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {userType === 'seller' ? 'Buyer' : 'Seller'}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => toggleSortOrder('price')}
                  >
                    Price {sortBy === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedOffers.map((offer, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(offer.acceptedDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {offer.wasteName || 'Unnamed Product'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {userType === 'seller' ? offer.buyerName || 'N/A' : offer.sellerName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {offer.quantity || 0} {offer.isKgs ? 'kgs' : 'units'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ₹{offer.price || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadges[offer.status || 'PENDING'].color}`}>
                        {statusBadges[offer.status || 'PENDING'].icon}
                        <span className="ml-1">{offer.status || 'PENDING'}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {offer.status === 'PENDING' && (
                          <>
                            <button 
                              onClick={() => updateOfferStatus(offer.id, 'COMPLETED')}
                              disabled={loading}
                              className="text-green-600 hover:text-green-900 disabled:text-gray-400"
                            >
                              Complete
                            </button>
                            <button 
                              onClick={() => updateOfferStatus(offer.id, 'CANCELLED')}
                              disabled={loading}
                              className="text-red-600 hover:text-red-900 disabled:text-gray-400"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {(offer.status === 'COMPLETED' || offer.status === 'CANCELLED') && (
                          <span className="text-gray-500">{offer.status}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">No accepted offers found</p>
          {statusFilter !== 'ALL' && (
            <button 
              onClick={() => setStatusFilter('ALL')}
              className="mt-4 text-blue-500 hover:text-blue-700"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AcceptedOffersPage;