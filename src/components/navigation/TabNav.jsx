import React from 'react';
import { NavLink } from 'react-router-dom';
import './TabNav.css';

/**
 * 탭 네비게이션 컴포넌트
 * 국산차/수입차 같은 탭 전환 (URL 기반)
 */
const TabNav = ({ tabs }) => {
  return (
    <div className="tab-nav">
      {tabs.map((tab, index) => (
        <NavLink
          key={index}
          to={tab.path}
          className={({ isActive }) => `tab-nav-item ${isActive ? 'active' : ''}`}
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  );
};

export default TabNav;

