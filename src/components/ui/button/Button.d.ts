import type { MouseEventHandler, ReactNode } from "react";

export interface ButtonProps {
  children: ReactNode;
  size?: string;
  variant?: string;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
  disabled?: boolean;
}

declare const Button: (props: ButtonProps) => JSX.Element;

export default Button;
