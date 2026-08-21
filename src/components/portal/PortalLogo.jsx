import React from 'react';

export default function PortalLogo({ className = '' }) {
  return (
    <>
      <img
        src="/Logo.svg"
        alt="Piyam Travel Logo"
        className={`h-auto max-w-full dark:hidden ${className}`.trim()}
      />
      <img
        src="/Logo-dark.svg"
        alt="Piyam Travel Logo"
        className={`hidden h-auto max-w-full dark:block ${className}`.trim()}
      />
    </>
  );
}
