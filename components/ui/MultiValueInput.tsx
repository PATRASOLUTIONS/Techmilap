"use client";

import React, { useState, useRef, KeyboardEvent, useEffect } from "react";

interface MultiValueInputProps {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

export default function MultiValueInput({ values, onChange, placeholder }: MultiValueInputProps) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addValue = (value: string) => {
    const trimmedValue = value.trim();
    if (trimmedValue && !values.includes(trimmedValue)) {
      onChange([...values, trimmedValue]);
    }
  };

  const removeValue = (value: string) => {
    onChange(values.filter((v) => v !== value));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === " " || e.key === ",") {
      e.preventDefault();
      if (inputValue) {
        addValue(inputValue);
        setInputValue("");
      }
    } else if (e.key === "Backspace" && !inputValue && values.length > 0) {
      // Remove last value on backspace if input is empty
      removeValue(values[values.length - 1]);
    }
  };

  useEffect(() => {
    // Optional: focus input on mount
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-2 border rounded-md px-2 py-1 min-h-[40px]">
      {values.map((value) => (
        <div key={value} className="flex items-center bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm">
          <span>{value}</span>
          <button
            type="button"
            onClick={() => removeValue(value)}
            className="ml-2 text-blue-600 hover:text-blue-900 focus:outline-none"
            aria-label={`Remove ${value}`}
          >
            &times;
          </button>
        </div>
      ))}
      <input
        ref={inputRef}
        type="text"
        className="flex-grow min-w-[120px] border-none focus:ring-0 focus:outline-none text-sm"
        placeholder={placeholder}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}
