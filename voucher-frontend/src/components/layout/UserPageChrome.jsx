import React from 'react';
import { useNavigate } from 'react-router-dom';

const C = {
  primary: '#022448',
  surfaceContainerLowest: '#ffffff',
  surfaceVariant: '#e2e2e2',
  outline: '#74777f',
  onSurfaceVariant: '#43474e',
};

const normalizeCrumbs = (items = []) => [
  { label: 'Dashboard', path: '/dashboard' },
  ...items,
];

export const UserBreadcrumb = ({ items = [], compact = false }) => {
  const navigate = useNavigate();
  const crumbs = normalizeCrumbs(items);

  return (
    <nav
      aria-label="Breadcrumb"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
        fontFamily: "'Inter', sans-serif",
        fontSize: compact ? 11 : 12,
        fontWeight: 700,
        color: C.onSurfaceVariant,
        marginBottom: compact ? 12 : 16,
      }}
    >
      {crumbs.map((item, index) => {
        const isLast = index === crumbs.length - 1;
        return (
          <React.Fragment key={`${item.label}-${index}`}>
            {index > 0 && (
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 16, color: C.outline, lineHeight: 1 }}
              >
                chevron_right
              </span>
            )}
            {item.path && !isLast ? (
              <button
                type="button"
                onClick={() => navigate(item.path)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  padding: 0,
                  margin: 0,
                  color: C.onSurfaceVariant,
                  cursor: 'pointer',
                  font: 'inherit',
                  textDecoration: 'none',
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = C.primary; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = C.onSurfaceVariant; }}
              >
                {item.label}
              </button>
            ) : (
              <span
                title={item.label}
                style={{
                  color: C.primary,
                  maxWidth: compact ? 180 : 280,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

const UserPageHeader = ({ title, subtitle, breadcrumbs = [], action = null, children = null }) => (
  <header
    style={{
      marginBottom: 32,
      padding: '20px 24px',
      background: C.surfaceContainerLowest,
      border: `1px solid ${C.surfaceVariant}`,
      borderRadius: 12,
      boxShadow: '0px 4px 20px rgba(30, 58, 95, 0.04)',
    }}
  >
    <UserBreadcrumb items={breadcrumbs} />
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20, flexWrap: 'wrap' }}>
      <div style={{ minWidth: 0 }}>
        <h1
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: 'clamp(26px, 3vw, 34px)',
            fontWeight: 700,
            color: C.primary,
            margin: 0,
            lineHeight: 1.15,
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: 14, color: C.onSurfaceVariant, margin: '6px 0 0', lineHeight: 1.5 }}>
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
    {children}
  </header>
);

export default UserPageHeader;
