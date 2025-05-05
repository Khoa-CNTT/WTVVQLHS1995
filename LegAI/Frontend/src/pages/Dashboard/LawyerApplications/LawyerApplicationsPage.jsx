import React from 'react';
import { Layout } from 'antd';
import LawyerApplicationsManager from '../UsersManager/components/LawyerApplicationsManager';
import classes from './LawyerApplicationsPage.module.css';

const { Content } = Layout;

const LawyerApplicationsPage = () => {
  return (
    <Content className={classes.content}>
      <LawyerApplicationsManager />
    </Content>
  );
};

export default LawyerApplicationsPage; 