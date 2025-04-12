import React, { useState } from "react";
import styles from "./form_sign_up.module.css";

export default function LawyerRegisterForm() {
  const [formData, setFormData] = useState({
    fullName: "",
    birthDate: "",
    phone: "",
    email: "",
    idCard: "",
    licenseNumber: "",
    barAssociation: "",
    lawOffice: "",
    workAddress: "",
    specialties: [],
    agree: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox" && name === "specialties") {
      const updated = checked
        ? [...formData.specialties, value]
        : formData.specialties.filter((item) => item !== value);
      setFormData({ ...formData, specialties: updated });
    } else if (type === "checkbox") {
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Dữ liệu đăng ký:", formData);
    alert("Gửi đăng ký thành công (giả lập ✨)");
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Đăng Ký Luật Sư</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.grid}>
          <input name="fullName" placeholder="Họ và tên" required onChange={handleChange} className={styles.input} />
          <input type="date" name="birthDate" required onChange={handleChange} className={styles.input} />
          <input name="phone" placeholder="Số điện thoại" required onChange={handleChange} className={styles.input} />
          <input type="email" name="email" placeholder="Email" required onChange={handleChange} className={styles.input} />
          <input name="idCard" placeholder="CCCD/CMND" required onChange={handleChange} className={styles.input} />
          <input name="licenseNumber" placeholder="Số thẻ luật sư" required onChange={handleChange} className={styles.input} />
          <input name="barAssociation" placeholder="Tên Đoàn luật sư" required onChange={handleChange} className={styles.input} />
          <input name="lawOffice" placeholder="Tên văn phòng/công ty luật" required onChange={handleChange} className={styles.input} />
        </div>

        <textarea
          name="workAddress"
          placeholder="Địa chỉ làm việc"
          required
          onChange={handleChange}
          className={styles.textarea}
        ></textarea>

        <div className={styles.checkboxGroup}>
          <label className={styles.label}>Lĩnh vực chuyên môn:</label>
          <div className={styles.checkboxWrap}>
            {["Dân sự", "Hình sự", "Hôn nhân", "Đất đai", "Doanh nghiệp", "Sở hữu trí tuệ"].map((field) => (
              <label key={field} className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="specialties"
                  value={field}
                  onChange={handleChange}
                />
                <span>{field}</span>
              </label>
            ))}
          </div>
        </div>

        <div className={styles.grid}>
          <label>
            Ảnh thẻ luật sư:
            <input type="file" accept="image/*" required className={styles.input} />
          </label>
          <label>
            Ảnh chân dung:
            <input type="file" accept="image/*" required className={styles.input} />
          </label>
        </div>

        <div className={styles.agree}>
          <input type="checkbox" name="agree" checked={formData.agree} onChange={handleChange} required />
          <label>
            Tôi đồng ý với <span className={styles.terms}>Điều khoản & Chính sách</span>
          </label>
        </div>

        <button type="submit" className={styles.submitBtn}>
          Gửi Đăng Ký
        </button>
      </form>
    </div>
  );
}
