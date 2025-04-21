const LegalDocumentModel = require("../models/legalDocumentModel");
const asyncHandler = require("../middleware/async");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const pdf = require("pdf-parse");
const puppeteer = require("puppeteer");

/**
 * @desc    Lấy tất cả văn bản pháp luật
 * @route   GET /api/legal/documents
 * @access  Public
 */
const getAllLegalDocuments = asyncHandler(async (req, res) => {
  const {
    search,
    document_type,
    from_date,
    to_date,
    page = 1,
    limit = 10,
  } = req.query;

  const options = {
    searchTerm: search,
    documentType: document_type,
    fromDate: from_date,
    toDate: to_date,
    page: parseInt(page),
    limit: parseInt(limit),
  };

  const result = await LegalDocumentModel.getAllLegalDocuments(options);

  res.status(200).json({
    status: "success",
    data: result.data,
    pagination: result.pagination,
  });
});

/**
 * @desc    Lấy chi tiết văn bản pháp luật
 * @route   GET /api/legal/documents/:id
 * @access  Public
 */
const getLegalDocumentById = asyncHandler(async (req, res) => {
  const documentId = req.params.id;
  const document = await LegalDocumentModel.getLegalDocumentById(documentId);

  if (!document) {
    return res.status(404).json({
      status: "error",
      message: "Không tìm thấy văn bản pháp luật",
    });
  }

  res.status(200).json({
    status: "success",
    data: document,
  });
});

/**
 * @desc    Lấy các loại văn bản
 * @route   GET /api/legal/document-types
 * @access  Public
 */
const getDocumentTypes = asyncHandler(async (req, res) => {
  const types = await LegalDocumentModel.getDocumentTypes();

  res.status(200).json({
    status: "success",
    data: types,
  });
});

/**
 * @desc    Lấy danh sách mẫu văn bản
 * @route   GET /api/legal/templates
 * @access  Public
 */
const getDocumentTemplates = asyncHandler(async (req, res) => {
  const { search, template_type, page = 1, limit = 10 } = req.query;

  const options = {
    searchTerm: search,
    templateType: template_type,
    page: parseInt(page),
    limit: parseInt(limit),
  };

  const result = await LegalDocumentModel.getDocumentTemplates(options);

  res.status(200).json({
    status: "success",
    data: result.data,
    pagination: result.pagination,
  });
});

/**
 * @desc    Lấy chi tiết mẫu văn bản
 * @route   GET /api/legal/templates/:id
 * @access  Public
 */
const getDocumentTemplateById = asyncHandler(async (req, res) => {
  const templateId = req.params.id;
  const template = await LegalDocumentModel.getDocumentTemplateById(templateId);

  if (!template) {
    return res.status(404).json({
      status: "error",
      message: "Không tìm thấy mẫu văn bản",
    });
  }

  res.status(200).json({
    status: "success",
    data: template,
  });
});

/**
 * @desc    Lấy các loại mẫu văn bản
 * @route   GET /api/legal/template-types
 * @access  Public
 */
const getTemplateTypes = asyncHandler(async (req, res) => {
  const types = await LegalDocumentModel.getTemplateTypes();

  res.status(200).json({
    status: "success",
    data: types,
  });
});

/**
 * @desc    Tìm kiếm tổng hợp
 * @route   GET /api/legal/search
 * @access  Public
 */
const searchAll = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 10 } = req.query;

  const options = {
    searchTerm: search,
    page: parseInt(page),
    limit: parseInt(limit),
  };

  const result = await LegalDocumentModel.searchAll(options);

  res.status(200).json({
    status: "success",
    data: result.data,
    pagination: result.pagination,
  });
});

/**
 * @desc    Lấy danh sách cơ quan ban hành
 * @route   GET /api/legal/issuing-bodies
 * @access  Public
 */
const getIssuingBodies = asyncHandler(async (req, res) => {
  const issuers = await LegalDocumentModel.getIssuingBodies();

  res.status(200).json({
    status: "success",
    data: issuers,
  });
});

/**
 * @desc    Lấy danh sách lĩnh vực pháp luật
 * @route   GET /api/legal/fields
 * @access  Public
 */
const getLegalFields = asyncHandler(async (req, res) => {
  const fields = await LegalDocumentModel.getLegalFields();

  res.status(200).json({
    status: "success",
    data: fields,
  });
});

/**
 * @desc    Lấy danh sách trạng thái hiệu lực
 * @route   GET /api/legal/effect-status
 * @access  Public
 */
const getEffectStatus = asyncHandler(async (req, res) => {
  const statuses = await LegalDocumentModel.getEffectStatus();

  res.status(200).json({
    status: "success",
    data: statuses,
  });
});

/**
 * @desc    Tạo văn bản pháp luật mới
 * @route   POST /api/legal/documents
 * @access  Private/Admin
 */
const createLegalDocument = asyncHandler(async (req, res) => {
  const documentData = req.body;

  if (
    !documentData.title ||
    !documentData.document_type ||
    !documentData.content
  ) {
    return res.status(400).json({
      status: "error",
      message:
        "Vui lòng cung cấp đầy đủ thông tin: tiêu đề, loại văn bản và nội dung",
    });
  }

  const document = await LegalDocumentModel.createLegalDocument(documentData);

  res.status(201).json({
    status: "success",
    data: document,
  });
});

/**
 * @desc    Cập nhật văn bản pháp luật
 * @route   PUT /api/legal/documents/:id
 * @access  Private/Admin
 */
const updateLegalDocument = asyncHandler(async (req, res) => {
  const documentId = req.params.id;
  const documentData = req.body;

  if (
    !documentData.title ||
    !documentData.document_type ||
    !documentData.content
  ) {
    return res.status(400).json({
      status: "error",
      message:
        "Vui lòng cung cấp đầy đủ thông tin: tiêu đề, loại văn bản và nội dung",
    });
  }

  try {
    const document = await LegalDocumentModel.updateLegalDocument(
      documentId,
      documentData
    );

    res.status(200).json({
      status: "success",
      data: document,
    });
  } catch (error) {
    res.status(404).json({
      status: "error",
      message: error.message,
    });
  }
});

/**
 * @desc    Xóa văn bản pháp luật
 * @route   DELETE /api/legal/documents/:id
 * @access  Private/Admin
 */
const deleteLegalDocument = asyncHandler(async (req, res) => {
  const documentId = req.params.id;

  const success = await LegalDocumentModel.deleteLegalDocument(documentId);

  if (!success) {
    return res.status(404).json({
      status: "error",
      message: "Không tìm thấy văn bản pháp luật",
    });
  }

  res.status(200).json({
    status: "success",
    data: null,
    message: "Văn bản pháp luật đã được xóa",
  });
});

/**
 * @desc    Tạo mẫu văn bản mới
 * @route   POST /api/legal/templates
 * @access  Private/Admin
 */
const createDocumentTemplate = asyncHandler(async (req, res) => {
  const templateData = req.body;

  if (
    !templateData.title ||
    !templateData.template_type ||
    !templateData.content
  ) {
    return res.status(400).json({
      status: "error",
      message:
        "Vui lòng cung cấp đầy đủ thông tin: tiêu đề, loại mẫu và nội dung",
    });
  }

  const template = await LegalDocumentModel.createDocumentTemplate(
    templateData
  );

  res.status(201).json({
    status: "success",
    data: template,
  });
});

/**
 * @desc    Cập nhật mẫu văn bản
 * @route   PUT /api/legal/templates/:id
 * @access  Private/Admin
 */
const updateDocumentTemplate = asyncHandler(async (req, res) => {
  const templateId = req.params.id;
  const templateData = req.body;

  if (
    !templateData.title ||
    !templateData.template_type ||
    !templateData.content
  ) {
    return res.status(400).json({
      status: "error",
      message:
        "Vui lòng cung cấp đầy đủ thông tin: tiêu đề, loại mẫu và nội dung",
    });
  }

  try {
    const template = await LegalDocumentModel.updateDocumentTemplate(
      templateId,
      templateData
    );

    res.status(200).json({
      status: "success",
      data: template,
    });
  } catch (error) {
    res.status(404).json({
      status: "error",
      message: error.message,
    });
  }
});

/**
 * @desc    Xóa mẫu văn bản
 * @route   DELETE /api/legal/templates/:id
 * @access  Private/Admin
 */
const deleteDocumentTemplate = asyncHandler(async (req, res) => {
  const templateId = req.params.id;

  const success = await LegalDocumentModel.deleteDocumentTemplate(templateId);

  if (!success) {
    return res.status(404).json({
      status: "error",
      message: "Không tìm thấy mẫu văn bản",
    });
  }

  res.status(200).json({
    status: "success",
    data: null,
    message: "Mẫu văn bản đã được xóa",
  });
});

// Cấu hình lưu trữ file tạm thời
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../../uploads/temp");
    // Tạo thư mục nếu chưa tồn tại
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// Middleware upload file
const upload = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // Tăng lên 20MB max
  fileFilter: function (req, file, cb) {
    // Chỉ cho phép PDF
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Chỉ cho phép upload file PDF"), false);
    }
    cb(null, true);
  },
}).single("pdf_file");

// Hàm phân tích PDF cải tiến
const parsePDF = async (dataBuffer) => {
  try {
    // Thiết lập tùy chọn cho pdf-parse để cải thiện khả năng xử lý
    const options = {
      // Số trang tối đa sẽ xử lý, -1 nghĩa là tất cả các trang
      max: -1,
      // Tự động xử lý vị trí các phần tử
      pagerender: function (pageData) {
        return pageData.getTextContent().then(function (textContent) {
          // Lưu thông tin về vị trí và định dạng của từng phần tử văn bản
          return JSON.stringify(textContent);
        });
      },
    };

    // Phân tích PDF với tùy chọn
    const result = await pdf(dataBuffer, options);

    // Trả về cả text và dữ liệu chi tiết (nếu có)
    return {
      text: result.text || "",
      metadata: result.info || {},
      numpages: result.numpages || 0,
      textContent: result.textContent || null,
    };
  } catch (error) {
    console.error("Lỗi khi phân tích PDF:", error);
    throw new Error(`Không thể phân tích file PDF: ${error.message}`);
  }
};

/**
 * @desc    Upload và chuyển đổi file PDF thành HTML
 * @route   POST /api/legal/upload-pdf
 * @access  Private/Admin
 */
const uploadPdfDocument = asyncHandler(async (req, res) => {
  try {
    // Đảm bảo thư mục uploads/temp tồn tại
    const uploadDir = path.join(__dirname, "../../uploads/temp");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Sử dụng middleware upload
    upload(req, res, async function (err) {
      if (err) {
        console.error("Lỗi upload file:", err);
        return res.status(400).json({
          status: "error",
          message: err.message || "Lỗi khi tải file lên",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          status: "error",
          message: "Không có file được upload",
        });
      }

      try {
        const filePath = req.file.path;

        // Kiểm tra file có tồn tại không
        if (!fs.existsSync(filePath)) {
          return res.status(400).json({
            status: "error",
            message: "File không tồn tại hoặc đã bị xóa",
          });
        }

        // Đọc dữ liệu từ file
        const dataBuffer = fs.readFileSync(filePath);

        if (!dataBuffer || dataBuffer.length === 0) {
          throw new Error("File rỗng hoặc không thể đọc nội dung");
        }

        // Parse PDF sang text và lấy thông tin vị trí
        const data = await parsePDF(dataBuffer);
        const text = data.text || "";

        // Tạo một iframe để hiển thị PDF trực tiếp
        const b64 = dataBuffer.toString("base64");
        const iframeHtml = `
<div class="pdf-container">
  <iframe 
    src="data:application/pdf;base64,${b64}#toolbar=0&navpanes=0" 
    width="auto" 
    height="100%"
    style="border: none; background: transparent;">
  </iframe>
</div>`;

        // Đồng thời tạo HTML từ text để có thể chỉnh sửa và tìm kiếm dễ dàng
        const htmlContent = convertTextToHtml(text);

        // Tạo đầu ra chỉ bao gồm iframe PDF không có tabs
        const combinedOutput = `
<div class="document-container">
  <div class="pdf-container">
    ${iframeHtml}
  </div>
</div>
<style>
  .document-container {
    width: 100%;
    font-family: 'Times New Roman', Times, serif;
  }
  .pdf-container {
    width: auto;
    overflow: visible;
  }
  iframe {
    width: 100%;
    min-height: 1200px;
    border: none;
    background: transparent;
  }
</style>
`;

        // Xóa file tạm sau khi xử lý
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }

        res.status(200).json({
          status: "success",
          data: {
            html: combinedOutput,
            text: htmlContent,
            pages: data.numpages || 0,
            info: data.metadata || {},
          },
        });
      } catch (error) {
        console.error("Lỗi chi tiết khi xử lý file PDF:", error);

        // Đảm bảo xóa file tạm nếu có lỗi
        if (req.file && fs.existsSync(req.file.path)) {
          try {
            fs.unlinkSync(req.file.path);
          } catch (unlinkError) {
            console.error("Không thể xóa file tạm:", unlinkError);
          }
        }

        res.status(500).json({
          status: "error",
          message: `Lỗi khi xử lý file PDF: ${
            error.message || "Lỗi không xác định"
          }`,
        });
      }
    });
  } catch (outerError) {
    console.error("Lỗi ngoài luồng xử lý upload:", outerError);
    res.status(500).json({
      status: "error",
      message: `Lỗi máy chủ: ${outerError.message || "Lỗi không xác định"}`,
    });
  }
});

/**
 * Chuyển đổi text thành HTML tiêu chuẩn nhưng vẫn giữ nguyên định dạng
 * @param {string} text - Text từ PDF
 * @returns {string} HTML content
 */
const convertTextToHtml = (text) => {
  // Phát hiện loại văn bản
  const isContract = text.includes("MẪU HỢP ĐỒNG") || text.includes("HỢP ĐỒNG");
  const isLegalDocument =
    text.includes("CỘNG HÒA XÃ HỘI") ||
    text.includes("NGHỊ ĐỊNH") ||
    text.includes("QUYẾT ĐỊNH") ||
    text.includes("THÔNG TƯ") ||
    text.includes("LUẬT");

  // Thay thế các ký tự đặc biệt
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  // Chuẩn bị các dòng văn bản
  const lines = html.split("\n");
  const processedLines = [];

  // Xử lý mỗi dòng để giữ nguyên định dạng ban đầu
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Bỏ qua các dòng trống liên tiếp
    if (line.trim() === "" && (i === 0 || lines[i - 1].trim() === "")) {
      continue;
    }

    // Phát hiện định dạng đặc biệt
    const isAllCaps =
      line.trim() === line.trim().toUpperCase() && line.trim().length > 3;
    const isTitleLine = isAllCaps && line.trim().length > 10;
    const isHeader = /^(CHƯƠNG|ĐIỀU|MỤC|PHẦN|Chương|Điều|Mục|Phần)\s+\d+/.test(
      line.trim()
    );
    const isMainTitle =
      line.trim().includes("MẪU HỢP ĐỒNG") ||
      line.trim().includes("CỘNG HÒA XÃ HỘI");

    // Tạo đoạn HTML với cài đặt pre để giữ nguyên khoảng trắng
    let htmlLine = "";
    if (line.trim() === "") {
      htmlLine = '<div class="empty-line" style="height: 1em;">&nbsp;</div>';
    } else if (isMainTitle) {
      htmlLine = `<div class="main-title" style="text-align: center; font-weight: bold; font-size: 16px; margin: 10px 0; text-transform: uppercase;">${line}</div>`;
    } else if (isTitleLine) {
      htmlLine = `<div class="title-text" style="text-align: center; font-weight: bold; margin: 10px 0;">${line}</div>`;
    } else if (isHeader) {
      htmlLine = `<div class="header-text" style="font-weight: bold; margin: 10px 0;">${line}</div>`;
    } else if (isAllCaps) {
      htmlLine = `<div class="uppercase-text" style="font-weight: bold;">${line}</div>`;
    } else {
      // Giữ nguyên khoảng trắng đầu dòng
      // Chuyển khoảng trắng thành &nbsp; để trình duyệt không xóa
      let spacedLine = "";
      let leadingSpacesCount = 0;

      for (let j = 0; j < line.length; j++) {
        if (line[j] === " " && j < line.length - 1 && line[j + 1] === " ") {
          spacedLine += "&nbsp;";
          if (j < 20) leadingSpacesCount++; // Chỉ đếm khoảng trắng đầu dòng
        } else if (line[j] === " ") {
          spacedLine += " ";
          if (j < 20) leadingSpacesCount++; // Chỉ đếm khoảng trắng đầu dòng
        } else {
          spacedLine += line[j];
        }
      }

      // Quyết định căn chỉnh dựa trên khoảng trắng
      let textAlign = "left";
      if (leadingSpacesCount > 15) {
        textAlign = "center";
      } else if (leadingSpacesCount > 8) {
        textAlign = "right";
      }

      htmlLine = `<pre class="text-line" style="margin: 0; white-space: pre-wrap; font-family: inherit; text-align: ${textAlign};">${spacedLine}</pre>`;
    }

    processedLines.push(htmlLine);
  }

  // CSS cho văn bản
  const css = `
    <style>
      .editable-content {
        font-family: 'Times New Roman', Times, serif;
        font-size: 14px;
        line-height: 1.5;
        color: #333;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
        background-color: #fff;
        border: 1px solid #ddd;
        box-shadow: 0 0 10px rgba(0,0,0,0.1);
      }
      
      [contenteditable="true"] {
        outline: none;
      }
      
      @media print {
        .editable-content {
          border: none;
          box-shadow: none;
          padding: 0;
        }
      }
    </style>
  `;

  // Tạo đoạn HTML hoàn chỉnh có thể chỉnh sửa
  const templateType = isContract
    ? "contract"
    : isLegalDocument
    ? "legal"
    : "general";
  const completeHtml = `
    <div class="editable-content ${templateType}-document" contenteditable="true">
      ${processedLines.join("\n")}
    </div>
    ${css}
  `;

  return completeHtml;
};

/**
 * @desc    Tải xuống văn bản pháp luật dưới dạng HTML
 * @route   GET /api/legal/documents/:id/download
 * @access  Public
 */
const downloadLegalDocument = asyncHandler(async (req, res) => {
  const documentId = req.params.id;
  const document = await LegalDocumentModel.getLegalDocumentById(documentId);

  if (!document) {
    return res.status(404).json({
      status: "error",
      message: "Không tìm thấy văn bản pháp luật",
    });
  }

  try {
    // Tạo tên file HTML an toàn 
    const safeName = document.title.replace(/[^a-zA-Z0-9]/g, "_");
    const fileName = `${safeName}_${Date.now()}.html`;

    // Đặt header cho response để tải về dưới dạng HTML
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

    // Tạo HTML với định dạng và nội dung đầy đủ
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${document.title}</title>
        <style>
          @media print {
            @page {
              size: A4;
              margin: 2cm;
            }
          }
          
          body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 14px;
            line-height: 1.5;
            color: #000;
            margin: 0;
            padding: 20px;
            background-color: #fff;
          }
          
          .document-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #fff;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          
          .header {
            text-align: center;
            margin-bottom: 20px;
          }
          
          .title {
            font-weight: bold;
            font-size: 18px;
            text-align: center;
            margin: 20px 0;
          }
          
          .metadata {
            margin-bottom: 20px;
            font-style: italic;
          }
          
          .content {
            text-align: justify;
          }
          
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
          
          hr {
            border: none;
            border-top: 1px solid #ccc;
            margin: 20px 0;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
          }
          
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          
          th {
            background-color: #f2f2f2;
            font-weight: bold;
          }
          
          .page-number {
            text-align: center;
            font-size: 12px;
            color: #666;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="document-container">
          <div class="header">
            <strong>VĂN BẢN PHÁP LUẬT</strong>
          </div>
          
          <div class="title">${document.title}</div>
          
          <div class="metadata">
            <p>Loại văn bản: ${document.document_type}</p>
            <p>Ngày ban hành: ${new Date(document.issued_date).toLocaleDateString("vi-VN")}</p>
            ${document.document_number ? `<p>Số hiệu: ${document.document_number}</p>` : ""}
          </div>
          
          <hr>
          
          <div class="content">
            ${document.content || ''}
          </div>
          
          <div class="footer">
            <p>Tải xuống từ Hệ thống LegAI - ${new Date().toLocaleDateString("vi-VN")}</p>
          </div>
        </div>
        
        <script>
          // Script để tạo số trang khi in
          window.onload = function() {
            if (typeof window.print === 'function') {
              const printButton = document.createElement('button');
              printButton.innerText = 'In tài liệu';
              printButton.style.padding = '8px 16px';
              printButton.style.margin = '20px auto';
              printButton.style.display = 'block';
              printButton.style.backgroundColor = '#4CAF50';
              printButton.style.color = 'white';
              printButton.style.border = 'none';
              printButton.style.borderRadius = '4px';
              printButton.style.cursor = 'pointer';
              printButton.onclick = function() { window.print(); };
              document.body.appendChild(printButton);
            }
          };
        </script>
      </body>
      </html>
    `;

    // Gửi HTML
    res.send(htmlContent);
    
  } catch (error) {
    console.error("Lỗi khi tạo file HTML:", error);
    return res.status(500).json({
      status: "error",
      message: "Không thể tạo file HTML",
    });
  }
});

/**
 * @desc    Tải xuống mẫu văn bản dưới dạng HTML
 * @route   GET /api/legal/templates/:id/download
 * @access  Public
 */
const downloadDocumentTemplate = asyncHandler(async (req, res) => {
  const templateId = req.params.id;
  const template = await LegalDocumentModel.getDocumentTemplateById(templateId);

  if (!template) {
    return res.status(404).json({
      status: "error",
      message: "Không tìm thấy mẫu văn bản",
    });
  }

  try {
    // Tạo tên file HTML an toàn
    const safeName = template.title.replace(/[^a-zA-Z0-9]/g, "_");
    const fileName = `mau_${safeName}_${Date.now()}.html`;

    // Đặt header cho response để tải về dưới dạng HTML
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

    // Tạo HTML với định dạng và nội dung đầy đủ
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${template.title}</title>
        <style>
          @media print {
            @page {
              size: A4;
              margin: 2cm;
            }
          }
          
          body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 14px;
            line-height: 1.5;
            color: #000;
            margin: 0;
            padding: 20px;
            background-color: #fff;
          }
          
          .document-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #fff;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          
          .header {
            text-align: center;
            margin-bottom: 20px;
          }
          
          .title {
            font-weight: bold;
            font-size: 18px;
            text-align: center;
            margin: 20px 0;
            text-transform: uppercase;
          }
          
          .metadata {
            margin-bottom: 20px;
            font-style: italic;
          }
          
          .content {
            text-align: justify;
          }
          
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
          
          hr {
            border: none;
            border-top: 1px solid #ccc;
            margin: 20px 0;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
          }
          
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          
          th {
            background-color: #f2f2f2;
            font-weight: bold;
          }
          
          .page-number {
            text-align: center;
            font-size: 12px;
            color: #666;
            margin-top: 20px;
          }
          
          .contract-box {
            border: 1px solid #000;
            padding: 15px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="document-container">
          <div class="header">
            <strong>MẪU VĂN BẢN</strong>
          </div>
          
          <div class="title">${template.title}</div>
          
          <div class="metadata">
            <p>Loại mẫu: ${template.template_type}</p>
            <p>Ngày tạo: ${new Date(template.created_at).toLocaleDateString("vi-VN")}</p>
          </div>
          
          <hr>
          
          <div class="content">
            ${template.content || ''}
          </div>
          
          <div class="footer">
            <p>Tải xuống từ Hệ thống LegAI - ${new Date().toLocaleDateString("vi-VN")}</p>
          </div>
        </div>
        
        <script>
          // Script để tạo nút in khi tài liệu được mở
          window.onload = function() {
            if (typeof window.print === 'function') {
              const printButton = document.createElement('button');
              printButton.innerText = 'In tài liệu';
              printButton.style.padding = '8px 16px';
              printButton.style.margin = '20px auto';
              printButton.style.display = 'block';
              printButton.style.backgroundColor = '#4CAF50';
              printButton.style.color = 'white';
              printButton.style.border = 'none';
              printButton.style.borderRadius = '4px';
              printButton.style.cursor = 'pointer';
              printButton.onclick = function() { window.print(); };
              document.body.appendChild(printButton);
            }
          };
        </script>
      </body>
      </html>
    `;

    // Gửi HTML
    res.send(htmlContent);
    
  } catch (error) {
    console.error("Lỗi khi tạo file HTML:", error);
    return res.status(500).json({
      status: "error",
      message: "Không thể tạo file HTML",
    });
  }
});

/**
 * @desc    Chuyển đổi HTML thành PDF và tải xuống
 * @route   POST /api/legal/html-to-pdf
 * @access  Private
 */
const convertHtmlToPdf = asyncHandler(async (req, res) => {
  const { html, title } = req.body;

  if (!html) {
    return res.status(400).json({
      status: "error",
      message: "Vui lòng cung cấp nội dung HTML để chuyển đổi",
    });
  }

  try {
    // Tạo thư mục tạm nếu chưa tồn tại
    const tempDir = path.join(__dirname, "../../uploads/temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Tạo tên file PDF
    const fileName = `${
      title ? title.replace(/[^a-zA-Z0-9]/g, "_") : "document"
    }_${Date.now()}.pdf`;
    const filePath = path.join(tempDir, fileName);

    // Tạo HTML hoàn chỉnh với CSS
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${title || "Tài liệu"}</title>
        <style>
          body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 12pt;
            line-height: 1.5;
            color: #000;
            margin: 30px;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
          }
          .title {
            font-weight: bold;
            text-align: center;
            margin: 20px 0;
            font-size: 14pt;
          }
          .content {
            text-align: justify;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10pt;
          }
        </style>
      </head>
      <body>
        ${title ? `<div class="title">${title}</div>` : ""}
        <div class="content">${html}</div>
        <div class="footer">
          <p>Tạo bởi Hệ thống LegAI - ${new Date().toLocaleDateString(
            "vi-VN"
          )}</p>
        </div>
      </body>
      </html>
    `;

    // Sử dụng puppeteer để tạo PDF
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    // Tạo PDF
    await page.pdf({
      path: filePath,
      format: "A4",
      margin: {
        top: "20mm",
        right: "20mm",
        bottom: "20mm",
        left: "20mm",
      },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: "<div></div>",
      footerTemplate:
        '<div style="width: 100%; text-align: center; font-size: 8pt; color: #777;">Trang <span class="pageNumber"></span> / <span class="totalPages"></span></div>',
      preferCSSPageSize: true,
    });

    await browser.close();

    // Đặt header cho response
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

    // Đọc file PDF và trả về cho user
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    // Xóa file sau khi gửi
    fileStream.on("end", () => {
      fs.unlinkSync(filePath);
    });
  } catch (error) {
    console.error("Lỗi khi chuyển đổi HTML sang PDF:", error);
    return res.status(500).json({
      status: "error",
      message: "Không thể chuyển đổi HTML sang PDF",
    });
  }
});

module.exports = {
  getAllLegalDocuments,
  getLegalDocumentById,
  getDocumentTypes,
  getDocumentTemplates,
  getDocumentTemplateById,
  getTemplateTypes,
  searchAll,
  getIssuingBodies,
  getLegalFields,
  getEffectStatus,
  createLegalDocument,
  updateLegalDocument,
  deleteLegalDocument,
  createDocumentTemplate,
  updateDocumentTemplate,
  deleteDocumentTemplate,
  uploadPdfDocument,
  downloadLegalDocument,
  downloadDocumentTemplate,
  convertHtmlToPdf,
};
