import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Input, Select, Form, Spin, Typography, Alert, DatePicker, Upload } from 'antd';
import { UploadOutlined, SaveOutlined, LeftOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import moment from 'moment';
import axiosInstance from '../../../config/axios';
import { API_URL } from '../../../config/constants';
import legalService from '../../../services/legalService';
import styles from './EditLegalDocument.module.css';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const EditLegalDocument = () => {
  // Lấy ID từ URL qua useParams hook
  const { id } = useParams();
  const isEditMode = id && id !== 'new';
  
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const editorRef = useRef(null);
  const quillInstance = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    document_type: '',
    version: '',
    content: '',
    summary: '',
    issued_date: '',
    language: 'Tiếng Việt',
    keywords: []
  });
  const [htmlContent, setHtmlContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [fallbackEditor, setFallbackEditor] = useState(false);
  const [quillReady, setQuillReady] = useState(false);
  const [loadingQuill, setLoadingQuill] = useState(false);
  const [quillLoadRetries, setQuillLoadRetries] = useState(0);
  const [debugInfo, setDebugInfo] = useState('');
  const MAX_RETRIES = 3;
  
  // Thêm một biến state mới để đánh dấu đã thử tải Quill từ useEffect
  const [hasTriedLoadingWithContent, setHasTriedLoadingWithContent] = useState(false);

  // Hàm tiện ích để làm sạch HTML
  const sanitizeHtml = (htmlContent) => {
    if (!htmlContent) return '';
    
    let result = htmlContent;
    
    // Loại bỏ các thẻ không an toàn
    result = result.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '');
    result = result.replace(/<frame[^>]*>[\s\S]*?<\/frame>/gi, '');
    result = result.replace(/<frameset[^>]*>[\s\S]*?<\/frameset>/gi, '');
    
    // Loại bỏ các thuộc tính JavaScript inline
    result = result.replace(/ on\w+="[^"]*"/gi, '');
    result = result.replace(/ on\w+='[^']*'/gi, '');
    result = result.replace(/ on\w+=\w+/gi, '');
    
    // Loại bỏ các tham chiếu JavaScript trong href
    result = result.replace(/href\s*=\s*["']?\s*javascript:[^"']*/gi, 'href="#"');
    
    // Xử lý các thẻ pre có nền đen (những thẻ có style background-color: #000000 hoặc rgb(0,0,0))
    result = result.replace(/<pre[^>]*style="[^"]*background-color:\s*(?:#000000|rgb\(0,\s*0,\s*0\))[^"]*"[^>]*>([\s\S]*?)<\/pre>/gi, 
                           (match, content) => {
                             // Thay thế thẻ pre bằng thẻ div với style thông thường
                             return `<div class="paragraph">${content}</div>`;
                           });
    
    // Loại bỏ style background-color: black từ bất kỳ thẻ nào
    result = result.replace(/style="([^"]*)background-color:\s*(?:#000000|#000|rgb\(0,\s*0,\s*0\)|black)([^"]*)"/gi, 
                           'style="$1$2"');
    
    // Bảo toàn thẻ xuống dòng và khoảng trắng
    // Nếu là văn bản không có thẻ HTML
    if (!result.includes('<p>') && !result.includes('<div>') && !result.includes('<br')) {
      result = result.replace(/\n/g, '<br />');
      result = result.replace(/\r/g, '');
      result = result.replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
      result = result.replace(/  /g, '&nbsp;&nbsp;');
      
      // Đảm bảo các đoạn văn được giữ nguyên
      result = '<p>' + result + '</p>';
    }
    
    // Đảm bảo các thẻ có width 100% để không bị tràn
    result = result.replace(/<(p|div|pre|h[1-6])[^>]*style="([^"]*)"/gi, 
                           (match, tag, style) => {
                             if (!style.includes('width')) {
                               return `<${tag} style="${style}width: 100%;max-width: 100%;word-wrap: break-word;"`;
                             }
                             return match;
                           });
    
    return result;
  };

  // ===== KHỞI TẠO QUILL =====
  const loadQuillResources = () => {
    setLoadingQuill(true);
    setDebugInfo('Đang tải tài nguyên Quill...');
    
    return new Promise((resolve, reject) => {
      try {
        // Tải CSS
        if (!document.querySelector('link[href*="quill.snow.css"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://cdn.jsdelivr.net/npm/quill@1.3.7/dist/quill.snow.css';
          document.head.appendChild(link);
          
          link.onload = () => {
            setDebugInfo('CSS đã tải xong, đang tải JavaScript...');
            loadQuillScript(resolve, reject);
          };
          
          link.onerror = (e) => {
            setDebugInfo('Lỗi khi tải CSS: ' + e);
            reject(new Error('Không thể tải CSS Quill'));
          };
        } else {
          setDebugInfo('CSS đã tồn tại, đang tải JavaScript...');
          loadQuillScript(resolve, reject);
        }
      } catch (error) {
        setDebugInfo('Lỗi khi tải tài nguyên: ' + error.message);
        reject(error);
      }
    });
  };

  const loadQuillScript = (resolve, reject) => {
    try {
      if (!window.Quill) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/quill@1.3.7/dist/quill.min.js';
        script.async = true;
        
        script.onload = () => {
          setDebugInfo('JavaScript đã tải xong, Quill sẵn sàng');
          resolve(true);
        };
        
        script.onerror = (e) => {
          setDebugInfo('Lỗi khi tải JavaScript: ' + e);
          reject(new Error('Không thể tải JavaScript Quill'));
        };
        
        document.body.appendChild(script);
      } else {
        setDebugInfo('Quill đã được tải trước đó');
        resolve(true);
      }
    } catch (error) {
      setDebugInfo('Lỗi khi tải script: ' + error.message);
      reject(error);
    }
  };

  const setupQuillEditor = async () => {
    if (!editorRef.current) {
      setDebugInfo('Lỗi: Tham chiếu editor không tồn tại');
      return;
    }
    
    try {
      setDebugInfo('Bắt đầu thiết lập editor...');
      
      // Xóa nội dung cũ nếu có
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
      }
      
      // Tải tài nguyên
      await loadQuillResources();
      
      // Đảm bảo Quill có sẵn
      if (!window.Quill) {
        throw new Error('Quill không được tải đúng cách');
      }
      
      // Tạo container
      const editorContainer = document.createElement('div');
      editorRef.current.appendChild(editorContainer);
      
      // Khởi tạo Quill
      quillInstance.current = new window.Quill(editorContainer, {
        theme: 'snow',
        modules: {
          toolbar: [
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'indent': '-1'}, { 'indent': '+1' }],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'align': [] }],
            ['link', 'image'],
            ['clean']
          ],
        },
        placeholder: 'Nhập nội dung văn bản ở đây...'
      });
      
      // Đăng ký sự kiện
      quillInstance.current.on('text-change', () => {
        try {
          const content = quillInstance.current.root.innerHTML;
          setHtmlContent(content);
          form.setFieldsValue({ content });
        } catch (err) {
          setDebugInfo('Lỗi khi cập nhật nội dung từ Quill: ' + err.message);
        }
      });
      
      setQuillReady(true);
      setLoadingQuill(false);
      setDebugInfo('Quill đã được tải thành công và sẵn sàng');
      
      // Nếu có nội dung, cập nhật vào Quill
      if (htmlContent) {
        setTimeout(() => updateQuillContent(htmlContent), 300);
      }
    } catch (error) {
      setDebugInfo('Lỗi khi thiết lập Quill: ' + error.message);
      setLoadingQuill(false);
      
      // Thử lại nếu chưa vượt quá số lần thử
      if (quillLoadRetries < MAX_RETRIES) {
        setQuillLoadRetries(prev => prev + 1);
        setDebugInfo(`Thử lại lần ${quillLoadRetries + 1}/${MAX_RETRIES}...`);
        
        // Sử dụng requestAnimationFrame thay vì setTimeout để giảm số lần render
        requestAnimationFrame(() => {
          // Kiểm tra thêm điều kiện để tránh vòng lặp vô hạn
          if (!quillReady && !fallbackEditor && quillLoadRetries < MAX_RETRIES) {
            // Chờ một thời gian trước khi thử lại
            setTimeout(setupQuillEditor, 1000);
          }
        });
      } else {
        // Chuyển sang chế độ fallback nếu vượt quá số lần thử
        setDebugInfo('Đã thử lại quá nhiều lần, chuyển sang chế độ soạn thảo đơn giản');
        setFallbackEditor(true);
      }
    }
  };

  const updateQuillContent = (content) => {
    if (!quillInstance.current || !content) {
      setDebugInfo('Không thể cập nhật nội dung: quillInstance hoặc content trống');
      return;
    }
    
    try {
      setDebugInfo('Đang cập nhật nội dung Quill...');
      
      // Xử lý content để loại bỏ iframe, frame nếu có
      let processedContent = sanitizeHtml(content);
      
      // Xóa nội dung hiện tại
      quillInstance.current.root.innerHTML = '';
      
      // Chèn HTML mới
      quillInstance.current.clipboard.dangerouslyPasteHTML(processedContent);
      setDebugInfo('Đã cập nhật nội dung Quill thành công');
    } catch (err) {
      setDebugInfo('Lỗi khi cập nhật nội dung: ' + err.message);
      
      // Thử phương pháp khác nếu dangerouslyPasteHTML thất bại
      try {
        // Vẫn xử lý content để loại bỏ iframe, frame
        let processedContent = sanitizeHtml(content);
        
        quillInstance.current.root.innerHTML = processedContent;
        setDebugInfo('Đã cập nhật nội dung bằng phương pháp thay thế');
      } catch (fallbackErr) {
        setDebugInfo('Không thể cập nhật nội dung, chuyển sang chế độ fallback');
        setFallbackEditor(true);
      }
    }
  };

  // Hiển thị editor fallback khi Quill gặp lỗi
  const renderFallbackEditor = () => {
    return (
      <TextArea
        value={htmlContent}
        onChange={(e) => {
          setHtmlContent(e.target.value);
          form.setFieldsValue({ content: e.target.value });
        }}
        style={{ minHeight: '500px', fontSize: '16px', lineHeight: 1.6, width: '100%' }}
        placeholder="Nhập nội dung văn bản ở đây..."
      />
    );
  };

  // ===== QUẢN LÝ DỮ LIỆU =====
  // Sửa đổi useEffect để tách biệt việc tải dữ liệu và khởi tạo Quill
  useEffect(() => {
    // Khởi tạo Quill khi component được mount
    setupQuillEditor();
    
    // Dọn dẹp khi unmount
    return () => {
      if (quillInstance.current) {
        try {
          if (typeof quillInstance.current.off === 'function') {
            quillInstance.current.off('text-change');
          }
        } catch (e) {
          console.error('Lỗi khi dọn dẹp Quill:', e);
        }
        quillInstance.current = null;
      }
    };
  }, []); // Chỉ chạy 1 lần khi component mount

  // Thêm useEffect riêng để tải dữ liệu
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Lấy danh sách loại văn bản
        const documentTypesData = await legalService.getDocumentTypes();
        setDocumentTypes(documentTypesData);
        
        // Kiểm tra ID có hợp lệ không
        if (id === 'dashboard' || id === undefined) {
          setError(`ID không hợp lệ: "${id || 'undefined'}" không phải là ID văn bản hợp lệ`);
          toast.error('Đường dẫn không hợp lệ, hệ thống sẽ chuyển hướng về trang chính');
          setTimeout(() => {
            goBack();
          }, 2000);
          return;
        }
        
        // Nếu có ID hợp lệ (không phải 'new')
        if (isEditMode) {
          let document = null;
          
          try {
            // Kiểm tra tính hợp lệ của ID
            if (isNaN(parseInt(id))) {
              throw new Error(`ID không hợp lệ: "${id}"`);
            }
            
            // Thử lấy dữ liệu từ API
            const response = await legalService.getLegalDocumentById(id);
            if (response.status === 'success' && response.data) {
              document = response.data;
            }
          } catch (apiError) {
            // Nếu API lỗi, thử lấy từ localStorage
            const savedDocument = localStorage.getItem('editingDocument');
            if (savedDocument) {
              try {
                document = JSON.parse(savedDocument);
                if (document.id && document.id.toString() !== id.toString()) {
                  document = null; // Nếu ID không khớp, không sử dụng
                }
              } catch (parseError) {
                // Lỗi phân tích - không xử lý
              }
            }
          }
          
          if (document) {
            // Chuyển đổi dữ liệu để hiển thị trên form
            const formattedDocument = {
              ...document,
              issued_date: document.issued_date ? moment(document.issued_date) : null,
              keywords: document.keywords && typeof document.keywords === 'string' 
                ? document.keywords.split(',').map(k => k.trim()) 
                : Array.isArray(document.keywords) ? document.keywords : []
            };
            
            setFormData(formattedDocument);
            setHtmlContent(formattedDocument.content || '');
            form.setFieldsValue(formattedDocument);
          } else {
            setError('Không thể tải thông tin văn bản pháp luật');
            toast.error('Không thể tải thông tin văn bản pháp luật');
          }
        }
      } catch (err) {
        setError('Không thể tải dữ liệu: ' + (err.response?.data?.message || err.message));
        toast.error('Không thể tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Không cần trả về cleanup function cho useEffect này
  }, [id, form]);

  // Thêm useEffect mới để xử lý khi cả nội dung và Quill đã sẵn sàng
  useEffect(() => {
    if (quillReady && htmlContent) {
      updateQuillContent(htmlContent);
    }
  }, [quillReady, htmlContent]);

  // Thêm xử lý trực tiếp nếu không thể tải Quill sau tất cả các lần thử
  useEffect(() => {
    if (quillLoadRetries >= MAX_RETRIES && !quillReady && !fallbackEditor) {
      setFallbackEditor(true);
    }
  }, [quillLoadRetries, quillReady, fallbackEditor]);

  // Sửa useEffect đang gây ra lỗi vòng lặp vô hạn
  useEffect(() => {
    // Khi nội dung thay đổi do tải tài liệu lên và Quill chưa sẵn sàng
    if (htmlContent && !quillReady && !fallbackEditor && !hasTriedLoadingWithContent && quillLoadRetries < MAX_RETRIES) {
      // Đánh dấu đã thử tải Quill để tránh gọi liên tục
      setHasTriedLoadingWithContent(true);
      // Thử khởi tạo lại Quill
      setupQuillEditor();
    }
  }, [htmlContent, quillReady, fallbackEditor, hasTriedLoadingWithContent, quillLoadRetries]);

  // Thêm useEffect để reset biến đánh dấu khi cần
  useEffect(() => {
    // Reset biến đánh dấu khi Quill đã sẵn sàng
    if (quillReady) {
      setHasTriedLoadingWithContent(false);
    }
  }, [quillReady]);

  const handleUploadPdf = async (info) => {
    if (info.file.status === 'uploading') {
      setIsUploading(true);
      return;
    }
    
    if (info.file.status !== 'done') {
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('file', info.file.originFileObj);
      
      const response = await axiosInstance.post(
        `${API_URL}/legal/upload-pdf`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      if (response.data && response.data.status === 'success') {
        let content = response.data.data.content;
        
        // Kiểm tra nếu nội dung có thẻ pre với background đen
        if (content.includes('<pre') && 
            (content.includes('background-color: #000') || 
             content.includes('background-color: rgb(0, 0, 0)'))) {
          // Đánh dấu để xử lý đặc biệt
          setDebugInfo('Phát hiện định dạng pre với nền đen, đang xử lý...');
        }
        
        // Xử lý đặc biệt cho nội dung văn bản thuần túy
        if (response.data.data.contentType === 'text' || !content.includes('<')) {
          // Nếu là văn bản thuần túy, thêm định dạng HTML cơ bản để giữ xuống dòng
          content = content.replace(/\n/g, '<br />');
          content = '<p style="width: 100%; max-width: 100%; word-wrap: break-word;">' + content + '</p>';
        }
        
        // Làm sạch nội dung HTML
        let processedContent = sanitizeHtml(content);
        
        // Cập nhật state và form
        setHtmlContent(processedContent);
        form.setFieldsValue({ content: processedContent });
        
        // Nếu Quill đã sẵn sàng, cập nhật nội dung trực tiếp
        if (quillReady && quillInstance.current) {
          // Timeout để đảm bảo state đã được cập nhật
          setTimeout(() => {
            try {
              // Xóa nội dung hiện tại trong Quill
              quillInstance.current.root.innerHTML = '';
              
              // Chèn HTML mới vào Quill theo cách an toàn
              quillInstance.current.clipboard.dangerouslyPasteHTML(processedContent);
              setDebugInfo('Đã cập nhật nội dung Quill thành công');
            } catch (err) {
              // Nếu phương thức dangerouslyPasteHTML gặp lỗi, thử phương pháp thay thế
              try {
                quillInstance.current.root.innerHTML = processedContent;
                setDebugInfo('Đã cập nhật nội dung Quill bằng phương pháp thay thế');
              } catch (fallbackErr) {
                setDebugInfo('Không thể cập nhật nội dung Quill: ' + fallbackErr.message);
                // Nếu cả hai phương pháp đều thất bại, chuyển sang chế độ fallback
                setFallbackEditor(true);
              }
            }
          }, 300);
        } else if (!quillReady && !fallbackEditor) {
          // Không gọi setupQuillEditor trực tiếp
          // useEffect sẽ phát hiện thay đổi trong htmlContent và xử lý
          setDebugInfo('Đã tải nội dung, chờ trình soạn thảo khởi tạo...');
          
          // Reset biến đánh dấu để cho phép useEffect thử tải lại Quill
          setHasTriedLoadingWithContent(false);
        }
        
        toast.success('Chuyển đổi tài liệu thành HTML thành công');
      }
    } catch (err) {
      setDebugInfo('Lỗi khi chuyển đổi tài liệu: ' + (err.response?.data?.message || err.message));
      toast.error('Không thể chuyển đổi tài liệu: ' + (err.response?.data?.message || err.message));
      // Nếu có lỗi, chuyển sang chế độ fallback để người dùng có thể nhập nội dung
      setFallbackEditor(true);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // Đảm bảo giá trị content được cập nhật từ trình soạn thảo
      if (quillInstance.current && !fallbackEditor) {
        try {
          // Làm sạch nội dung HTML trước khi lưu
          const rawContent = quillInstance.current.root.innerHTML;
          values.content = sanitizeHtml(rawContent);
        } catch (err) {
          values.content = sanitizeHtml(htmlContent);
        }
      } else {
        values.content = sanitizeHtml(htmlContent);
      }
      
      // Chuyển đổi mảng từ khóa thành chuỗi
      if (values.keywords && Array.isArray(values.keywords)) {
        values.keywords = values.keywords.join(', ');
      }
      
      // Chuyển đổi ngày phát hành sang định dạng chuẩn
      if (values.issued_date) {
        values.issued_date = values.issued_date.format('YYYY-MM-DD');
      }
      
      setSaving(true);
      
      if (isEditMode) {
        // Cập nhật văn bản hiện có
        const response = await axiosInstance.put(
          `${API_URL}/legal/documents/${id}`,
          values
        );
        
        if (response.data && response.data.status === 'success') {
          toast.success('Cập nhật văn bản pháp lý thành công');
          // Chuyển hướng về trang danh sách
          goBack();
        }
      } else {
        // Tạo văn bản mới
        const response = await axiosInstance.post(
          `${API_URL}/legal/documents`,
          values
        );
        
        if (response.data && response.data.status === 'success') {
          toast.success('Tạo văn bản pháp lý mới thành công');
          // Chuyển hướng về trang danh sách
          goBack();
        }
      }
    } catch (err) {
      console.error('Lỗi khi lưu văn bản pháp lý:', err);
      toast.error('Không thể lưu văn bản pháp lý: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  // Hàm quay lại trang trước
  const goBack = () => {
    try {
      navigate('/dashboard');
    } catch (e) {
      // Nếu navigate không hoạt động
      window.location.href = '/dashboard';
    }
  };

  // Hàm chuyển hướng đến trang standalone editor
  const openStandaloneEditor = () => {
    // Lưu dữ liệu hiện tại vào localStorage
    try {
      const currentFormData = form.getFieldsValue();
      currentFormData.content = htmlContent;
      currentFormData.id = id;
      localStorage.setItem('editingDocument', JSON.stringify(currentFormData));
      
      // Mở trang standalone editor trong tab mới
      const editorUrl = `/standalone-editor.html${id ? `?id=${id}` : ''}`;
      window.open(editorUrl, '_blank');
    } catch (err) {
      console.error('Lỗi khi lưu dữ liệu vào localStorage:', err);
      toast.error('Lỗi khi mở trình soạn thảo riêng biệt: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" />
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className={styles.container}>
        <Alert
          message="Lỗi"
          description={error}
          type="error"
          showIcon
          action={
            <Button onClick={goBack} type="primary">
              Quay lại
            </Button>
          }
        />
      </Card>
    );
  }

  return (
    <Card className={styles.container}>
      <div className={styles.header}>
        <Button 
          type="default"
          icon={<LeftOutlined />}
          onClick={goBack}
          className={styles.backButton}
        >
          Quay lại
        </Button>
        
        <Title level={3}>{isEditMode ? 'Chỉnh sửa văn bản pháp luật' : 'Thêm văn bản pháp luật mới'}</Title>
        
        <div>
          <Button
            style={{ marginRight: '10px' }}
            type="default"
            onClick={openStandaloneEditor}
          >
            Mở trình soạn thảo riêng biệt
          </Button>
        </div>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSubmit}
            loading={saving}
            className={styles.saveButton}
          >
            Lưu
          </Button>
      </div>

      <Form
        form={form}
        layout="vertical"
        initialValues={formData}
        className={styles.form}
      >
        <div className={styles.formRow}>
          <Form.Item
            name="title"
            label="Tiêu đề"
            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề văn bản pháp lý' }]}
            className={styles.formItem}
          >
            <Input placeholder="Nhập tiêu đề văn bản pháp lý" />
          </Form.Item>
          
          <Form.Item
            name="document_type"
            label="Loại văn bản"
            rules={[{ required: true, message: 'Vui lòng chọn loại văn bản pháp lý' }]}
            className={styles.formItem}
          >
            <Select placeholder="Chọn loại văn bản pháp lý">
              {documentTypes.map((type) => (
                <Option key={type.id || type} value={type.id || type}>
                  {type.name || type}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </div>

        <div className={styles.formRow}>
          <Form.Item
            name="version"
            label="Phiên bản"
            className={styles.formItem}
          >
            <Input placeholder="Nhập phiên bản (nếu có)" />
          </Form.Item>
          
          <Form.Item
            name="language"
            label="Ngôn ngữ"
            rules={[{ required: true, message: 'Vui lòng chọn ngôn ngữ' }]}
            className={styles.formItem}
          >
            <Select>
              <Option value="Tiếng Việt">Tiếng Việt</Option>
              <Option value="English">English</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="issued_date"
            label="Ngày ban hành"
            className={styles.formItem}
          >
            <DatePicker 
              format="DD/MM/YYYY" 
              placeholder="Chọn ngày"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </div>
        
        <Form.Item
          name="keywords"
          label="Từ khóa"
        >
          <Select
            mode="tags"
            placeholder="Nhập từ khóa và nhấn Enter"
            style={{ width: '100%' }}
          />
        </Form.Item>
        
        <Form.Item
          name="summary"
          label="Tóm tắt"
          style={{width: '100%'}}
        >
          <TextArea
            rows={6}
            placeholder="Nhập tóm tắt về văn bản pháp lý"
            style={{ fontSize: '16px', lineHeight: '1.6',width: '100%' }}
          />
        </Form.Item>
        
        <div className={styles.editorHeader} style={{width: '100%',display: 'flex',justifyContent: 'space-between',alignItems: 'center'}}>
          <div className={styles.editorTitle}>
            <Text strong>Nội dung văn bản</Text>
            <Text type="secondary">(Sử dụng các công cụ định dạng để chỉnh sửa nội dung)</Text>
          </div>
          
          <Upload
            name="file"
            accept=".pdf,.doc,.docx"
            showUploadList={false}
            customRequest={({ file, onSuccess }) => {
              setTimeout(() => {
                onSuccess("ok");
              }, 0);
            }}
            onChange={handleUploadPdf}
          >
            <Button
              icon={<UploadOutlined />}
              loading={isUploading}
            >
              Tải lên file
            </Button>
          </Upload>
        </div>
        
        <Form.Item
          name="content"
          rules={[{ required: true, message: 'Vui lòng nhập nội dung văn bản pháp lý' }]}
          noStyle
        >
          <input type="hidden" />
        </Form.Item>
        
        <div className={styles.editorContainer}>
          {/* Thông báo thông tin */}
          {!loading && (
            <Alert
              message="Thông tin nội dung"
              description={
                <div>
                  <p>Nội dung: {htmlContent ? 'Có' : 'Không'}</p>
                  {!quillReady && !fallbackEditor && (
                    <p style={{ color: '#1890ff' }}>Nhấn nút "Hiển thị tài liệu" để tải trình soạn thảo.</p>
                  )}
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: '10px' }}
            />
          )}
          
          {/* Nút thử lại thủ công */}
          {!quillReady && !fallbackEditor && !loading && (
            <Button 
              type="primary" 
              onClick={() => {
                setQuillLoadRetries(0);
                setupQuillEditor();
              }}
              style={{ 
                margin: '0 auto 10px',
                display: 'block'
              }}
            >
              Hiển thị tài liệu
            </Button>
          )}
        
          
          {/* Quill Editor Container hoặc Fallback Editor */}
          {fallbackEditor ? (
            renderFallbackEditor()
          ) : (
            <div ref={editorRef} className={styles.editor}></div>
          )}
        </div>
      </Form>
    </Card>
  );
};

export default EditLegalDocument; 