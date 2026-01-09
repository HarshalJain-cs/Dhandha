import React, { useEffect } from 'react';
import { notification, Button, Space } from 'antd';
import { DownloadOutlined, InfoCircleOutlined, CloseOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import {
  setChecking,
  setUpdateAvailable,
  setUpdateNotAvailable,
  setDownloading,
  setDownloadProgress,
  setDownloaded,
  setError,
} from '../store/slices/updateSlice';

/**
 * UpdateNotification Component
 * Displays notification when update is available
 */
const UpdateNotification: React.FC = () => {
  const dispatch = useDispatch();
  const updateState = useSelector((state: RootState) => state.update);

  /**
   * Setup event listeners from main process
   */
  useEffect(() => {
    // Check if electronAPI is available
    if (!window.electronAPI || !window.electronAPI.update) {
      console.warn('Update API not available - auto-update features will be disabled');
      return;
    }

    // Checking for update
    const unsubscribeChecking = window.electronAPI.update.onChecking(() => {
      dispatch(setChecking(true));
    });

    // Update available
    const unsubscribeAvailable = window.electronAPI.update.onAvailable((info) => {
      dispatch(setUpdateAvailable(info));
      showUpdateNotification(info);
    });

    // Update not available
    const unsubscribeNotAvailable = window.electronAPI.update.onNotAvailable(() => {
      dispatch(setUpdateNotAvailable());
    });

    // Download progress
    const unsubscribeProgress = window.electronAPI.update.onDownloadProgress((progress) => {
      dispatch(setDownloadProgress(progress));
    });

    // Update downloaded
    const unsubscribeDownloaded = window.electronAPI.update.onDownloaded((info) => {
      dispatch(setDownloaded(info));
      showReadyToInstallNotification(info);
    });

    // Update error
    const unsubscribeError = window.electronAPI.update.onError((error) => {
      dispatch(setError(error));
      notification.error({
        message: 'Update Error',
        description: error,
        placement: 'topRight',
        duration: 5,
      });
    });

    // Cleanup listeners on unmount
    return () => {
      if (unsubscribeChecking) unsubscribeChecking();
      if (unsubscribeAvailable) unsubscribeAvailable();
      if (unsubscribeNotAvailable) unsubscribeNotAvailable();
      if (unsubscribeProgress) unsubscribeProgress();
      if (unsubscribeDownloaded) unsubscribeDownloaded();
      if (unsubscribeError) unsubscribeError();
    };
  }, [dispatch]);

  /**
   * Show notification when update is available
   */
  const showUpdateNotification = (info: any) => {
    const key = `update-available-${Date.now()}`;

    notification.open({
      key,
      message: 'Update Available',
      description: `Version ${info.version} is available. ${info.releaseNotes ? 'Click "View Details" for release notes.' : ''}`,
      placement: 'topRight',
      duration: 30, // Auto-dismiss after 30 seconds
      icon: <DownloadOutlined style={{ color: '#1890ff' }} />,
      btn: (
        <Space>
          {info.releaseNotes && (
            <Button
              type="link"
              size="small"
              icon={<InfoCircleOutlined />}
              onClick={() => {
                // Open release notes modal or link
                if (info.releaseNotes) {
                  notification.destroy(key);
                  notification.info({
                    message: `Version ${info.version} Release Notes`,
                    description: (
                      <div
                        style={{
                          maxHeight: '300px',
                          overflow: 'auto',
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {info.releaseNotes}
                      </div>
                    ),
                    placement: 'topRight',
                    duration: 0,
                  });
                }
              }}
            >
              View Details
            </Button>
          )}
          <Button
            type="primary"
            size="small"
            icon={<DownloadOutlined />}
            onClick={async () => {
              notification.destroy(key);
              dispatch(setDownloading(true));
              await window.electronAPI.update.download();
            }}
          >
            Download Now
          </Button>
          <Button
            type="text"
            size="small"
            icon={<CloseOutlined />}
            onClick={() => {
              notification.destroy(key);
            }}
          >
            Dismiss
          </Button>
        </Space>
      ),
    });
  };

  /**
   * Show notification when update is downloaded and ready to install
   */
  const showReadyToInstallNotification = (info: any) => {
    const key = `update-ready-${Date.now()}`;

    notification.success({
      key,
      message: 'Update Downloaded',
      description: `Version ${info.version} is ready to install. The application will restart.`,
      placement: 'topRight',
      duration: 0, // Don't auto-dismiss
      btn: (
        <Space>
          <Button
            type="default"
            size="small"
            onClick={() => {
              notification.destroy(key);
            }}
          >
            Install Later
          </Button>
          <Button
            type="primary"
            size="small"
            onClick={async () => {
              notification.destroy(key);
              await window.electronAPI.update.install();
            }}
          >
            Install & Restart
          </Button>
        </Space>
      ),
    });
  };

  // This component doesn't render anything visible
  // It only manages notifications
  return null;
};

export default UpdateNotification;
