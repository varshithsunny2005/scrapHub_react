import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const OfferPage = () => {
  const { productId, userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get product and user data passed from the search page
  const productData = location.state?.product;
  const userData = location.state?.user;
  const role = location.state?.role || localStorage.getItem('userType');
  
  const [offer, setOffer] = useState({
    reqQuantity: 1,
    reqPrice: 0,
    reqPhoneNumber: ''
  });
  
  const [product, setProduct] = useState(productData || null);
  const [user, setUser] = useState(userData || null);
  const [isLoading, setIsLoading] = useState(!productData || !userData);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Get the user's phone number from local storage
    const phone = localStorage.getItem('phoneNumber');
    if (phone) {
      setOffer(prev => ({ ...prev, reqPhoneNumber: phone }));
    }

    // If we don't have product or user data from navigation state, fetch it
    const fetchData = async () => {
      if (!productData || !userData) {
        setIsLoading(true);
        try {
          const token = localStorage.getItem('token');
          
          // Determine the correct API endpoints based on the role
          const userEndpoint = role === 'seller' 
            ? `http://localhost:8080/api/consumer/${userId}`
            : `http://localhost:8080/api/seller/${userId}`;
          
          const userResponse = await axios.get(userEndpoint, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          setUser(userResponse.data);
          
          // Find the product in the user's product list
          const userProductList = role === 'seller'
            ? userResponse.data.requiredProductPosts
            : userResponse.data.productPosts;
          
          const foundProduct = userProductList?.find(p => p._id === productId || p.id === productId);
          
          if (foundProduct) {
            setProduct(foundProduct);
            setOffer(prev => ({
              ...prev,
              reqPrice: foundProduct.price || 0
            }));
          } else {
            setError('Product not found');
          }
        } catch (err) {
          setError('Failed to load details. Please try again.');
          console.error('Error fetching details:', err);
        } finally {
          setIsLoading(false);
        }
      } else {
        // If we have product data, set the initial price
        setOffer(prev => ({
          ...prev,
          reqPrice: productData.price || 0
        }));
      }
    };

    fetchData();
  }, [productId, userId, productData, userData, role]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setOffer({
      ...offer,
      [name]: name === 'reqPhoneNumber' ? value : parseInt(value, 10) || 0
    });
  };

  const calculateTotal = () => {
    return (offer.reqQuantity * offer.reqPrice).toFixed(2);
  };

  const handleSubmitOffer = async (e) => {
    e.preventDefault();
    
    if (offer.reqQuantity <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    if (offer.reqPrice <= 0) {
      setError('Price must be greater than 0');
      return;
    }

    const maxQuantity = product.quantity || product.noOf || product.amount || 0;
    if (offer.reqQuantity > maxQuantity) {
      setError(`Quantity cannot exceed available amount (${maxQuantity})`);
      return;
    }

    if (!offer.reqPhoneNumber) {
      setError('Phone number is required');
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // The endpoint depends on whether we're a consumer making an offer to a seller,
      // or a seller making an offer to a consumer
      const endpoint = role === 'consumer'
        ? `http://localhost:8080/api/offers/seller/${productId}/${userId}`
        : `http://localhost:8080/api/offers/consumer/${productId}/${userId}`;
      
      const response = await axios.post(
        endpoint,
        offer,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      );

      setSuccess(true);
      setTimeout(() => {
        navigate('/search');
      }, 2000);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to submit offer. Please try again.';
      setError(errorMessage);
      console.error('Error submitting offer:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-4 w-4 bg-green-600 rounded-full mx-1"></div>
          <div className="h-4 w-4 bg-green-600 rounded-full mx-1 animate-pulse delay-150"></div>
          <div className="h-4 w-4 bg-green-600 rounded-full mx-1 animate-pulse delay-300"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!product || !user) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || "Product or user information could not be loaded."}
        </div>
        <div className="mt-4">
          <button 
            onClick={() => navigate('/search')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Go Back to Search
          </button>
        </div>
      </div>
    );
  }

  const productName = product.productName || product.wasteName || product.name || 'Product';
  const isKgs = product.isKgs || product.weightBased || false;
  const maxQuantity = product.quantity || product.noOf || product.amount || 0;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <button 
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center text-gray-600 hover:text-gray-900"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        Back to Search
      </button>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-green-600 text-white px-6 py-4">
          <h1 className="text-2xl font-bold">Make an Offer</h1>
        </div>

        <div className="p-6">
          <div className="mb-6 bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold">{productName}</h2>
                <p className="text-gray-600">
                  {role === 'consumer' ? 'Sold by' : 'Required by'}: {user.name}
                </p>
                {user.companyName && (
                  <p className="text-gray-600 text-sm">Company: {user.companyName}</p>
                )}
              </div>
              <div className="text-right">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                  ₹{product.price}/{isKgs ? 'kg' : 'unit'}
                </span>
                <p className="text-sm mt-1">Available: {maxQuantity} {isKgs ? 'kg' : 'unit(s)'}</p>
              </div>
            </div>
            
            {product.description && (
              <div className="mt-4 text-gray-700">
                <p>{product.description}</p>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
              Offer submitted successfully! Redirecting...
            </div>
          )}

          <form onSubmit={handleSubmitOffer}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Quantity ({isKgs ? 'kg' : 'units'})
                </label>
                <input
                  type="number"
                  name="reqQuantity"
                  value={offer.reqQuantity}
                  onChange={handleInputChange}
                  min="1"
                  max={maxQuantity}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum available: {maxQuantity} {isKgs ? 'kg' : 'unit(s)'}
                </p>
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Offer Price per {isKgs ? 'kg' : 'unit'} (₹)
                </label>
                <input
                  type="number"
                  name="reqPrice"
                  value={offer.reqPrice}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Original price: ₹{product.price || 0}/{isKgs ? 'kg' : 'unit'}
                </p>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Your Phone Number
                </label>
                <input
                  type="tel"
                  name="reqPhoneNumber"
                  value={offer.reqPhoneNumber}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter your phone number"
                  disabled={offer.reqPhoneNumber}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  This will be shared with {user.name} to contact you
                </p>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Total Offer Value
                </label>
                <div className="w-full border border-gray-200 rounded px-3 py-2 bg-gray-50 font-bold text-lg">
                  ₹{calculateTotal()}
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 mt-4">
              <button
                type="submit"
                disabled={isLoading || success}
                className={`w-full py-3 rounded-lg font-medium text-white 
                  ${isLoading || success 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700'}`}
              >
                {isLoading ? 'Submitting...' : success ? 'Offer Sent!' : 'Submit Offer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OfferPage;