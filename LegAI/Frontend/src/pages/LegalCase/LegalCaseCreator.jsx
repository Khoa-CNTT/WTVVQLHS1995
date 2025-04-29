import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Upload, Button, Card, Checkbox, Space, message, Typography, Spin, Divider, Row, Col, Layout, Tooltip } from 'antd';
import { UploadOutlined, FileOutlined, FileTextOutlined, SaveOutlined, SendOutlined, ArrowLeftOutlined, InfoCircleOutlined } from '@ant-design/icons';
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
    };

    // Xử lý khi người dùng thay đổi file upload
    const handleFileChange = ({ fileList }) => {
        // Đảm bảo fileList không bị null hoặc undefined
        const safeFileList = Array.isArray(fileList) ? fileList : [];
        setFileList(safeFileList);
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
            }

            // Đảm bảo fileList không null hoặc undefined trước khi xử lý
            const safeFileList = Array.isArray(fileList) ? fileList : [];

            // Thêm các file nếu có
            if (safeFileList.length > 0) {
                safeFileList.forEach((file) => {
                    if (file.originFileObj) {
                        formData.append('files', file.originFileObj);
                    } else if (file instanceof File) {
                        formData.append('files', file);
                    }
                });
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

            setFileList([...fileList, file]);
            return false; // Ngăn chặn tự động upload
        },
        fileList,
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

    // Xử lý submit form khi sử dụng AI
    const handleSubmitWithAI = () => {
        // Kiểm tra các trường bắt buộc
        form.validateFields().then(values => {
            // Gộp giá trị từ cả hai form
            const aiValues = aiForm.getFieldsValue(['template_id', 'user_input']);
            const combinedValues = { ...values, ...aiValues };
            handleCreateCase(combinedValues);
        }).catch(errorInfo => {
            message.error('Vui lòng điền đầy đủ thông tin bắt buộc');
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
                                            tooltip="Hỗ trợ tải lên tối đa 5 file (PDF, DOCX, JPG, PNG), mỗi file tối đa 10MB"
                                        >
                                            <Upload {...uploadProps} multiple maxCount={5} className={styles.uploadArea}>
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
                        </Row>
                    </div>
                </Content>
            </Layout>
        </>
    );
};

export default LegalCaseCreator; 