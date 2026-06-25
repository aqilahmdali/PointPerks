// Format date to readable string
export const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-MY', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
};

// Format discount display
export const formatDiscount = (type, value) => {
  if (type === 'percentage') return `${value}% OFF`;
  if (type === 'fixed') return `RM${value} OFF`;
  return `${value} OFF`;
};

// Format points
export const formatPoints = (points) => {
  return `${points?.toLocaleString() || 0} pts`;
};

// Check if voucher is expired
export const isExpired = (expiryDate) => {
  return new Date(expiryDate) < new Date();
};

// Days remaining until expiry
export const daysRemaining = (expiryDate) => {
  const diff = new Date(expiryDate) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

// Category color map for PrimeReact tags
export const categoryColors = {
  food: 'success',
  shopping: 'info',
  travel: 'warning',
  entertainment: 'danger',
  health: 'secondary',
};

// Category icons
export const categoryIcons = {
  food: 'pi pi-star',
  shopping: 'pi pi-shopping-bag',
  travel: 'pi pi-car',
  entertainment: 'pi pi-video',
  health: 'pi pi-heart',
};

// Download PDF blob from API response
export const downloadPDF = (blobData, filename) => {
  const pdfBlob = blobData instanceof Blob
    ? blobData
    : new Blob([blobData], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename || 'voucher.pdf');
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// Truncate long text
export const truncate = (text, maxLength = 100) => {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

// Get status severity for PrimeReact Tag
export const getStatusSeverity = (status) => {
  const map = {
    active: 'success',
    used: 'info',
    expired: 'warning',
    cancelled: 'danger',
  };
  return map[status] || 'secondary';
};
