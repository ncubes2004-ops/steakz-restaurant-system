import React from 'react';

type Props = {
  className?: string;
};

export default function Flame({ className }: Props) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <g className="flame-group">
        <path className="flame-base" d="M32 60c10-6 18-14 18-26 0-9-7-17-12-22-3 6-9 10-9 18 0 8-7 10-7 22 0 6 3 8 10 8z" />
        <path className="flame-mid" d="M32 46c6-4 10-8 10-14 0-5-4-9-6-11-2 3-5 5-5 9 0 4-4 6-4 12 0 3 2 4 5 4z" />
        <path className="flame-core" d="M32 36c3-2 5-4 5-7 0-2-2-3-3-4-1 1-2 2-2 4 0 2-2 3-2 6 0 1 1 1 2 1z" />
      </g>
    </svg>
  );
}
