// components/NavItem.tsx
import React from 'react';

type NavItemProps = {
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
};

const NavItem: React.FC<NavItemProps> = ({ label, icon, active, onClick }) => {
  return (
    <div
      className={`navBarItem ${active ? 'active' : ''}`}
      onClick={onClick}
    >
      <i className={`${icon} icon`} /> {label}
    </div>
  );
};

export default NavItem;
