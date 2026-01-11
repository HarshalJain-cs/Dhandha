import React from 'react';
import { Card as AntCard, CardProps as AntCardProps } from 'antd';

interface CardProps extends AntCardProps {
  hover?: boolean;
}

const Card: React.FC<CardProps> = ({ hover = false, className = '', ...props }) => {
  return (
    <AntCard
      className={`
        ${hover ? 'hover:shadow-lg transition-shadow cursor-pointer' : ''}
        ${className}
      `}
      {...props}
    />
  );
};

export default Card;
