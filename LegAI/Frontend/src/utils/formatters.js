/**
 * Định dạng ngày tháng
 * @param {string} dateString - Chuỗi ngày tháng cần định dạng
 * @returns {string} Chuỗi ngày tháng đã định dạng theo định dạng Việt Nam
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    const options = { 
      year: 'numeric', 
      month: 'numeric', 
      day: 'numeric',
    };
    
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  } catch (error) {
    console.error('Lỗi khi định dạng ngày tháng:', error);
    return 'N/A';
  }
};

/**
 * Định dạng số tiền
 * @param {number|string} amount - Số tiền cần định dạng
 * @param {string} currency - Đơn vị tiền tệ (mặc định: VNĐ)
 * @returns {string} Chuỗi số tiền đã định dạng
 */
export const formatCurrency = (amount, currency = 'VNĐ') => {
  if (amount === null || amount === undefined) return 'N/A';
  
  try {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    return `${numAmount.toLocaleString('vi-VN')} ${currency}`;
  } catch (error) {
    console.error('Lỗi khi định dạng số tiền:', error);
    return 'N/A';
  }
};

/**
 * Định dạng ngày tháng có giờ phút
 * @param {string} dateString - Chuỗi ngày tháng cần định dạng
 * @returns {string} Chuỗi ngày tháng đã định dạng theo định dạng Việt Nam kèm giờ phút
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    const options = { 
      year: 'numeric', 
      month: 'numeric', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  } catch (error) {
    console.error('Lỗi khi định dạng ngày tháng có giờ phút:', error);
    return 'N/A';
  }
}; 