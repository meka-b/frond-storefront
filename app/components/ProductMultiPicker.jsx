import React, { useState, useMemo } from 'react';
import {
  Search,
  Check,
  Plus,
  X,
  Sparkles,
  Layers,
  CheckSquare,
  Square
} from 'lucide-react';

/**
 * React Aria inspired ProductMultiPicker component
 * Provides high-accessibility searchable product grid / list with selection tags and bulk actions.
 */
export default function ProductMultiPicker({
  products = [],
  selectedIds = [],
  onChange,
  label = "Ürün Seçin",
  description = "Aşağıdaki listeden birden fazla ürün seçebilirsiniz.",
  maxHeight = "max-h-80"
}) {
  const [filterText, setFilterText] = useState('');
  const [onlySelected, setOnlySelected] = useState(false);

  // Filter products by search text and toggle
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchText =
        p.title.toLowerCase().includes(filterText.toLowerCase()) ||
        p.id.toLowerCase().includes(filterText.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(filterText.toLowerCase()));

      if (!matchText) return false;
      if (onlySelected) return selectedIds.includes(p.id);
      return true;
    });
  }, [products, filterText, onlySelected, selectedIds]);

  const selectedItems = useMemo(() => {
    return products.filter((p) => selectedIds.includes(p.id));
  }, [products, selectedIds]);

  const toggleProduct = (id) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((item) => item !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const selectAllFiltered = () => {
    const newSelected = Array.from(new Set([...selectedIds, ...filteredProducts.map((p) => p.id)]));
    onChange(newSelected);
  };

  const clearAll = () => {
    onChange([]);
  };

  const removeSingle = (id) => {
    onChange(selectedIds.filter((item) => item !== id));
  };

  return (
    <div className="space-y-3 bg-[#FAF9F5] p-4 rounded-xl border border-[#E8E6DF]">
      {/* Header & Meta */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <label className="block text-xs font-bold text-[#1D2A1C] uppercase tracking-wider font-mono">
            {label}
          </label>
          {description && <p className="text-[11px] text-[#7A8377] mt-0.5">{description}</p>}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#1D2A1C] text-[#FDFBF7] font-semibold">
            {selectedIds.length} / {products.length} Seçili
          </span>
        </div>
      </div>

      {/* Selected Tags Strip (React Aria TagGroup pattern) */}
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 p-2 bg-white rounded-lg border border-[#E5E3DC]">
          <span className="text-[10px] font-mono text-[#8C9388] uppercase mr-1">Seçilenler:</span>
          {selectedItems.map((p) => (
            <span
              key={p.id}
              className="inline-flex items-center gap-1 bg-[#F4F3EE] text-[#1D2A1C] border border-[#DDDCD5] text-[11px] px-2 py-0.5 rounded-md font-medium group transition"
            >
              <span>{p.title}</span>
              <button
                type="button"
                onClick={() => removeSingle(p.id)}
                className="text-[#8C9388] hover:text-red-600 rounded p-0.5"
                title="Kaldır"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="text-[10px] text-red-600 hover:underline font-mono ml-auto px-1"
          >
            Tümünü Temizle
          </button>
        </div>
      )}

      {/* Search & Filter Toolbar (React Aria SearchField pattern) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-[#8C9388] absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Bitki adı, ID veya SKU ara..."
            className="w-full text-xs bg-white border border-[#E0DED7] rounded-lg pl-8 pr-7 py-2 text-[#1D2A1C] placeholder-[#8C9388] focus:outline-none focus:border-[#1D2A1C]"
          />
          {filterText && (
            <button
              type="button"
              onClick={() => setFilterText('')}
              className="absolute right-2.5 top-2.5 text-[#8C9388] hover:text-[#1D2A1C]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setOnlySelected(!onlySelected)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
              onlySelected
                ? 'bg-[#1D2A1C] text-white border-[#1D2A1C]'
                : 'bg-white text-[#5C665A] border-[#E0DED7] hover:bg-[#F4F3EE]'
            }`}
          >
            Sadece Seçililer
          </button>

          <button
            type="button"
            onClick={selectAllFiltered}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white text-[#5C665A] border border-[#E0DED7] hover:bg-[#F4F3EE] transition"
          >
            Filtrelenenleri Seç
          </button>
        </div>
      </div>

      {/* Products Selection List (React Aria ListBox / Grid pattern) */}
      <div
        tabIndex={0}
        role="listbox"
        aria-multiselectable="true"
        className={`grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-y-auto pr-1 ${maxHeight}`}
      >
        {filteredProducts.length === 0 ? (
          <div className="col-span-full py-8 text-center text-xs text-[#8C9388]">
            Arama kriterine uygun ürün bulunamadı.
          </div>
        ) : (
          filteredProducts.map((p) => {
            const isSelected = selectedIds.includes(p.id);
            const imgUrl = p.primary_image || p.image_url || (p.images && p.images[0]) || '/assets/img/p-monstera-1.jpg';
            const normalizedImg = imgUrl.startsWith('http') || imgUrl.startsWith('/') ? imgUrl : '/' + imgUrl;

            return (
              <div
                key={p.id}
                role="option"
                aria-selected={isSelected}
                onClick={() => toggleProduct(p.id)}
                className={`flex items-center justify-between p-2.5 rounded-lg border text-left text-xs cursor-pointer transition select-none ${
                  isSelected
                    ? 'border-[#1D2A1C] bg-[#F4F7F4] shadow-xs'
                    : 'border-[#E8E6DF] bg-white hover:bg-[#FAF9F5] hover:border-[#D5D3CC]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <img
                    src={normalizedImg}
                    alt={p.title}
                    className="w-9 h-9 rounded-md object-cover border border-[#E8E6DF] bg-[#F4F3EE] flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-semibold text-xs truncate ${isSelected ? 'text-[#1D2A1C]' : 'text-[#2D3E2C]'}`}>
                        {p.title}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-[#7A8377] block truncate">
                      ID: {p.id} {p.sku ? `· ${p.sku}` : ''}
                    </span>
                  </div>
                </div>

                <div className="flex-shrink-0 ml-2">
                  {isSelected ? (
                    <span className="w-5 h-5 rounded bg-[#1D2A1C] text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <span className="w-5 h-5 rounded border border-[#C8C6BE] bg-white flex items-center justify-center group-hover:border-[#1D2A1C]">
                      <Plus className="w-3 h-3 text-[#AAA]" />
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
