import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./form_sign_up.module.css";
import authService from "../../../services/authService";
import userService from "../../../services/userService";

function LawyerRegisterForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [errors, setErrors] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [previewAvatar, setPreviewAvatar] = useState(null);
  const [previewCertification, setPreviewCertification] = useState(null);
  
  const [formData, setFormData] = useState({
    // Thông tin cơ bản (từ tài khoản người dùng)
    username: "",
    email: "",
    phone: "",
    fullName: "",
    
    // Thông tin profile
    address: "",
    avatarFile: null,
    bio: "",
    
    // Thông tin luật sư
    certification: "",
    experienceYears: "0",
    specialization: [],
    
    // Thông tin bổ sung
    idCard: "",
    birthDate: "",
    licenseNumber: "",
    barAssociation: "",
    lawOffice: "",
    certificationFile: null,
    agree: false,
  });

  // Kiểm tra người dùng đã đăng nhập và lấy thông tin
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      
      // Điền thông tin từ người dùng đã đăng nhập
      setFormData(prevData => ({
        ...prevData,
        username: user.username || "",
        email: user.email || "",
        phone: user.phone || "",
        fullName: user.fullName || "",
      }));
    } else {
      // Nếu không có người dùng đăng nhập, chuyển hướng về trang đăng nhập
      navigate("/login");
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === "file") {
      if (files && files[0]) {
        setFormData({ ...formData, [name]: files[0] });
        
        // Tạo URL xem trước cho tệp đã chọn
        const fileUrl = URL.createObjectURL(files[0]);
        if (name === "avatarFile") {
          setPreviewAvatar(fileUrl);
        } else if (name === "certificationFile") {
          setPreviewCertification(fileUrl);
        }
      }
    } else if (type === "checkbox" && name === "specialization") {
      const updated = checked
        ? [...formData.specialization, value]
        : formData.specialization.filter((item) => item !== value);
      setFormData({ ...formData, specialization: updated });
    } else if (type === "checkbox") {
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
      
      // Xóa lỗi khi người dùng bắt đầu chỉnh sửa
      if (errors[name]) {
        setErrors({ ...errors, [name]: "" });
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Kiểm tra các trường bắt buộc
    const requiredFields = [
      { field: "address", message: "Vui lòng nhập địa chỉ" },
      { field: "idCard", message: "Vui lòng nhập số CCCD/CMND" },
      { field: "licenseNumber", message: "Vui lòng nhập số thẻ luật sư" },
      { field: "barAssociation", message: "Vui lòng nhập tên Đoàn luật sư" },
      { field: "lawOffice", message: "Vui lòng nhập tên văn phòng/công ty luật" }
    ];
    
    requiredFields.forEach(item => {
      if (!formData[item.field] || formData[item.field].trim() === "") {
        newErrors[item.field] = item.message;
      }
    });
    
    // Kiểm tra số năm kinh nghiệm
    if (isNaN(parseInt(formData.experienceYears)) || parseInt(formData.experienceYears) < 0) {
      newErrors.experienceYears = "Số năm kinh nghiệm không hợp lệ";
    }
    
    // Kiểm tra chuyên môn
    if (formData.specialization.length === 0) {
      newErrors.specialization = "Vui lòng chọn ít nhất một lĩnh vực chuyên môn";
    }
    
    // Kiểm tra file avatar
    if (!formData.avatarFile) {
      newErrors.avatarFile = "Vui lòng tải lên ảnh đại diện";
    }
    
    // Kiểm tra file chứng chỉ
    if (!formData.certificationFile) {
      newErrors.certificationFile = "Vui lòng tải lên ảnh thẻ luật sư";
    }
    
    // Kiểm tra đồng ý điều khoản
    if (!formData.agree) {
      newErrors.agree = "Bạn phải đồng ý với điều khoản và chính sách";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Lưu lại trạng thái hiện tại của form trước khi kiểm tra
    const currentFormData = { ...formData };
    setErrors({});
    
    // Kiểm tra form
    const isValid = validateForm();
    if (!isValid) {
      setMessage({
        type: "error",
        text: "Vui lòng điền đầy đủ thông tin bắt buộc"
      });
      
      // Cuộn đến phần tử lỗi đầu tiên
      setTimeout(() => {
        const firstErrorField = Object.keys(errors)[0];
        if (firstErrorField) {
          const errorElement = document.querySelector(`[name="${firstErrorField}"]`);
          if (errorElement) {
            errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }
      }, 100);
      
      return;
    }
    
    setLoading(true);
    setMessage({ type: "", text: "" });
    
    try {
      // Lấy token xác thực
      const token = localStorage.getItem('token');
      
      // Tạo đối tượng FormData để gửi cả file và dữ liệu
      const data = new FormData();
      
      // Thêm userId từ người dùng hiện tại
      if (currentUser && currentUser.id) {
        data.append("userId", currentUser.id);
      }
      
      // Thêm thông tin cơ bản của tài khoản đã đăng nhập
      // (Backend vẫn yêu cầu các trường này mặc dù đã có trong DB)
      data.append("username", currentFormData.username);
      data.append("email", currentFormData.email);
      data.append("phone", currentFormData.phone);
      data.append("fullName", currentFormData.fullName);
      
      // Thêm mật khẩu mặc định (backend yêu cầu)
      // Sử dụng mật khẩu giả vì người dùng đã đăng nhập
      data.append("password", "updated_password_placeholder");
      
      // Thêm dữ liệu profile
      data.append("address", currentFormData.address);
      data.append("bio", currentFormData.bio || "");
      
      // Thêm file avatar
      if (currentFormData.avatarFile) {
        data.append("avatar", currentFormData.avatarFile);
      }
      
      // Thêm dữ liệu luật sư
      data.append("certification", currentFormData.certification || "");
      data.append("experienceYears", currentFormData.experienceYears || "0");
      data.append("specialization", currentFormData.specialization.join(","));
      
      // Thêm dữ liệu bổ sung
      data.append("idCard", currentFormData.idCard);
      data.append("birthDate", currentFormData.birthDate || "");
      data.append("licenseNumber", currentFormData.licenseNumber);
      data.append("barAssociation", currentFormData.barAssociation);
      data.append("lawOffice", currentFormData.lawOffice);
      
      // Thêm file chứng chỉ
      if (currentFormData.certificationFile) {
        data.append("certificationFile", currentFormData.certificationFile);
      }
      
      // In ra console để debug
      for (let pair of data.entries()) {
        console.log(pair[0] + ": " + pair[1]);
      }
      
      // Gửi yêu cầu đăng ký luật sư với token xác thực
      const response = await axios.post("http://localhost:8000/api/auth/register-lawyer", data, {
        headers: {
          "Content-Type": "multipart/form-data",
          "Authorization": `Bearer ${token}`
        }
      });
      
      // Xử lý phản hồi thành công
      setMessage({
        type: "success",
        text: "Đăng ký thành công! Hồ sơ của bạn đang được xem xét. Vui lòng đăng xuất và đăng nhập lại để sử dụng đầy đủ quyền truy cập luật sư."
      });
      
      // Cập nhật thông tin người dùng trong localStorage mà không cần đăng nhập lại
      try {
        // Sử dụng hàm refreshUserData thay vì updateUserInLocalStorage
        await userService.refreshUserData();
        console.log("Đã cập nhật thông tin người dùng trong localStorage");
      } catch (refreshError) {
        console.error("Lỗi khi cập nhật thông tin người dùng:", refreshError);
      }
      
      // Cuộn lên đầu trang để hiển thị thông báo
      window.scrollTo({ top: 0, behavior: "smooth" });
      
      // Đăng xuất người dùng sau 3 giây và chuyển hướng về trang đăng nhập
      setTimeout(() => {
        authService.logout();
        navigate("/login?message=relogin_required");
      }, 5000);
      
    } catch (error) {
      console.error("Lỗi đăng ký:", error);
      
      // Hiển thị chi tiết lỗi nhận được
      console.log("Phản hồi chi tiết:", error.response?.data);
      
      // Xử lý lỗi
      if (error.response?.data?.message) {
        setMessage({
          type: "error",
          text: error.response.data.message
        });
      } else {
        setMessage({
          type: "error",
          text: "Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại sau."
        });
      }
      
      // Cuộn lên đầu trang để hiển thị thông báo lỗi
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Đăng Ký Trở Thành Luật Sư</h2>
      
      {message.text && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formCard}>
          <h3 className={styles.sectionTitle}>
            <i className="fas fa-user-circle"></i> Thông tin tài khoản
          </h3>
        <div className={styles.grid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Tên đăng nhập</label>
              <div className={styles.inputWithIcon}>
                <i className="fas fa-user"></i>
                <input 
                  name="username" 
                  value={formData.username}
                  disabled={true}
                  className={`${styles.input} ${styles.readOnly}`} 
                />
              </div>
              <div className={styles.infoMsg}>Đã đăng nhập với tài khoản này</div>
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Email</label>
              <div className={styles.inputWithIcon}>
                <i className="fas fa-envelope"></i>
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email}
                  disabled={true}
                  className={`${styles.input} ${styles.readOnly}`}
                />
              </div>
            </div>
          </div>
        </div>

        <div className={styles.formCard}>
          <h3 className={styles.sectionTitle}>
            <i className="fas fa-id-card"></i> Thông tin cá nhân
          </h3>
          <div className={styles.grid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Họ và tên</label>
              <div className={styles.inputWithIcon}>
                <i className="fas fa-user-tag"></i>
                <input 
                  name="fullName" 
                  value={formData.fullName}
                  disabled={true}
                  className={`${styles.input} ${styles.readOnly}`}
                />
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Ngày sinh</label>
              <div className={styles.inputWithIcon}>
                <i className="fas fa-calendar-alt"></i>
                <input 
                  type="date" 
                  name="birthDate" 
                  value={formData.birthDate}
                  onChange={handleChange} 
                  className={styles.input} 
                />
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Số điện thoại</label>
              <div className={styles.inputWithIcon}>
                <i className="fas fa-phone"></i>
                <input 
                  name="phone" 
                  value={formData.phone}
                  disabled={true}
                  className={`${styles.input} ${styles.readOnly}`}
                />
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>CCCD/CMND <span className={styles.required}>*</span></label>
              <div className={styles.inputWithIcon}>
                <i className="fas fa-id-card"></i>
                <input 
                  name="idCard" 
                  value={formData.idCard}
                  onChange={handleChange} 
                  placeholder="Nhập số CCCD/CMND"
                  className={`${styles.input} ${errors.idCard ? styles.inputError : ""}`} 
                />
              </div>
              {errors.idCard && <div className={styles.errorMsg}>{errors.idCard}</div>}
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Địa chỉ <span className={styles.required}>*</span></label>
            <div className={styles.inputWithIcon}>
              <i className="fas fa-map-marker-alt"></i>
              <input 
                name="address" 
                value={formData.address}
                onChange={handleChange} 
                placeholder="Nhập địa chỉ liên hệ đầy đủ"
                className={`${styles.input} ${errors.address ? styles.inputError : ""}`} 
              />
            </div>
            {errors.address && <div className={styles.errorMsg}>{errors.address}</div>}
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Giới thiệu bản thân</label>
        <textarea
              name="bio"
              value={formData.bio}
          onChange={handleChange}
          className={styles.textarea}
              placeholder="Hãy chia sẻ về kinh nghiệm và lý do bạn muốn trở thành luật sư trên LegAI..."
        ></textarea>
          </div>
        </div>
        
        <div className={styles.formCard}>
          <h3 className={styles.sectionTitle}>
            <i className="fas fa-gavel"></i> Thông tin chuyên môn
          </h3>
          <div className={styles.grid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Số thẻ luật sư <span className={styles.required}>*</span></label>
              <div className={styles.inputWithIcon}>
                <i className="fas fa-certificate"></i>
                <input 
                  name="licenseNumber" 
                  value={formData.licenseNumber}
                  onChange={handleChange} 
                  placeholder="Nhập số thẻ luật sư"
                  className={`${styles.input} ${errors.licenseNumber ? styles.inputError : ""}`} 
                />
              </div>
              {errors.licenseNumber && <div className={styles.errorMsg}>{errors.licenseNumber}</div>}
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Tên Đoàn luật sư <span className={styles.required}>*</span></label>
              <div className={styles.inputWithIcon}>
                <i className="fas fa-users"></i>
                <input 
                  name="barAssociation" 
                  value={formData.barAssociation}
                  onChange={handleChange} 
                  placeholder="Nhập tên Đoàn luật sư"
                  className={`${styles.input} ${errors.barAssociation ? styles.inputError : ""}`} 
                />
              </div>
              {errors.barAssociation && <div className={styles.errorMsg}>{errors.barAssociation}</div>}
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Tên văn phòng/công ty luật <span className={styles.required}>*</span></label>
              <div className={styles.inputWithIcon}>
                <i className="fas fa-building"></i>
                <input 
                  name="lawOffice" 
                  value={formData.lawOffice}
                  onChange={handleChange} 
                  placeholder="Nhập tên văn phòng/công ty luật"
                  className={`${styles.input} ${errors.lawOffice ? styles.inputError : ""}`} 
                />
              </div>
              {errors.lawOffice && <div className={styles.errorMsg}>{errors.lawOffice}</div>}
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Số năm kinh nghiệm</label>
              <div className={styles.inputWithIcon}>
                <i className="fas fa-briefcase"></i>
                <input 
                  type="number" 
                  name="experienceYears" 
                  value={formData.experienceYears}
                  onChange={handleChange} 
                  placeholder="Nhập số năm kinh nghiệm"
                  className={`${styles.input} ${errors.experienceYears ? styles.inputError : ""}`} 
                  min="0"
                />
              </div>
              {errors.experienceYears && <div className={styles.errorMsg}>{errors.experienceYears}</div>}
            </div>
          </div>

        <div className={styles.checkboxGroup}>
            <label className={styles.label}>Lĩnh vực chuyên môn <span className={styles.required}>*</span></label>
            {errors.specialization && <div className={styles.errorMsg}>{errors.specialization}</div>}
          <div className={styles.checkboxWrap}>
              {["Dân sự", "Hình sự", "Hôn nhân", "Đất đai", "Doanh nghiệp", "Sở hữu trí tuệ", "Lao động", "Hành chính"].map((field) => (
              <label key={field} className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                    name="specialization"
                  value={field}
                    checked={formData.specialization.includes(field)}
                  onChange={handleChange}
                />
                <span>{field}</span>
              </label>
            ))}
            </div>
          </div>
        </div>

        <div className={styles.formCard}>
          <h3 className={styles.sectionTitle}>
            <i className="fas fa-file-image"></i> Tài liệu chứng minh
          </h3>
          <div className={styles.fileUploadGrid}>
            <div className={styles.fileUploadItem}>
              <label className={styles.fileLabel}>
                <span>Ảnh thẻ luật sư <span className={styles.required}>*</span></span>
                <div className={`${styles.fileDropArea} ${errors.certificationFile ? styles.fileError : ""}`}>
                  {previewCertification ? (
                    <div className={styles.previewImage}>
                      <img src={previewCertification} alt="Ảnh thẻ luật sư" />
                      <div className={styles.changeFileOverlay}>
                        <span>Thay đổi</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <i className="fas fa-cloud-upload-alt"></i>
                      <span>Kéo thả hoặc nhấp để chọn ảnh</span>
                    </>
                  )}
                  <input 
                    type="file" 
                    name="certificationFile" 
                    accept="image/*"
                    onChange={handleChange} 
                    className={styles.fileInput} 
                  />
                </div>
                {errors.certificationFile && <div className={styles.errorMsg}>{errors.certificationFile}</div>}
          </label>
            </div>
            
            <div className={styles.fileUploadItem}>
              <label className={styles.fileLabel}>
                <span>Ảnh đại diện <span className={styles.required}>*</span></span>
                <div className={`${styles.fileDropArea} ${errors.avatarFile ? styles.fileError : ""}`}>
                  {previewAvatar ? (
                    <div className={styles.previewImage}>
                      <img src={previewAvatar} alt="Ảnh đại diện" />
                      <div className={styles.changeFileOverlay}>
                        <span>Thay đổi</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <i className="fas fa-cloud-upload-alt"></i>
                      <span>Kéo thả hoặc nhấp để chọn ảnh</span>
                    </>
                  )}
                  <input 
                    type="file" 
                    name="avatarFile" 
                    accept="image/*"
                    onChange={handleChange} 
                    className={styles.fileInput} 
                  />
                </div>
                {errors.avatarFile && <div className={styles.errorMsg}>{errors.avatarFile}</div>}
          </label>
            </div>
          </div>
        </div>

        <div className={styles.termsSection}>
        <div className={styles.agree}>
            <input 
              type="checkbox" 
              id="agreeTerms"
              name="agree" 
              checked={formData.agree} 
              onChange={handleChange} 
            />
            <label htmlFor="agreeTerms">
              Tôi đồng ý với <span className={styles.terms}>Điều khoản & Chính sách</span> của LegAI
          </label>
          </div>
          {errors.agree && <div className={styles.errorMsg}>{errors.agree}</div>}
        </div>

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? (
            <>
              <i className="fas fa-spinner fa-spin"></i> Đang xử lý...
            </>
          ) : (
            <>
              <i className="fas fa-paper-plane"></i> Gửi Đăng Ký
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default LawyerRegisterForm;
