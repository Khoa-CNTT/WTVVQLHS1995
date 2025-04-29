import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Upload, Button, Card, Checkbox, Space, message, Typography, Spin, Divider, Row, Col, Layout, Tooltip } from 'antd';
import { UploadOutlined, FileOutlined, FileTextOutlined, SaveOutlined, SendOutlined, ArrowLeftOutlined, InfoCircleOutlined, FilePdfOutlined, FileWordOutlined, FileImageOutlined, DownloadOutlined } from '@ant-design/icons';
import legalCaseService from '../../services/legalCaseService';
import legalService from '../../services/legalService';
import userService from '../../services/userService';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './LegalCase.module.css';
import Navbar from '../../components/layout/Nav/Navbar';

const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Header, Content } = Layout;

const LegalCaseEditor = () => {
    const { id } = useParams();
    const [form] = Form.useForm();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [caseData, setCaseData] = useState(null);
    const [useAI, setUseAI] = useState(false);
    const [caseTypes, setCaseTypes] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [aiDraft, setAiDraft] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [editableDraft, setEditableDraft] = useState('');
    const [fileList, setFileList] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [formLayout, setFormLayout] = useState('vertical');
    const [existingDocuments, setExistingDocuments] = useState([]);

    // Lấy thông tin vụ án và danh sách loại vụ án
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Lấy chi tiết vụ án
                const caseResponse = await legalCaseService.getLegalCaseById(id);
                if (caseResponse && caseResponse.success) {
                    const caseInfo = caseResponse.data;
                    setCaseData(caseInfo);
                    
                    // Set form values from case data
                    form.setFieldsValue({
                        title: caseInfo.title,
                        case_type: caseInfo.case_type,
                        description: caseInfo.description || ''
                    });

                    // Kiểm tra nếu có nội dung AI
                    if (caseInfo.is_ai_generated && caseInfo.ai_content) {
                        setUseAI(true);
                        setAiDraft(caseInfo.ai_content);
                        setEditableDraft(caseInfo.ai_content);
                    }

                    // Lưu danh sách tài liệu hiện có
                    if (caseInfo.documents && Array.isArray(caseInfo.documents)) {
                        setExistingDocuments(caseInfo.documents);
                    }
                } else {
                    message.error('Không thể tải thông tin vụ án');
                    navigate('/legal-cases');
                }

                // Lấy danh sách loại vụ án
                const caseTypesRes = await legalCaseService.getCaseTypes();
                if (caseTypesRes && caseTypesRes.data) {
                    setCaseTypes(caseTypesRes.data);
                } else {
                    // Nếu không có dữ liệu, sử dụng danh sách mặc định
                    setCaseTypes([
                        { case_type: 'Dân sự', description: 'Tranh chấp dân sự, hợp đồng, đất đai' },
                        { case_type: 'Hình sự', description: 'Bào chữa, tư vấn các vụ án hình sự' },
                        { case_type: 'Hành chính', description: 'Khiếu nại, tố cáo hành chính' },
                        { case_type: 'Lao động', description: 'Tranh chấp lao động, hợp đồng lao động' },
                        { case_type: 'Hôn nhân gia đình', description: 'Ly hôn, phân chia tài sản, nuôi con' },
                        { case_type: 'Kinh doanh thương mại', description: 'Tranh chấp thương mại, doanh nghiệp' },
                        { case_type: 'Sở hữu trí tuệ', description: 'Bản quyền, nhãn hiệu, sáng chế' }
                    ]);
                }

                try {
                    // Lấy danh sách mẫu văn bản trong một try-catch riêng
                    const templatesRes = await legalService.getDocumentTemplates();
                    if (templatesRes && templatesRes.data) {
                        setTemplates(templatesRes.data);
                    }
                } catch (templateError) {
                    console.error('Lỗi khi lấy danh sách mẫu văn bản:', templateError);
                    setTemplates([]);
                }
            } catch (error) {
                console.error('Lỗi khi lấy dữ liệu vụ án:', error);
                message.error('Không thể tải thông tin vụ án');
                navigate('/legal-cases');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, form, navigate]);

    // Xử lý tải xuống tài liệu hiện có
    const handleDownloadDocument = async (documentId) => {
        try {
            message.loading({ content: 'Đang chuẩn bị tải xuống...', key: 'download' });
            
            const blob = await legalCaseService.downloadDocument(id, documentId);

            // Tìm tên tài liệu từ existingDocuments
            let fileName = `document-${documentId}`;
            if (existingDocuments && Array.isArray(existingDocuments)) {
                const document = existingDocuments.find(doc => doc.id === documentId);
                if (document && document.original_name) {
                    fileName = document.original_name;
                }
            }

            // Tạo URL từ blob và tải xuống
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Giải phóng URL
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
            }, 100);

            message.success({ content: 'Đã tải xuống tài liệu', key: 'download' });
        } catch (error) {
            console.error('Lỗi khi tải xuống tài liệu:', error);
            message.error({ 
                content: 'Không thể tải xuống tài liệu. Vui lòng thử lại sau.', 
                key: 'download',
                duration: 3 
            });
        }
    };

    // Xử lý khi người dùng chọn sử dụng AI
    const handleAICheckboxChange = (e) => {
        setUseAI(e.target.checked);
        if (!e.target.checked) {
            setAiDraft('');
            setEditableDraft('');
        } else if (caseData && caseData.is_ai_generated && caseData.ai_content) {
            setAiDraft(caseData.ai_content);
            setEditableDraft(caseData.ai_content);
        }
    };

    // Xử lý khi người dùng thay đổi file upload
    const handleFileChange = ({ fileList }) => {
        // Chỉ lưu các file hợp lệ vào state
        const validFiles = fileList.map(file => {
            // Nếu file có originFileObj (tức là file mới upload)
            if (file.originFileObj) {
                // Kiểm tra định dạng
                const isValidType = 
                    file.type === 'application/pdf' ||
                    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                    file.type === 'application/msword' ||
                    file.type === 'image/jpeg' ||
                    file.type === 'image/png';
                
                // Kiểm tra kích thước
                const isLt10M = file.size / 1024 / 1024 < 10;
                
                if (!isValidType) {
                    message.error(`${file.name} không phải là định dạng hỗ trợ!`);
                    return null;
                }
                if (!isLt10M) {
                    message.error(`${file.name} vượt quá kích thước tối đa 10MB!`);
                    return null;
                }
            }
            return file;
        }).filter(file => file !== null);
        
        setFileList(validFiles);
    };

    // Xử lý tạo bản nháp AI
    const handleCreateAIDraft = async () => {
        try {
            const values = form.getFieldsValue(['template_id', 'user_input', 'case_type', 'title']);

            if (!values.template_id || !values.user_input || !values.case_type || !values.title) {
                message.warning('Vui lòng nhập đầy đủ thông tin mẫu, yêu cầu, loại vụ án và tiêu đề');
                return;
            }

            setAiLoading(true);
            const response = await legalCaseService.createAIDraft(values);

            if (response.success) {
                // Kiểm tra nội dung AI trả về
                let content = response.data.ai_content;

                // Kiểm tra và loại bỏ các câu trả lời mặc định không mong muốn
                const defaultResponses = [
                    "Tôi hiểu bạn đang cần thông tin chính xác hơn. Hãy cho tôi biết bạn muốn tìm hiểu điều gì cụ thể để tôi có thể hỗ trợ tốt hơn",
                    "Tôi đang gặp khó khăn trong việc xử lý câu hỏi của bạn. Vui lòng thử lại sau hoặc kiểm tra lại câu hỏi của bạn"
                ];

                const containsDefaultResponse = defaultResponses.some(defaultText =>
                    content.includes(defaultText)
                );

                if (containsDefaultResponse) {
                    message.warning('AI không thể tạo bản nháp phù hợp. Vui lòng điều chỉnh yêu cầu và thử lại.');
                    setAiDraft('');
                    setEditableDraft('');
                } else {
                    setAiDraft(content);
                    setEditableDraft(content);
                    message.success('Đã tạo bản nháp thành công. Bạn có thể chỉnh sửa nội dung bên dưới.');
                }
            } else {
                message.error(response.message || 'Lỗi khi tạo bản nháp');
            }
        } catch (error) {
            console.error('Lỗi khi tạo bản nháp AI:', error);
            message.error('Lỗi khi tạo bản nháp AI. Vui lòng thử lại sau.');
        } finally {
            setAiLoading(false);
        }
    };

    // Xử lý khi người dùng chỉnh sửa bản nháp
    const handleDraftChange = (e) => {
        setEditableDraft(e.target.value);
    };

    // Xử lý cập nhật vụ án
    const handleUpdateCase = async (values) => {
        try {
            setSubmitting(true);

            // Tạo form data để gửi file
            const formData = new FormData();

            // Thêm các trường thông tin vào formData
            formData.append('title', values.title);
            formData.append('description', values.description || '');
            formData.append('case_type', values.case_type);

            // Nếu sử dụng AI, thêm nội dung AI đã chỉnh sửa
            if (useAI && editableDraft) {
                formData.append('ai_content', editableDraft);
                formData.append('is_ai_generated', 'true');
            }

            // Thêm các file mới nếu có
            if (fileList && fileList.length > 0) {
                console.log(`Chuẩn bị tải lên ${fileList.length} tệp tin:`);
                let uploadCount = 0;

                for (let index = 0; index < fileList.length; index++) {
                    const file = fileList[index];
                    
                    // Kiểm tra file có hợp lệ không
                    const isValidType = 
                        file.type === 'application/pdf' ||
                        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                        file.type === 'application/msword' ||
                        file.type === 'image/jpeg' ||
                        file.type === 'image/png';
                    
                    const isLt10M = file.size / 1024 / 1024 < 10;
                    
                    if (!isValidType) {
                        console.warn(`Bỏ qua tệp không hợp lệ: ${file.name} - Loại: ${file.type}`);
                        continue;
                    }
                    
                    if (!isLt10M) {
                        console.warn(`Bỏ qua tệp quá lớn: ${file.name} - Kích thước: ${file.size} bytes`);
                        continue;
                    }
                    
                    // Xử lý tải lên dựa trên loại tệp
                    if (file.originFileObj) {
                        console.log(`Tải lên tệp #${index + 1}: ${file.originFileObj.name}, kích thước: ${file.originFileObj.size} bytes`);
                        formData.append('files', file.originFileObj);
                        uploadCount++;
                    } else if (file instanceof File) {
                        console.log(`Tải lên tệp File #${index + 1}: ${file.name}, kích thước: ${file.size} bytes`);
                        formData.append('files', file);
                        uploadCount++;
                    } else {
                        console.log(`Tải lên tệp Object #${index + 1}: ${file.name || 'không có tên'}, kiểu: ${typeof file}`);
                        
                        // Trường hợp là đối tượng không phải File
                        if (file.name && file.url) {
                            // Đây có thể là đối tượng từ Antd Upload
                            try {
                                const response = await fetch(file.url);
                                const blob = await response.blob();
                                const fileObj = new File([blob], file.name, { type: file.type || 'application/octet-stream' });
                                formData.append('files', fileObj);
                                uploadCount++;
                                console.log(`Đã chuyển đổi thành File từ URL: ${file.url}`);
                            } catch (error) {
                                console.error(`Không thể chuyển đổi thành File từ URL: ${file.url}`, error);
                            }
                        }
                    }
                }
                
                console.log(`Tổng cộng ${uploadCount} tệp tin đã được đính kèm vào FormData`);
                
                // Debug: Log tất cả các cặp key-value trong FormData
                for (let pair of formData.entries()) {
                    console.log(`FormData: ${pair[0]}, ${pair[1] instanceof File ? `File: ${pair[1].name}` : pair[1]}`);
                }
            }

            // For debugging - log keys in FormData
            console.log("FormData chứa các trường sau:");
            for (let key of formData.keys()) {
                console.log(`- Trường: ${key}`);
            }

            // Kiểm tra dữ liệu trước khi gửi
            if (!formData.has('title') || !formData.has('case_type')) {
                message.error('Thiếu thông tin bắt buộc (tiêu đề hoặc loại vụ án)');
                setSubmitting(false);
                return;
            }

            // Gọi API cập nhật vụ án
            console.log(`Gửi yêu cầu cập nhật vụ án ID: ${id}`);
            const response = await legalCaseService.updateLegalCase(id, formData);

            if (response && response.success) {
                message.success('Cập nhật vụ án thành công');
                
                // Làm mới dữ liệu vụ án để hiển thị tài liệu mới
                console.log('Lấy lại thông tin vụ án để cập nhật UI');
                const updatedCase = await legalCaseService.getLegalCaseById(id);
                
                if (updatedCase && updatedCase.success) {
                    // Cập nhật danh sách tài liệu hiện có
                    if (updatedCase.data.documents && Array.isArray(updatedCase.data.documents)) {
                        console.log(`Nhận được ${updatedCase.data.documents.length} tài liệu từ API`);
                        setExistingDocuments(updatedCase.data.documents);
                    }
                    
                    // Cập nhật dữ liệu vụ án
                    setCaseData(updatedCase.data);
                    
                    // Reset fileList sau khi tải lên thành công
                    setFileList([]);
                }
                
                navigate(`/legal-cases/${id}`);
            } else {
                message.error(response?.message || 'Lỗi khi cập nhật vụ án');
                console.error('Chi tiết lỗi:', response);
            }
        } catch (error) {
            console.error('Lỗi khi cập nhật vụ án:', error);
            message.error('Lỗi khi cập nhật vụ án. Vui lòng thử lại sau.');
        } finally {
            setSubmitting(false);
        }
    };

    // Xử lý lưu vụ án khi sử dụng AI
    const handleSaveWithAI = () => {
        // Kiểm tra các trường bắt buộc
        form.validateFields().then(values => {
            handleUpdateCase(values);
        }).catch(errorInfo => {
            message.error('Vui lòng điền đầy đủ thông tin bắt buộc');
        });
    };

    // Cấu hình upload
    const uploadProps = {
        onRemove: file => {
            const index = fileList.indexOf(file);
            const newFileList = fileList.slice();
            newFileList.splice(index, 1);
            setFileList(newFileList);
        },
        beforeUpload: file => {
            // Kiểm tra loại file
            const isValidType = file.type === 'application/pdf' ||
                file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                file.type === 'application/msword' ||
                file.type === 'image/jpeg' ||
                file.type === 'image/png';

            if (!isValidType) {
                message.error('Chỉ hỗ trợ định dạng PDF, DOCX, DOC, JPG và PNG!');
                return Upload.LIST_IGNORE;
            }

            // Kiểm tra kích thước file (tối đa 10MB)
            const isLt10M = file.size / 1024 / 1024 < 10;
            if (!isLt10M) {
                message.error('File phải nhỏ hơn 10MB!');
                return Upload.LIST_IGNORE;
            }

            // Thêm file vào danh sách
            setFileList([...fileList, file]);
            return false; // Ngăn chặn tự động upload
        },
        fileList,
        multiple: true,
        maxCount: 5
    };

    // Xác định cột dành cho form thông tin chính dựa vào việc sử dụng AI
    const getMainFormColSpan = () => {
        // Nếu không dùng AI hoặc màn hình nhỏ thì chiếm toàn bộ
        if (!useAI) {
            return {
                xs: 24,
                md: 24,
                lg: 24,
                style: {
                    maxWidth: '800px',
                    margin: '0 auto'
                }
            };
        }

        // Nếu dùng AI thì chiếm 1/3 màn hình 
        return {
            xs: 24,
            md: 24,
            lg: 8
        };
    };

    // Hiển thị icon tương ứng với loại file
    const renderFileIcon = (mimeType) => {
        if (mimeType.includes('pdf')) {
            return <FilePdfOutlined style={{ color: '#ff4d4f' }} />;
        } else if (mimeType.includes('word')) {
            return <FileWordOutlined style={{ color: '#1890ff' }} />;
        } else if (mimeType.includes('image')) {
            return <FileImageOutlined style={{ color: '#52c41a' }} />;
        } else {
            return <FileOutlined style={{ color: '#faad14' }} />;
        }
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <Layout className={styles.legalCaseLayout}>
                    <Content className={styles.legalCaseContent}>
                        <div className={styles.loadingContainer}>
                            <Spin size="large" tip="Đang tải thông tin vụ án..." />
                        </div>
                    </Content>
                </Layout>
            </>
        );
    }

    return (
        <>  <Navbar />

            <Layout className={styles.legalCaseLayout}>
                <Content className={styles.legalCaseContent}>
                    <div className={styles.legalCaseCreator}>
                        <div className={styles.pageHeader}>
                            <Button
                                type="link"
                                icon={<ArrowLeftOutlined />}
                                onClick={() => navigate(`/legal-cases/${id}`)}
                                className={styles.backButton}
                            >
                                Quay lại chi tiết
                            </Button>
                            <Title level={2} style={{marginLeft: '165px'}}>Chỉnh sửa vụ án</Title>
                        </div>

                        <Row gutter={24}>
                            <Col {...getMainFormColSpan()}>
                                <Card
                                    title="Thông tin vụ án"
                                    bordered={false}
                                    className={styles.infoCard}
                                    extra={
                                        <Tooltip title="Chỉnh sửa thông tin cơ bản của vụ án">
                                            <InfoCircleOutlined />
                                        </Tooltip>
                                    }
                                >
                                    <Form
                                        form={form}
                                        layout={formLayout}
                                        onFinish={handleUpdateCase}
                                        requiredMark="optional"
                                        className={styles.creatorForm}
                                    >
                                        <Form.Item
                                            name="title"
                                            label="Tiêu đề vụ án"
                                            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề vụ án' }]}
                                        >
                                            <Input placeholder="Nhập tiêu đề vụ án" size="large" />
                                        </Form.Item>

                                        <Form.Item
                                            name="case_type"
                                            label="Loại vụ án"
                                            rules={[{ required: true, message: 'Vui lòng chọn loại vụ án' }]}
                                        >
                                            <Select placeholder="Chọn loại vụ án" size="large">
                                                {caseTypes.map(type => (
                                                    <Option key={type.case_type} value={type.case_type}>
                                                        {type.case_type} - {type.description}
                                                    </Option>
                                                ))}
                                            </Select>
                                        </Form.Item>

                                        <Form.Item
                                            name="description"
                                            label="Mô tả chi tiết"
                                        >
                                            <TextArea rows={6} placeholder="Nhập mô tả chi tiết về vụ án" />
                                        </Form.Item>

                                        {existingDocuments && existingDocuments.length > 0 && (
                                            <>
                                                <Divider orientation="left">Tài liệu hiện có</Divider>
                                                <div className={styles.documentSection}>
                                                    {existingDocuments.map(doc => (
                                                        <div key={doc.id} className={styles.documentItem}>
                                                            <div className={styles.documentIcon}>
                                                                {renderFileIcon(doc.mime_type)}
                                                            </div>
                                                            <div className={styles.documentInfo}>
                                                                <div className={styles.documentName}>
                                                                    {doc.original_name}
                                                                </div>
                                                            </div>
                                                            <div className={styles.documentAction}>
                                                                <Button
                                                                    type="primary"
                                                                    size="small"
                                                                    icon={<DownloadOutlined />}
                                                                    onClick={() => handleDownloadDocument(doc.id)}
                                                                    className={styles.downloadButton}
                                                                >
                                                                    Tải xuống
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        )}

                                        <Form.Item
                                            label="Thêm tài liệu mới"
                                            tooltip="Hỗ trợ tải lên tối đa 5 file (PDF, DOCX, JPG, PNG), mỗi file tối đa 10MB"
                                        >
                                            <Upload {...uploadProps} className={styles.uploadArea}>
                                                <Button icon={<UploadOutlined />} size="large" type="dashed" block>
                                                    Chọn tài liệu
                                                </Button>
                                                <div className={styles.uploadHint}>
                                                    Kéo thả file vào đây hoặc nhấn để chọn
                                                </div>
                                            </Upload>
                                        </Form.Item>

                                        <Form.Item className={styles.aiCheckboxWrapper}>
                                            <Checkbox
                                                checked={useAI}
                                                onChange={handleAICheckboxChange}
                                                className={styles.aiCheckbox}
                                            >
                                                <span className={styles.aiCheckboxLabel}>Sử dụng AI soạn thảo văn bản</span>
                                            </Checkbox>
                                        </Form.Item>

                                        {!useAI && (
                                            <Form.Item className={styles.formActions}>
                                                <Space size="middle">
                                                    <Button
                                                        type="primary"
                                                        htmlType="submit"
                                                        icon={<SaveOutlined />}
                                                        loading={submitting}
                                                        size="large"
                                                        className={styles.submitButton}
                                                    >
                                                        Lưu vụ án
                                                    </Button>

                                                    <Button
                                                        type="default"
                                                        onClick={() => navigate(`/legal-cases/${id}`)}
                                                        size="large"
                                                    >
                                                        Hủy
                                                    </Button>
                                                </Space>
                                            </Form.Item>
                                        )}
                                    </Form>
                                </Card>
                            </Col>

                            {useAI && (
                                <Col xs={24} lg={16}>
                                    <Card
                                        title="Soạn thảo bằng AI"
                                        className={styles.aiCard}
                                        bordered={false}
                                        extra={
                                            <Tooltip title="AI sẽ tạo bản nháp dựa trên yêu cầu của bạn">
                                                <InfoCircleOutlined />
                                            </Tooltip>
                                        }
                                    >
                                        <Form
                                            form={form}
                                            layout={formLayout}
                                            className={styles.aiForm}
                                        >
                                            <Row gutter={24}>
                                                <Col xs={24} md={12}>
                                                    <Form.Item
                                                        name="template_id"
                                                        label="Chọn mẫu văn bản"
                                                        rules={[{ required: useAI, message: 'Vui lòng chọn mẫu văn bản' }]}
                                                    >
                                                        <Select placeholder="Chọn mẫu văn bản" size="large">
                                                            {templates.map(template => (
                                                                <Option key={template.id} value={template.id}>
                                                                    {template.title}
                                                                </Option>
                                                            ))}
                                                        </Select>
                                                    </Form.Item>
                                                </Col>
                                                <Col xs={24} md={12}>
                                                    <Form.Item
                                                        name="user_input"
                                                        label="Yêu cầu soạn thảo"
                                                        rules={[{ required: useAI, message: 'Vui lòng nhập yêu cầu soạn thảo' }]}
                                                    >
                                                        <TextArea
                                                            rows={4}
                                                            placeholder="Mô tả yêu cầu soạn thảo của bạn (ví dụ: soạn đơn khởi kiện tranh chấp hợp đồng mua bán giá trị 500 triệu đồng)"
                                                        />
                                                    </Form.Item>
                                                </Col>
                                            </Row>

                                            <Form.Item>
                                                <Button
                                                    type="primary"
                                                    onClick={handleCreateAIDraft}
                                                    icon={<FileTextOutlined />}
                                                    loading={aiLoading}
                                                    size="large"
                                                    className={styles.draftButton}
                                                >
                                                    Tạo bản nháp mới
                                                </Button>
                                            </Form.Item>

                                            {aiLoading && (
                                                <div className={styles.loadingContainer}>
                                                    <Spin size="large" tip="Đang tạo bản nháp..." />
                                                </div>
                                            )}

                                            {(aiDraft || editableDraft) && (
                                                <div className={styles.aiDraftContainer}>
                                                    <Divider>
                                                        <Title level={4} className={styles.draftTitle}>Bản nháp AI</Title>
                                                    </Divider>
                                                    <div className={styles.draftEditorWrapper}>
                                                        <Form.Item
                                                            label="Bạn có thể chỉnh sửa nội dung này trước khi lưu"
                                                        >
                                                            <div className={styles.customTextAreaContainer}>
                                                                <TextArea
                                                                    rows={20}
                                                                    value={editableDraft}
                                                                    onChange={handleDraftChange}
                                                                    placeholder="Nội dung bản nháp AI"
                                                                    className={styles.aiDraftEditor}
                                                                />
                                                            </div>
                                                        </Form.Item>
                                                    </div>
                                                </div>
                                            )}

                                            {useAI && (
                                                <Form.Item className={styles.aiFormActions}>
                                                    <Space size="middle">
                                                        <Button
                                                            type="primary"
                                                            icon={<SaveOutlined />}
                                                            loading={submitting}
                                                            size="large"
                                                            className={styles.submitButton}
                                                            onClick={handleSaveWithAI}
                                                        >
                                                            Lưu vụ án với bản nháp AI
                                                        </Button>

                                                        <Button
                                                            type="default"
                                                            onClick={() => navigate(`/legal-cases/${id}`)}
                                                            size="large"
                                                        >
                                                            Hủy
                                                        </Button>
                                                    </Space>
                                                </Form.Item>
                                            )}
                                        </Form>
                                    </Card>
                                </Col>
                            )}
                        </Row>
                    </div>
                </Content>
            </Layout>
        </>
    );
};

export default LegalCaseEditor; 