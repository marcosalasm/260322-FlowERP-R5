import React, { useContext, useState, useEffect } from 'react';
import { NAV_ITEMS } from '../../constants';
import { AppContext } from '../../context/AppContext';
import { usePermissions } from '../../hooks/usePermissions';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: any) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
  const appContext = useContext(AppContext);
  const { can } = usePermissions();
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  if (!appContext) {
    return null; // or a loading spinner
  }

  const { companyInfo } = appContext;

  const navItems = NAV_ITEMS.filter(item => {
    const { module, section } = item.permission;
    return can(module, section, 'view');
  });

  // Automatically expand the parent menu if the current view is a child
  // Fixed: Only run when currentView changes, using the constant NAV_ITEMS to find the parent
  // to avoid re-running on every render when navItems is recalculated.
  useEffect(() => {
    const parentItem = NAV_ITEMS.find(item => 
      item.subItems?.some(sub => sub.id === currentView)
    );
    if (parentItem) {
      setExpandedItem(parentItem.id);
    }
  }, [currentView]);

  const handleItemClick = (e: React.MouseEvent, item: typeof NAV_ITEMS[0]) => {
    e.preventDefault();
    if (item.subItems) {
      setExpandedItem(prev => prev === item.id ? null : item.id);
    } else {
      setCurrentView(item.id);
    }
  };

  return (
    <div className="w-64 bg-white shadow-md flex flex-col h-screen">
      <div className="flex items-center justify-center h-20 border-b border-light-gray px-4 flex-shrink-0">
        {companyInfo.logoBase64 ? (
          <img src={companyInfo.logoBase64} alt={`${companyInfo.name} Logo`} className="h-12 max-w-full object-contain" />
        ) : (
          <h1 className="text-2xl font-bold text-primary">FlowERP</h1>
        )}
      </div>
      <nav className="flex-1 px-4 py-6 overflow-y-auto">
        <ul>
          {navItems.map((item) => {
            // Check if this item is currently active (either direct ID match or it's the parent of the current view)
            const isActive = currentView === item.id || (item.subItems && item.subItems.some(sub => sub.id === currentView));
            const isExpanded = expandedItem === item.id;

            return (
              <li key={item.id} className="mb-1">
                <a
                  href="#"
                  onClick={(e) => handleItemClick(e, item)}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg transition-colors duration-200 ${
                    isActive
                      ? 'bg-blue-100 text-primary font-semibold'
                      : 'text-dark-gray hover:bg-light-gray'
                  }`}
                >
                  <div className="flex items-center">
                    <item.icon className="h-6 w-6 mr-3 flex-shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.subItems && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? 'transform rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </a>
                
                {/* Submenu */}
                {item.subItems && isExpanded && (
                  <ul className="mt-1 ml-4 border-l-2 border-slate-200 pl-2 space-y-1">
                    {item.subItems.map(subItem => (
                      <li key={subItem.id}>
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentView(subItem.id);
                          }}
                          className={`block px-4 py-2 text-sm rounded-md transition-colors duration-200 ${
                            currentView === subItem.id
                              ? 'text-primary font-semibold bg-blue-50'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                          }`}
                        >
                          {subItem.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="px-4 py-6 border-t border-light-gray flex-shrink-0">
        <p className="text-xs text-center text-medium-gray">&copy; 2024 FlowERP. Todos los derechos reservados.</p>
      </div>
    </div>
  );
};