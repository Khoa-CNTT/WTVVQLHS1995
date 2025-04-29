import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Upload, Button, Card, Checkbox, Space, message, Typography, Spin, Divider, Row, Col, Layout, Tooltip, Tabs } from 'antd';
import { UploadOutlined, FileOutlined, FileTextOutlined, SaveOutlined, SendOutlined, ArrowLeftOutlined, InfoCircleOutlined, FilePdfOutlined, FileWordOutlined } from '@ant-design/icons';
import legalCaseService from '../../services/legalCaseService';
import legalService from '../../services/legalService';
import userService from '../../services/userService';
import { useNavigate } from 'react-router-dom';
import styles from './LegalCase.module.css';
import Navbar from '../../components/layout/Nav/Navbar';

const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Header, Content } = Layout;
const { TabPane } = Tabs;

const LegalCaseCreator = () => {
    const [form] = Form.useForm();
    const [aiForm] = Form.useForm();
    const navigate = useNavigate();

    const [useAI, setUseAI] = useState(false);
    const [caseTypes, setCaseTypes] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [aiDraft, setAiDraft] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [editableDraft, setEditableDraft] = useState('');
    const [fileList, setFileList] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [formLayout, setFormLayout] = useState('vertical');
    const [fileContent, setFileContent] = useState('');
    const [fileProcessing, setFileProcessing] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [activeTab, setActiveTab] = useState('upload');
    
    // State để kiểm soát hiển thị khu vực chỉnh sửa nội dung file
    const [showFileEditor, setShowFileEditor] = useState(false);
    
    // State để lưu trữ loại file đã chọn
    const [fileType, setFileType] = useState(null);
    
    // State để kiểm soát khi nào nên hiển thị khu vực tải lên và khi nào nên hiển thị khu vực AI
    const [inputMethod, setInputMethod] = useState('upload'); // 'upload' hoặc 'ai'

    // Lấy danh sách loại vụ án và mẫu văn bản
    useEffect(() => {
        const fetchData = async () => {
            try {
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
                console.error('Lỗi khi lấy dữ liệu loại vụ án:', error);
                // Sử dụng danh sách mặc định khi có lỗi
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
        };

        fetchData();
    }, []);

    // Xử lý khi người dùng chọn sử dụng AI
    const handleAICheckboxChange = (e) => {
        setUseAI(e.target.checked);
        setAiDraft('');
        setEditableDraft('');
        
        // Đổi phương thức nhập liệu
        handleInputMethodChange(e.target.checked ? 'ai' : 'upload');
    };

    // Xử lý khi người dùng thay đổi file upload
    const handleFileChange = ({ fileList }) => {
        // Đảm bảo fileList không bị null hoặc undefined
        const safeFileList = Array.isArray(fileList) ? fileList : [];
        setFileList(safeFileList);
        
        console.log('File đã được chọn:', safeFileList);
        
        // Nếu có file được chọn
        if (safeFileList.length > 0) {
            const file = safeFileList[0].originFileObj || safeFileList[0];
            setSelectedFile(file);
            console.log('File đã chọn:', file.name, 'Loại:', file.type);
            
            // Đặt loại file dựa trên phần mở rộng
            const fileName = file.name.toLowerCase();
            if (fileName.endsWith('.pdf')) {
                setFileType('pdf');
            } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
                setFileType('docx');
            } else if (fileName.endsWith('.txt')) {
                setFileType('txt');
            } else {
                setFileType('other');
            }
            
            // Hiển thị editor và đọc nội dung file
            console.log('Hiển thị editor file');
            setShowFileEditor(true);
            
            // Thêm timeout để đảm bảo showFileEditor được cập nhật
            setTimeout(() => {
                console.log('showFileEditor sau timeout:', true);
                setShowFileEditor(true);
            }, 100);
            
            // Gọi hàm đọc file
            extractFileContent(file);
            
            // Đảm bảo rằng activeTab là 'upload'
            if (activeTab !== 'upload') {
                setActiveTab('upload');
            }
            
            // Chuyển sang chế độ upload thay vì AI
            setUseAI(false);
            setInputMethod('upload');
        } else {
            // Nếu không có file, ẩn editor
            setShowFileEditor(false);
            setFileContent('');
            setSelectedFile(null);
            setFileType(null);
        }
    };
    
    // Hàm trích xuất nội dung từ file
    const extractFileContent = (file) => {
        if (!file) return;
        
        console.log('Đang trích xuất nội dung từ file:', file.name);
        setFileProcessing(true);
        
        const reader = new FileReader();
        
        reader.onload = (event) => {
            console.log('File đã được đọc, loại kết quả:', typeof event.target.result);
            const content = event.target.result;
            if (typeof content === 'string') {
                // Cho file text
                console.log('Đã đọc nội dung text:', content.substring(0, 100) + '...');
                setFileContent(content);
                setEditableDraft(content); // Đồng bộ với phần chỉnh sửa
            } else {
                // Cho file binary (PDF, DOCX)
                console.log('Đã đọc nội dung binary, không thể hiển thị trực tiếp');
                // Đối với file binary, hiển thị nội dung mặc định để người dùng có thể chỉnh sửa
                // Để trống để người dùng nhập nội dung
                const defaultContent = '';
                setFileContent(defaultContent);
                setEditableDraft(defaultContent);
            }
            
            setFileProcessing(false);
            
            // Đảm bảo editor được hiển thị sau khi xử lý file
            setShowFileEditor(true);
            console.log('Đã hoàn thành xử lý file, showFileEditor =', true);
        };
        
        reader.onerror = (error) => {
            console.error('Lỗi khi đọc file:', error);
            message.error('Không thể đọc file. Vui lòng thử lại.');
            setFileProcessing(false);
        };
        
        // Đọc file dựa trên loại
        if (file.type === 'text/plain') {
            console.log('Đọc file dạng text');
            reader.readAsText(file);
        } else {
            // Đối với các loại file khác như PDF, DOCX
            console.log('Đọc file dạng binary');
            reader.readAsArrayBuffer(file);
        }
    };
    
    // Xử lý khi nội dung file được chỉnh sửa
    const handleFileContentChange = (e) => {
        setFileContent(e.target.value);
        setEditableDraft(e.target.value); // Đồng bộ với trạng thái AI
    };
    
    // Xử lý khi thay đổi phương thức nhập liệu (Upload/AI)
    const handleInputMethodChange = (method) => {
        setInputMethod(method);
        
        if (method === 'ai') {
            setUseAI(true);
            setShowFileEditor(false);
        } else {
            setUseAI(false);
            // Hiển thị editor nếu đã có file được chọn
            setShowFileEditor(fileList.length > 0);
        }
    };
    
    // Xử lý khi người dùng chọn tab
    const handleTabChange = (key) => {
        setActiveTab(key);
        handleInputMethodChange(key);
    };
    
    // Lấy icon phù hợp với loại file
    const getFileIcon = () => {
        switch (fileType) {
            case 'pdf':
                return <FilePdfOutlined style={{ fontSize: '24px', color: '#f5222d' }} />;
            case 'docx':
                return <FileWordOutlined style={{ fontSize: '24px', color: '#1890ff' }} />;
            case 'txt':
                return <FileTextOutlined style={{ fontSize: '24px', color: '#52c41a' }} />;
            default:
                return <FileOutlined style={{ fontSize: '24px', color: '#faad14' }} />;
        }
    };

    // Xử lý tạo bản nháp AI
    const handleCreateAIDraft = async () => {
        try {
            // Lấy thông tin từ form chính
            const mainFormValues = form.getFieldsValue(['case_type', 'title']);
            
            // Lấy thông tin từ form AI
            const aiFormValues = aiForm.getFieldsValue(['template_id', 'user_input']);
            
            console.log('Giá trị form chính:', mainFormValues);
            console.log('Giá trị form AI:', aiFormValues);

            // Kiểm tra đầy đủ các trường
            if (!aiFormValues.template_id || !aiFormValues.user_input || !mainFormValues.case_type || !mainFormValues.title) {
                let missingFields = [];
                if (!mainFormValues.title) missingFields.push('tiêu đề');
                if (!mainFormValues.case_type) missingFields.push('loại vụ án');
                if (!aiFormValues.template_id) missingFields.push('mẫu văn bản');
                if (!aiFormValues.user_input) missingFields.push('yêu cầu soạn thảo');
                
                message.warning(`Vui lòng nhập đầy đủ thông tin: ${missingFields.join(', ')}`);
                return;
            }

            setAiLoading(true);
            
            // Gộp thông tin từ cả hai form để gửi request
            const requestData = {
                template_id: aiFormValues.template_id,
                user_input: aiFormValues.user_input,
                case_type: mainFormValues.case_type,
                title: mainFormValues.title
            };
            
            const response = await legalCaseService.createAIDraft(requestData);

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

    // Xử lý tạo vụ án mới
    const handleCreateCase = async (values) => {
        try {
            setSubmitting(true);

            // Tạo form data để gửi file
            const formData = new FormData();

            // Thêm các trường thông tin vào formData
            formData.append('title', values.title);
            formData.append('description', values.description || '');
            formData.append('case_type', values.case_type);

            // Nếu sử dụng AI, thêm các trường liên quan
            if (useAI) {
                // Lấy giá trị từ form
                const aiFormValues = aiForm.getFieldsValue(['template_id', 'user_input']);
                formData.append('ai_draft', 'true');
                formData.append('template_id', aiFormValues.template_id || '');
                formData.append('user_input', aiFormValues.user_input || '');
                formData.append('ai_content', editableDraft || '');
            } else if (showFileEditor && fileContent) {
                // Nếu không sử dụng AI nhưng có nội dung file đã chỉnh sửa
                // Thêm nội dung đã chỉnh sửa vào formData
                formData.append('extracted_content', fileContent);
            }

            // Đảm bảo fileList không null hoặc undefined trước khi xử lý
            const safeFileList = Array.isArray(fileList) ? fileList : [];

            // Thêm các file nếu có
            if (safeFileList.length > 0) {
                const file = safeFileList[0];
                if (file.originFileObj) {
                    formData.append('file', file.originFileObj);
                } else if (file instanceof File) {
                    formData.append('file', file);
                }
            }

            try {
                // Gọi API tạo vụ án
                const response = await legalCaseService.createLegalCase(formData);

                if (response && response.success) {
                    message.success('Tạo vụ án thành công');
                    navigate(`/legal-cases/${response.data.id}`);
                } else {
                    message.error(response?.message || 'Lỗi khi tạo vụ án');
                }
            } catch (apiError) {
                console.error('Lỗi khi gọi API tạo vụ án:', apiError);
                message.error('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
            }
        } catch (error) {
            console.error('Lỗi khi tạo vụ án:', error);
            message.error('Lỗi khi tạo vụ án. Vui lòng thử lại sau.');
        } finally {
            setSubmitting(false);
        }
    };

    // Xử lý lưu vụ án khi sử dụng AI
    const handleSaveWithAI = () => {
        // Kiểm tra các trường bắt buộc
        form.validateFields().then(values => {
            handleCreateCase(values);
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
            setShowFileEditor(false);
            setFileContent('');
        },
        beforeUpload: file => {
            // Kiểm tra loại file
            const isValidType = file.type === 'application/pdf' ||
                file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                file.type === 'application/msword' ||
                file.type === 'text/plain';

            if (!isValidType) {
                message.error('Chỉ hỗ trợ định dạng PDF, DOCX, DOC, TXT!');
                return Upload.LIST_IGNORE;
            }

            // Kiểm tra kích thước file (tối đa 10MB)
            const isLt10M = file.size / 1024 / 1024 < 10;
            if (!isLt10M) {
                message.error('File phải nhỏ hơn 10MB!');
                return Upload.LIST_IGNORE;
            }

            // Thêm file vào fileList và xử lý nó
            const newFileList = [file];
            setFileList(newFileList);
            
            // Gọi hàm xử lý file
            handleFileChange({ fileList: newFileList });
            
            // Ngăn chặn tự động upload
            return false;
        },
        fileList,
        showUploadList: {
            showRemoveIcon: true
        },
        maxCount: 1
    };

    // Lấy cột dành cho form thông tin chính dựa vào việc sử dụng AI hoặc file
    const getMainFormColSpan = () => {
        // Nếu không dùng AI hoặc file đã được upload thì chiếm toàn bộ
        if (!useAI && fileList.length === 0) {
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

        // Nếu dùng AI hoặc có file upload thì chiếm 1/3 màn hình 
        return {
            xs: 24,
            md: 24,
            lg: 8
        };
    };

    // Xử lý submit form khi sử dụng AI
    const handleSubmitWithAI = () => {
        // Kiểm tra các trường bắt buộc từ form chính
        form.validateFields().then(mainFormValues => {
            // Kiểm tra các trường bắt buộc từ form AI
            aiForm.validateFields().then(aiValues => {
                console.log('Form chính đã xác thực:', mainFormValues);
                console.log('Form AI đã xác thực:', aiValues);
                
                // Kết hợp giá trị từ cả hai form
                const combinedValues = { 
                    ...mainFormValues, 
                    template_id: aiValues.template_id,
                    user_input: aiValues.user_input
                };
                
                // Gọi hàm tạo vụ án
                handleCreateCase(combinedValues);
            }).catch(aiError => {
                console.error('Lỗi xác thực form AI:', aiError);
                // Hiển thị thông báo chi tiết các trường còn thiếu
                const missingFields = [];
                if (aiError.errorFields) {
                    aiError.errorFields.forEach(field => {
                        if (field.name[0] === 'template_id') missingFields.push('mẫu văn bản');
                        if (field.name[0] === 'user_input') missingFields.push('yêu cầu soạn thảo');
                    });
                }
                
                if (missingFields.length > 0) {
                    message.error(`Vui lòng điền đầy đủ thông tin: ${missingFields.join(', ')}`);
                } else {
                    message.error('Vui lòng điền đầy đủ thông tin bắt buộc');
                }
            });
        }).catch(mainError => {
            console.error('Lỗi xác thực form chính:', mainError);
            // Hiển thị thông báo chi tiết các trường còn thiếu
            const missingFields = [];
            if (mainError.errorFields) {
                mainError.errorFields.forEach(field => {
                    if (field.name[0] === 'title') missingFields.push('tiêu đề');
                    if (field.name[0] === 'case_type') missingFields.push('loại vụ án');
                });
            }
            
            if (missingFields.length > 0) {
                message.error(`Vui lòng điền đầy đủ thông tin: ${missingFields.join(', ')}`);
            } else {
                message.error('Vui lòng điền đầy đủ thông tin bắt buộc');
            }
        });
    };

    return (
        <>  <Navbar />

            <Layout className={styles.legalCaseLayout}>
                <Content className={styles.legalCaseContent}>
                    <div className={styles.legalCaseCreator}>
                        <div className={styles.pageHeader}>
                            <Button
                                type="link"
                                icon={<ArrowLeftOutlined />}
                                onClick={() => navigate('/legal-cases')}
                                className={styles.backButton}
                            >
                                Quay lại danh sách
                            </Button>
                            <Title level={2} style={{marginLeft: '165px'}}>Tạo vụ án mới</Title>
                        </div>

                        <Row gutter={24}>
                            <Col {...getMainFormColSpan()}>
                                <Card
                                    title="Thông tin vụ án"
                                    bordered={false}
                                    className={styles.infoCard}
                                    extra={
                                        <Tooltip title="Nhập thông tin cơ bản của vụ án">
                                            <InfoCircleOutlined />
                                        </Tooltip>
                                    }
                                >
                                    <Form
                                        form={form}
                                        layout={formLayout}
                                        onFinish={handleCreateCase}
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

                                        <Form.Item
                                            label="Tài liệu liên quan"
                                            tooltip="Hỗ trợ tải lên file (PDF, DOCX, TXT), tối đa 10MB"
                                        >
                                            <Tabs 
                                                activeKey={activeTab} 
                                                onChange={handleTabChange}
                                                className={styles.uploadTabs}
                                            >
                                                <TabPane tab="Tải lên file" key="upload">
                                                    <Upload 
                                                        {...uploadProps} 
                                                        maxCount={1} 
                                                        className={styles.uploadArea}
                                                    >
                                                        <Button icon={<UploadOutlined />} size="large" type="dashed" block>
                                                            Chọn tài liệu
                                                        </Button>
                                                        <div className={styles.uploadHint}>
                                                            Kéo thả file vào đây hoặc nhấn để chọn
                                                        </div>
                                                    </Upload>
                                                </TabPane>
                                                <TabPane tab="Sử dụng AI" key="ai">
                                                    <div className={styles.aiCheckboxWrapper}>
                                                        <Checkbox
                                                            checked={useAI}
                                                            onChange={handleAICheckboxChange}
                                                            className={styles.aiCheckbox}
                                                        >
                                                            <span className={styles.aiCheckboxLabel}>Sử dụng AI soạn thảo văn bản</span>
                                                        </Checkbox>
                                                    </div>
                                                </TabPane>
                                            </Tabs>
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
                                                        onClick={() => navigate('/legal-cases')}
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
                                            form={aiForm}
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
                                                    Tạo bản nháp
                                                </Button>
                                            </Form.Item>

                                            {aiLoading && (
                                                <div className={styles.loadingContainer}>
                                                    <Spin size="large" tip="Đang tạo bản nháp..." />
                                                </div>
                                            )}

                                            {aiDraft && (
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
                                                            onClick={handleSubmitWithAI}
                                                        >
                                                            Lưu vụ án với bản nháp AI
                                                        </Button>

                                                        <Button
                                                            type="default"
                                                            onClick={() => navigate('/legal-cases')}
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
                            
                            {(() => {
                                // Log để kiểm tra điều kiện hiển thị
                                console.log("Điều kiện hiển thị editor bên phải:", {
                                    useAI: useAI,
                                    fileListLength: fileList.length,
                                    showFileEditor: showFileEditor,
                                    shouldShow: !useAI && fileList.length > 0
                                });
                                
                                // Kiểm tra điều kiện hiển thị bên phải
                                return !useAI && fileList.length > 0 && (
                                    <Col xs={24} lg={16}>
                                        <Card
                                            title={`Chỉnh sửa nội dung file: ${selectedFile?.name || 'Tài liệu'}`}
                                            className={styles.aiCard}
                                            bordered={false}
                                            extra={
                                                <Tooltip title="Bạn có thể chỉnh sửa nội dung file trước khi lưu">
                                                    <InfoCircleOutlined />
                                                </Tooltip>
                                            }
                                        >
                                            {fileProcessing ? (
                                                <div className={styles.loadingContainer}>
                                                    <Spin size="large" tip="Đang xử lý nội dung file..." />
                                                </div>
                                            ) : (
                                                <>
                                                    <div className={styles.fileTypeIconContainer}>
                                                        <Space>
                                                            {getFileIcon()}
                                                            <Text strong>Loại file: {fileType?.toUpperCase() || 'Không xác định'}</Text>
                                                        </Space>
                                                    </div>
                                                    
                                                    <div className={styles.aiDraftContainer}>
                                                        <Divider>
                                                            <Title level={4} className={styles.draftTitle}>Nội dung</Title>
                                                        </Divider>
                                                        <div className={styles.draftEditorWrapper}>
                                                            <Form.Item
                                                                label="Bạn có thể chỉnh sửa nội dung này trước khi lưu"
                                                            >
                                                                <div className={styles.customTextAreaContainer}>
                                                                    <TextArea
                                                                        rows={25}
                                                                        value={fileContent}
                                                                        onChange={handleFileContentChange}
                                                                        placeholder="Nhập nội dung tài liệu tại đây"
                                                                        className={styles.aiDraftEditor}
                                                                    />
                                                                </div>
                                                            </Form.Item>
                                                        </div>
                                                    </div>
                                                    
                                                    <Form.Item className={styles.aiFormActions}>
                                                        <Space size="middle">
                                                            <Button
                                                                type="primary"
                                                                icon={<SaveOutlined />}
                                                                loading={submitting}
                                                                size="large"
                                                                className={styles.submitButton}
                                                                onClick={() => form.submit()}
                                                            >
                                                                Lưu vụ án với nội dung đã chỉnh sửa
                                                            </Button>

                                                            <Button
                                                                type="default"
                                                                onClick={() => navigate('/legal-cases')}
                                                                size="large"
                                                            >
                                                                Hủy
                                                            </Button>
                                                        </Space>
                                                    </Form.Item>
                                                </>
                                            )}
                                        </Card>
                                    </Col>
                                );
                            })()}
                        </Row>
                    </div>
                </Content>
            </Layout>
        </>
    );
};

export default LegalCaseCreator; 