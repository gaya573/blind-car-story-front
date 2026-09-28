import React from 'react';
import { Link } from 'react-router-dom';
import './Breadcrumb.css';

const Breadcrumb = ({ items = [] }) => {
  return (
    <nav className="breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const Element = item.link && !isLast ? Link : 'span';

        return (
          <React.Fragment key={index}>
            {index > 0 && (
              <span className="breadcrumb-separator">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path 
                    d="M6 4L10 8L6 12" 
                    stroke="#212121" 
                    strokeWidth="1.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    opacity="0.3"
                  />
                </svg>
              </span>
            )}
            
            <Element
              to={item.link || undefined}
              className={`breadcrumb-item${isLast ? ' active' : ''}`}
            >
              {item.label}
            </Element>
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumb;
