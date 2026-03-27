import React from 'react';
import { NavLink } from 'react-router-dom';
import { Map, MapPin, Trophy, Gift, User, Home as HomeIcon } from 'lucide-react';

const Navigation = () => {
  const links = [
    { to: '/', icon: <Map size={24} />, label: 'Карта' },
    { to: '/passport', icon: <MapPin size={24} />, label: 'Паспорт' },
    { to: '/capture', icon: <Trophy size={24} />, label: 'Захват' },
    { to: '/rewards', icon: <Gift size={24} />, label: 'Бонусы' },
    { to: '/profile', icon: <User size={24} />, label: 'Профиль' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border-soft px-4 py-3 z-50 flex justify-between items-center shadow-[0_-10px_40px_rgba(0,0,0,0.05)] md:top-0 md:bottom-auto md:border-t-0 md:border-b md:px-12">
      <div className="hidden md:flex items-center gap-2 mr-8">
        <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-white font-bold text-xl">
          Р
        </div>
        <span className="font-heading text-lg font-bold tracking-tight">Рязань.Гид</span>
      </div>

      <div className="flex justify-between w-full md:w-auto md:gap-8">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 transition-all duration-300 ${
                isActive ? 'text-accent scale-110' : 'text-text-muted hover:text-accent'
              }`
            }
          >
            {link.icon}
            <span className="text-[10px] uppercase font-bold tracking-wider md:text-sm md:normal-case">{link.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;
