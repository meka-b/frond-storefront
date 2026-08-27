import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  Search,
  Check,
  X,
  Package
} from 'lucide-react';

/**
 * React Aria inspired ProductSingleSelect Combobox
 * Provides a clean searchable single-product dropdown with thumbnails, SKU badges, and keyboard support.
 */
export default function ProductSingleSelect({
  products = [],
  value = '',
  onChange,
  name,
  label = 'Ürün Seçin',
  placeholder = 'Bir bitki seçin...',
  required = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  const selectedProduct = products.find((p) => p.id === value);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const filtered = products.filter((p) => {
    const s = search.toLowerCase();
    return (
      p.title.toLowerCase().includes(s) ||
      p.id.toLowerCase().includes(s) ||
      (p.sku && p.sku.toLowerCase().includes(s))
    );
  });

  const handleSelect = (productId) => {
    onChange(productId);
    setIsOpen(false);
    setSearch('');
  };

  const clearSelection = (e) => {
    e.stopPropagation();
    onChange('');
  };

  const getImgUrl = (p) => {
    if (!p) return '/assets/img/p-monstera-1.jpg';
    const raw = p.primary_image || p.image_url || (p.images && p.images[0]) || '/assets/img/p-monstera-1.jpg';
    return raw.startsWith('http') || raw.startsWith('/') ? raw : '/' + raw;
  };

  return (
    <div className="space-y-1.5" ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold text-[#5C665A]">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Hidden input for HTML form submissions */}
      {name && <input type="hidden" name={name} value={value || ''} />}

      {/* Trigger Button */}
      <div className="relative">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-2 rounded-lg border border-[#E0DED7] bg-[#FAF9F5] hover:bg-white text-xs text-left focus:outline-none focus:border-[#1D2A1C] transition shadow-2xs"
        >
          {selectedProduct ? (
            <div className="flex items-center gap-2.5 min-w-0 pr-2">
              <img
                src={getImgUrl(selectedProduct)}
                alt={selectedProduct.title}
                className="w-7 h-7 rounded object-cover border border-[#E8E6DF] bg-[#F4F3EE] flex-shrink-0"
              />
              <div className="min-w-0">
                <span className="font-semibold text-xs text-[#1D2A1C] truncate block">
                  {selectedProduct.title}
                </span>
                <span className="text-[10px] font-mono text-[#7A8377] block truncate">
                  ID: {selectedProduct.id} {selectedProduct.sku ? `· ${selectedProduct.sku}` : ''}
                </span>
              </div>
            </div>
          ) : (
            <span className="text-[#8C9388] text-xs py-1 flex items-center gap-2">
              <Package className="w-4 h-4 text-[#AAA]" />
              <span>{placeholder}</span>
            </span>
          )}

          <div className="flex items-center gap-1 flex-shrink-0">
            {value && (
              <button
                type="button"
                onClick={clearSelection}
                className="p-1 text-[#8C9388] hover:text-red-600 rounded"
                title="Seçimi Temizle"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <ChevronDown className={`w-4 h-4 text-[#8C9388] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {/* Dropdown Popover */}
        {isOpen && (
          <div className="absolute z-50 mt-1 w-full bg-white rounded-xl border border-[#E8E6DF] shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            {/* Search Filter Header */}
            <div className="p-2 border-b border-[#E8E6DF] bg-[#FAF9F5]">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#8C9388] absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Bitki ara..."
                  className="w-full text-xs bg-white border border-[#E0DED7] rounded-lg pl-8 pr-3 py-1.5 text-[#1D2A1C] placeholder-[#8C9388] focus:outline-none focus:border-[#1D2A1C]"
                />
              </div>
            </div>

            {/* Product Options List */}
            <div
              role="listbox"
              className="max-h-60 overflow-y-auto p-1.5 space-y-1 divide-y divide-[#F4F3EE]"
            >
              {filtered.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#8C9388]">
                  Eşleşen ürün bulunamadı.
                </div>
              ) : (
                filtered.map((p) => {
                  const isSelected = p.id === value;
                  return (
                    <div
                      key={p.id}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(p.id)}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition text-xs select-none ${
                        isSelected
                          ? 'bg-[#F4F7F4] text-[#1D2A1C] font-semibold'
                          : 'hover:bg-[#FAF9F5] text-[#333]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <img
                          src={getImgUrl(p)}
                          alt={p.title}
                          className="w-8 h-8 rounded object-cover border border-[#E8E6DF] bg-[#F4F3EE] flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="block truncate text-xs font-medium text-[#1D2A1C]">
                            {p.title}
                          </span>
                          <span className="text-[10px] font-mono text-[#7A8377] block truncate">
                            ID: {p.id} {p.sku ? `· ${p.sku}` : ''}
                          </span>
                        </div>
                      </div>

                      {isSelected && (
                        <Check className="w-4 h-4 text-[#3F5E3D] flex-shrink-0 ml-2" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
