import { FC } from "react";

interface Props {
  value: number;
  outerStroke: string;
  innerStroke: string;
  size?: number;
}

export const CircularProgress: FC<Props> = ({ value, outerStroke, innerStroke, size = 130 }) => {
  const radius = size / 2 - 6;
  const circumference = 2 * Math.PI * radius;
  const percentage = (value / 10) * 100;
  const length = (percentage / 100) * circumference;
  const center = size / 2;

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <div className="absolute inset-0 flex items-center justify-center">
        <svg width={size} height={size}>
          <circle cx={center} cy={center} r={radius} fill="none" stroke={outerStroke} strokeWidth="4" />
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={innerStroke}
            strokeWidth="8"
            strokeDasharray={`${length} ${circumference}`}
            transform={`rotate(-90 ${center} ${center})`}
          />
        </svg>
      </div>
      <div
        style={{ color: outerStroke }}
        className="absolute inset-0 flex items-center justify-center text-xl pt-1.5 font-bold"
      >
        {value}
      </div>
    </div>
  );
};
