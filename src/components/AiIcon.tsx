interface AiIconProps {
  className?: string;
}

const AiIcon = ({ className = "h-8 w-8" }: AiIconProps) => {
  return (
    <img 
      src="/Ai.svg" 
      alt="AI" 
      className={className}
    />
  );
};

export default AiIcon;
