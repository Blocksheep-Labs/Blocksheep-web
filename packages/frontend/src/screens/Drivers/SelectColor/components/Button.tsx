import { FC } from "react";

type ButtonProps = {
  text: string;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
};

const Button: FC<ButtonProps> = ({ text, className = "", onClick, disabled = false }) => {
  return (
    <div
      className={`h-10 w-1/2 mx-auto pt-1.5 flex items-center justify-center text-xl text-white rounded-lg shadow-lg ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      } ${className}`}
      style={{
        background: disabled
          ? "gray"
          : "linear-gradient(90deg, rgba(81,112,218,1) 0%, rgba(42,63,134,1) 100%)",
      }}
      onClick={!disabled ? onClick : undefined}
    >
      {text}
    </div>
  );
};

export default Button;
