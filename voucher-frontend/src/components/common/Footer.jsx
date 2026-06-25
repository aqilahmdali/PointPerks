import React from 'react';
import { Link } from 'react-router-dom';

/* ── Design tokens ───────────────────────────────────────────────── */
const C = {
  surfaceContainerHighest: '#e2e2e2',
  outlineVariant: '#c4c6cf',
  onSurfaceVariant: '#43474e',
};

const FOOTER_LINKS = [
  { label: 'Privacy Policy', to: '/privacy' },
  { label: 'Terms of Service', to: '/terms' },
  { label: 'Compliance', to: '/compliance' },
  { label: 'Contact', to: '/contact' },
];

/**
 * Footer
 *
 * Props:
 *   links  – optional array of { label: string, to?: string, href?: string }
 *            overrides the default nav links
 */
const Footer = ({ links = FOOTER_LINKS }) => {
  return (
    <>
      <footer
        style={{
          width: '100%',
          marginTop: 'auto',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '24px 24px',
          background: C.surfaceContainerHighest,
          borderTop: `1px solid ${C.outlineVariant}`,
          gap: 16,
          boxSizing: 'border-box',
        }}
        className="pp-footer"
      >
        <p
          className="pp-footer__copy"
          style={{ fontSize: 12, color: C.onSurfaceVariant, margin: 0 }}
        >
          © {new Date().getFullYear()} PointPerks Institutional. All rights reserved.
        </p>

        <nav
          style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 24 }}
          aria-label="Footer navigation"
        >
          {links.map(({ label, to, href }) =>
            to ? (
              <Link
                key={label}
                to={to}
                style={{
                  fontSize: 12,
                  color: C.onSurfaceVariant,
                  textDecoration: 'none',
                  transition: 'color 0.15s',
                }}
                className="pp-footer__link"
              >
                {label}
              </Link>
            ) : (
              <a
                key={label}
                href={href || '#'}
                style={{
                  fontSize: 12,
                  color: C.onSurfaceVariant,
                  textDecoration: 'none',
                  transition: 'color 0.15s',
                }}
                className="pp-footer__link"
              >
                {label}
              </a>
            )
          )}
        </nav>
      </footer>

      <style>{`
        @media (max-width: 768px) {
          .pp-footer {
            flex-direction: column !important;
            text-align: center !important;
          }
          .pp-footer__copy {
            text-align: center !important;
          }
          .pp-footer nav {
            justify-content: center !important;
          }
        }
        .pp-footer__link:hover {
          color: #022448 !important;
        }
      `}</style>
    </>
  );
};

export default Footer;