import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import styles from './LegalDocDetail.module.css';
import * as legalDocService from '../../services/legalDocService';
import * as legalDocAIService from '../../services/legalDocAIService';
import Spinner from '../../components/Common/Spinner';
import DocShareModal from './components/DocShareModal';
import DocAnalysisModal from './components/DocAnalysisModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';

const LegalDocDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    category: '',
    tags: ''
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [editableContent, setEditableContent] = useState('');
  const [isSavingContent, setIsSavingContent] = useState(false);
  const [fileUrl, setFileUrl] = useState('');
  const [isLoadingFullContent, setIsLoadingFullContent] = useState(false);
  const [contentTruncated, setContentTruncated] = useState(false);
  const [newFile, setNewFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef(null);

  // Lấy thông tin tài liệu và kiểm tra quyền sở hữu
  useEffect(() => {
    const fetchDocument = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const response = await legalDocService.getLegalDocById(id);
        
        if (response.success) {
          const docData = response.data;
          setDoc(docData);
          
          // Lưu URL file nếu có
          if (docData.file_url) {
            setFileUrl(docData.file_url);
          } else {
            console.log("Không tìm thấy URL file trong dữ liệu");
          }
          
          // Kiểm tra quyền sở hữu
          const currentUser = JSON.parse(localStorage.getItem('user'));
          setIsOwner(currentUser && docData.user_id === currentUser.id);
          
          // Khởi tạo form chỉnh sửa
          setEditForm({
            title: docData.title || '',
            description: docData.description || '',
            category: docData.category || '',
            tags: docData.tags ? (Array.isArray(docData.tags) ? docData.tags.join(', ') : docData.tags) : ''
          });
          
          // Tải nội dung tài liệu
          try {
            
            // Kiểm tra xem docData đã có nội dung hay chưa
            if (docData.content) {
              setContent(docData.content);
              setEditableContent(docData.content);
            } else if (docData.metadata && docData.metadata.extracted_text) {
              setContent(docData.metadata.extracted_text);
              setEditableContent(docData.metadata.extracted_text);
            } else {
              // Thử lấy nội dung file từ API nếu không có sẵn
              try {
                const contentResponse = await legalDocService.getDocFileContent(id);
                
                if (contentResponse.success && contentResponse.data && contentResponse.data.content) {
                  // Đảm bảo xuống dòng đúng cách
                  const formattedContent = contentResponse.data.content
                    .replace(/\r\n/g, '\n')
                    .replace(/\r/g, '\n')
                    .replace(/\n{3,}/g, '\n\n'); // Giới hạn tối đa 2 dòng trống liên tiếp
                  
                  // Kiểm tra nếu nội dung bị cắt ngắn hoặc nội dung có thể không đầy đủ
                  if (contentResponse.data.truncated || formattedContent.length > 500) {
                    setContentTruncated(true);
                  }
                  
                  setContent(formattedContent);
                  setEditableContent(formattedContent);
                } else {
                  
                  // Nếu không có nội dung từ API và có file_url, thử tải nội dung từ URL file
                  if (docData.file_url) {
                    try {
                      const fileResponse = await fetch(docData.file_url);
                      
                      if (fileResponse.ok) {
                        // Kiểm tra loại file
                        const isTextFile = ['txt', 'html', 'css', 'js', 'json', 'xml'].includes(docData.file_type?.toLowerCase());
                        const contentType = fileResponse.headers.get('content-type');
                        const isTextContentType = contentType && contentType.includes('text');
                        
                        
                        if (isTextFile || isTextContentType) {
                          const textContent = await fileResponse.text();
                          
                          // Kiểm tra nếu nội dung là HTML với DOCTYPE
                          if (textContent.trim().toLowerCase().startsWith('<!doctype html>') || 
                              textContent.trim().toLowerCase().startsWith('<html')) {
                            console.error("Phát hiện nội dung HTML không hợp lệ từ URL file sau khi API lỗi");
                            setContent('Định dạng file không được hỗ trợ để hiển thị trực tiếp. Vui lòng tải xuống để xem đầy đủ.');
                            setContentTruncated(true);
                            return;
                          }
                          
                          // Đảm bảo xuống dòng đúng cách
                          const formattedUrlContent = textContent
                            .replace(/\r\n/g, '\n')
                            .replace(/\r/g, '\n')
                            .replace(/\n{3,}/g, '\n\n'); // Giới hạn tối đa 2 dòng trống liên tiếp
                          
                          // Luôn hiển thị nút tải đầy đủ nội dung cho nội dung từ URL
                          if (formattedUrlContent.length > 500) {
                            setContentTruncated(true);
                          }
                          
                          setContent(formattedUrlContent);
                          setEditableContent(formattedUrlContent);
                        } else {
                          console.log("File không phải dạng văn bản đơn giản, sử dụng URL để hiển thị");
                          if (docData.file_type === 'pdf' || contentType && contentType.includes('pdf')) {
                            setContent('Tài liệu PDF này sẽ được hiển thị trong khung xem.');
                          } else if (isImageFile(docData.file_type) || contentType && contentType.includes('image')) {
                            setContent('Hình ảnh này sẽ được hiển thị bên dưới.');
                          } else {
                            setContent('Tài liệu này sẽ được hiển thị theo loại tệp.');
                          }
                        }
                      } else {
                        setContent('Không thể tải nội dung từ URL file. Vui lòng tải xuống để xem nội dung.');
                      }
                    } catch (fetchError) {
                      console.error("Lỗi khi tải nội dung từ URL:", fetchError);
                      setContent('Lỗi khi tải nội dung từ URL file. Vui lòng tải xuống để xem nội dung.');
                    }
                  } else {
                    setContent('Không thể hiển thị nội dung tệp này trực tiếp trên trình duyệt. Vui lòng tải xuống để xem chi tiết.');
                  }
                }
              } catch (contentError) {
                console.error("Lỗi khi gọi API lấy nội dung:", contentError);
                
                // Thử tải từ URL nếu có
                if (docData.file_url) {
                  try {
                    const fileResponse = await fetch(docData.file_url);
                    
                    if (fileResponse.ok) {
                      const contentType = fileResponse.headers.get('content-type');
                      const isTextFile = ['txt', 'html', 'css', 'js', 'json', 'xml'].includes(docData.file_type?.toLowerCase());
                      const isTextContentType = contentType && contentType.includes('text');
                      
                      if (isTextFile || isTextContentType) {
                        const textContent = await fileResponse.text();
                        // Đảm bảo xuống dòng đúng cách
                        const formattedUrlContent = textContent
                          .replace(/\r\n/g, '\n')
                          .replace(/\r/g, '\n')
                          .replace(/\n{3,}/g, '\n\n'); // Giới hạn tối đa 2 dòng trống liên tiếp
                        setContent(formattedUrlContent);
                        setEditableContent(formattedUrlContent);
                      } else {
                        if (docData.file_type === 'pdf' || contentType && contentType.includes('pdf')) {
                          setContent('Tài liệu PDF này sẽ được hiển thị trong khung xem.');
                        } else if (isImageFile(docData.file_type) || contentType && contentType.includes('image')) {
                          setContent('Hình ảnh này sẽ được hiển thị bên dưới.');
                        } else {
                          setContent('Tài liệu này sẽ được hiển thị theo loại tệp.');
                        }
                      }
                    } else {
                      setContent('Không thể tải nội dung từ URL file. Vui lòng tải xuống để xem nội dung.');
                    }
                  } catch (fetchError) {
                    console.error("Lỗi khi tải nội dung từ URL sau khi API lỗi:", fetchError);
                    setContent('Lỗi khi tải nội dung từ URL file. Vui lòng tải xuống để xem nội dung.');
                  }
                } else {
                  setContent('Không thể tải nội dung tài liệu. Vui lòng tải xuống để xem chi tiết.');
                }
              }
            }
          } catch (error) {
            console.error('Lỗi khi tải nội dung tài liệu:', error);
            setContent('Không thể tải nội dung tài liệu. Vui lòng tải xuống để xem chi tiết.');
            setEditableContent('');
          }
        } else {
          console.error("API trả về lỗi:", response.message);
          toast.error('Không thể tải thông tin hồ sơ pháp lý');
          navigate('/legal-docs');
        }
      } catch (error) {
        console.error('Lỗi khi tải thông tin hồ sơ:', error);
        toast.error('Có lỗi xảy ra khi tải thông tin hồ sơ');
        navigate('/legal-docs');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchCategories = async () => {
      try {
        const response = await legalDocService.getLegalDocCategories();
        if (response.success) {
          setCategories(response.data);
        }
      } catch (error) {
        console.error('Lỗi khi tải danh mục:', error);
      }
    };

    fetchDocument();
    fetchCategories();
    // Mặc định hiển thị nút tải đầy đủ nội dung
    setContentTruncated(true);
  }, [id, navigate]);

  // Thêm useEffect mới để xử lý tự động phát hiện URL file
  useEffect(() => {
    const detectFileUrl = async () => {
      if (doc && !fileUrl) {
        
        // Kiểm tra xem có file_url trong đối tượng doc không
        if (doc.file_url) {
          setFileUrl(doc.file_url);
          return;
        }
        
        // Kiểm tra xem có URL trong các trường khác không
        if (doc.url) {
          setFileUrl(doc.url);
          return;
        }
        
        if (doc.download_url) {
          setFileUrl(doc.download_url);
          return;
        }
        
        // Thử xây dựng URL từ thông tin sẵn có
        try {
          // Thử tạo URL dựa trên ID và loại tệp
          if (doc.id && doc.file_type) {
            const possibleUrl = `${window.location.origin}/files/${doc.id}.${doc.file_type}`;
            
            // Kiểm tra xem URL có tồn tại không
            try {
              const response = await fetch(possibleUrl, { method: 'HEAD' });
              if (response.ok) {
                setFileUrl(possibleUrl);
                return;
              }
            } catch (error) {
              console.log("URL được tạo không tồn tại:", error);
            }
          }
          
          // Thử tìm kiếm trường khác có thể chứa URL
          const docEntries = Object.entries(doc);
          for (const [key, value] of docEntries) {
            if (typeof value === 'string' && 
                (value.startsWith('http://') || value.startsWith('https://')) &&
                (value.endsWith(`.${doc.file_type}`) || value.includes('/files/') || value.includes('/uploads/'))) {
              setFileUrl(value);
              return;
            }
          }
          
        } catch (error) {
          console.error("Lỗi khi tự động phát hiện URL file:", error);
        }
      }
    };
    
    detectFileUrl();
  }, [doc, fileUrl]);

  // Xử lý thay đổi giá trị form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Bắt đầu chỉnh sửa
  const handleStartEditing = () => {
    setIsEditing(true);
  };

  // Hủy chỉnh sửa
  const handleCancelEdit = () => {
    // Khôi phục dữ liệu ban đầu
    setEditForm({
      title: doc.title || '',
      description: doc.description || '',
      category: doc.category || '',
      tags: doc.tags ? (Array.isArray(doc.tags) ? doc.tags.join(', ') : doc.tags) : ''
    });
    setIsEditing(false);
  };

  // Xử lý thay đổi file
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Kiểm tra kích thước file (tối đa 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('Kích thước file quá lớn. Vui lòng chọn file nhỏ hơn 10MB');
      return;
    }

    setNewFile(selectedFile);
  };

  // Xử lý mở cửa sổ chọn file
  const handleOpenFileSelector = () => {
    fileInputRef.current.click();
  };

  // Xử lý hủy chọn file
  const handleCancelFileSelect = () => {
    setNewFile(null);
  };

  // Xử lý thay thế file
  const handleReplaceFile = async () => {
    if (!newFile) {
      toast.error('Vui lòng chọn file để thay thế');
      return;
    }

    try {
      setUploadingFile(true);
      const response = await legalDocService.replaceDocFile(id, newFile);
      
      if (response.success) {
        // Cập nhật thông tin tài liệu từ đối tượng mới được tạo
        const newDocId = response.data.id;
        toast.success('Đã thay thế file thành công');
        
        // Chuyển hướng đến trang chi tiết của tài liệu mới
        navigate(`/legal-docs/${newDocId}`);
      } else {
        toast.error(response.message || 'Không thể thay thế file');
      }
    } catch (error) {
      console.error('Lỗi khi thay thế file:', error);
      toast.error('Có lỗi xảy ra khi thay thế file');
    } finally {
      setUploadingFile(false);
    }
  };

  // Lưu thay đổi
  const handleSaveChanges = async (e) => {
    e.preventDefault();
    
    if (!editForm.title.trim()) {
      toast.error('Vui lòng nhập tiêu đề hồ sơ');
      return;
    }
    
    // Nếu có file mới, thực hiện thay thế file (sẽ tự động cập nhật thông tin)
    if (newFile) {
      try {
        setIsUpdating(true);
        const response = await legalDocService.replaceDocFile(id, newFile);
        
        if (response.success) {
          const newDocId = response.data.id;
          toast.success('Đã cập nhật hồ sơ và thay thế file thành công');
          navigate(`/legal-docs/${newDocId}`);
        } else {
          toast.error(response.message || 'Không thể thay thế file');
        }
      } catch (error) {
        console.error('Lỗi khi thay thế file:', error);
        toast.error('Có lỗi xảy ra khi thay thế file');
      } finally {
        setIsUpdating(false);
      }
      return;
    }
    
    // Nếu không có file mới, chỉ cập nhật thông tin
    try {
      setIsUpdating(true);
      
      // Chuẩn bị dữ liệu cập nhật
      const updateData = {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        category: editForm.category,
        tags: editForm.tags ? editForm.tags.split(',').map(tag => tag.trim()) : []
      };
      
      const response = await legalDocService.updateLegalDoc(id, updateData);
      
      if (response.success) {
        // Cập nhật dữ liệu hiển thị
        setDoc({
          ...doc,
          ...updateData,
          updated_at: new Date().toISOString()
        });
        
        setIsEditing(false);
        toast.success('Cập nhật hồ sơ thành công');
      } else {
        toast.error(response.message || 'Không thể cập nhật hồ sơ');
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật hồ sơ:', error);
      toast.error('Có lỗi xảy ra khi cập nhật hồ sơ');
    } finally {
      setIsUpdating(false);
    }
  };

  // Xử lý tải xuống
  const handleDownload = async () => {
    try {
      await legalDocService.downloadLegalDoc(id);
      toast.success('Đang tải xuống hồ sơ...');
    } catch (error) {
      console.error('Lỗi khi tải xuống hồ sơ:', error);
      toast.error('Không thể tải xuống hồ sơ');
    }
  };

  // Xử lý xóa
  const handleShowDeleteConfirm = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setIsDeleting(true);
      const response = await legalDocService.deleteLegalDoc(id);
      
      if (response.success) {
        toast.success('Đã xóa hồ sơ pháp lý');
        navigate('/legal-docs');
      } else {
        toast.error(response.message || 'Không thể xóa hồ sơ');
      }
    } catch (error) {
      console.error('Lỗi khi xóa hồ sơ:', error);
      toast.error('Có lỗi xảy ra khi xóa hồ sơ');
    } finally {
      setIsDeleting(false);
    }
  };

  // Xử lý chia sẻ
  const handleShare = () => {
    setShowShareModal(true);
  };

  // Xử lý phân tích
  const handleAnalyze = () => {
    setShowAnalysisModal(true);
  };

  // Hoàn thành chia sẻ
  const handleShareSuccess = () => {
    setShowShareModal(false);
    toast.success('Đã chia sẻ hồ sơ pháp lý thành công');
  };

  // Hoàn thành phân tích
  const handleAnalysisComplete = () => {
    setShowAnalysisModal(false);
    // Tải lại thông tin tài liệu để cập nhật kết quả phân tích
    const refreshDoc = async () => {
      try {
        const response = await legalDocService.getLegalDocById(id);
        if (response.success) {
          setDoc(response.data);
        }
      } catch (error) {
        console.error('Lỗi khi tải lại thông tin tài liệu:', error);
      }
    };
    refreshDoc();
  };

  // Thêm các hàm xử lý chỉnh sửa nội dung
  const handleStartContentEditing = () => {
    setIsEditingContent(true);
  };

  const handleCancelContentEdit = () => {
    setEditableContent(content);
    setIsEditingContent(false);
  };

  const handleContentChange = (e) => {
    setEditableContent(e.target.value);
  };

  const handleSaveContent = async () => {
    try {
      setIsSavingContent(true);
      
      const response = await legalDocService.updateDocContent(id, editableContent);
      
      if (response.success) {
        setContent(editableContent);
        setIsEditingContent(false);
        toast.success('Đã cập nhật nội dung thành công');
      } else {
        toast.error(response.message || 'Không thể cập nhật nội dung');
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật nội dung:', error);
      toast.error('Có lỗi xảy ra khi cập nhật nội dung');
    } finally {
      setIsSavingContent(false);
    }
  };

  // Lấy icon theo loại file
  const getFileIcon = (fileType) => {
    const type = fileType ? fileType.toLowerCase() : '';
    
    switch (type) {
      case 'pdf':
        return 'fa-file-pdf';
      case 'docx':
      case 'doc':
        return 'fa-file-word';
      case 'xlsx':
      case 'xls':
        return 'fa-file-excel';
      case 'pptx':
      case 'ppt':
        return 'fa-file-powerpoint';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return 'fa-file-image';
      case 'txt':
        return 'fa-file-alt';
      default:
        return 'fa-file';
    }
  };

  // Format thời gian
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Format kích thước file
  const formatFileSize = (bytes) => {
    if (!bytes || isNaN(bytes)) return 'Không xác định';
    
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  // Kiểm tra xem file có phải là hình ảnh không
  const isImageFile = (fileType) => {
    const type = fileType ? fileType.toLowerCase() : '';
    return ['jpg', 'jpeg', 'png', 'gif'].includes(type);
  };

  // Kiểm tra xem có thể phân tích tài liệu hay không (không phải file hình ảnh)
  const canAnalyze = doc && !isImageFile(doc.file_type);
  
  // Kiểm tra xem tài liệu đã được phân tích chưa
  const isAnalyzed = doc && doc.metadata && doc.metadata.analyzed;

  // Tải nội dung đầy đủ khi phát hiện bị cắt bớt
  const loadFullContent = async () => {
    try {
      setIsLoadingFullContent(true);
      setContentTruncated(true); // Luôn đặt là true để hiện nút
      
      // Gọi API với tham số chỉ định không giới hạn kích thước và ưu tiên tải từ file gốc
      const response = await legalDocService.getDocFileContent(id, { 
        maxSize: 0,
        fullContent: true 
      });
      
      // Xử lý trường hợp API trả về HTML thay vì nội dung văn bản thực
      if (response.data && response.data.isHtmlError) {
        console.error("Phát hiện nội dung HTML không hợp lệ");
        toast.error('Định dạng nội dung không được hỗ trợ để hiển thị trực tiếp.');
        
        // Tự động tải xuống tài liệu để người dùng xem
        try {
          const downloadResponse = await legalDocService.downloadLegalDoc(id);
          if (downloadResponse.success) {
            toast.info('Đã tải xuống tài liệu. Hãy mở file để xem toàn bộ nội dung.');
          }
        } catch (downloadError) {
          console.error('Lỗi khi tải xuống tài liệu:', downloadError);
        }
        
        return;
      }
      
      if (response.success && response.data && response.data.content) {
        // Đảm bảo xuống dòng đúng cách
        const formattedContent = response.data.content
          .replace(/\r\n/g, '\n')
          .replace(/\r/g, '\n')
          .replace(/\n{3,}/g, '\n\n'); // Giới hạn tối đa 2 dòng trống liên tiếp
        
        setContent(formattedContent);
        setEditableContent(formattedContent);
        setContentTruncated(false);
        toast.success('Đã tải đầy đủ nội dung tài liệu');
      } else {
        toast.error('Không thể tải đầy đủ nội dung tài liệu');
        
        // Tải trực tiếp bằng cách tải xuống file và đọc
        try {
          const downloadResponse = await legalDocService.downloadLegalDoc(id);
          if (downloadResponse.success) {
            toast.info('Đã tải xuống tài liệu. Hãy mở file để xem toàn bộ nội dung.');
          }
        } catch (downloadError) {
          console.error('Lỗi khi tải xuống tài liệu:', downloadError);
        }
      }
    } catch (error) {
      console.error('Lỗi khi tải đầy đủ nội dung:', error);
      toast.error('Có lỗi xảy ra khi tải đầy đủ nội dung');
      
      // Nếu có lỗi, thử tải xuống file
      try {
        await legalDocService.downloadLegalDoc(id);
        toast.info('Đã tải xuống tài liệu. Hãy mở file để xem toàn bộ nội dung.');
      } catch (downloadError) {
        console.error('Lỗi khi tải xuống tài liệu:', downloadError);
      }
    } finally {
      setIsLoadingFullContent(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner />
        <p>Đang tải thông tin hồ sơ...</p>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className={styles.errorContainer}>
        <h2>Không tìm thấy hồ sơ pháp lý</h2>
        <button 
          className={styles.returnButton}
          onClick={() => navigate('/legal-docs')}
        >
          Quay lại danh sách hồ sơ
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button
          className={styles.backButton}
          onClick={() => navigate('/legal-docs')}
        >
          <i className="fas fa-arrow-left"></i> Quay lại
        </button>
        
        <div className={styles.headerActions}>
          {isOwner && (
            <>
              <button
                className={`${styles.actionButton} ${styles.downloadButton}`}
                onClick={handleDownload}
                title="Tải xuống"
              >
                <i className="fas fa-download"></i>
                <span>Tải xuống</span>
              </button>
              
              {canAnalyze && (
                <button
                  className={`${styles.actionButton} ${styles.analyzeButton} ${isAnalyzed ? styles.analyzedButton : ''}`}
                  onClick={handleAnalyze}
                  title={isAnalyzed ? "Xem phân tích AI" : "Phân tích với AI"}
                >
                  <i className={`fas ${isAnalyzed ? 'fa-robot' : 'fa-magic'}`}></i>
                  <span>{isAnalyzed ? "Xem phân tích AI" : "Phân tích"}</span>
                </button>
              )}
              
              <button
                className={`${styles.actionButton} ${styles.shareButton}`}
                onClick={handleShare}
                title="Chia sẻ"
              >
                <i className="fas fa-share-alt"></i>
                <span>Chia sẻ</span>
              </button>
              
              {!isEditing && (
                <button
                  className={`${styles.actionButton} ${styles.editButton}`}
                  onClick={handleStartEditing}
                  title="Chỉnh sửa"
                >
                  <i className="fas fa-edit"></i>
                  <span>Chỉnh sửa</span>
                </button>
              )}
              
              <button
                className={`${styles.actionButton} ${styles.deleteButton}`}
                onClick={handleShowDeleteConfirm}
                title="Xóa"
              >
                <i className="fas fa-trash-alt"></i>
                <span>Xóa</span>
              </button>
            </>
          )}
          
          {!isOwner && (
            <button
              className={`${styles.actionButton} ${styles.downloadButton}`}
              onClick={handleDownload}
              title="Tải xuống"
            >
              <i className="fas fa-download"></i>
              <span>Tải xuống</span>
            </button>
          )}
        </div>
      </div>
      
      <div className={styles.content}>
        <div className={styles.docInfo}>
          <div className={styles.docHeader}>
            <div className={styles.fileIconLarge}>
              <i className={`fas ${getFileIcon(doc.file_type)}`}></i>
            </div>
            
            <div className={styles.docTitleSection}>
              {isEditing ? (
                <form className={styles.editForm} onSubmit={handleSaveChanges}>
                  <div className={styles.formGroup}>
                    <label htmlFor="title">Tiêu đề:</label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={editForm.title}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="description">Mô tả:</label>
                    <textarea
                      id="description"
                      name="description"
                      value={editForm.description}
                      onChange={handleInputChange}
                      rows={3}
                    />
                  </div>
                  
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label htmlFor="category">Danh mục:</label>
                      <select
                        id="category"
                        name="category"
                        value={editForm.category}
                        onChange={handleInputChange}
                      >
                        <option value="">Chọn danh mục</option>
                        {categories.map((category, index) => (
                          <option key={index} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className={styles.formGroup}>
                      <label htmlFor="tags">Thẻ (phân cách bằng dấu phẩy):</label>
                      <input
                        type="text"
                        id="tags"
                        name="tags"
                        value={editForm.tags}
                        onChange={handleInputChange}
                        placeholder="Nhập thẻ, cách nhau bằng dấu phẩy"
                      />
                    </div>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>Thay thế file:</label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif"
                    />
                    
                    {!newFile ? (
                      <div className={styles.fileUploadPlaceholder} onClick={handleOpenFileSelector}>
                        <i className="fas fa-file-upload"></i>
                        <span>Chọn file để thay thế</span>
                        <small>File hiện tại: {doc.file_type?.toUpperCase()} ({formatFileSize(doc.file_size)})</small>
                      </div>
                    ) : (
                      <div className={styles.newFilePreview}>
                        <div className={styles.fileIcon}>
                          <i className={`fas ${getFileIcon(newFile.name.split('.').pop().toLowerCase())}`}></i>
                        </div>
                        <div className={styles.fileInfo}>
                          <p className={styles.fileName}>{newFile.name}</p>
                          <p className={styles.fileSize}>{formatFileSize(newFile.size)}</p>
                        </div>
                        <button 
                          type="button" 
                          className={styles.removeFileButton}
                          onClick={handleCancelFileSelect}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className={styles.formActions}>
                    <button
                      type="button"
                      className={styles.cancelButton}
                      onClick={handleCancelEdit}
                      disabled={isUpdating}
                    >
                      Hủy
                    </button>
                    
                    <button
                      type="submit"
                      className={styles.saveButton}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i> Đang lưu...
                        </>
                      ) : 'Lưu thay đổi'}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <h1 className={styles.docTitle}>{doc.title}</h1>
                  <p className={styles.docDescription}>{doc.description || 'Không có mô tả'}</p>
                  
                  <div className={styles.docMeta}>
                    <div className={styles.metaItem}>
                      <i className="fas fa-folder"></i>
                      <span>Danh mục: {doc.category || 'Không phân loại'}</span>
                    </div>
                    
                    <div className={styles.metaItem}>
                      <i className="fas fa-calendar-alt"></i>
                      <span>Ngày tạo: {formatDate(doc.created_at)}</span>
                    </div>
                    
                    {doc.updated_at && doc.updated_at !== doc.created_at && (
                      <div className={styles.metaItem}>
                        <i className="fas fa-edit"></i>
                        <span>Cập nhật: {formatDate(doc.updated_at)}</span>
                      </div>
                    )}
                    
                    <div className={styles.metaItem}>
                      <i className="fas fa-file-alt"></i>
                      <span>Loại tệp: {doc.file_type ? doc.file_type.toUpperCase() : 'Không xác định'}</span>
                    </div>
                    
                    <div className={styles.metaItem}>
                      <i className="fas fa-hdd"></i>
                      <span>Kích thước: {formatFileSize(doc.file_size || 0)}</span>
                    </div>
                    
                    {doc.owner_name && (
                      <div className={styles.metaItem}>
                        <i className="fas fa-user"></i>
                        <span>Chủ sở hữu: {doc.owner_name}</span>
                      </div>
                    )}
                  </div>
                  
                  {doc.tags && doc.tags.length > 0 && (
                    <div className={styles.docTags}>
                      {Array.isArray(doc.tags) ? 
                        doc.tags.map((tag, index) => (
                          <span key={index} className={styles.tag}>{tag}</span>
                        )) : 
                        doc.tags.split(',').map((tag, index) => (
                          <span key={index} className={styles.tag}>{tag.trim()}</span>
                        ))
                      }
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        
        {isAnalyzed && (
          <div className={styles.analysisSection}>
            <h2 className={styles.sectionTitle}>
              <i className="fas fa-robot"></i> Phân tích AI
            </h2>
            
            <div className={styles.analysisContent}>
              <div className={styles.analysisSummary}>
                <h3>Tóm tắt</h3>
                <p>{doc.metadata?.summary || 'Không có tóm tắt'}</p>
              </div>
              
              {doc.metadata?.keywords && doc.metadata.keywords.length > 0 && (
                <div className={styles.analysisKeywords}>
                  <h3>Từ khóa chính</h3>
                  <div className={styles.keywordsList}>
                    {doc.metadata.keywords.map((keyword, index) => (
                      <span key={index} className={styles.keyword}>{keyword}</span>
                    ))}
                  </div>
                </div>
              )}
              
              {doc.metadata?.document_type && (
                <div className={styles.analysisType}>
                  <h3>Loại tài liệu</h3>
                  <p className={styles.documentType}>
                    <i className="fas fa-file-alt"></i>
                    <span>{doc.metadata.document_type}</span>
                  </p>
                </div>
              )}
              
              {doc.metadata?.recommendations && (
                <div className={styles.analysisRecommendations}>
                  <h3>Khuyến nghị</h3>
                  <p>{doc.metadata.recommendations}</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className={styles.documentContent}>
          <h2 className={styles.sectionTitle}>
            <i className="fas fa-file-alt"></i> Nội dung tài liệu
            {isOwner && content && !isEditingContent && (
              <button
                className={styles.editContentButton}
                onClick={handleStartContentEditing}
                title="Chỉnh sửa nội dung"
              >
                <i className="fas fa-edit"></i>
                <span>Chỉnh sửa nội dung</span>
              </button>
            )}
          </h2>
          
          <div className={styles.contentViewer}>
            {doc.file_type === 'pdf' ? (
              <div className={styles.pdfViewer}>
                {fileUrl ? (
                  <>
                    <iframe
                      src={fileUrl}
                      className={styles.pdfFrame}
                      title={doc.title}
                      allowFullScreen
                    ></iframe>
                    <div className={styles.downloadButtonContainer}>
                      <button 
                        className={styles.downloadInlineButton}
                        onClick={handleDownload}
                      >
                        <i className="fas fa-download"></i> Tải xuống PDF
                      </button>
                    </div>
                  </>
                ) : (
                  <div className={styles.pdfNotice}>
                    <i className="fas fa-info-circle"></i>
                    <p>Tệp PDF không thể hiển thị trực tiếp. Vui lòng tải xuống để xem chi tiết.</p>
                    <button 
                      className={styles.downloadInlineButton}
                      onClick={handleDownload}
                    >
                      <i className="fas fa-download"></i> Tải xuống
                    </button>
                  </div>
                )}
              </div>
            ) : isImageFile(doc.file_type) ? (
              <div className={styles.imagePreview}>
                {fileUrl ? (
                  <>
                    <img src={fileUrl} alt={doc.title} />
                    <div className={styles.downloadButtonContainer}>
                      <button 
                        className={styles.downloadInlineButton}
                        onClick={handleDownload}
                      >
                        <i className="fas fa-download"></i> Tải xuống hình ảnh
                      </button>
                    </div>
                  </>
                ) : doc.file_url ? (
                  <>
                    <img src={doc.file_url} alt={doc.title} />
                    <div className={styles.downloadButtonContainer}>
                      <button 
                        className={styles.downloadInlineButton}
                        onClick={handleDownload}
                      >
                        <i className="fas fa-download"></i> Tải xuống hình ảnh
                      </button>
                    </div>
                  </>
                ) : (
                  <div className={styles.noPreview}>
                    <i className="fas fa-image"></i>
                    <p>Không thể hiển thị hình ảnh. Vui lòng tải xuống để xem.</p>
                    <button 
                      className={styles.downloadInlineButton}
                      onClick={handleDownload}
                    >
                      <i className="fas fa-download"></i> Tải xuống
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.textContent}>
                {isEditingContent ? (
                  <div className={styles.contentEditContainer}>
                    <textarea
                      className={styles.contentEditArea}
                      value={editableContent}
                      onChange={handleContentChange}
                      rows={20}
                    ></textarea>
                    <div className={styles.contentEditActions}>
                      <button
                        type="button"
                        className={styles.cancelButton}
                        onClick={handleCancelContentEdit}
                        disabled={isSavingContent}
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        className={styles.saveButton}
                        onClick={handleSaveContent}
                        disabled={isSavingContent}
                      >
                        {isSavingContent ? (
                          <>
                            <i className="fas fa-spinner fa-spin"></i> Đang lưu...
                          </>
                        ) : 'Lưu nội dung'}
                      </button>
                    </div>
                  </div>
                ) : content ? (
                  <>
                    <div className={styles.documentText}>
                      {content.split('\n').map((line, index) => (
                        <div key={index} style={{ paddingLeft: '10px', textIndent: line.startsWith(' ') ? '0' : '0.5em' }}>
                          {line || <span>&nbsp;</span>}
                        </div>
                      ))}
                    </div>
                    
                    {contentTruncated && (
                      <div className={styles.loadMoreContainer}>
                        <button 
                          className={styles.loadMoreButton}
                          onClick={loadFullContent}
                          disabled={isLoadingFullContent}
                        >
                          {isLoadingFullContent ? (
                            <>
                              <i className="fas fa-spinner fa-spin"></i> Đang tải đầy đủ nội dung...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-file-alt"></i> Tải đầy đủ nội dung
                            </>
                          )}
                        </button>
                        <small>Nội dung hiện tại bị cắt ngắn. Nhấn nút trên để tải toàn bộ nội dung.</small>
                      </div>
                    )}
                    
                    <div className={styles.downloadButtonContainer} style={{ marginTop: '20px' }}>
                      <button 
                        className={styles.downloadInlineButton}
                        onClick={handleDownload}
                      >
                        <i className="fas fa-download"></i> Tải xuống
                      </button>
                    </div>
                  </>
                ) : (
                  <div className={styles.noContent}>
                    <i className="fas fa-file-alt"></i>
                    <p>Không thể hiển thị nội dung tài liệu này trực tiếp. Vui lòng tải xuống để xem chi tiết.</p>
                    <button 
                      className={styles.downloadInlineButton}
                      onClick={handleDownload}
                    >
                      <i className="fas fa-download"></i> Tải xuống
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Modal chia sẻ */}
      {showShareModal && (
        <DocShareModal
          doc={doc}
          onClose={() => setShowShareModal(false)}
          onSuccess={handleShareSuccess}
        />
      )}
      
      {/* Modal phân tích */}
      {showAnalysisModal && (
        <DocAnalysisModal
          doc={doc}
          onClose={() => setShowAnalysisModal(false)}
          onComplete={handleAnalysisComplete}
        />
      )}
      
      {/* Modal xác nhận xóa */}
      {showDeleteModal && (
        <DeleteConfirmModal
          doc={doc}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteConfirm}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
};

export default LegalDocDetail; 