import React, { useState, useEffect, useRef } from 'react';
import { Form, Input, Select, Upload, Button, Card, Checkbox, Space, message, Typography, Spin, Divider, Row, Col, Layout, Tooltip, Tabs, Modal } from 'antd';
import { UploadOutlined, FileOutlined, FileTextOutlined, SaveOutlined, SendOutlined, ArrowLeftOutlined, InfoCircleOutlined, FilePdfOutlined, FileWordOutlined, RobotOutlined } from '@ant-design/icons';
import legalCaseService from '../../services/legalCaseService';
import legalService from '../../services/legalService';
import userService from '../../services/userService';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './LegalCase.module.css';
import Navbar from '../../components/layout/Nav/Navbar';
import authService from '../../services/authService';

const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Header, Content } = Layout;
const { TabPane } = Tabs;

const LegalCaseEditor = () => {
    const { id } = useParams();
    const [form] = Form.useForm();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [caseData, setCaseData] = useState(null);
    const [caseTypes, setCaseTypes] = useState([]);
    const [editableDraft, setEditableDraft] = useState('');
    const [fileList, setFileList] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [formLayout, setFormLayout] = useState('vertical');
    const [fileContent, setFileContent] = useState('');
    const [fileProcessing, setFileProcessing] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [activeTab, setActiveTab] = useState('content');
    const [isOwner, setIsOwner] = useState(false);
    const [showFileEditor, setShowFileEditor] = useState(false);
    const [fileType, setFileType] = useState(null);
    
    // States cho AI assistant
    const [showAIModal, setShowAIModal] = useState(false);
    const [aiPrompt, setAIPrompt] = useState('');
    const [aiProcessing, setAIProcessing] = useState(false);
    const [aiResult, setAIResult] = useState('');
    
    // Tham chiếu để theo dõi nội dung file trong quá trình xử lý bất đồng bộ
    const fileContentRef = useRef('');
    
    // Lấy thông tin vụ án và danh sách loại vụ án
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                
                // Lấy thông tin vụ án
                const caseResponse = await legalCaseService.getLegalCaseById(id);
                if (!caseResponse || !caseResponse.success) {
                    message.error('Không thể tải thông tin vụ án. Vui lòng thử lại sau.');
                    navigate('/legal-cases');
                    return;
                }
                
                const caseDetail = caseResponse.data;
                console.log('Thông tin vụ án:', caseDetail);
                setCaseData(caseDetail);
                
                // Kiểm tra quyền chỉnh sửa
                const userData = authService.getCurrentUser() || {};
                const isUserOwner = caseDetail.user_id === userData.id;
                const isAdmin = userData.role && userData.role.toLowerCase() === 'admin';
                
                if (!isUserOwner && !isAdmin) {
                    message.error('Bạn không có quyền chỉnh sửa vụ án này.');
                    navigate(`/legal-cases/${id}`);
                    return;
                }
                
                setIsOwner(isUserOwner);
                
                // Điền thông tin vào form
                form.setFieldsValue({
                    title: caseDetail.title,
                    case_type: caseDetail.case_type,
                    description: caseDetail.description
                });
                
                // Nếu có nội dung AI, hiển thị trong editor
                if (caseDetail.ai_content) {
                    setEditableDraft(caseDetail.ai_content);
                    setFileContent(caseDetail.ai_content);
                    fileContentRef.current = caseDetail.ai_content;
                    setShowFileEditor(true);
                }
                
                // Nếu có file, thêm vào fileList
                if (caseDetail.file_url) {
                    const fileName = caseDetail.file_url.split('/').pop();
                    const fileExtension = fileName.split('.').pop().toLowerCase();
                    
                    if (fileExtension === 'pdf') {
                        setFileType('pdf');
                    } else if (['docx', 'doc'].includes(fileExtension)) {
                        setFileType('docx');
                    } else if (fileExtension === 'txt') {
                        setFileType('txt');
                    } else {
                        setFileType('other');
                    }
                    
                    setFileList([{
                        uid: '-1',
                        name: fileName,
                        status: 'done',
                        url: `${process.env.REACT_APP_API_BASE_URL || ''}${caseDetail.file_url}`
                    }]);
                }
                
                // Lấy danh sách loại vụ án
                const caseTypesRes = await legalCaseService.getCaseTypes();
                if (caseTypesRes && caseTypesRes.data) {
                    setCaseTypes(caseTypesRes.data);
                } else {
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
            } catch (error) {
                console.error('Lỗi khi lấy dữ liệu:', error);
                message.error('Không thể tải dữ liệu. Vui lòng thử lại sau.');
                navigate('/legal-cases');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, navigate, form]);

    // Cập nhật ref mỗi khi fileContent thay đổi
    useEffect(() => {
        fileContentRef.current = fileContent;
    }, [fileContent]);

    // Xử lý khi người dùng thay đổi file upload
    const handleFileChange = ({ fileList }) => {
        // Đảm bảo fileList không bị null hoặc undefined
        const safeFileList = Array.isArray(fileList) ? fileList : [];
        setFileList(safeFileList);
        
        // Nếu có file được chọn
        if (safeFileList.length > 0) {
            const file = safeFileList[0].originFileObj || safeFileList[0];
            setSelectedFile(file);
            
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
            setShowFileEditor(true);
            
            // Gọi hàm đọc file
            extractFileContent(file);
            
            // Đảm bảo rằng activeTab là 'upload'
            if (activeTab !== 'upload') {
                setActiveTab('upload');
            }
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
        
        setFileProcessing(true);
        
        const reader = new FileReader();
        
        reader.onload = (event) => {
            const content = event.target.result;
            
            if (typeof content === 'string') {
                // Xử lý file text
                setFileContent(content);
                fileContentRef.current = content;
                setEditableDraft(content); // Đè lên nội dung hiện tại
            } else {
                // Xử lý file binary (PDF, DOCX)
                const defaultContent = 'Đang xử lý nội dung từ file. Vui lòng đợi trong giây lát...';
                setFileContent(defaultContent);
                fileContentRef.current = defaultContent;
                setEditableDraft(defaultContent);
                
                // Tạo FormData để gửi file lên server
                const formData = new FormData();
                formData.append('file', file);
                
                // Gọi API để trích xuất nội dung
                legalCaseService.extractFileContent(formData)
                    .then(response => {
                        if (response && response.success) {
                            const extractedContent = response.data.content || '';
                            
                            // Cập nhật cả hai state và ref
                            setFileContent(extractedContent);
                            fileContentRef.current = extractedContent;
                            setEditableDraft(extractedContent); // Đè lên nội dung hiện tại
                            
                            // Hiển thị thông báo thành công
                            message.success('Đã trích xuất nội dung file thành công');
                        } else {
                            message.error(response?.message || 'Không thể trích xuất nội dung file');
                            setFileContent('');
                            fileContentRef.current = '';
                            setEditableDraft('');
                        }
                    })
                    .catch(error => {
                        console.error('Lỗi khi gọi API trích xuất nội dung:', error);
                        message.error('Không thể trích xuất nội dung file. Vui lòng thử lại.');
                        setFileContent('');
                        fileContentRef.current = '';
                        setEditableDraft('');
                    })
                    .finally(() => {
                        setFileProcessing(false);
                    });
                
                // Return sớm để tránh set fileProcessing = false trước khi API xử lý xong
                return;
            }
            
            setFileProcessing(false);
            setShowFileEditor(true);
        };
        
        reader.onerror = (error) => {
            console.error('Lỗi khi đọc file:', error);
            message.error('Không thể đọc file. Vui lòng thử lại.');
            setFileProcessing(false);
        };
        
        // Đọc file dựa trên loại
        if (file.type === 'text/plain') {
            reader.readAsText(file);
        } else {
            reader.readAsArrayBuffer(file);
        }
    };

    // Xử lý khi người dùng thay đổi nội dung trong editor
    const handleFileContentChange = (e) => {
        const content = e.target.value;
        setEditableDraft(content);
    };

    // Xử lý khi thay đổi tab
    const handleTabChange = (key) => {
        setActiveTab(key);
    };

    // Lấy icon cho file
    const getFileIcon = () => {
        if (fileType === 'pdf') {
            return <FilePdfOutlined style={{ fontSize: '24px', color: '#ff4d4f' }} />;
        } else if (fileType === 'docx' || fileType === 'doc') {
            return <FileWordOutlined style={{ fontSize: '24px', color: '#1890ff' }} />;
        } else {
            return <FileOutlined style={{ fontSize: '24px' }} />;
        }
    };
    
    // Mở modal AI assistant
    const handleOpenAIModal = () => {
        setShowAIModal(true);
        setAIPrompt('');
        setAIResult('');
    };
    
    // Đóng modal AI assistant
    const handleCloseAIModal = () => {
        setShowAIModal(false);
    };
    
    // Xử lý yêu cầu AI chỉnh sửa
    const handleAIEdit = async () => {
        if (!aiPrompt.trim()) {
            message.warning('Vui lòng nhập hướng dẫn cho AI');
            return;
        }
        
        setAIProcessing(true);
        
        try {
            // Gọi API AI để xử lý nội dung
            const response = await legalCaseService.createAIDraft({
                template_id: 1, // ID mẫu văn bản cơ bản
                user_input: aiPrompt,
                case_type: form.getFieldValue('case_type'),
                title: form.getFieldValue('title'),
                content: editableDraft // Truyền nội dung hiện tại để AI chỉnh sửa
            });
            
            if (response && response.success) {
                const aiContent = response.data.ai_content;
                setAIResult(aiContent);
            } else {
                message.error(response?.message || 'Không thể tạo nội dung AI');
            }
        } catch (error) {
            console.error('Lỗi khi tạo nội dung AI:', error);
            message.error('Không thể tạo nội dung AI. Vui lòng thử lại sau.');
        } finally {
            setAIProcessing(false);
        }
    };
    
    // Áp dụng kết quả AI vào nội dung
    const handleApplyAIResult = () => {
        if (aiResult) {
            setEditableDraft(aiResult);
            setShowAIModal(false);
            message.success('Đã áp dụng nội dung AI thành công');
        }
    };

    // Xử lý cập nhật vụ án
    const handleUpdateCase = async (values) => {
        try {
            setSubmitting(true);
            
            // Log để kiểm tra dữ liệu trước khi gửi
            console.log('Dữ liệu vụ án trước khi cập nhật:', { 
                ...values, 
                editableDraft, 
                contentLength: editableDraft ? editableDraft.length : 0 
            });
            
            // Tạo FormData để gửi dữ liệu
            const formData = new FormData();
            formData.append('title', values.title || '');
            formData.append('case_type', values.case_type || '');
            formData.append('description', values.description || '');
            
            // Thêm nội dung từ editor nếu có
            if (editableDraft && editableDraft.trim() !== '') {
                formData.append('ai_content', editableDraft);
                // Log nội dung AI trước khi gửi đi
                console.log('Nội dung AI sẽ được gửi đi, độ dài:', editableDraft.length);
            } else {
                console.log('Không có nội dung AI để gửi');
            }
            
            // Nếu có file mới, thêm vào formData
            if (selectedFile && selectedFile.originFileObj) {
                formData.append('file', selectedFile.originFileObj);
                console.log('Đã thêm file mới vào FormData');
            } else if (selectedFile) {
                formData.append('file', selectedFile);
                console.log('Đã thêm file đã chọn vào FormData');
            }
            
            // Thêm thông tin về nguồn gốc nội dung (AI hay không)
            const isAIGenerated = caseData && caseData.is_ai_generated ? 'true' : 'false';
            formData.append('is_ai_generated', isAIGenerated);
            console.log('Trạng thái is_ai_generated:', isAIGenerated);
            
            // Log tất cả dữ liệu trong FormData để kiểm tra
            console.log('Dữ liệu FormData trước khi gửi:');
            for (let [key, value] of formData.entries()) {
                if (key === 'file') {
                    console.log(`${key}: [File object]`);
                } else if (key === 'ai_content') {
                    console.log(`${key}: [Nội dung với độ dài ${value.length}]`);
                } else {
                    console.log(`${key}: ${value}`);
                }
            }
            
            // Gọi API cập nhật vụ án với timeout dài hơn để xử lý file lớn
            const response = await legalCaseService.updateLegalCase(id, formData);
            
            if (response && response.success) {
                message.success('Cập nhật vụ án thành công');
                navigate(`/legal-cases/${id}`);
            } else {
                message.error(response?.message || 'Không thể cập nhật vụ án. Vui lòng thử lại.');
            }
        } catch (error) {
            console.error('Lỗi khi cập nhật vụ án:', error);
            message.error('Không thể cập nhật vụ án. Vui lòng thử lại sau.');
        } finally {
            setSubmitting(false);
        }
    };

    // Xử lý hủy
    const handleCancel = () => {
        navigate(`/legal-cases/${id}`);
    };

    if (loading) {
        return (
            <Layout className={styles.legalCaseLayout}>
                <Navbar />
                <Content className={styles.legalCaseContent}>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                        <Spin size="large" tip="Đang tải dữ liệu..." />
                    </div>
                </Content>
            </Layout>
        );
    }

    return (
        <Layout className={styles.legalCaseLayout}>
            <Navbar />
            <Content className={styles.legalCaseContent}>
                <div className={styles.pageContainer}>
                    <div className={styles.pageHeader}>
                        <Button
                            type="link"
                            icon={<ArrowLeftOutlined />}
                            onClick={handleCancel}
                            className={styles.backButton}
                        >
                            Quay lại
                        </Button>
                        <Title level={2}>Chỉnh sửa vụ án</Title>
                    </div>

                    <Card className={styles.createCaseCard}>
                        <Form
                            form={form}
                            layout={formLayout}
                            onFinish={handleUpdateCase}
                            scrollToFirstError
                            className={styles.createCaseForm}
                        >
                            <Row gutter={24}>
                                <Col span={24}>
                                    <Form.Item
                                        name="title"
                                        label="Tiêu đề vụ án"
                                        rules={[{ required: true, message: 'Vui lòng nhập tiêu đề vụ án' }]}
                                    >
                                        <Input placeholder="Nhập tiêu đề vụ án" maxLength={255} />
                                    </Form.Item>
                                </Col>
                                
                                <Col span={12}>
                                    <Form.Item
                                        name="case_type"
                                        label="Loại vụ án"
                                        rules={[{ required: true, message: 'Vui lòng chọn loại vụ án' }]}
                                    >
                                        <Select placeholder="Chọn loại vụ án">
                                            {caseTypes.map(type => (
                                                <Option key={type.case_type} value={type.case_type}>
                                                    {type.case_type}
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>
                                
                                <Col span={24}>
                                    <Form.Item
                                        name="description"
                                        label="Mô tả vụ án"
                                    >
                                        <TextArea
                                            placeholder="Nhập mô tả chi tiết về vụ án"
                                            autoSize={{ minRows: 3, maxRows: 5 }}
                                        />
                                    </Form.Item>
                                </Col>
                                
                                <Col span={24}>
                                    <Divider>Nội dung vụ án</Divider>
                                    
                                    <Tabs
                                        activeKey={activeTab}
                                        onChange={handleTabChange}
                                        className={styles.caseTabs}
                                    >
                                        <TabPane tab="Nội dung văn bản" key="content">
                                            <div className={styles.editorArea}>
                                                <div className={styles.editorToolbar}>
                                                    <Button 
                                                        type="primary" 
                                                        icon={<RobotOutlined />}
                                                        onClick={handleOpenAIModal}
                                                    >
                                                        Trợ giúp AI
                                                    </Button>
                                                </div>
                                                <TextArea
                                                    value={editableDraft}
                                                    onChange={handleFileContentChange}
                                                    placeholder="Nhập nội dung văn bản vụ án..."
                                                    autoSize={{ minRows: 15, maxRows: 30 }}
                                                    className={styles.contentEditor}
                                                />
                                            </div>
                                        </TabPane>
                                        
                                        <TabPane tab="Tải lên tài liệu" key="upload">
                                            <div className={styles.uploadArea}>
                                                <Upload
                                                    name="file"
                                                    fileList={fileList}
                                                    onChange={handleFileChange}
                                                    beforeUpload={() => false}
                                                    maxCount={1}
                                                >
                                                    <Button icon={<UploadOutlined />}>Chọn file</Button>
                                                </Upload>
                                                
                                                <div className={styles.fileTypeNote}>
                                                    <Text type="secondary">Hỗ trợ các định dạng: .pdf, .docx, .doc, .txt</Text>
                                                </div>
                                                
                                                {fileProcessing && (
                                                    <div className={styles.processingNote}>
                                                        <Spin size="small" />
                                                        <Text style={{ marginLeft: 8 }}>Đang xử lý file...</Text>
                                                    </div>
                                                )}
                                                
                                                {showFileEditor && fileType && (
                                                    <div className={styles.filePreview}>
                                                        <div className={styles.fileInfo}>
                                                            {getFileIcon()}
                                                            <Text strong style={{ marginLeft: 8 }}>
                                                                {selectedFile ? selectedFile.name : (fileList[0]?.name || 'Tài liệu')}
                                                            </Text>
                                                            <Button 
                                                                type="link" 
                                                                icon={<RobotOutlined />}
                                                                onClick={handleOpenAIModal}
                                                                style={{ marginLeft: 'auto' }}
                                                            >
                                                                Trợ giúp AI
                                                            </Button>
                                                        </div>
                                                        
                                                        <div className={styles.editorArea}>
                                                            <TextArea
                                                                value={editableDraft}
                                                                onChange={handleFileContentChange}
                                                                placeholder="Nội dung tài liệu..."
                                                                autoSize={{ minRows: 15, maxRows: 30 }}
                                                                className={styles.contentEditor}
                                                                style={{ backgroundColor: '#f5f5f5',width: '100%',minWidth: '700px' }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </TabPane>
                                    </Tabs>
                                </Col>
                                
                                <Col span={24} style={{ marginTop: 20 }}>
                                    <Divider />
                                    <div className={styles.formActions}>
                                        <Space size="middle">
                                            <Button onClick={handleCancel}>
                                                Hủy
                                            </Button>
                                            <Button 
                                                type="primary" 
                                                htmlType="submit" 
                                                loading={submitting}
                                                icon={<SaveOutlined />}
                                            >
                                                Lưu thay đổi
                                            </Button>
                                        </Space>
                                    </div>
                                </Col>
                            </Row>
                        </Form>
                    </Card>
                </div>
                
                {/* Modal AI Assistant */}
                <Modal
                    title={
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <RobotOutlined style={{ fontSize: '20px', marginRight: '10px' }} /> 
                            <span>Trợ giúp AI chỉnh sửa nội dung</span>
                        </div>
                    }
                    open={showAIModal}
                    onCancel={handleCloseAIModal}
                    footer={[
                        <Button key="cancel" onClick={handleCloseAIModal}>
                            Hủy
                        </Button>,
                        <Button 
                            key="submit" 
                            type="primary" 
                            onClick={handleAIEdit}
                            loading={aiProcessing}
                            disabled={!aiPrompt.trim()}
                        >
                            <SendOutlined /> Gửi yêu cầu
                        </Button>,
                        <Button 
                            key="apply" 
                            type="primary" 
                            onClick={handleApplyAIResult}
                            disabled={!aiResult}
                            style={{ display: aiResult ? 'inline-block' : 'none' }}
                        >
                            Áp dụng
                        </Button>
                    ]}
                    width={800}
                >
                    <div className={styles.aiModalContent}>
                        <div className={styles.aiPromptArea}>
                            <Text strong>Nhập yêu cầu cho AI:</Text>
                            <TextArea
                                value={aiPrompt}
                                onChange={(e) => setAIPrompt(e.target.value)}
                                placeholder="Ví dụ: Tóm tắt nội dung tài liệu này, Thêm phần phân tích pháp lý, Sửa lỗi chính tả, Hãy viết rõ phần trách nhiệm của các bên, v.v."
                                autoSize={{ minRows: 3, maxRows: 6 }}
                                style={{ marginTop: '10px', marginBottom: '15px' }}
                            />
                            <Text type="secondary">
                                Hãy mô tả chi tiết những gì bạn muốn AI thay đổi trong nội dung hiện tại.
                            </Text>
                        </div>
                        
                        {aiProcessing && (
                            <div style={{ textAlign: 'center', margin: '20px 0' }}>
                                <Spin tip="AI đang xử lý yêu cầu của bạn..." />
                            </div>
                        )}
                        
                        {aiResult && (
                            <div className={styles.aiResultArea}>
                                <Divider>Kết quả từ AI</Divider>
                                <div className={styles.aiResultContent}>
                                    <TextArea
                                        value={aiResult}
                                        readOnly
                                        autoSize={{ minRows: 10, maxRows: 20 }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </Modal>
            </Content>
        </Layout>
    );
};

export default LegalCaseEditor;
