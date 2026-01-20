import React from 'react';
import { Card as AntCard, CardProps as AntCardProps } from 'antd';

interface CardProps extends AntCardProps {
  hover?: boolean;
  padding?: boolean;  // Control padding, defaults to true
}

const Card: React.FC<CardProps> = ({ hover = false, padding = true, className = '', ...props }) => {
  return (
    <AntCard
      className={`
        ${hover ? 'hover:shadow-lg transition-shadow cursor-pointer' : ''}
        ${!padding ? '[&_.ant-card-body]:p-0' : ''}
        ${className}
      `}
      {...props}
    />
  );
};

export default Card;
