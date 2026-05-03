import React, { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { FiChevronDown, FiCheck } from 'react-icons/fi';

export const SORT_OPTIONS = [
  { key: 'featured', label: 'Featured' },
  { key: 'name-asc', label: 'Name (A → Z)' },
  { key: 'name-desc', label: 'Name (Z → A)' },
  { key: 'price-asc', label: 'Price (Low → High)' },
  { key: 'price-desc', label: 'Price (High → Low)' },
];

// Pure comparator. `featured` keeps original array order (stable).
export const sortProducts = (products, sortKey) => {
  if (sortKey === 'featured' || !sortKey) return products;
  const copy = [...products];
  switch (sortKey) {
    case 'name-asc':
      return copy.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    case 'name-desc':
      return copy.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    case 'price-asc':
      return copy.sort((a, b) => Number(a.price) - Number(b.price));
    case 'price-desc':
      return copy.sort((a, b) => Number(b.price) - Number(a.price));
    default:
      return products;
  }
};

const SortDropdown = ({ value, onChange }) => {
  const current = SORT_OPTIONS.find((o) => o.key === value) || SORT_OPTIONS[0];

  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button className="inline-flex items-center gap-2 rounded-xl bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-teal-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/30">
        <span className="text-slate-400 dark:text-slate-500">Sort:</span>
        <span className="font-semibold text-slate-800 dark:text-slate-100">{current.label}</span>
        <FiChevronDown className="text-slate-400 dark:text-slate-500" size={16} />
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-150"
        enterFrom="opacity-0 -translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-100"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right rounded-2xl bg-white dark:bg-slate-800 shadow-soft-xl border border-slate-100 dark:border-slate-700 p-2 z-30 focus:outline-none">
          {SORT_OPTIONS.map((option) => (
            <Menu.Item key={option.key}>
              {({ active }) => (
                <button
                  type="button"
                  onClick={() => onChange(option.key)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    active ? 'bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300' : 'text-slate-700 dark:text-slate-200'
                  } ${value === option.key ? 'bg-teal-50/70 dark:bg-teal-500/10' : ''}`}
                >
                  <span>{option.label}</span>
                  {value === option.key && <FiCheck size={16} className="text-teal-600 dark:text-teal-300" />}
                </button>
              )}
            </Menu.Item>
          ))}
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

export default SortDropdown;
