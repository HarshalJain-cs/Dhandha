import React from 'react';
import { Card, Tabs } from 'antd';
import { SettingOutlined, PrinterOutlined } from '@ant-design/icons';
import PrinterWidget from '../components/PrinterWidget';

const { TabPane } = Tabs;

/**
 * Settings Page
 * Application settings and configuration
 */
const Settings: React.FC = () => {
  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <span>
            <SettingOutlined /> Settings
          </span>
        }
      >
        <Tabs defaultActiveKey="printer" type="card">
          <TabPane
            tab={
              <span>
                <PrinterOutlined />
                Printer
              </span>
            }
            key="printer"
          >
            <div style={{ maxWidth: 600 }}>
              <PrinterWidget />
            </div>
          </TabPane>

          {/* Future tabs can be added here */}
          {/* <TabPane
            tab={
              <span>
                <SettingOutlined />
                General
              </span>
            }
            key="general"
          >
            <div>General settings will go here</div>
          </TabPane> */}
        </Tabs>
      </Card>
    </div>
  );
};

export default Settings;
