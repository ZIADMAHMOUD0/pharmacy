import React, { useState } from 'react';

const Image = ({ 
  src, 
  alt, 
  className = '', 
  fallbackSrc = '/api/placeholder/300/300',
  onError,
  ...props 
}) => {
  const [imageSrc, setImageSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleError = (e) => {
    if (!hasError) {
      setHasError(true);
      setImageSrc(fallbackSrc);
      setIsLoading(false);
      if (onError) onError(e);
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  // Generate a placeholder based on the alt text or use a default
  const getPlaceholder = () => {
    if (alt) {
      // Create a simple colored placeholder with first letter
      const firstLetter = alt.charAt(0).toUpperCase();
      const colors = [
        'bg-blue-500', 'bg-green-500', 'bg-purple-500', 
        'bg-pink-500', 'bg-yellow-500', 'bg-indigo-500'
      ];
      const colorIndex = alt.length % colors.length;
      return (
        <div className={`${colors[colorIndex]} flex items-center justify-center text-white text-4xl font-bold ${className}`}>
          {firstLetter}
        </div>
      );
    }
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
      </div>
    );
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}
      {hasError && !imageSrc ? (
        getPlaceholder()
      ) : (
        <img
          src={imageSrc || fallbackSrc}
          alt={alt}
          className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          onError={handleError}
          onLoad={handleLoad}
          {...props}
        />
      )}
    </div>
  );
};

export default Image;






