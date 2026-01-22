"use client";

import React from 'react';
import SidebarContent from './SidebarContent';

const Sidebar = () => {
  return (
    <div className="w-64 border-r h-[calc(100vh-64px)] hidden md:flex flex-col p-4 bg-muted/20">
      <SidebarContent />
    </div>
  );
};

export default Sidebar;