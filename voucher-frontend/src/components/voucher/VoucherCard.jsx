import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDiscount, formatDate, categoryIcons, daysRemaining } from '../../utils/helpers';

const VoucherCard = ({ voucher }) => {
  const navigate = useNavigate();
  const days = daysRemaining(voucher.expiryDate);

  // Theme colors matching the provided style
  const C = {
    primary: '#022448',
    primaryContainer: '#1e3a5f',
    brandGold: '#ffc641'
  };

  return (
    <div 
      onClick={() => navigate(`/vouchers/${voucher._id}`)} 
      style={{ 
        height: '100%',
        background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryContainer} 100%)`, 
        borderRadius: 16, 
        padding: 24, 
        color: '#fff', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'space-between', 
        cursor: 'pointer', 
        position: 'relative', 
        overflow: 'hidden',
        boxShadow: '0px 8px 24px rgba(2, 36, 72, 0.15)',
        transition: 'transform 300ms ease, box-shadow 300ms ease'
      }}
      className="pp-voucher-card hover:-translate-y-1"
    >
      {/* Decorative blurred circle */}
      <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(40px)' }} />
      
      {/* Top Section: Title, Merchant & Discount */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 10 }}>
        <div style={{ paddingRight: '1rem' }}>
          <h5 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 18, fontWeight: 600, margin: '0 0 4px', lineHeight: 1.3 }}>
            {voucher.title}
          </h5>
          <p style={{ margin: 0, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.7, fontWeight: 700 }}>
            {voucher.merchant}
          </p>
          
          {/* Category & Expiry Tags */}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ background: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: 999, fontSize: 11, textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <i className={categoryIcons[voucher.category]} style={{ fontSize: '10px' }} />
              {voucher.category}
            </span>
            {days <= 7 && (
              <span style={{ background: 'rgba(255, 80, 80, 0.4)', padding: '2px 8px', borderRadius: 999, fontSize: 11, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <i className="pi pi-clock" style={{ fontSize: '10px' }} />
                {days}d left
              </span>
            )}
          </div>
        </div>
        
        <div style={{ background: C.brandGold, color: '#fff', padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
          {formatDiscount(voucher.discountType, voucher.discountValue)}
        </div>
      </div>

      {/* Bottom Section: Dashed Separator, Points & Button */}
      <div style={{ borderTop: '1px dashed rgba(255,255,255,0.3)', paddingTop: 16, position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ margin: 0, fontSize: 12, opacity: 0.7 }}>
            {voucher.totalLimit ? `${voucher.remainingCount} left · ` : ''}Expires {formatDate(voucher.expiryDate)}
          </p>
          <p style={{ fontFamily: "'Poppins', sans-serif", margin: 0, fontSize: 20, fontWeight: 700 }}>
            {voucher.pointsCost > 0 ? `${voucher.pointsCost} pts` : 'Free'}
          </p>
        </div>
        <button 
          style={{ background: '#fff', color: C.primary, border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
          onClick={(e) => { 
            e.stopPropagation(); // Prevents double firing of the parent div's onClick
            navigate(`/vouchers/${voucher._id}`); 
          }}
        >
          View Details
        </button>
      </div>
    </div>
  );
};

export default VoucherCard;
