import React from 'react';
import { Badge as AntBadge, BadgeProps } from 'antd';

const Badge: React.FC<BadgeProps> = (props) => {
  return <AntBadge {...props} />;
};

export default Badge;
