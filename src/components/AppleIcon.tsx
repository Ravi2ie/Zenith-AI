const AppleIcon = ({ className = "h-8 w-8" }: { className?: string }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#FCD34D', stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: '#F59E0B', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#DC2626', stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#34D399', stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: '#0EA5E9', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#3B82F6', stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id="gradient3" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#DC2626', stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: '#BE123C', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#9F1239', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      
      {/* Apple shape split into colorful sections */}
      <ellipse cx="50" cy="55" rx="35" ry="38" fill="url(#gradient1)" transform="rotate(-30 50 55)" />
      <ellipse cx="50" cy="55" rx="35" ry="38" fill="url(#gradient2)" transform="rotate(30 50 55)" />
      <ellipse cx="50" cy="55" rx="35" ry="38" fill="url(#gradient3)" transform="rotate(90 50 55)" />
      
      {/* Leaf */}
      <path
        d="M 50 15 Q 52 10, 58 8 Q 54 12, 52 18 Z"
        fill="#9333EA"
        opacity="0.9"
      />
    </svg>
  );
};

export default AppleIcon;
