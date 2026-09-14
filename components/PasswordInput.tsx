"use client";

import { InputHTMLAttributes, useState } from "react";
import { IconEye, IconEyeOff } from "./Icons";

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  ringClassName?: string;
};

export default function PasswordInput({
  className = "",
  ringClassName = "focus:ring-blue-500",
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        className={`w-full rounded-md border border-gray-300 pl-3 pr-10 py-2 focus:outline-none focus:ring-2 ${ringClassName} ${className}`}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
      >
        {visible ? <IconEyeOff /> : <IconEye />}
      </button>
    </div>
  );
}
