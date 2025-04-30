import React, { useState, useRef, useEffect } from 'react';
import { renderAsync } from 'docx-preview';
import styles from './ContractDocViewer.module.css';

const ContractDocViewer = ({ fileUrl, fileName }) => {
  const [viewerType, setViewerType] = useState('native'); // Sử dụng trình xem tích hợp là mặc định
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [googleDocsError, setGoogleDocsError] = useState(false);
  const docxContainer = useRef(null);
  const iframeRef = useRef(null);
  
  // Lấy base URL an toàn
  const getBaseUrl = () => {
    try {
      // Trả về API base URL cố định thay vì lấy từ window.location.origin
      return 'http://localhost:8000/api';
    } catch (error) {
      console.error("Lỗi khi lấy origin URL:", error);
      return 'http://localhost:8000/api'; // Fallback nếu không lấy được origin
    }
  };
  
  // Chuẩn hóa URL của tài liệu để sử dụng API download
  const normalizeDocUrl = (url) => {
    if (!url) return url;

    // Nếu URL đã là URL đầy đủ và chứa backend API, sử dụng nó
    if (url.includes('localhost:8000')) {
      console.log("URL đã trỏ đến backend API:", url);
      return url;
    }

    // Nếu url là đường dẫn tương đối /uploads/ thì thêm domain backend
    if (url.startsWith('/uploads/')) {
      const baseApiUrl = 'http://localhost:8000'; // Domain của backend API
      const fullUrl = `${baseApiUrl}${url}`;
      console.log("Chuyển đổi URL uploads sang backend API:", fullUrl);
      return fullUrl;
    }
    
    // Nếu URL localhost:3000 thì chuyển thành localhost:8000
    if (url.includes('localhost:3000')) {
      const correctedUrl = url.replace('localhost:3000', 'localhost:8000');
      console.log("Chuyển đổi URL từ frontend sang backend:", correctedUrl);
      return correctedUrl;
    }

    // Kiểm tra nếu URL đã là API download
    if (url.includes('/contracts/') && url.includes('/download')) {
      console.log("URL đã là API download:", url);
      return url;
    }

    // Kiểm tra nếu URL trỏ đến uploads folder
    if (url.includes('/uploads/contracts/')) {
      try {
        // Thử lấy ID của tài liệu từ URL
        const urlParts = url.split('/');
        const filename = urlParts[urlParts.length - 1];
        const contractId = filename.split('.')[0].split('_')[0]; // Lấy phần trước dấu gạch dưới và dấu chấm là ID
        
        if (contractId) {
          // Tạo URL API download an toàn
          const baseUrl = getBaseUrl();
          const downloadUrl = `${baseUrl}/contracts/${contractId}/download`;
          console.log("Tạo URL API download:", downloadUrl);
          return downloadUrl;
        }
      } catch (error) {
        console.error("Lỗi khi chuẩn hóa URL:", error);
      }
    }
    
    return url;
  };

  // Tạo các URL trực tiếp cho các trình xem bên ngoài
  const getGoogleDocsUrl = () => `https://docs.google.com/viewer?url=${encodeURIComponent(normalizeDocUrl(fileUrl))}&embedded=true`;
  const getOfficeOnlineUrl = () => `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(normalizeDocUrl(fileUrl))}`;
  
  // Theo dõi lỗi iframe Google Docs
  const checkIframeLoaded = () => {
    if (iframeRef.current) {
      try {
        // Thử truy cập nội dung iframe (sẽ gây lỗi nếu không tải được)
        const iframeContent = iframeRef.current.contentWindow.document;
        console.log("Google Docs Viewer đã tải thành công");
        setGoogleDocsError(false);
        setLoading(false);
      } catch (err) {
        console.log("Lỗi khi kiểm tra iframe Google Docs:", err);
      }
    }
  };

  // Xử lý khi iframe bị lỗi
  const handleIframeError = () => {
    console.error("Google Docs Viewer không thể tải tài liệu");
    setGoogleDocsError(true);
  };

  // Xử lý khi người dùng thay đổi loại trình xem
  const handleViewerChange = (type) => {
    setViewerType(type);
    setLoading(true);
    setGoogleDocsError(false);
    
    // Nếu chuyển sang native viewer, cần khởi tạo lại
    if (type === 'native') {
      loadDocxNative();
    }
  };

  // Xử lý khi iframe đã tải xong
  const handleFrameLoad = () => {
    setLoading(false);
    // Sau khi iframe tải, kiểm tra có nội dung không
    setTimeout(checkIframeLoaded, 2000);
  };
  
  // Tải và hiển thị file docx bằng docx-preview
  const loadDocxNative = async () => {
    if (!docxContainer.current) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Kiểm tra URL hợp lệ
      if (!fileUrl) {
        throw new Error('URL tài liệu không hợp lệ');
      }
      
      // Chuẩn hóa URL để sử dụng đúng nguồn
      const normalizedUrl = normalizeDocUrl(fileUrl);
      console.log("Đang tải file từ URL:", normalizedUrl);
      
      try {
        // Kiểm tra tài liệu có tồn tại không
        let headResponse;
        try {
          headResponse = await fetch(normalizedUrl, { 
            method: 'HEAD',
            headers: {
              'Accept': 'application/octet-stream, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/msword, */*'
            }
          });
          
          if (!headResponse.ok) {
            console.warn(`Kiểm tra HEAD không thành công: ${headResponse.status} ${headResponse.statusText}`);
            // Tiếp tục thử GET nếu HEAD không thành công
          }
        } catch (headError) {
          console.warn("Lỗi khi kiểm tra HEAD, sẽ thử GET trực tiếp:", headError);
          // Tiếp tục thử GET nếu HEAD gặp lỗi
        }
        
        // Nếu HEAD trả về lỗi hoặc không phải là file DOCX, thử kiểm tra content-type
        if (headResponse && headResponse.ok) {
          const contentType = headResponse.headers.get('Content-Type');
          console.log("Content-Type:", contentType);
          
          // Nếu content-type là text/html, có thể máy chủ đang trả về trang lỗi hoặc trang đăng nhập
          if (contentType && contentType.includes('text/html')) {
            console.warn('Server trả về HTML thay vì file Word. Chuyển sang sử dụng Google Docs Viewer...');
            setViewerType('google');
            throw new Error(`Server trả về HTML thay vì file DOCX. Đang chuyển sang trình xem Google Docs.`);
          }
          
          // Không tiếp tục nếu rõ ràng không phải file DOCX
          if (contentType && 
              !contentType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document') &&
              !contentType.includes('application/msword') &&
              !contentType.includes('application/octet-stream') &&
              !contentType.includes('binary/octet-stream') &&
              !contentType.includes('application/zip')) {
            console.warn('Content-Type không phải file Word:', contentType);
            setViewerType('google');
            throw new Error(`Định dạng file không được hỗ trợ: ${contentType}. Chuyển sang Google Docs.`);
          }
        }
      } catch (error) {
        console.error("Lỗi kiểm tra file:", error);
        // Nếu không kiểm tra được, vẫn thử tải file
      }
      
      // Tải file docx từ URL với header phù hợp
      let response;
      try {
        response = await fetch(normalizedUrl, {
          headers: {
            'Accept': 'application/octet-stream, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/msword, */*'
          }
        });
        
        if (!response.ok) {
          console.error(`Không thể tải tài liệu: ${response.status} ${response.statusText}`);
          setViewerType('google');
          throw new Error(`Không thể tải tài liệu trực tiếp. Chuyển sang Google Docs.`);
        }
      } catch (fetchError) {
        console.error("Lỗi khi tải tài liệu:", fetchError);
        setViewerType('google');
        throw new Error("Không thể tải tài liệu. Đang chuyển sang Google Docs.");
      }
      
      // Kiểm tra content-type của response
      const responseContentType = response.headers.get('Content-Type');
      if (responseContentType && responseContentType.includes('text/html')) {
        console.warn('Response trả về HTML thay vì file Word. Chuyển sang sử dụng Google Docs Viewer...');
        setViewerType('google');
        throw new Error(`Server trả về HTML thay vì file DOCX. Đang chuyển sang trình xem Google Docs.`);
      }
      
      // Chuyển đổi thành ArrayBuffer
      let arrayBuffer;
      try {
        arrayBuffer = await response.arrayBuffer();
      } catch (bufferError) {
        console.error("Lỗi khi chuyển đổi response sang ArrayBuffer:", bufferError);
        setViewerType('google');
        throw new Error("Lỗi khi xử lý tài liệu. Đang chuyển sang Google Docs.");
      }
      
      // Kiểm tra kích thước file
      if (!arrayBuffer || arrayBuffer.byteLength < 100) {
        console.warn("Tài liệu rỗng hoặc quá nhỏ:", arrayBuffer ? arrayBuffer.byteLength : 0);
        setViewerType('google');
        throw new Error('Tài liệu rỗng hoặc không hợp lệ. Đang chuyển sang Google Docs.');
      }
      
      console.log('Kích thước file:', arrayBuffer.byteLength, 'bytes');
      
      // Kiểm tra xem file có đúng định dạng không bằng cách đọc 4 byte đầu
      const firstFourBytes = new Uint8Array(arrayBuffer.slice(0, 4));
      const docxSignature = [0x50, 0x4B, 0x03, 0x04]; // Định dạng ZIP/DOCX bắt đầu với 'PK\x03\x04'
      
      let isValidZip = true;
      for (let i = 0; i < 4; i++) {
        if (firstFourBytes[i] !== docxSignature[i]) {
          isValidZip = false;
          break;
        }
      }
      
      if (!isValidZip) {
        console.error("File không phải định dạng ZIP/DOCX hợp lệ", firstFourBytes);
        console.log("Chuyển sang sử dụng Google Docs Viewer...");
        setViewerType('google');
        throw new Error("Tài liệu không phải định dạng DOCX hợp lệ. Đang chuyển sang Google Docs.");
      }
      
      // Xóa nội dung cũ nếu có
      if (docxContainer.current) {
        docxContainer.current.innerHTML = '';
      }
      
      console.log('Bắt đầu hiển thị DOCX, kích thước:', arrayBuffer.byteLength);
      
      try {
        // Hiển thị docx bằng docx-preview
        await renderAsync(arrayBuffer, docxContainer.current, null, {
          className: styles.docxContent,
          inWrapper: true,
          ignoreHeight: false,
          ignoreWidth: false,
          defaultFont: {
            family: 'Arial',
            size: 12,
          },
        });
      } catch (renderError) {
        console.error('Lỗi khi render file DOCX:', renderError);
        console.log("Chuyển sang sử dụng Google Docs Viewer...");
        setViewerType('google');
        throw new Error(`Không thể hiển thị nội dung DOCX: ${renderError.message}`);
      }
      
    } catch (err) {
      console.error('Lỗi khi tải tài liệu DOCX:', err);
      setError(`Không thể hiển thị tài liệu: ${err.message}`);
      
      // Chuyển đổi ngay sang Google Docs
      if (viewerType === 'native') {
        console.log("Tự động chuyển sang Google Docs Viewer");
        setViewerType('google');
      }
    } finally {
      setLoading(false);
    }
  };

  // Tạo iframe URL với tham số ngẫu nhiên để khắc phục vấn đề cache
  const createIframeUrl = (baseUrl) => {
    const timestamp = new Date().getTime();
    return `${baseUrl}&rand=${timestamp}`;
  };
  
  // Tải tài liệu khi component được tạo hoặc URL thay đổi
  useEffect(() => {
    if (!fileUrl) {
      setError('Không có URL tài liệu');
      setLoading(false);
      return;
    }
    
    if (viewerType === 'native') {
      loadDocxNative();
    }
  }, [fileUrl, viewerType]);

  return (
    <div className={styles.docxViewerContainer}>
      <div className={styles.viewerControls}>
        <button 
          className={`${styles.viewerButton} ${viewerType === 'native' ? styles.active : ''}`}
          onClick={() => handleViewerChange('native')}
        >
          <i className="fas fa-file-word"></i> Tích hợp
        </button>
        <button 
          className={`${styles.viewerButton} ${viewerType === 'google' ? styles.active : ''}`}
          onClick={() => handleViewerChange('google')}
        >
          <i className="fas fa-globe"></i> Google Docs
        </button>
        <button 
          className={`${styles.viewerButton} ${viewerType === 'office' ? styles.active : ''}`}
          onClick={() => handleViewerChange('office')}
        >
          <i className="fas fa-file-word"></i> Office Online
        </button>
        <a 
          href={normalizeDocUrl(fileUrl)} 
          target="_blank" 
          rel="noopener noreferrer"
          className={styles.downloadButton}
        >
          <i className="fas fa-download"></i> Tải xuống
        </a>
      </div>

      <div className={styles.viewerContent}>
        {loading && (
          <div className={styles.loadingOverlay}>
            <i className="fas fa-spinner fa-spin"></i>
            <p>Đang tải tài liệu...</p>
          </div>
        )}
        
        {viewerType === 'native' && (
          <div className={styles.nativeViewerContainer}>
            {error ? (
              <div className={styles.errorContainer}>
                <i className="fas fa-exclamation-triangle"></i>
                <p>{error}</p>
                <button 
                  className={styles.switchViewerButton}
                  onClick={() => setViewerType('google')}
                >
                  <i className="fas fa-globe"></i> Mở trong Google Docs
                </button>
              </div>
            ) : (
              <div ref={docxContainer} className={styles.docxContainer}></div>
            )}
          </div>
        )}
        
        {viewerType === 'google' && (
          <div className={styles.iframeContainer}>
            <iframe
              ref={iframeRef}
              src={createIframeUrl(getGoogleDocsUrl())}
              width="100%"
              height="600px"
              frameBorder="0"
              title={fileName}
              onLoad={handleFrameLoad}
              onError={handleIframeError}
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
            >
              Trình duyệt của bạn không hỗ trợ iframe
            </iframe>

            {googleDocsError && (
              <div className={styles.fallbackViewer}>
                <div className={styles.errorMessage}>
                  <i className="fas fa-exclamation-circle"></i>
                  <p>Google Docs Viewer không thể hiển thị tài liệu này.</p>
                </div>
                
                <div className={styles.fallbackActions}>
                  <button 
                    className={styles.switchViewerButton}
                    onClick={() => handleViewerChange('office')}
                  >
                    <i className="fas fa-file-word"></i> Thử Office Online
                  </button>
                  
                  <a 
                    href={normalizeDocUrl(fileUrl)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={styles.downloadDirectButton}
                  >
                    <i className="fas fa-download"></i> Tải xuống trực tiếp
                  </a>
                </div>
              </div>
            )}

            <div className={styles.viewerHelp}>
              <p>
                <i className="fas fa-info-circle"></i> 
                Nếu tài liệu không hiển thị, hãy bấm <a 
                  href={`https://docs.google.com/viewer?url=${encodeURIComponent(normalizeDocUrl(fileUrl))}`} 
                  target="_blank"
                  rel="noopener noreferrer"
                >mở trong Google Docs</a> hoặc tải xuống để xem trên máy tính của bạn.
              </p>
            </div>
          </div>
        )}
        
        {viewerType === 'office' && (
          <div className={styles.iframeContainer}>
            <iframe
              src={createIframeUrl(getOfficeOnlineUrl())}
              width="100%"
              height="600px"
              frameBorder="0"
              title={fileName}
              onLoad={handleFrameLoad}
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
            >
              Trình duyệt của bạn không hỗ trợ iframe
            </iframe>
            
            <div className={styles.viewerHelp}>
              <p>
                <i className="fas fa-info-circle"></i> 
                Nếu tài liệu không hiển thị, hãy bấm <a 
                  href={`https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(normalizeDocUrl(fileUrl))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >mở trong Office Online</a> hoặc tải xuống để xem trên máy tính của bạn.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractDocViewer; 