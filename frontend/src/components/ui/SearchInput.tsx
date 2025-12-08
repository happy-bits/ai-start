import { type InputHTMLAttributes } from 'react';
import Card from './Card';
import { formInputBase, formInputBorderNormal, cn } from '../../utils/styles';

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function SearchInput({ placeholder = 'Search...', value, onChange, className = '', ...props }: SearchInputProps) {
  return (
    <Card padding="sm">
      <search role="search">
        <div className="relative">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            aria-label={placeholder.replace('...', '')}
            className={cn(formInputBase.replace('px-4', 'pl-12 pr-4'), formInputBorderNormal, 'py-3', className)}
            {...props}
          />
        </div>
      </search>
    </Card>
  );
}

