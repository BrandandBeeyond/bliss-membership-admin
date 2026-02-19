import type { FC, ReactNode } from "react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  showCloseButton?: boolean;
  isFullscreen?: boolean;
}

export const Modal: FC<ModalProps>;
