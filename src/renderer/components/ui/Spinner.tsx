import React from 'react';
import { Spin, SpinProps } from 'antd';

const Spinner: React.FC<SpinProps> = (props) => {
  return <Spin {...props} />;
};

export default Spinner;
