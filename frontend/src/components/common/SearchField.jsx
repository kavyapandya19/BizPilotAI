import React from 'react';
import { Search, X } from 'lucide-react';

const SearchField = ({ value, onChange, placeholder, className = '', inputRef, onKeyDown }) => (
  <div className={`search-field ${className}`}>
    <Search className="search-field-icon" aria-hidden="true" />
    <input
      ref={inputRef}
      type="search"
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      className="search-field-input"
    />
    {value && (
      <button
        type="button"
        onClick={() => onChange({ target: { value: '' } })}
        className="search-field-clear"
        aria-label="Clear search"
      >
        <X className="h-4 w-4" />
      </button>
    )}
  </div>
);

export default SearchField;