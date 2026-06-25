import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { redemptionAPI } from '../../services/api';
import { formatDate, formatDiscount, downloadPDF } from '../../utils/helpers';
import { UserBreadcrumb } from '../../components/layout/UserPageChrome';

/* ── Design tokens ─────────────────────────────────────────────── */
const C = {
  primary: '#022448',
  primaryContainer: '#1e3a5f',
  brandGold: '#D4A017',
  secondary: '#795900',
  secondaryContainer: '#ffc641',
  secondaryFixedDim: '#f6be39',
  surface: '#f9f9f8',
  surfaceLow: '#f4f4f3',
  surfaceContainer: '#eeeeed',
  surfaceHigh: '#e8e8e7',
  surfaceHighest: '#e2e2e2',
  surfaceLowest: '#ffffff',
  onSurface: '#1a1c1c',
  onSurfaceVariant: '#43474e',
  outline: '#74777f',
  outlineVariant: '#c4c6cf',
  onPrimary: '#ffffff',
  primaryFixedDim: '#adc8f5',
  error: '#ba1a1a',
  success: '#386a20',
  successBg: '#c4f0c4',
  onSecondaryContainer: '#715300',
};

const PDFVoucherPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [redemption, setRedemption] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    redemptionAPI.getOne(id)
      .then((res) => setRedemption(res.data.redemption))
      .catch(() => toast.error('Redemption not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const getPdfFilename = () => `voucher-${redemption?.redemptionCode || id}.pdf`;

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const res = await redemptionAPI.downloadPDF(id);
      const pdfBlob = res.data instanceof Blob
        ? res.data
        : new Blob([res.data], { type: 'application/pdf' });
      downloadPDF(pdfBlob, getPdfFilename());
      toast.success('PDF downloaded successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate PDF');
    } finally {
      setDownloading(false);
    }
  };

  const ms = (size = 24, fill = 0) => ({
    fontFamily: "'Material Symbols Outlined'",
    fontSize: size,
    fontVariationSettings: `"FILL" ${fill}, "wght" 400, "GRAD" 0, "opsz" 24`,
    lineHeight: 1,
    display: 'inline-block',
    verticalAlign: 'middle',
  });

  const getStatusStyle = (status) => {
    switch (status) {
      case 'active':
        return { bg: C.successBg, color: C.success, label: 'Active' };
      case 'used':
        return { bg: C.surfaceHighest, color: C.onSurfaceVariant, label: 'Used' };
      case 'cancelled':
      case 'expired':
        return { bg: '#ffdad6', color: C.error, label: status.charAt(0).toUpperCase() + status.slice(1) };
      default:
        return { bg: C.surfaceHighest, color: C.onSurfaceVariant, label: status };
    }
  };

  /* ── Skeleton loader ─────────────────────────────────────────── */
  if (loading) {
    return (
      <div style={{ background: C.surfaceLow, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Inter', sans-serif" }}>
        <div style={{ width: '100%', maxWidth: 820, background: C.surfaceLowest, borderRadius: 16, overflow: 'hidden', display: 'flex', boxShadow: '0px 12px 40px rgba(30,58,95,0.08)' }}>
          <div style={{ width: '33.33%', background: C.primaryContainer, minHeight: 480 }} className="pp-skeleton-pulse" />
          <div style={{ width: '66.66%', padding: 36 }}>
            <div style={{ height: 20, background: C.surfaceContainer, width: '35%', marginBottom: 20, borderRadius: 6 }} className="pp-skeleton-pulse" />
            <div style={{ height: 20, background: C.surfaceContainer, width: '25%', marginLeft: 'auto', borderRadius: 6 }} className="pp-skeleton-pulse" />
            <div style={{ height: 200, background: C.surfaceContainer, width: 200, margin: '28px auto', borderRadius: 12 }} className="pp-skeleton-pulse" />
            <div style={{ height: 1, width: '100%', margin: '16px 0 28px', background: C.surfaceContainer }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ height: 130, background: C.surfaceContainer, borderRadius: 10 }} className="pp-skeleton-pulse" />
              <div style={{ height: 130, background: C.surfaceContainer, borderRadius: 10 }} className="pp-skeleton-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!redemption) return null;

  const v = redemption.voucherSnapshot || {};
  const statusInfo = getStatusStyle(redemption.status);

  return (
    <div style={{ 
      background: C.surfaceLow, 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      padding: '48px 24px', 
      fontFamily: "'Inter', sans-serif", 
      color: C.onSurface, 
    }}>

      {/* ═══ Top Action Row: Breadcrumb & Buttons ═══ */}
      <div className="pp-no-print" style={{ 
        width: '100%', 
        maxWidth: 820, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 28,
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <UserBreadcrumb
          compact
          items={[
            { label: 'My Redemptions', path: '/my-redemptions' },
            { label: redemption.redemptionCode || 'Voucher' },
          ]}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Back Button */}
          <button
            onClick={() => navigate('/my-redemptions')}
            className="pp-btn-ghost"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              background: 'transparent',
              color: C.onSurfaceVariant,
              borderRadius: 10,
              border: `1px solid ${C.outlineVariant}`,
              cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
              fontWeight: 500,
              fontSize: 13,
              transition: 'all 0.2s ease',
            }}
          >
            <span style={ms(18)}>arrow_back</span>
            <span>Back</span>
          </button>

          {/* Download PDF Button */}
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="pp-btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 20px',
              background: downloading ? C.primaryContainer : C.primary,
              color: C.onPrimary,
              borderRadius: 10,
              border: 'none',
              cursor: downloading ? 'wait' : 'pointer',
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              fontSize: 13,
              transition: 'all 0.2s ease',
              boxShadow: '0px 2px 8px rgba(2, 36, 72, 0.15)',
              opacity: downloading ? 0.8 : 1,
            }}
          >
            {downloading ? (
              <>
                <span className="pp-spinner" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block' }} />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <span style={ms(18, 1)}>picture_as_pdf</span>
                <span>Download PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ═══ Main Voucher Document ═══ */}
      <main
        className="pp-voucher-container"
        style={{
          width: '100%',
          maxWidth: 820,
          background: C.surfaceLowest,
          boxShadow: '0px 16px 48px rgba(30,58,95,0.10)',
          borderRadius: 16,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'row',
          position: 'relative',
        }}
      >
        {/* ── Perforation overlay decoration ── */}
        <div className="pp-perforation-line" style={{
          display: 'none',
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: '33.33%',
          width: 0,
          borderLeft: `2px dashed ${C.outlineVariant}`,
          zIndex: 0,
          pointerEvents: 'none',
        }} />

        {/* ═══ Left Side: Brand & Visuals ═══ */}
        <div
          className="pp-stub"
          style={{
            width: '33.33%',
            background: `linear-gradient(180deg, ${C.primary} 0%, ${C.primaryContainer} 100%)`,
            padding: 36,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            color: C.onPrimary,
            textAlign: 'center',
            zIndex: 1,
          }}
        >
          {/* Brand header */}
          <div style={{ width: '100%', textAlign: 'center' }}>
            <span style={{ 
              fontFamily: "'Poppins', sans-serif", 
              fontSize: 18, 
              fontWeight: 700, 
              color: '#fff',
              letterSpacing: '0.02em',
            }}>
              PointPerks
            </span>
          </div>

          {/* Merchant visual */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            width: '100%',
            margin: '32px 0',
          }}>
            <div style={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: '#fff',
              padding: 12,
              boxShadow: '0px 8px 32px rgba(0,0,0,0.2)',
              border: `3px solid ${C.secondaryContainer}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}>
              {v.image ? (
                <img src={v.image} alt="Merchant" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <span style={{ ...ms(48, 1), color: C.primary }}>storefront</span>
              )}
            </div>

            <h2 style={{
              marginTop: 20,
              fontFamily: "'Poppins', sans-serif",
              fontSize: 22,
              fontWeight: 600,
              color: '#fff',
              lineHeight: 1.3,
              textAlign: 'center',
            }}>
              {v.merchant || 'Merchant'}
            </h2>

            <div style={{
              marginTop: 12,
              background: C.secondaryContainer,
              color: C.onSecondaryContainer,
              padding: '6px 16px',
              borderRadius: 999,
              fontFamily: "'Inter', sans-serif",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.02em',
            }}>
              {formatDiscount(v.discountType, v.discountValue)}
            </div>
          </div>

          {/* Footer details */}
          <div style={{ textAlign: 'center' }}>
            <p style={{ 
              fontSize: 12, 
              color: 'rgba(255,255,255,0.7)', 
              fontWeight: 500 
            }}>
              Issued: {formatDate(redemption.createdAt)}
            </p>
            <div style={{ 
              marginTop: 20, 
              opacity: 0.4,
              display: 'flex',
              justifyContent: 'center',
            }}>
              <span style={ms(40, 1)}>verified</span>
            </div>
          </div>

          {/* Visual "Cut" circle */}
          <div className="pp-cutout-right" style={{
            display: 'none',
            position: 'absolute',
            top: '50%',
            right: -16,
            transform: 'translateY(-50%)',
            width: 32,
            height: 32,
            background: C.surfaceLow,
            borderRadius: '50%',
          }} />
        </div>

        {/* ═══ Right Side: Content & Validation ═══ */}
        <div
          className="pp-value-side"
          style={{
            width: '66.66%',
            padding: 36,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderLeft: `2px dashed ${C.outlineVariant}`,
            zIndex: 1,
          }}
        >
          {/* ── Header row: Voucher Number | Expires ── */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start', 
            marginBottom: 28,
            flexWrap: 'wrap',
            gap: 16,
          }}>
            <div>
              <h3 style={{
                fontSize: 11,
                color: C.outline,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontWeight: 600,
                margin: '0 0 6px',
                fontFamily: "'Inter', sans-serif",
              }}>
                Voucher Number
              </h3>
              <div style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: 26,
                fontWeight: 700,
                color: C.primary,
                letterSpacing: '0.08em',
              }}>
                {redemption.redemptionCode}
              </div>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                marginTop: 8,
                background: statusInfo.bg,
                color: statusInfo.color,
                padding: '3px 10px',
                borderRadius: 6,
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}>
                <span style={{ 
                  width: 6, 
                  height: 6, 
                  borderRadius: '50%', 
                  background: statusInfo.color,
                  display: 'inline-block',
                }} />
                {statusInfo.label}
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h3 style={{
                fontSize: 11,
                color: C.outline,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontWeight: 600,
                margin: '0 0 6px',
                fontFamily: "'Inter', sans-serif",
              }}>
                Expires
              </h3>
              <div style={{
                fontSize: 14,
                color: C.error,
                fontWeight: 700,
                fontFamily: "'Inter', sans-serif",
              }}>
                {formatDate(redemption.expiresAt).toUpperCase()}
              </div>
            </div>
          </div>

          {/* ── QR Section ── */}
          <div
            className="pp-qr-section"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 28,
              background: C.surfaceLow,
              borderRadius: 12,
              border: `1px solid ${C.outlineVariant}`,
              marginBottom: 28,
            }}
          >
            <div style={{
              width: 180,
              height: 180,
              padding: 12,
              background: '#fff',
              border: `2px solid ${C.primary}`,
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {redemption.qrCodeData ? (
                <img
                  src={redemption.qrCodeData}
                  alt="QR Code"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              ) : (
                <div
                  className="pp-qr-placeholder"
                  style={{
                    width: '100%',
                    height: '100%',
                    opacity: 0.6,
                    backgroundImage: 'radial-gradient(#022448 1.5px, transparent 1.5px)',
                    backgroundSize: '8px 8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  <div style={{ 
                    background: '#fff', 
                    padding: 12, 
                    borderRadius: 8, 
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
                    zIndex: 1 
                  }}>
                    <span style={{ ...ms(36, 1), color: C.primary }}>qr_code_2</span>
                  </div>
                </div>
              )}
            </div>
            <p style={{
              marginTop: 16,
              fontSize: 12,
              color: C.outline,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              <span style={ms(16, 0)}>qr_code_scanner</span>
              Scan at checkout point-of-sale
            </p>
          </div>

          {/* ── Dashed Separator ── */}
          <div
            style={{
              height: 1,
              width: '100%',
              backgroundImage: `linear-gradient(to right, ${C.outlineVariant} 50%, transparent 50%)`,
              backgroundSize: '12px 1px',
              backgroundRepeat: 'repeat-x',
              margin: '0 0 24px',
            }}
          />

          {/* ── Instructions Grid ── */}
          <div className="pp-bento-grid" style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: 16,
            flex: 1,
          }}>
            {/* How to Use */}
            <div style={{ 
              padding: 20, 
              borderRadius: 12, 
              background: C.surfaceLow, 
              border: `1px solid ${C.surfaceHighest}`,
              display: 'flex',
              flexDirection: 'column',
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8, 
                marginBottom: 12, 
                color: C.primary 
              }}>
                <span style={ms(18, 1)}>info</span>
                <h4 style={{ 
                  fontSize: 11, 
                  fontWeight: 700, 
                  textTransform: 'uppercase', 
                  margin: 0, 
                  letterSpacing: '0.08em' 
                }}>
                  How to Use
                </h4>
              </div>
              <ul style={{ 
                fontSize: 12, 
                color: C.onSurfaceVariant, 
                paddingLeft: 18, 
                margin: 0, 
                lineHeight: 1.8,
                flex: 1,
              }}>
                <li>Present this voucher at any participating location.</li>
                <li>Ask the cashier to scan the QR code.</li>
                <li>Valid for in-store purchases only.</li>
              </ul>
            </div>

            {/* Terms */}
            <div style={{ 
              padding: 20, 
              borderRadius: 12, 
              background: C.surfaceLow, 
              border: `1px solid ${C.surfaceHighest}`,
              display: 'flex',
              flexDirection: 'column',
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8, 
                marginBottom: 12, 
                color: C.primary 
              }}>
                <span style={ms(18, 1)}>gavel</span>
                <h4 style={{ 
                  fontSize: 11, 
                  fontWeight: 700, 
                  textTransform: 'uppercase', 
                  margin: 0, 
                  letterSpacing: '0.08em' 
                }}>
                  Terms & Conditions
                </h4>
              </div>
              <p style={{ 
                fontSize: 12, 
                color: C.onSurfaceVariant, 
                lineHeight: 1.8, 
                margin: 0,
                flex: 1,
              }}>
                Non-refundable and cannot be exchanged for cash. Single use only. PointPerks is not responsible for lost or stolen codes.
              </p>
            </div>
          </div>

          {/* ── Footer ── */}
          <div style={{
            marginTop: 24,
            paddingTop: 20,
            borderTop: `1px solid ${C.outlineVariant}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
          }}>
            <div>
              <p style={{ 
                fontSize: 10, 
                color: C.outline, 
                marginBottom: 4,
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}>
                Verification Hash
              </p>
              <code style={{ 
                fontSize: 10, 
                color: C.outlineVariant, 
                fontFamily: "'Courier New', monospace" 
              }}>
                SHA256: {redemption._id?.slice(0, 8)}...{redemption._id?.slice(-5)}
              </code>
            </div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8 
            }}>
              <span style={{ 
                fontSize: 11, 
                color: C.outline 
              }}>
                Powered by
              </span>
              <span style={{ 
                fontFamily: "'Poppins', sans-serif", 
                fontSize: 14, 
                fontWeight: 700, 
                color: C.primary 
              }}>
                PointPerks
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* ═══ Embedded Styles ═══ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

        /* ── Skeleton pulse ── */
        .pp-skeleton-pulse {
          animation: pp-pulse 1.5s infinite ease-in-out;
        }
        @keyframes pp-pulse {
          0%   { opacity: 0.5; }
          50%  { opacity: 0.8; }
          100% { opacity: 0.5; }
        }

        /* ── Spinner animation ── */
        .pp-spinner {
          animation: pp-spin 0.8s linear infinite;
        }
        @keyframes pp-spin {
          to { transform: rotate(360deg); }
        }

        /* ── Button hover states ── */
        .pp-btn-ghost:hover {
          background: ${C.surfaceContainer} !important;
          border-color: ${C.outline} !important;
          color: ${C.onSurface} !important;
        }
        .pp-btn-primary:hover {
          background: ${C.primaryContainer} !important;
          box-shadow: 0px 4px 12px rgba(2, 36, 72, 0.2) !important;
          transform: translateY(-1px);
        }
        .pp-btn-primary:active {
          transform: translateY(0) !important;
          box-shadow: 0px 2px 6px rgba(2, 36, 72, 0.15) !important;
        }
        .pp-btn-primary:disabled {
          cursor: wait !important;
        }

        /* ── QR section hover ── */
        .pp-qr-section {
          transition: all 0.2s ease;
        }
        .pp-qr-section:hover {
          background: ${C.surfaceContainer} !important;
          border-color: ${C.outline} !important;
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .pp-voucher-container {
            flex-direction: column !important;
          }
          .pp-stub {
            width: 100% !important;
            padding: 28px !important;
          }
          .pp-value-side {
            width: 100% !important;
            border-left: none !important;
            border-top: 2px dashed ${C.outlineVariant} !important;
            padding: 28px !important;
          }
          .pp-cutout-right,
          .pp-perforation-line {
            display: none !important;
          }
          .pp-bento-grid {
            grid-template-columns: 1fr !important;
          }
          
          /* Mobile top row wraps cleanly */
          .pp-no-print {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
        }

        /* ── Show perforation & cutout only on MD+ ── */
        @media (min-width: 769px) {
          .pp-perforation-line { display: block !important; }
          .pp-cutout-right     { display: block !important; }
        }

        /* ── Print styles ── */
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm;
          }

          html, body {
            width: 100% !important;
            min-height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .pp-no-print { display: none !important; }
          
          .pp-voucher-container {
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            page-break-inside: avoid !important;
          }

          .pp-stub { 
            background: ${C.primaryContainer} !important; 
          }
          .pp-value-side { 
            background: ${C.surfaceLowest} !important; 
          }

          .pp-perforation-line,
          .pp-cutout-right {
            display: block !important;
          }

          .pp-voucher-container * {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PDFVoucherPage;