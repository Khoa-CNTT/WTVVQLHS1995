import { 
  FaFilePdf, 
  FaFileWord, 
  FaFileExcel, 
  FaFilePowerpoint, 
  FaFileAlt, 
  FaFileImage, 
  FaFileArchive,
  FaFileCode,
  FaFile
} from 'react-icons/fa';

/**
 * Lấy biểu tượng dựa trên định dạng tập tin
 * @param {string} fileType - Kiểu tập tin (pdf, doc, xls, v.v.)
 * @returns {React.ComponentType} - Component biểu tượng của tập tin
 */
export const getFileIcon = (fileType) => {
  if (!fileType) return FaFile;
  
  const type = fileType.toLowerCase();
  
  // Kiểm tra theo phần mở rộng hoặc mime type
  if (type.includes('pdf')) {
    return FaFilePdf;
  } else if (type.includes('doc') || type.includes('word')) {
    return FaFileWord;
  } else if (type.includes('xls') || type.includes('excel') || type.includes('sheet')) {
    return FaFileExcel;
  } else if (type.includes('ppt') || type.includes('powerpoint') || type.includes('presentation')) {
    return FaFilePowerpoint;
  } else if (type.includes('jpg') || type.includes('jpeg') || type.includes('png') || type.includes('gif') || type.includes('image')) {
    return FaFileImage;
  } else if (type.includes('zip') || type.includes('rar') || type.includes('tar') || type.includes('7z') || type.includes('archive')) {
    return FaFileArchive;
  } else if (type.includes('html') || type.includes('css') || type.includes('js') || type.includes('json') || type.includes('code')) {
    return FaFileCode;
  } else if (type.includes('txt') || type.includes('text')) {
    return FaFileAlt;
  }
  
  // Mặc định
  return FaFile;
};

/**
 * Lấy màu cho biểu tượng dựa trên loại tập tin
 * @param {string} fileType - Kiểu tập tin
 * @returns {string} - Mã màu HEX
 */
export const getFileIconColor = (fileType) => {
  if (!fileType) return '#6B7280';
  
  const type = fileType.toLowerCase();
  
  if (type.includes('pdf')) {
    return '#DC2626'; // Đỏ
  } else if (type.includes('doc') || type.includes('word')) {
    return '#2563EB'; // Xanh dương
  } else if (type.includes('xls') || type.includes('excel') || type.includes('sheet')) {
    return '#059669'; // Xanh lá
  } else if (type.includes('ppt') || type.includes('powerpoint') || type.includes('presentation')) {
    return '#D97706'; // Cam
  } else if (type.includes('jpg') || type.includes('jpeg') || type.includes('png') || type.includes('gif') || type.includes('image')) {
    return '#7C3AED'; // Tím
  } else if (type.includes('zip') || type.includes('rar') || type.includes('tar') || type.includes('7z') || type.includes('archive')) {
    return '#9CA3AF'; // Xám
  } else if (type.includes('html') || type.includes('css') || type.includes('js') || type.includes('json') || type.includes('code')) {
    return '#0EA5E9'; // Xanh da trời
  } else if (type.includes('txt') || type.includes('text')) {
    return '#6B7280'; // Xám đậm
  }
  
  return '#6B7280'; // Mặc định
};

/**
 * Trả về tên hiển thị cho loại tập tin
 * @param {string} fileType - Kiểu tập tin
 * @returns {string} - Tên hiển thị
 */
export const getFileTypeName = (fileType) => {
  if (!fileType) return 'Tập tin';
  
  const type = fileType.toLowerCase();
  
  if (type.includes('pdf')) {
    return 'Tập tin PDF';
  } else if (type.includes('doc') || type.includes('word')) {
    return 'Tài liệu Word';
  } else if (type.includes('xls') || type.includes('excel') || type.includes('sheet')) {
    return 'Bảng tính Excel';
  } else if (type.includes('ppt') || type.includes('powerpoint') || type.includes('presentation')) {
    return 'Trình chiếu PowerPoint';
  } else if (type.includes('jpg') || type.includes('jpeg') || type.includes('png') || type.includes('gif') || type.includes('image')) {
    return 'Hình ảnh';
  } else if (type.includes('zip') || type.includes('rar') || type.includes('tar') || type.includes('7z') || type.includes('archive')) {
    return 'Tập tin nén';
  } else if (type.includes('html') || type.includes('css') || type.includes('js') || type.includes('json') || type.includes('code')) {
    return 'Mã nguồn';
  } else if (type.includes('txt') || type.includes('text')) {
    return 'Văn bản';
  }
  
  return 'Tập tin';
}; 