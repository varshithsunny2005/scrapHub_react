import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Snackbar, Alert, CircularProgress } from '@mui/material';

const OffersManagement = () => {
  const userType = localStorage.getItem('userType');
  const phoneNumber = localStorage.getItem('phoneNumber');
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    console.log('Fetching offers on component mount...');
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      setError(null);

      const endpoint = userType === 'consumer' 
        ? `http://localhost:8080/api/${userType}/get`
        : `http://localhost:8080/api/${userType}/offers`;

      console.log(`Fetching offers from endpoint: ${endpoint} for phoneNumber: ${phoneNumber}`);

      const response = await axios.get(endpoint, {
        params: { phoneNumber },
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('API Response:', response.data);

      let extractedOffers = [];
      if (userType === 'consumer') {
        if (response.data && response.data.requiredProductPosts) {
          extractedOffers = response.data.requiredProductPosts.flatMap((product, index) => {
            console.log(`Processing product at index ${index}:`, product);
            if (!product || !Array.isArray(product.offersReceived)) {
              return [];
            }
            return product.offersReceived.map(offer => ({
              ...offer,
              productIndex: index,
              productName: product.wasteName || 'Unnamed Product',
              productPrice: product.price || 0,
              productQuantity: product.noOf || 0,
              isKgs: Boolean(product.isKgs)
            }));
          });
        }
      } else {
        // Modified for seller to handle the specific response format
        if (Array.isArray(response.data)) {
          extractedOffers = response.data.map((item, index) => {
            console.log(`Processing offer at index ${index}:`, item);
            
            // Extract data from the offer object and productPost object
            const offer = item.offer || {};
            const productPost = item.productPost || {};
            
            return {
              ...offer,
              productIndex: index,
              productName: productPost.wasteName || 'Unnamed Product',
              productPrice: productPost.price || 0,
              productQuantity: offer.reqQuantity || 0,
              isKgs: Boolean(productPost.isKgs),
              reqPhoneNumber: offer.reqPhoneNumber,
              reqPrice: offer.reqPrice
            };
          });
        } else {
          console.error('Unexpected response format for seller offers:', response.data);
          setError('Received unexpected data format from server');
        }
      }

      console.log('Extracted Offers:', extractedOffers);
      setOffers(extractedOffers);
    } catch (err) {
      console.error('Error fetching offers:', err);
      if (err.response) {
        console.error('Error response:', err.response.status, err.response.data);
        setError(`Error (${err.response.status}): ${err.response.data?.message || 'Failed to fetch offers'}`);
      } else if (err.request) {
        console.error('No response received');
        setError('Network error: Failed to reach the server');
      } else {
        console.error('Error message:', err.message);
        setError(`Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOffer = async (offer, productIndex) => {
    try {
      setLoading(true);
      console.log('Accepting offer:', {
        phoneNumber,
        productIndex,
        counterPartyPhone: offer.reqPhoneNumber,
        quantity: offer.reqQuantity,
        price: offer.reqPrice
      });

      const response = await axios.post(
        `http://localhost:8080/api/${userType}/accept-offer`,
        {
          phoneNumber,
          productIndex,
          counterPartyPhone: offer.reqPhoneNumber,
          quantity: offer.reqQuantity,
          price: offer.reqPrice
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Accept offer response:', response.data);
      setSuccessMessage('Offer accepted successfully! Order created.');
      setSuccess(true);

      setTimeout(() => fetchOffers(), 1500);
    } catch (err) {
      console.error('Error accepting offer:', err);
      const errorMessage = err.response?.data?.message || 'Failed to accept offer';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectOffer = async (offer, productIndex) => {
    try {
      setLoading(true);
      console.log('Rejecting offer:', {
        phoneNumber,
        productIndex,
        counterPartyPhone: offer.reqPhoneNumber
      });

      const response = await axios.post(
        `http://localhost:8080/api/${userType}/reject-offer`,
        {
          phoneNumber,
          productIndex,
          counterPartyPhone: offer.reqPhoneNumber
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Reject offer response:', response.data);
      setSuccessMessage('Offer rejected successfully!');
      setSuccess(true);

      setTimeout(() => fetchOffers(), 1500);
    } catch (err) {
      console.error('Error rejecting offer:', err);
      const errorMessage = err.response?.data?.message || 'Failed to reject offer';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleContact = (contactPhoneNumber) => {
    if (!contactPhoneNumber) {
      console.error('Contact information is missing');
      setError('Contact information is missing');
      return;
    }
    console.log(`Navigating to chat with phone number: ${contactPhoneNumber}`);
    navigate(`/chat/${encodeURIComponent(contactPhoneNumber)}`);
  };

  const clearError = () => {
    console.log('Clearing error...');
    setError(null);
  };

  const closeSuccessAlert = () => {
    console.log('Closing success alert...');
    setSuccess(false);
  };

  if (loading && offers.length === 0) {
    console.log('Loading offers...');
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <CircularProgress color="primary" />
        <p className="mt-4 text-gray-600">Loading offers...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">
          {'Offers Received'}
        </h2>
        <div className="flex items-center">
          {loading && <CircularProgress size={20} className="mr-3" />}
          <button 
            onClick={fetchOffers}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition"
            disabled={loading}
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <Alert 
          severity="error" 
          className="mb-4"
          onClose={clearError}
        >
          {error}
        </Alert>
      )}

      {offers.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-lg">
            {userType === 'consumer' 
              ? 'You have not received any offers yet.' 
              : 'You have not made any offers yet.'}
          </p>
          <p className="text-gray-400 mt-2">
            Check back later or refresh to see updates.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {offers.map((offer, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-blue-600">
                  {offer.productName || 'Unnamed Product'}
                </h3>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                  {offer.isKgs ? `${offer.reqQuantity} kgs` : `${offer.reqQuantity} units`}
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-4">
                <div>
                  <p className="text-gray-600">Offered Price:</p>
                  <p className="text-xl font-bold">₹{offer.reqPrice || 0}</p>
                </div>
                <div>
                  <p className="text-gray-600">Original Price:</p>
                  <p className="text-xl">₹{offer.productPrice || 0}</p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-gray-600">
                  {userType === 'consumer' ? 'From Seller:' : 'To Consumer:'}
                </p>
                <p className="font-medium">{offer.reqPhoneNumber || 'Unknown'}</p>
              </div>

              {userType === 'consumer' ? (
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleAcceptOffer(offer, offer.productIndex)}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Accept Offer
                  </button>
                  <button
                    onClick={() => handleRejectOffer(offer, offer.productIndex)}
                    disabled={loading}
                    className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Reject Offer
                  </button>
                  <button
                    onClick={() => handleContact(offer.reqPhoneNumber)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition"
                  >
                    Contact Seller
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleAcceptOffer(offer, offer.productIndex)}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Accept Offer
                  </button>
                  <button
                    onClick={() => handleRejectOffer(offer, offer.productIndex)}
                    disabled={loading}
                    className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Reject Offer
                  </button>
                  <button
                    onClick={() => handleContact(offer.reqPhoneNumber)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition"
                  >
                    Contact Consumer
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
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
    </div>
  );
};

export default OffersManagement;