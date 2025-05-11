import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [userType, setUserType] = useState('consumer');
  const [form, setForm] = useState({
    name: '',
    phoneNumber: '',
    password: '',
    companyName: '',
    pinCode: ''
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Validation for phone number (10 digits)
    if (name === 'phoneNumber' && value.length > 10) {
      return;
    }
    
    // Validation for pin code (6 digits)
    if (name === 'pinCode' && value.length > 6) {
      return;
    }
    
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Additional client-side validation
    if (!isLogin && form.pinCode.length !== 6) {
      alert('Pin code must be 6 digits');
      return;
    }
    
    if (form.phoneNumber.length !== 10) {
      alert('Phone number must be 10 digits');
      return;
    }

    try {
      const endpoint = isLogin ? 'login' : 'register';
      const url = `http://localhost:8080/api/auth/${endpoint}-${userType}`;

      const payload = isLogin
        ? {
          phoneNumber: form.phoneNumber,
          password: form.password
        }
        : {
          name: form.name,
          phoneNumber: form.phoneNumber,
          password: form.password,
          pinCode: parseInt(form.pinCode),
          companyName: userType === 'consumer' ? form.companyName : ''
        };

      const response = await axios.post(url, payload);

      if (isLogin) {
        localStorage.setItem('token', response.data);
        localStorage.setItem('userType', userType);
        localStorage.setItem('phoneNumber', form.phoneNumber);
        alert('Login successful');
        navigate('/dashboard');
      } else {
        alert(response.data);
        setIsLogin(true);
      }
    } catch (error) {
      alert(error.response?.data || 'Something went wrong');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-r from-green-300 via-blue-500 to-purple-600 p-4 animate-gradient">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10">

        {/* Stylish ScrapHub Text Logo */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 text-transparent bg-clip-text tracking-wide">
            ScrapHub
          </h1>
        </div>

        <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">
          {isLogin ? 'Login' : 'Register'} as {userType.charAt(0).toUpperCase() + userType.slice(1)}
        </h2>

        <div className="flex justify-center mb-6 gap-4">
          {['consumer', 'seller'].map(type => (
            <button
              key={type}
              onClick={() => setUserType(type)}
              className={`px-4 py-2 rounded-full font-semibold transition ${userType === type
                  ? 'bg-green-600 text-white scale-105 shadow'
                  : 'bg-gray-200 text-gray-700 hover:bg-green-100'
                }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <>
              <input
                name="name"
                placeholder="Name"
                onChange={handleChange}
                required
                className="border rounded-md p-2"
              />
              {userType === 'consumer' && (
                <input
                  name="companyName"
                  placeholder="Company Name"
                  onChange={handleChange}
                  required
                  className="border rounded-md p-2"
                />
              )}
              <input
                name="pinCode"
                type="number"
                placeholder="Pin Code (6 digits)"
                onChange={handleChange}
                value={form.pinCode}
                required
                maxLength={6}
                className="border rounded-md p-2"
              />
            </>
          )}
          <input
            name="phoneNumber"
            type="number"
            placeholder="Phone Number (10 digits)"
            onChange={handleChange}
            value={form.phoneNumber}
            required
            maxLength={10}
            className="border rounded-md p-2"
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            onChange={handleChange}
            required
            className="border rounded-md p-2"
          />

          <button type="submit" className="bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition">
            {isLogin ? 'Login' : 'Register'}
          </button>
          <div className="text-right text-sm text-blue-600 hover:underline cursor-pointer" onClick={() => alert('Forgot Password flow coming soon!')}>
            Forgot Password?
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-gray-700">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button onClick={() => setIsLogin(!isLogin)} className="ml-2 text-blue-600 hover:underline">
            {isLogin ? 'Register' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;