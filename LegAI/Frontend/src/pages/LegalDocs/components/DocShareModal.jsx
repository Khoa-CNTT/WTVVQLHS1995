import { useState } from 'react';
import { toast } from 'react-toastify';
import styles from './DocShareModal.module.css';
import * as legalDocService from '../../../services/legalDocService';
import userService from '../../../services/userService';
import axios from 'axios';

const DocShareModal = ({ doc, onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [permissions, setPermissions] = useState('view');
  const [expiryDate, setExpiryDate] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [sharedWith, setSharedWith] = useState(doc.shared_with || []);

  // Xử lý chia sẻ tài liệu
  const handleShare = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Vui lòng nhập email người nhận');
      return;
    }
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Email không hợp lệ');
      return;
    }

    setIsSharing(true);    
    try {
      // LẤY NGƯỜI DÙNG THEO EMAIL BẰNG SERVICE
      let userId = null;
      let userData = null;
      
      try {
        // Sử dụng service để tìm người dùng theo email
        const findUserResult = await userService.findUserByEmail(email);
        
        if (findUserResult && findUserResult.success && findUserResult.data) {
          userId = findUserResult.data.id;
          userData = findUserResult.data;
          
          // Kiểm tra ID người dùng là số hợp lệ
          if (!userId || isNaN(parseInt(userId))) {
            toast.error('ID người dùng không hợp lệ. Vui lòng thử lại với email khác.');
            setIsSharing(false);
            return;
          }
        } else {
          const errorMessage = findUserResult?.message || 'Không tìm thấy người dùng với email này';
          toast.error(errorMessage);
          setIsSharing(false);
          return;
        }
      } catch (findError) {
        console.error('Lỗi khi tìm kiếm người dùng theo email:', findError);
        
        // Hiển thị thông báo mô tả chi tiết hơn
        if (findError.response) {
          toast.error(`Lỗi tìm kiếm người dùng: ${findError.response.status} - ${findError.response.statusText}`);
        } else {
          toast.error('Không thể tìm thấy người dùng. Vui lòng thử lại sau.');
        }
        
        setIsSharing(false);
        return;
      }
      
      // Hiển thị thông báo khi tìm thấy người dùng
      toast.info(`Đang chia sẻ tài liệu với ${userData.full_name || userData.username || email}...`);
      
      // Bước 2: Chuyển đổi quyền thành mảng đúng định dạng
      let permissionArray = [];
      if (permissions === 'view') permissionArray = ['read'];
      else if (permissions === 'edit') permissionArray = ['read', 'edit'];
      else if (permissions === 'full') permissionArray = ['read', 'edit', 'delete'];
      
      const shareData = {
        shared_with: parseInt(userId),
        permissions: permissionArray,
        valid_until: expiryDate || null
      };
      
      
      try {
        const response = await legalDocService.shareLegalDoc(doc.id, shareData);
        
        if (response && response.success) {
          setEmail('');
          
          // Cập nhật danh sách người được chia sẻ
          if (response.data && response.data.shared_with) {
            setSharedWith(response.data.shared_with);
          } else {
            // Nếu API không trả về danh sách cập nhật, thêm vào danh sách hiện tại
            const newSharedUser = {
              id: userId,
              email: email,
              username: userData?.username || email.split('@')[0],
              permissions: permissionArray,
              shared_at: new Date().toISOString()
            };
            setSharedWith([...sharedWith, newSharedUser]);
          }
          
          if (onSuccess) {
            onSuccess();
          }
        } else {
          toast.error(response?.message || 'Không thể chia sẻ tài liệu');
        }
      } catch (shareError) {
        console.error("Lỗi khi chia sẻ tài liệu:", shareError);
        if (shareError.response) {
          toast.error(`Lỗi khi chia sẻ: ${shareError.response.status} - ${shareError.response.data?.message || 'Người dùng không tồn tại hoặc đã bị xóa'}`);
        } else {
          toast.error('Có lỗi xảy ra khi chia sẻ tài liệu');
        }
      }
    } catch (error) {
      console.error(error);
      if (error.response && error.response.data && error.response.data.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Có lỗi xảy ra khi chia sẻ tài liệu');
      }
    } finally {
      setIsSharing(false);
    }
  };

  // Xử lý hủy chia sẻ
  const handleUnshare = async (userId) => {
    if (window.confirm('Bạn có chắc chắn muốn hủy chia sẻ tài liệu này?')) {
      try {
        const response = await legalDocService.unshareLegalDoc(doc.id, userId);
        
        if (response.success) {
          toast.success('Đã hủy chia sẻ tài liệu');
          
          // Xóa người dùng khỏi danh sách
          const newSharedWith = sharedWith.filter(user => user.id !== userId);
          setSharedWith(newSharedWith);
          
          if (onSuccess) {
            onSuccess(response.data);
          }
        } else {
          toast.error(response.message || 'Không thể hủy chia sẻ tài liệu');
        }
      } catch (error) {
        console.error(error);
        toast.error('Có lỗi xảy ra khi hủy chia sẻ tài liệu');
      }
    }
  };

  // Format ngày tháng
  const formatDate = (dateString) => {
    if (!dateString) return 'Không giới hạn';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  };

  // Lấy tên quyền hạn
  const getPermissionName = (permission) => {
    switch (permission) {
      case 'view':
        return 'Xem';
      case 'edit':
        return 'Chỉnh sửa';
      case 'full':
        return 'Toàn quyền';
      default:
        return 'Xem';
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>Chia sẻ hồ sơ pháp lý</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.docInfo}>
            <div className={styles.docTitle}>
              <i className={`fas fa-file-${getFileIcon(doc.file_type)}`}></i>
              <h3>{doc.title}</h3>
            </div>
            <div className={styles.docCategory}>
              <span>{doc.category}</span>
            </div>
          </div>

          <form onSubmit={handleShare} className={styles.shareForm}>
            <div className={styles.formGroup}>
              <label htmlFor="email">Email người nhận</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập email người nhận"
                required
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="permissions">Quyền hạn</label>
                <select
                  id="permissions"
                  value={permissions}
                  onChange={(e) => setPermissions(e.target.value)}
                >
                  <option value="view">Chỉ xem</option>
                  <option value="edit">Chỉnh sửa</option>
                  <option value="full">Toàn quyền</option>
                </select>
              </div>

              {/* <div className={styles.formGroup}>
                <label htmlFor="expiryDate">Ngày hết hạn (tùy chọn)</label>
                <input
                  type="date"
                  id="expiryDate"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]} // Ngày hiện tại trở đi
                />
              </div> */}
            </div>

            <button
              type="submit"
              className={styles.shareButton}
              disabled={isSharing}
            >
              {isSharing ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Đang chia sẻ...
                </>
              ) : (
                <>
                  <i className="fas fa-share-alt"></i> Chia sẻ
                </>
              )}
            </button>
          </form>

          {sharedWith && sharedWith.length > 0 && (
            <div className={styles.sharedList}>
              <h3>Đã chia sẻ với</h3>
              <ul>
                {sharedWith.map(user => (
                  <li key={user.id} className={styles.sharedItem}>
                    <div className={styles.sharedUser}>
                      <div className={styles.userAvatar}>
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt={user.name || user.email} />
                        ) : (
                          <span>{user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className={styles.userInfo}>
                        <p className={styles.userName}>{user.name || user.email}</p>
                        <div className={styles.userMeta}>
                          <span className={styles.userPermission}>
                            {getPermissionName(user.permissions)}
                          </span>
                          {user.expiry_date && (
                            <span className={styles.userExpiry}>
                              Hết hạn: {formatDate(user.expiry_date)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button 
                      className={styles.unshareButton}
                      onClick={() => handleUnshare(user.id)}
                      title="Hủy chia sẻ"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.cancelButton} onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

// Hàm xác định icon dựa trên loại file
const getFileIcon = (fileType) => {
  const type = fileType ? fileType.toLowerCase() : '';
  
  switch (type) {
    case 'pdf':
      return 'pdf';
    case 'docx':
    case 'doc':
      return 'word';
    case 'xlsx':
    case 'xls':
      return 'excel';
    case 'pptx':
    case 'ppt':
      return 'powerpoint';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return 'image';
    case 'txt':
      return 'alt';
    default:
      return 'alt';
  }
};

export default DocShareModal; 