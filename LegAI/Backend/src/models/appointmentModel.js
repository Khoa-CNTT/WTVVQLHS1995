const db = require('../config/database');

// Tạo lịch hẹn mới
const createAppointment = async (appointmentData) => {
  const { customer_id, lawyer_id, start_time, end_time, status, purpose, notes } = appointmentData;
  
  try {
    const result = await db.query(
      `INSERT INTO Appointments 
       (customer_id, lawyer_id, start_time, end_time, status, purpose, notes, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) 
       RETURNING *`,
      [customer_id, lawyer_id, start_time, end_time, status || 'pending', purpose || '', notes || '']
    );
    
    return result.rows[0];
  } catch (err) {
    throw new Error(`Không thể tạo lịch hẹn: ${err.message}`);
  }
};

// Lấy danh sách lịch hẹn của khách hàng
const getAppointmentsByCustomerId = async (customerId, status = null) => {
  try {
    let query = `
      SELECT a.*, u.full_name as lawyer_name, u.email as lawyer_email, 
             ld.specialization, up.avatar_url
      FROM Appointments a
      JOIN Users u ON a.lawyer_id = u.id
      LEFT JOIN LawyerDetails ld ON a.lawyer_id = ld.lawyer_id
      LEFT JOIN UserProfiles up ON a.lawyer_id = up.user_id
      WHERE a.customer_id = $1
    `;
    
    const params = [customerId];
    
    if (status) {
      query += ' AND a.status = $2';
      params.push(status);
    }
    
    query += ' ORDER BY a.start_time ASC';
    
    const result = await db.query(query, params);
    return result.rows;
  } catch (err) {
    throw new Error(`Không thể lấy danh sách lịch hẹn của khách hàng: ${err.message}`);
  }
};

// Lấy danh sách lịch hẹn của luật sư
const getAppointmentsByLawyerId = async (lawyerId, status = null) => {
  try {
    let query = `
      SELECT a.*, u.full_name as customer_name, u.email as customer_email, up.avatar_url
      FROM Appointments a
      JOIN Users u ON a.customer_id = u.id
      LEFT JOIN UserProfiles up ON a.customer_id = up.user_id
      WHERE a.lawyer_id = $1
    `;
    
    const params = [lawyerId];
    
    if (status) {
      query += ' AND a.status = $2';
      params.push(status);
    }
    
    query += ' ORDER BY a.start_time ASC';
    
    const result = await db.query(query, params);
    return result.rows;
  } catch (err) {
    throw new Error(`Không thể lấy danh sách lịch hẹn của luật sư: ${err.message}`);
  }
};

// Lấy chi tiết lịch hẹn theo ID
const getAppointmentById = async (appointmentId) => {
  try {
    const result = await db.query(
      `SELECT a.*, 
              c.full_name as customer_name, c.email as customer_email, cp.avatar_url as customer_avatar,
              l.full_name as lawyer_name, l.email as lawyer_email, lp.avatar_url as lawyer_avatar,
              ld.specialization
       FROM Appointments a
       JOIN Users c ON a.customer_id = c.id
       JOIN Users l ON a.lawyer_id = l.id
       LEFT JOIN UserProfiles cp ON a.customer_id = cp.user_id
       LEFT JOIN UserProfiles lp ON a.lawyer_id = lp.user_id
       LEFT JOIN LawyerDetails ld ON a.lawyer_id = ld.lawyer_id
       WHERE a.id = $1`,
      [appointmentId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  } catch (err) {
    throw new Error(`Không thể lấy chi tiết lịch hẹn: ${err.message}`);
  }
};

// Cập nhật trạng thái lịch hẹn
const updateAppointmentStatus = async (appointmentId, status, notes = null) => {
  try {
    const updateFields = ['status = $2'];
    const params = [appointmentId, status];
    let paramIndex = 3;
    
    if (notes !== null) {
      updateFields.push(`notes = $${paramIndex}`);
      params.push(notes);
      paramIndex++;
    }
    
    const query = `
      UPDATE Appointments 
      SET ${updateFields.join(', ')} 
      WHERE id = $1 
      RETURNING *
    `;
    
    const result = await db.query(query, params);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  } catch (err) {
    throw new Error(`Không thể cập nhật trạng thái lịch hẹn: ${err.message}`);
  }
};

// Kiểm tra xem luật sư có lịch trống trong khoảng thời gian
const checkLawyerAvailability = async (lawyerId, startTime, endTime) => {
  try {
    // Kiểm tra xem có lịch hẹn nào trùng thời gian không
    const result = await db.query(
      `SELECT * FROM Appointments 
       WHERE lawyer_id = $1 
       AND status != 'cancelled'
       AND (
           (start_time <= $2 AND end_time > $2) OR
           (start_time < $3 AND end_time >= $3) OR
           (start_time >= $2 AND end_time <= $3)
       )`,
      [lawyerId, startTime, endTime]
    );
    
    // Kiểm tra xem luật sư có lịch làm việc trong khoảng thời gian này không
    const availabilityResult = await db.query(
      `SELECT * FROM LawyerAvailability 
       WHERE lawyer_id = $1 
       AND status = 'available'
       AND start_time <= $2 
       AND end_time >= $3`,
      [lawyerId, startTime, endTime]
    );
    
    return {
      isAvailable: result.rows.length === 0 && availabilityResult.rows.length > 0,
      conflictingAppointments: result.rows,
      availabilitySlots: availabilityResult.rows
    };
  } catch (err) {
    throw new Error(`Không thể kiểm tra lịch trống của luật sư: ${err.message}`);
  }
};

// Xoá lịch hẹn (soft delete bằng cách đổi trạng thái sang cancelled)
const deleteAppointment = async (appointmentId, reason = '') => {
  try {
    const result = await db.query(
      `UPDATE Appointments 
       SET status = 'cancelled', notes = CONCAT(notes, $2) 
       WHERE id = $1 
       RETURNING *`,
      [appointmentId, reason ? `\nLý do huỷ: ${reason}` : '']
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  } catch (err) {
    throw new Error(`Không thể xoá lịch hẹn: ${err.message}`);
  }
};

// Lấy tất cả khung giờ làm việc của luật sư
const getLawyerAvailabilities = async (lawyerId) => {
  try {
    const result = await db.query(
      `SELECT * FROM LawyerAvailability 
       WHERE lawyer_id = $1 
       AND status = 'available'
       ORDER BY start_time ASC`,
      [lawyerId]
    );
    
    return result.rows;
  } catch (err) {
    throw new Error(`Không thể lấy lịch làm việc của luật sư: ${err.message}`);
  }
};

// Thêm khung giờ làm việc mới cho luật sư
const addLawyerAvailability = async (lawyerId, startTime, endTime) => {
  try {
    const result = await db.query(
      `INSERT INTO LawyerAvailability (lawyer_id, start_time, end_time, status)
       VALUES ($1, $2, $3, 'available')
       RETURNING *`,
      [lawyerId, startTime, endTime]
    );
    
    return result.rows[0];
  } catch (err) {
    throw new Error(`Không thể thêm lịch làm việc cho luật sư: ${err.message}`);
  }
};

// Xoá khung giờ làm việc của luật sư
const deleteLawyerAvailability = async (availabilityId) => {
  try {
    const result = await db.query(
      `DELETE FROM LawyerAvailability WHERE id = $1 RETURNING *`,
      [availabilityId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  } catch (err) {
    throw new Error(`Không thể xoá lịch làm việc của luật sư: ${err.message}`);
  }
};

// Lấy số lượng lịch hẹn theo trạng thái
const getAppointmentCountsByStatus = async (userId, isLawyer = false) => {
  try {
    const userField = isLawyer ? 'lawyer_id' : 'customer_id';
    
    const result = await db.query(
      `SELECT status, COUNT(*) as count
       FROM Appointments
       WHERE ${userField} = $1
       GROUP BY status`,
      [userId]
    );
    
    const counts = {
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      total: 0
    };
    
    result.rows.forEach(row => {
      counts[row.status] = parseInt(row.count);
      counts.total += parseInt(row.count);
    });
    
    return counts;
  } catch (err) {
    throw new Error(`Không thể lấy số lượng lịch hẹn: ${err.message}`);
  }
};

// Lấy lịch hẹn sắp tới
const getUpcomingAppointments = async (userId, isLawyer = false, limit = 5) => {
  try {
    const userField = isLawyer ? 'lawyer_id' : 'customer_id';
    const otherUserField = isLawyer ? 'customer_id' : 'lawyer_id';
    const otherUserName = isLawyer ? 'customer_name' : 'lawyer_name';
    
    const result = await db.query(
      `SELECT a.*, u.full_name as ${otherUserName}
       FROM Appointments a
       JOIN Users u ON a.${otherUserField} = u.id
       WHERE a.${userField} = $1
       AND a.status IN ('pending', 'confirmed')
       AND a.start_time >= NOW()
       ORDER BY a.start_time ASC
       LIMIT $2`,
      [userId, limit]
    );
    
    return result.rows;
  } catch (err) {
    throw new Error(`Không thể lấy lịch hẹn sắp tới: ${err.message}`);
  }
};

module.exports = {
  createAppointment,
  getAppointmentsByCustomerId,
  getAppointmentsByLawyerId,
  getAppointmentById,
  updateAppointmentStatus,
  checkLawyerAvailability,
  deleteAppointment,
  getLawyerAvailabilities,
  addLawyerAvailability,
  deleteLawyerAvailability,
  getAppointmentCountsByStatus,
  getUpcomingAppointments
}; 