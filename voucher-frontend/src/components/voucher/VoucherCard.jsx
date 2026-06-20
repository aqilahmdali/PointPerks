import React from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { useNavigate } from 'react-router-dom';
import { formatDiscount, formatDate, categoryColors, categoryIcons, daysRemaining } from '../../utils/helpers';

const VoucherCard = ({ voucher }) => {
  const navigate = useNavigate();
  const days = daysRemaining(voucher.expiryDate);

  const header = (
    <div style={{
      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      padding: '1.5rem', textAlign: 'center', borderRadius: '8px 8px 0 0',
    }}>
      {voucher.merchantLogo ? (
        <img src={voucher.merchantLogo} alt={voucher.merchant}
          style={{ height: '40px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
          onError={(e) => { e.target.style.display = 'none'; }} />
      ) : (
        <i className={categoryIcons[voucher.category]} style={{ fontSize: '2rem', color: '#fff' }} />
      )}
      <div style={{
        fontSize: '2rem', fontWeight: 'bold', color: '#fff', marginTop: '0.5rem',
      }}>
        {formatDiscount(voucher.discountType, voucher.discountValue)}
      </div>
    </div>
  );

  return (
    <Card header={header} style={{ borderRadius: '8px', overflow: 'hidden', height: '100%' }}
      className="shadow-2 hover:shadow-4 transition-all transition-duration-200">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

        {/* Title & Merchant */}
        <div>
          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>{voucher.title}</h4>
          <p style={{ margin: '0.2rem 0 0', color: '#6c757d', fontSize: '0.85rem' }}>
            <i className="pi pi-building" style={{ marginRight: '0.3rem' }} />
            {voucher.merchant}
          </p>
        </div>

        {/* Category & Featured */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Tag value={voucher.category} severity={categoryColors[voucher.category]} />
          {voucher.isFeatured && <Tag value="Featured" severity="warning" icon="pi pi-star" />}
          {days <= 7 && <Tag value={`${days}d left`} severity="danger" icon="pi pi-clock" />}
        </div>

        {/* Points Cost */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.85rem', color: '#6c757d' }}>
            <i className="pi pi-star" style={{ color: '#f59e0b', marginRight: '0.3rem' }} />
            {voucher.pointsCost > 0 ? `${voucher.pointsCost} pts` : 'Free'}
          </span>
          {voucher.totalLimit && (
            <span style={{ fontSize: '0.8rem', color: '#6c757d' }}>
              {voucher.remainingCount} left
            </span>
          )}
        </div>

        {/* Expiry */}
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#9ca3af' }}>
          <i className="pi pi-calendar" style={{ marginRight: '0.3rem' }} />
          Expires: {formatDate(voucher.expiryDate)}
        </p>

        {/* Action Button */}
        <Button
          label="View Details"
          icon="pi pi-arrow-right"
          iconPos="right"
          className="p-button-sm"
          style={{ marginTop: 'auto' }}
          onClick={() => navigate(`/vouchers/${voucher._id}`)}
        />
      </div>
    </Card>
  );
};

export default VoucherCard;
