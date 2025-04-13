import React, { useState } from 'react';
import axiosInstance from '../config/axios';

const TestApiConnection = () => {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState('');

  const testEndpoint = async () => {
    try {
      setLoading(true);
      setResult('');
      const response = await axiosInstance.get('/');
      setResult(JSON.stringify(response.data, null, 2));
    } catch (error) {
      setResult(`Lỗi: ${error.message}\n${error.response ? JSON.stringify(error.response.data, null, 2) : 'Không có response data'}`);
    } finally {
      setLoading(false);
    }
  };

  const testDeleteUser = async () => {
    if (!userId) {
      setResult('Vui lòng nhập ID người dùng');
      return;
    }

    try {
      setLoading(true);
      setResult('');
      console.log(`Đang gọi API xóa người dùng: /auth/users/${userId}`);
      const response = await axiosInstance.delete(`/auth/users/${userId}`);
      setResult(JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.error('Lỗi trong quá trình xóa:', error);
      setResult(`Lỗi: ${error.message}\n${error.response ? JSON.stringify(error.response.data, null, 2) : 'Không có response data'}`);
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      padding: '20px',
      maxWidth: '800px',
      margin: '0 auto',
      backgroundColor: '#f5f5f5',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    },
    title: {
      borderBottom: '2px solid #333',
      paddingBottom: '10px',
      marginBottom: '20px',
      color: '#333'
    },
    button: {
      padding: '10px 15px',
      backgroundColor: '#007bff',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      marginRight: '10px',
      marginBottom: '10px'
    },
    deleteButton: {
      backgroundColor: '#dc3545',
    },
    input: {
      padding: '8px',
      borderRadius: '4px',
      border: '1px solid #ccc',
      marginRight: '10px',
      marginBottom: '10px'
    },
    result: {
      marginTop: '20px',
      padding: '15px',
      backgroundColor: '#fff',
      border: '1px solid #ddd',
      borderRadius: '4px',
      whiteSpace: 'pre-wrap'
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Kiểm tra API</h2>
      
      <div>
        <button 
          style={styles.button} 
          onClick={testEndpoint} 
          disabled={loading}
        >
          Kiểm tra Welcome Endpoint
        </button>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>Kiểm tra xóa người dùng</h3>
        <input
          type="text"
          placeholder="ID người dùng"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          style={styles.input}
        />
        <button 
          style={{...styles.button, ...styles.deleteButton}} 
          onClick={testDeleteUser} 
          disabled={loading}
        >
          Xóa người dùng
        </button>
      </div>

      {loading && <p>Đang tải...</p>}
      
      {result && (
        <div style={styles.result}>
          <h4>Kết quả:</h4>
          {result}
        </div>
      )}
    </div>
  );
};

export default TestApiConnection; 