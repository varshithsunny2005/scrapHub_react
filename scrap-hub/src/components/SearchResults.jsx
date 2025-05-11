import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const SearchPage = () => {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const role = localStorage.getItem('userType'); // "consumer" or "seller"
  const navigate = useNavigate();

  const handleSearch = async () => {
    if (!keyword.trim()) {
      setError('Please enter a search keyword');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await axios.get(`http://localhost:8080/api/search`, {
        params: {
          keyword: keyword,
          role: role
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      setResults(response.data || []);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Search failed. Please try again.';
      setError(errorMessage);
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  useEffect(() => {
    if (keyword.trim()) {
      handleSearch();
    }
  }, []);

  const highlightMatch = (text, query) => {
    if (!text || !query) return text;

    const regex = new RegExp(`(${query})`, 'gi');
    const parts = String(text).split(regex);

    return parts.map((part, i) =>
      regex.test(part) ?
        <span key={i} className="bg-yellow-200">{part}</span> :
        part
    );
  };

  const getMatchingProducts = (user) => {
    if (!user) return [];

    const productFields = [
      'productPosts',
      'products',
      'sellingProducts',
      'wasteItems',
      'requiredProductPosts',
      'requirements',
      'requiredProducts'
    ];

    const matchingProducts = [];

    // Search through all possible product fields
    for (const field of productFields) {
      if (Array.isArray(user[field])) {
        // Find all products that match the keyword in their name
        const matches = user[field].filter(product => {
          const productName = (
            product.wasteName ||
            product.name ||
            product.productName ||
            ''
          ).toLowerCase();
          return productName.includes(keyword.toLowerCase());
        });

        matchingProducts.push(...matches);
      }
    }

    return matchingProducts;
  };

  const getProductName = (product) => {
    return product.wasteName || product.name || product.productName || 'Unnamed Product';
  };

  const getProductQuantity = (product) => {
    return product.noOf || product.quantity || product.amount || 0;
  };

  const isWeightBased = (product) => {
    return product.isKgs || product.weightBased || false;
  };

  const getProductDescription = (product) => {
    return product.description || product.details || product.info || '';
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">
        {role === 'seller' ? 'Find Consumers' : 'Find Sellers'}
      </h1>

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="Search across all fields"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyPress={handleKeyPress}
          className="border border-gray-300 rounded px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-500"
          disabled={isLoading}
        />
        <button
          onClick={handleSearch}
          disabled={isLoading}
          className={`px-4 py-2 rounded font-medium ${isLoading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {error && (
        <div className="text-red-500 mb-4 p-2 bg-red-50 rounded border border-red-200">
          {error}
        </div>
      )}

      <div className="mt-6">
        {!isLoading && results.length === 0 && keyword && (
          <div className="text-gray-500 text-center p-4 bg-gray-50 rounded">
            No results found for "{keyword}". Try a different keyword.
          </div>
        )}

        {isLoading && (
          <div className="text-center p-8">
            <div className="animate-pulse flex justify-center">
              <div className="h-4 w-4 bg-green-600 rounded-full mx-1"></div>
              <div className="h-4 w-4 bg-green-600 rounded-full mx-1 animate-pulse delay-150"></div>
              <div className="h-4 w-4 bg-green-600 rounded-full mx-1 animate-pulse delay-300"></div>
            </div>
          </div>
        )}

        {!isLoading && results.map((user) => {
          const matchingProducts = getMatchingProducts(user);

          if (matchingProducts.length === 0) return null;

          return matchingProducts.map((product) => {
            const productName = getProductName(product);
            const quantity = getProductQuantity(product);
            const isKgs = isWeightBased(product);
            const description = getProductDescription(product);
            const price = product.price || 0;
            const totalValue = (price * quantity).toFixed(2);
            const productId = product.id || product._id;
            const userId = user.id || user._id;

            return (
              <div key={`${userId}-${productId}`} className="border border-gray-200 p-4 rounded-lg mb-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold">{highlightMatch(user.name, keyword)}</h2>
                    <p className="text-sm text-gray-700">
                      Pin Code: {highlightMatch(user.pincode, keyword) || 'Not specified'}
                    </p>
                    {role === 'seller' && user.companyName && (
                      <p className="text-sm text-gray-700">Company: {highlightMatch(user.companyName, keyword)}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      {role === 'seller' ? 'Consumer' : 'Seller'}
                    </span>
                    <p className="text-sm mt-1">
                      <a href={`tel:${user.phoneNumber}`} className="text-blue-600 hover:underline flex items-center justify-end">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {user.phoneNumber}
                      </a>
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-800 mb-3 border-b border-gray-200 pb-2">
                    Matching Product
                  </h4>

                  <div className="bg-white p-3 rounded border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-lg">
                        {highlightMatch(productName, keyword)}
                      </span>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                        ₹{price}/{isKgs ? 'kg' : 'unit'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center">
                        <span className="mr-2 font-medium">Quantity:</span>
                        <span>{quantity} {isKgs ? 'kg' : 'unit(s)'}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="mr-2 font-medium">Total Value:</span>
                        <span>₹{totalValue}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="mr-2 font-medium">Type:</span>
                        <span>{isKgs ? 'Weight-based' : 'Unit-based'}</span>
                      </div>
                      {product.category && (
                        <div className="flex items-center">
                          <span className="mr-2 font-medium">Category:</span>
                          <span>{highlightMatch(product.category, keyword)}</span>
                        </div>
                      )}
                      {description && (
                        <div className="col-span-2 mt-2">
                          <span className="font-medium">Description:</span>
                          <p className="text-gray-700 mt-1">{highlightMatch(description, keyword)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-200 flex justify-end">
                  <button
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center"
                    onClick={() => {
                      if (!productId) {
                        console.error("Product ID is missing");
                        return;
                      }

                      if (!userId) {
                        console.error("User ID is missing");
                        return;
                      }

                      navigate(`/offer/${productId}/${userId}`, {
                        state: {
                          product,
                          user,
                          role
                        }
                      });
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c.27-.67.75-1 1.5-1s1.23.33 1.5 1m-1.5 1v3m0 4v.01M20.66 4.34a8 8 0 00-11.32 0l-.79.79a8 8 0 000 11.32l.79.79a8 8 0 0011.32 0l.79-.79a8 8 0 000-11.32l-.79-.79z" />
                    </svg>
                    Give {user.name}
                  </button>
                </div>
              </div>
            );
          });
        })}
      </div>
    </div>
  );
};

export default SearchPage;