import React, { useState, useEffect } from "react";

type Props = {
  value: number;
  onChange: (newValue: number) => void;
};

export const CurrencyCellInput: React.FC<Props> = ({ value, onChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value.toString());

  // Keep draft in sync when value changes externally
  useEffect(() => {
    if (!isEditing) {
      setDraft(value.toString());
    }
  }, [value, isEditing]);

  const handleFocus = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    const parsed = parseFloat(draft);
    if (!isNaN(parsed)) {
      onChange(parsed);
    } else {
      setDraft(value.toString()); // Revert to last valid
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDraft(e.target.value);
  };

  const formatCurrency = (num: number) =>
    new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);

  return (
    <input
      type="text"
      value={isEditing ? draft : formatCurrency(value)}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className="border p-1 w-full text-right"
    />
  );
};
