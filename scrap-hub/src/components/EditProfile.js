import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Snackbar, Alert } from '@mui/material';

const EditProfile = () => {
  const userType = localStorage.getItem('userType');
  const phoneNumber = localStorage.getItem('phoneNumber');
  const token = localStorage.getItem('token');

  const [formData, setFormData] = useState({
    name: '',
    pinCode: '',
    company_name: '',
    password: '',
    productPosts: []
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`http://localhost:8080/api/${userType}/get`, {
          params: { phoneNumber },
          headers: { Authorization: `Bearer ${token}` }
        });

        const data = response.data;

        setFormData({
          name: data.name || '',
          pinCode: data.pinCode || data.pincode || '',
          company_name: data.companyName || '',
          password: '',
          productPosts: userType === 'consumer' ? data.requiredProductPosts || [] : data.productPosts || []
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [phoneNumber, userType, token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Validate pin code to be exactly 6 digits
    if (name === 'pinCode') {
      if (value.length > 6 || !/^\d*$/.test(value)) {
        return;
      }
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProductPostChange = (index, field, value) => {
    const updatedPosts = [...formData.productPosts];
    updatedPosts[index] = {
      ...updatedPosts[index],
      [field]: field === 'isKgs' ? JSON.parse(value) : ['noOf', 'price'].includes(field) ? value === '' ? '' : Number(value) : value
    };
    setFormData(prev => ({ ...prev, productPosts: updatedPosts }));
  };
  
  const handleAddProduct = () => {
    const newProduct = { wasteName: '', noOf: '', isKgs: true, price: '' };
    setFormData(prev => ({ ...prev, productPosts: [...prev.productPosts, newProduct] }));
  };

  const handleRemoveProduct = async (index) => {
    const updatedPosts = [...formData.productPosts];
    updatedPosts.splice(index, 1);

    try {
      const payload = {
        phoneNumber,
        ...(userType === 'consumer'
          ? { requiredProductPosts: updatedPosts }
          : { productPosts: updatedPosts })
      };

      await axios.put(`http://localhost:8080/api/${userType}/update`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setFormData(prev => ({ ...prev, productPosts: updatedPosts }));
      setSuccess(true);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update after removal');
      setSuccess(false);
    }
  };

  const handleSave = async () => {
    // Validate pin code before saving
    if (!/^\d{6}$/.test(formData.pinCode)) {
      setError('Pin code must be exactly 6 digits');
      return;
    }

    try {
      const payload = {
        phoneNumber,
        name: formData.name,
        ...(formData.password && { password: formData.password }),
        ...(userType === 'consumer'
          ? {
            pincode: parseInt(formData.pinCode),
            companyName: formData.company_name,
            requiredProductPosts: formData.productPosts
          }
          : {
            pincode: parseInt(formData.pinCode),
            productPosts: formData.productPosts
          })
      };

      await axios.put(
        `http://localhost:8080/api/${userType}/update`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setSuccess(true);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
      setSuccess(false);
    }
  };

  if (loading) {
    return <div>Loading profile...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white shadow-xl rounded-lg mt-10">
      <h2 className="text-3xl font-bold text-center text-green-700 mb-8">
        Edit Your Profile
      </h2>

      {error && <Alert severity="error" className="mb-4">{error}</Alert>}

      <div className="space-y-6">
        <div>
          <label className="block text-lg font-semibold mb-2">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-lg font-semibold mb-2">Phone Number</label>
          <input
            type="text"
            value={phoneNumber}
            readOnly
            className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-lg font-semibold mb-2">New Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Leave blank to keep current password"
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-lg font-semibold mb-2">Pin Code (6 digits)</label>
          <input
            type="text"
            name="pinCode"
            
            value={formData.pinCode}
            onChange={handleChange}
            maxLength={6}
            pattern="\d{6}"
            inputMode="numeric"
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
          />
        </div>

        {userType === 'consumer' && (
          <div>
            <label className="block text-lg font-semibold mb-2">Company Name</label>
            <input
              type="text"
              name="company_name"
              value={formData.company_name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
            />
          </div>
        )}
      </div>

      <div className="mt-10">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-blue-600">
            {userType === 'consumer' ? 'Required Products' : 'Your Posted Products'}
          </h3>
          <button
            onClick={handleAddProduct}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            Add Product
          </button>
        </div>

        {formData.productPosts.length === 0 ? (
          <p className="text-gray-500">No products added yet.</p>
        ) : (
          <div className="space-y-6">
            {formData.productPosts.map((post, index) => (
              <div key={index} className="bg-gray-50 p-5 rounded-lg shadow border border-gray-200">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold">Product #{index + 1}</h4>
                  <button
                    onClick={() => handleRemoveProduct(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold mb-1">Waste Name</label>
                    <input
                      type="text"
                      value={post.wasteName}
                      onChange={(e) => handleProductPostChange(index, 'wasteName', e.target.value)}
                      className="w-full px-4 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Quantity</label>
                    <input
                      type="number"
                      value={post.noOf !== '' ? post.noOf : ''}
                      onChange={(e) => handleProductPostChange(index, 'noOf', e.target.value)}
                      className="w-full px-4 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Measurement</label>
                    <select
                      value={post.isKgs ? 'true' : 'false'}
                      onChange={(e) => handleProductPostChange(index, 'isKgs', e.target.value)}
                      className="w-full px-4 py-2 border rounded-md"
                    >
                      <option value="true">Kilograms</option>
                      <option value="false">Units</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={post.price !== '' ? post.price : ''}
                      onChange={(e) => handleProductPostChange(index, 'price', e.target.value)}
                      className="w-full px-4 py-2 border rounded-md"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-center mt-10">
        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Update Profile'}
        </button>
      </div>

      <Snackbar
        open={success}
        autoHideDuration={4000}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccess(false)} severity="success">
          Profile updated successfully!
        </Alert>
      </Snackbar>
    </div>
  );
};

export default EditProfile;