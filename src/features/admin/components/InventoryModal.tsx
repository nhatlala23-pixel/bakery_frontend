import React, { useState, useEffect } from 'react';
import { Save, Package } from 'lucide-react';
import productService, { type ProductResponse, type ProductRequest } from '@/services/api/productService';
import { Modal } from '@/components/ui/Modal';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product: ProductResponse | null;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({ isOpen, onClose, onSuccess, product }) => {
  const [loading, setLoading] = useState(false);
  const [fetchingDetail, setFetchingDetail] = useState(false);
  
  const [formData, setFormData] = useState<ProductRequest>({
    sku: '',
    productName: '',
    slug: '',
    originalPrice: 0,
    salePrice: 0,
    stock: 0,
    categoryId: 0,
    brandId: 0,
    status: 1,
    thumbnail: '',
    shortDescription: '',
    description: '',
    images: [],
    variants: []
  });

  useEffect(() => {
    const fetchFullDetail = async () => {
      if (product && isOpen) {
        setFetchingDetail(true);
        try {
          const detail = await productService.getProductBySlug(product.slug);
          setFormData({
            sku: detail.sku,
            productName: detail.productName,
            slug: detail.slug,
            originalPrice: detail.originalPrice,
            salePrice: detail.salePrice,
            stock: detail.stock,
            thumbnail: detail.thumbnail || '',
            shortDescription: detail.shortDescription || '',
            description: detail.description || '',
            categoryId: detail.category?.id || 0,
            brandId: detail.brand?.id,
            status: detail.status,
            images: detail.images.map(img => ({
              imageUrl: img.imageUrl,
              isMain: img.isMain,
              sortOrder: img.sortOrder
            })),
            variants: detail.variants.map(v => ({
              sku: v.sku,
              price: v.variantPrice,
              stockQuantity: v.stock,
              colorCode: v.colorCode || '',
              size: v.size || '',
              thumbnailUrl: v.thumbnailUrl,
              status: 1
            }))
          });
        } catch (error) {
          console.error('Failed to fetch product detail:', error);
        } finally {
          setFetchingDetail(false);
        }
      }
    };
    fetchFullDetail();
  }, [product, isOpen]);

  const updateVariantStock = (index: number, stock: number) => {
    setFormData(prev => {
      const variants = [...(prev.variants || [])];
      variants[index] = { ...variants[index], stockQuantity: stock };
      
      // Update parent stock as sum of variants if there are variants
      const totalStock = variants.reduce((sum, v) => sum + (v.stockQuantity || 0), 0);
      return { ...prev, variants, stock: variants.length > 0 ? totalStock : prev.stock };
    });
  };

  const updateMainStock = (stock: number) => {
    setFormData(prev => ({ ...prev, stock }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    
    setLoading(true);
    try {
      await productService.updateProduct(product.id, formData);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Lỗi cập nhật tồn kho:', error);
      alert(error.response?.data?.message || 'Cập nhật thất bại!');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Cập nhật tồn kho: ${product?.productName}`}
      size="lg"
    >
      {fetchingDetail ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Đang tải dữ liệu kho...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto">
          
          {formData.variants && formData.variants.length > 0 ? (
            <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Tồn kho theo phiên bản</h3>
                <div className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-xl">
                  Tổng: {formData.stock}
                </div>
              </div>
              
              <div className="space-y-3">
                {formData.variants.map((variant, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                      {variant.thumbnailUrl ? (
                        <img src={`http://localhost:8080${variant.thumbnailUrl}`} alt="" className="w-10 h-10 rounded-lg object-cover border" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400"><Package size={16} /></div>
                      )}
                      <div>
                        <div className="font-bold text-sm text-gray-900">{variant.colorCode} {variant.size ? `- ${variant.size}` : ''}</div>
                        <div className="text-[10px] text-gray-400 font-mono">{variant.sku}</div>
                      </div>
                    </div>
                    <div className="w-32">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Số lượng tồn</label>
                      <input 
                        type="number"
                        min="0"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg outline-none text-sm font-bold text-blue-600 text-center focus:bg-white focus:ring-2 focus:ring-blue-100"
                        value={variant.stockQuantity}
                        onChange={e => updateVariantStock(idx, Number(e.target.value))}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 space-y-4">
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Tồn kho sản phẩm chung</h3>
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
                    <Package size={24} />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">Sản phẩm không có phiên bản</div>
                    <div className="text-xs text-gray-400">Cập nhật số lượng trực tiếp</div>
                  </div>
                </div>
                <div className="w-32">
                  <input 
                    type="number"
                    min="0"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-lg font-black text-blue-600 text-center focus:bg-white focus:ring-2 focus:ring-blue-100"
                    value={formData.stock}
                    onChange={e => updateMainStock(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button 
              type="button" 
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-all"
            >
              Hủy
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save size={16} /> Cập nhật tồn kho
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
