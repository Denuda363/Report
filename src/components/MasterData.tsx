import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAppContext } from '../store/AppContext';
import { Plus, Trash2, Download, Upload, Search, ChevronDown, Edit2, X } from 'lucide-react';
import { Supplier, Product } from '../types';
import { downloadMasterDataTemplate, parseMasterDataImport } from '../lib/excel';

export const MasterData = () => {
  const { suppliers, products, addSupplier, updateSupplier, deleteSupplier, addProduct, updateProduct, deleteProduct, importMasterData } = useAppContext();
  
  const [activeTab, setActiveTab] = useState<'suppliers' | 'products'>('suppliers');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Supplier Form & Edit
  const [supplierName, setSupplierName] = useState('');
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  
  // List Search States
  const [supplierListSearch, setSupplierListSearch] = useState('');
  const [productListSearch, setProductListSearch] = useState('');
  
  // Product Form
  const [productName, setProductName] = useState('');
  const [productSupplierId, setProductSupplierId] = useState('');
  const [productUnit, setProductUnit] = useState('pcs');

  // Product Edit & Search State
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [supplierSearchQuery, setSupplierSearchQuery] = useState('');
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
  const supplierDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (supplierDropdownRef.current && !supplierDropdownRef.current.contains(event.target as Node)) {
        setIsSupplierDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredSuppliersForSelect = useMemo(() => {
    return suppliers.filter(s => s.name.toLowerCase().includes(supplierSearchQuery.toLowerCase()));
  }, [suppliers, supplierSearchQuery]);

  const handleSubmitSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim()) return;
    
    if (editingSupplierId) {
      updateSupplier({ id: editingSupplierId, name: supplierName.trim() });
      setEditingSupplierId(null);
    } else {
      addSupplier({ name: supplierName.trim() });
    }
    
    setSupplierName('');
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplierId(supplier.id);
    setSupplierName(supplier.name);
    setActiveTab('suppliers');
  };

  const handleCancelEditSupplier = () => {
    setEditingSupplierId(null);
    setSupplierName('');
  };

  const filteredSuppliersList = useMemo(() => {
    return suppliers.filter(s => s.name.toLowerCase().includes(supplierListSearch.toLowerCase()));
  }, [suppliers, supplierListSearch]);

  const filteredProductsList = useMemo(() => {
    return products.filter(p => {
      const sName = suppliers.find(s => s.id === p.supplierId)?.name.toLowerCase() || '';
      const pName = p.name.toLowerCase();
      const q = productListSearch.toLowerCase();
      return pName.includes(q) || sName.includes(q);
    });
  }, [products, suppliers, productListSearch]);

  const handleSubmitProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim() || !productSupplierId || !productUnit.trim()) return;
    
    if (editingProductId) {
      updateProduct({
        id: editingProductId,
        name: productName.trim(),
        supplierId: productSupplierId,
        unit: productUnit.trim()
      });
      setEditingProductId(null);
    } else {
      addProduct({
        name: productName.trim(),
        supplierId: productSupplierId,
        unit: productUnit.trim()
      });
    }
    
    setProductName('');
    setProductSupplierId('');
    setProductUnit('pcs');
    setSupplierSearchQuery('');
  };

  const handleEditProduct = (product: Product) => {
    setEditingProductId(product.id);
    setProductName(product.name);
    setProductSupplierId(product.supplierId);
    setProductUnit(product.unit || 'pcs');
    
    const sName = suppliers.find(s => s.id === product.supplierId)?.name || '';
    setSupplierSearchQuery(sName);
    setActiveTab('products');
  };

  const handleCancelEditProduct = () => {
    setEditingProductId(null);
    setProductName('');
    setProductSupplierId('');
    setProductUnit('pcs');
    setSupplierSearchQuery('');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { suppliers: newSuppliers, products: newProducts } = await parseMasterDataImport(file);
      if (newSuppliers.length > 0 || newProducts.length > 0) {
        importMasterData(newSuppliers, newProducts);
        alert(`Successfully imported ${newSuppliers.length} suppliers and ${newProducts.length} products.`);
      } else {
        alert("No valid data found in template.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to parse the file. Please ensure it matches the template format.");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-[#E2E4D8] shadow-sm overflow-hidden flex flex-col h-full min-h-[600px]">
      {/* Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#E2E4D8] gap-4 sm:gap-0 pb-4 sm:pb-0">
        <div className="flex w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`flex-1 sm:flex-none px-4 sm:px-8 py-4 text-sm font-bold text-center transition-colors ${
              activeTab === 'suppliers' ? 'text-[#3A3D32] border-b-2 border-[#8B9D77] bg-[#F9FAF6]' : 'text-[#7A7F6E] hover:text-[#556B2F] hover:bg-[#F1F3E9]'
            }`}
          >
            Suppliers
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`flex-1 sm:flex-none px-4 sm:px-8 py-4 text-sm font-bold text-center transition-colors ${
              activeTab === 'products' ? 'text-[#3A3D32] border-b-2 border-[#8B9D77] bg-[#F9FAF6]' : 'text-[#7A7F6E] hover:text-[#556B2F] hover:bg-[#F1F3E9]'
            }`}
          >
            Products
          </button>
        </div>
        <div className="flex items-center gap-3 px-4 sm:pr-6 w-full sm:w-auto justify-end">
          <button 
            onClick={downloadMasterDataTemplate}
            className="flex items-center gap-2 bg-white text-[#8B9D77] border border-[#E2E4D8] hover:bg-[#F1F3E9] px-4 py-2 rounded-xl font-bold transition-colors text-xs uppercase tracking-wider"
          >
            <Download className="w-3.5 h-3.5" /> Template
          </button>
          <label className="flex items-center gap-2 bg-[#8B9D77] text-white hover:bg-[#728261] px-4 py-2 rounded-xl font-bold transition-colors text-xs uppercase tracking-wider cursor-pointer">
            <Upload className="w-3.5 h-3.5" /> Import
            <input 
              type="file" 
              accept=".xlsx, .xls" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleImport}
            />
          </label>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 flex flex-col lg:flex-row gap-8">
        {/* Form Section */}
        <div className="w-full lg:w-1/3 shrink-0">
          <h3 className="font-bold text-[#2D3025] mb-4">
            {activeTab === 'suppliers' 
              ? (editingSupplierId ? 'Edit Supplier' : 'Add New Supplier') 
              : (editingProductId ? 'Edit Product' : 'Add New Product')}
          </h3>
          
          {activeTab === 'suppliers' ? (
            <form onSubmit={handleSubmitSupplier} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#8B9D77] uppercase tracking-wider mb-2">Supplier Name</label>
                <input
                  type="text"
                  required
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="w-full px-4 py-3 border border-[#E2E4D8] rounded-2xl bg-[#F9FAF6] focus:ring-2 focus:ring-[#8B9D77] focus:border-[#8B9D77] outline-none transition-all text-sm text-[#3A3D32]"
                  placeholder="e.g. PT Maju Bersama"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 bg-[#8B9D77] hover:bg-[#728261] text-white px-4 py-3 rounded-2xl font-bold transition-colors text-sm"
                >
                  {editingSupplierId ? <><Edit2 className="w-4 h-4" /> Update</> : <><Plus className="w-4 h-4" /> Add</>} Supplier
                </button>
                {editingSupplierId && (
                  <button
                    type="button"
                    onClick={handleCancelEditSupplier}
                    className="flex-none flex items-center justify-center gap-2 bg-[#F1F3E9] hover:bg-[#E2E4D8] text-[#7A7F6E] px-4 py-3 rounded-2xl font-bold transition-colors text-sm"
                  >
                    <X className="w-4 h-4" /> Cancel
                  </button>
                )}
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmitProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#8B9D77] uppercase tracking-wider mb-2">Product Name</label>
                <input
                  type="text"
                  required
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-4 py-3 border border-[#E2E4D8] rounded-2xl bg-[#F9FAF6] focus:ring-2 focus:ring-[#8B9D77] focus:border-[#8B9D77] outline-none transition-all text-sm text-[#3A3D32]"
                  placeholder="e.g. Indomie Goreng"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#8B9D77] uppercase tracking-wider mb-2">Unit</label>
                <input
                  type="text"
                  required
                  value={productUnit}
                  onChange={(e) => setProductUnit(e.target.value)}
                  className="w-full px-4 py-3 border border-[#E2E4D8] rounded-2xl bg-[#F9FAF6] focus:ring-2 focus:ring-[#8B9D77] focus:border-[#8B9D77] outline-none transition-all text-sm text-[#3A3D32]"
                  placeholder="e.g. pcs, Box, fls"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#8B9D77] uppercase tracking-wider mb-2">Supplier</label>
                <div className="relative" ref={supplierDropdownRef}>
                  <div 
                    className={`flex items-center w-full px-4 py-3 border rounded-2xl bg-[#F9FAF6] transition-all cursor-text ${isSupplierDropdownOpen ? 'border-[#8B9D77] ring-2 ring-[#8B9D77]' : 'border-[#E2E4D8]'}`}
                    onClick={() => setIsSupplierDropdownOpen(true)}
                  >
                    <Search className="w-4 h-4 text-[#7A7F6E] mr-2 shrink-0" />
                    <input
                      type="text"
                      className="bg-transparent outline-none w-full text-sm text-[#3A3D32]"
                      placeholder="Search supplier..."
                      value={supplierSearchQuery}
                      onChange={(e) => {
                        setSupplierSearchQuery(e.target.value);
                        setProductSupplierId('');
                        setIsSupplierDropdownOpen(true);
                      }}
                      onFocus={() => setIsSupplierDropdownOpen(true)}
                    />
                    <ChevronDown className="w-4 h-4 text-[#7A7F6E] ml-2 shrink-0" />
                  </div>
                  
                  {isSupplierDropdownOpen && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-[#E2E4D8] rounded-2xl shadow-lg max-h-60 overflow-y-auto">
                      {filteredSuppliersForSelect.length > 0 ? (
                        filteredSuppliersForSelect.map(s => (
                          <div 
                            key={s.id}
                            className="px-4 py-3 hover:bg-[#F1F3E9] cursor-pointer text-sm font-bold text-[#2D3025] transition-colors"
                            onClick={() => {
                              setProductSupplierId(s.id);
                              setSupplierSearchQuery(s.name);
                              setIsSupplierDropdownOpen(false);
                            }}
                          >
                            {s.name}
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-4 text-center text-sm text-[#7A7F6E]">
                          No suppliers found.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 bg-[#8B9D77] hover:bg-[#728261] text-white px-4 py-3 rounded-2xl font-bold transition-colors text-sm"
                  disabled={suppliers.length === 0 || !productSupplierId}
                >
                  {editingProductId ? <><Edit2 className="w-4 h-4" /> Update</> : <><Plus className="w-4 h-4" /> Add</>} Product
                </button>
                {editingProductId && (
                  <button
                    type="button"
                    onClick={handleCancelEditProduct}
                    className="flex-none flex items-center justify-center gap-2 bg-[#F1F3E9] hover:bg-[#E2E4D8] text-[#7A7F6E] px-4 py-3 rounded-2xl font-bold transition-colors text-sm"
                  >
                    <X className="w-4 h-4" /> Cancel
                  </button>
                )}
              </div>
              {suppliers.length === 0 && (
                <p className="text-xs text-rose-500 mt-1">Please add a supplier first.</p>
              )}
            </form>
          )}
        </div>

        {/* List Section */}
        <div className="flex-1 border-t lg:border-t-0 lg:border-l border-[#E2E4D8] pt-6 lg:pt-0 lg:pl-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
            <h3 className="font-bold text-[#2D3025]">
              {activeTab === 'suppliers' ? 'Supplier List' : 'Product List'}
            </h3>
            
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-[#7A7F6E] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={activeTab === 'suppliers' ? "Search suppliers..." : "Search products..."}
                value={activeTab === 'suppliers' ? supplierListSearch : productListSearch}
                onChange={(e) => activeTab === 'suppliers' ? setSupplierListSearch(e.target.value) : setProductListSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-[#E2E4D8] rounded-xl bg-[#F9FAF6] focus:ring-2 focus:ring-[#8B9D77] outline-none transition-all text-sm"
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            {activeTab === 'suppliers' ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E4D8]">
                    <th className="py-3 px-4 text-xs font-bold text-[#8B9D77] uppercase tracking-wider bg-[#F1F3E9] rounded-tl-xl">ID</th>
                    <th className="py-3 px-4 text-xs font-bold text-[#8B9D77] uppercase tracking-wider bg-[#F1F3E9]">Name</th>
                    <th className="py-3 px-4 text-xs font-bold text-[#8B9D77] uppercase tracking-wider bg-[#F1F3E9] rounded-tr-xl w-20">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSuppliersList.length === 0 ? (
                    <tr><td colSpan={3} className="py-8 text-center text-[#7A7F6E] text-sm">No suppliers found.</td></tr>
                  ) : (
                    filteredSuppliersList.map(s => (
                      <tr key={s.id} className="border-b border-[#F1F3E9] hover:bg-[#F9FAF6]">
                        <td className="py-3 px-4 text-sm text-[#7A7F6E] font-mono">{s.id}</td>
                        <td className="py-3 px-4 text-sm font-bold text-[#2D3025]">{s.name}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleEditSupplier(s)} className="p-1.5 text-[#8B9D77] hover:bg-[#F1F3E9] rounded-lg transition-colors" title="Edit">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => deleteSupplier(s.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E4D8]">
                    <th className="py-3 px-4 text-xs font-bold text-[#8B9D77] uppercase tracking-wider bg-[#F1F3E9] rounded-tl-xl">Name</th>
                    <th className="py-3 px-4 text-xs font-bold text-[#8B9D77] uppercase tracking-wider bg-[#F1F3E9]">Unit</th>
                    <th className="py-3 px-4 text-xs font-bold text-[#8B9D77] uppercase tracking-wider bg-[#F1F3E9]">Supplier</th>
                    <th className="py-3 px-4 text-xs font-bold text-[#8B9D77] uppercase tracking-wider bg-[#F1F3E9] rounded-tr-xl w-20">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProductsList.length === 0 ? (
                    <tr><td colSpan={4} className="py-8 text-center text-[#7A7F6E] text-sm">No products found.</td></tr>
                  ) : (
                    filteredProductsList.map(p => (
                      <tr key={p.id} className="border-b border-[#F1F3E9] hover:bg-[#F9FAF6]">
                        <td className="py-3 px-4 text-sm font-bold text-[#2D3025]">{p.name}</td>
                        <td className="py-3 px-4 text-sm text-[#7A7F6E]">{p.unit || '-'}</td>
                        <td className="py-3 px-4 text-[10px] text-[#8B9D77] uppercase font-bold">
                          {suppliers.find(s => s.id === p.supplierId)?.name || <span className="text-rose-400">Unknown</span>}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleEditProduct(p)} className="p-1.5 text-[#8B9D77] hover:bg-[#F1F3E9] rounded-lg transition-colors" title="Edit">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => deleteProduct(p.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
