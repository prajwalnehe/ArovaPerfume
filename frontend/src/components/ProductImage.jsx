import React from 'react';

const FALLBACK_IMAGE = '/no-image.png';

const ProductImage = ({
  src,
  alt = 'Product image',
  className = '',
  fallbackSrc = FALLBACK_IMAGE,
  ...rest
}) => {
  const resolvedSrc = src && String(src).trim() ? String(src).trim() : fallbackSrc;

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      onError={(e) => {
        if (e.currentTarget.src.endsWith(fallbackSrc)) return;
        e.currentTarget.src = fallbackSrc;
      }}
      {...rest}
    />
  );
};

export default ProductImage;
