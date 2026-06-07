'use client';

import { useState, type KeyboardEvent } from 'react';

export type PromptField = {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  defaultValue: string;
};

interface QuickPromptFormProps {
  fields: PromptField[];
  onSubmit: (values: Record<string, string>) => void;
  onCancel: () => void;
}

const inputClasses =
  'w-full px-3 py-1.5 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg placeholder:text-zinc-400 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-500';

export function QuickPromptForm({ fields, onSubmit, onCancel }: QuickPromptFormProps) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      fields.map((f) => [f.name, f.type === 'select' ? f.defaultValue : ''])
    )
  );

  const requiredFields = fields.filter((f) => f.required);
  const canSubmit = requiredFields.every((f) => values[f.name]?.trim().length > 0);

  const handleChange = (name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    const resolved = Object.fromEntries(
      fields.map((f) => {
        const trimmed = values[f.name]?.trim() ?? '';
        return [f.name, trimmed.length > 0 ? trimmed : f.defaultValue];
      })
    );
    onSubmit(resolved);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      className="px-4 pb-3 pt-1 space-y-2.5 border-t border-zinc-200 dark:border-zinc-700"
      onClick={(e) => e.stopPropagation()}
    >
      {fields.map((field) => {
        const inputId = `qp-field-${field.name}`;
        return (
          <div key={field.name} className="space-y-1">
            <label htmlFor={inputId} className="block text-xs text-zinc-500 dark:text-zinc-400">
              {field.label}
              {field.required && <span className="text-zinc-400"> *</span>}
            </label>
            {field.type === 'text' && (
              <input
                id={inputId}
                type="text"
                value={values[field.name]}
                placeholder={field.placeholder}
                onChange={(e) => handleChange(field.name, e.target.value)}
                onKeyDown={handleKeyDown}
                className={inputClasses}
              />
            )}
            {field.type === 'textarea' && (
              <textarea
                id={inputId}
                value={values[field.name]}
                placeholder={field.placeholder}
                onChange={(e) => handleChange(field.name, e.target.value)}
                rows={2}
                className={`${inputClasses} resize-none`}
              />
            )}
            {field.type === 'select' && (
              <select
                id={inputId}
                value={values[field.name]}
                onChange={(e) => handleChange(field.name, e.target.value)}
                className={inputClasses}
              >
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        );
      })}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="text-xs px-3 py-1.5 rounded-lg bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Отправить →
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs px-3 py-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          Свернуть
        </button>
      </div>
    </div>
  );
}
