// components/SubModule.tsx
import React from 'react';

type SubModuleProps = {
  subModule: string;
  activeSubModule: string;
  onClick: (subModule: string) => void;
};

const SubModule: React.FC<SubModuleProps> = ({ subModule, activeSubModule, onClick }) => {
  return (
    <div
      className={`subModuleItem ${activeSubModule === subModule ? 'active' : ''}`}
      onClick={() => onClick(subModule)}
    >
      {subModule}
    </div>
  );
};

export default SubModule;
