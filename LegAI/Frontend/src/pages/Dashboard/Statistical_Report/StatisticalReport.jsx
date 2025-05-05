import { Card, Table, Typography, Select, Button, Row, Col } from "antd";
import { useState } from "react";
import styles from "./StatisticalReport.module.css";

const { Title } = Typography;
const { Option } = Select;

const StatisticalReport = () => {
  const [month, setMonth] = useState("THÁNG 4");

  const months = [
    "THÁNG 1", "THÁNG 2", "THÁNG 3", "THÁNG 4", "THÁNG 5", "THÁNG 6", 
    "THÁNG 7", "THÁNG 8", "THÁNG 9", "THÁNG 10", "THÁNG 11", "THÁNG 12"
  ];

  const columns = [
    {
      title: "KHÁCH HÀNG",
      dataIndex: "customer",
    },
    {
      title: "DỊCH VỤ",
      dataIndex: "service",
    },
    {
      title: "SỐ TIỀN",
      dataIndex: "amount",
    },
    {
      title: "TRẠNG THÁI",
      dataIndex: "status",
    },
    {
      title: "THỜI GIAN",
      dataIndex: "time",
    },
  ];


  const data = 
  [
    {
      customer: "phong",
      service: "dan su",
      month: "THÁNG 4",
      status: "done",
      amount: 20000000,
      time: "2025-04-12"
    },
    {
      customer: "phong",
      service: "dan su",
      month: "THÁNG 4",
      status: "pending",
      amount: 10000000,
      time: "2025-04-12"
    },
    {
      customer: "phong",
      service: "dan su",
      month: "THÁNG 4",
      status: "inprogress",
      amount: 10000000,
      time: "2025-04-12"
    },
    {
      customer: "phong",
      service: "dan su",
      month: "THÁNG 4",
      status: "inprogress",
      amount: 10000000,
      time: "2025-04-12"
    },
    {
      customer: "phong",
      service: "dan su",
      month: "THÁNG 4",
      status: "paid",
      amount: 15000000,
      time: "2025-04-12"
    },
    {
      customer: "phong",
      service: "dan su",
      month: "THÁNG 5",
      status: "done",
      amount: 10000000,
      time: "2025-04-12"
    }
  ]; // Dữ liệu hiển thị trong bảng

  const calculateStats = (month) => {
    let totalDone = 0;
    let totalPaid = 0;
    let totalPending = 0;
    let totalProcessing = 0;
    let dataTableWithMonth = []
    data.forEach(item => {
      if (item.month === month) {
      dataTableWithMonth.push(item)
        if (item.status === "done") {
          totalDone += item.amount;
        } else if (item.status === "pending") {
          totalPending += item.amount;
        } else if (item.status === "inprogress") {
          totalProcessing += 1;
        } else if (item.status === "paid") {
          totalPaid += item.amount;
        }
      }
    });

    return { totalDone, totalPaid, totalPending, totalProcessing, dataTableWithMonth };
  };

  const stats = calculateStats(month);

  return (
    <div className={styles.container}>
      <Row justify="space-between" align="middle" className={styles.rowMarginBottom}>
        <Col>
          <Select value={month} onChange={setMonth}>
            {months.map((m, index) => (
              <Option key={index} value={m}>{m}</Option>
            ))}
          </Select>
        </Col>
        <Col>
          <Button type="primary" className={styles.button}>
            XUẤT BÁO CÁO
          </Button>
        </Col>
      </Row>

      <Row gutter={16} className={styles.cardMarginBottom}>
        <Col span={6}>
          <Card bordered={false}>
            <Title level={5} className={styles.cardTitle}>ĐÃ CHUYỂN</Title>
            <div className={styles.cardContent}>{stats.totalDone.toLocaleString()} đ</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <Title level={5} className={styles.cardTitle}>ĐÃ THANH TOÁN</Title>
            <div className={styles.cardContent}>{stats.totalPaid.toLocaleString()} đ</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <Title level={5} className={styles.cardTitle}>CHƯA THANH TOÁN</Title>
            <div className={styles.cardContent}>{stats.totalPending.toLocaleString()} đ</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <Title level={5} className={styles.cardTitle}>HỒ SƠ ĐANG XỬ LÝ</Title>
            <div className={styles.cardContent}>{stats.totalProcessing.toLocaleString()}</div>
          </Card>
        </Col>
      </Row>

      <Table columns={columns} dataSource={stats.dataTableWithMonth} pagination={false} />
    </div>
  );
};

export default StatisticalReport;
