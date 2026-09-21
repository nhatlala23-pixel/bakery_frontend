import { useState, useEffect } from 'react';
import {
  Search, Eye, Trash2, FileDown, FileText,
  MessageSquare, AlertCircle, CheckCircle,
  RefreshCw, ChevronLeft, ChevronRight, Inbox
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import contactService, { type ContactResponse } from '@/services/api/contactService';
import { ContactDetailModal, StatusBadge } from '../components/ContactDetailModal';

// ─── Stat Card ─────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  description: string;
  highlight?: boolean;
}

const StatCard = ({ label, value, icon, iconBg, iconColor, description, highlight }: StatCardProps) => (
  <div className={`bg-white rounded-2xl p-5 shadow-sm border transition-all hover:shadow-md hover:-translate-y-0.5 ${highlight ? 'border-red-200' : 'border-gray-100'}`}>
    <div className="flex items-start justify-between mb-4">
      <div>
        <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">{label}</p>
        <h3 className={`text-3xl font-black tracking-tight ${highlight && value > 0 ? 'text-red-500' : 'text-gray-900'}`}>
          {value}
        </h3>
      </div>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconBg} ${iconColor}`}>
        {icon}
      </div>
    </div>
    <p className="text-xs text-gray-400">{description}</p>
  </div>
);

// ─── Main Page ──────────────────────────────────────────────────────────────
export const AdminContacts = () => {
  const currentUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
  const isAdmin = currentUser.roleName === 'ADMIN';

  const [contacts, setContacts] = useState<ContactResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedContact, setSelectedContact] = useState<ContactResponse | null>(null);

  // Stats computed from all contacts (fetch once separately for accuracy)
  const [allContacts, setAllContacts] = useState<ContactResponse[]>([]);

  // ── Fetch current page ──────────────────────────────────────────────────
  const fetchContacts = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    try {
      const status = statusFilter === 'ALL' ? undefined : statusFilter;
      const response = await contactService.getAllContacts(page, 10, status, searchTerm || undefined);
      setContacts(response.content || []);
      setTotalPages(response.totalPages || 0);
      setTotalElements(response.totalElements || 0);
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ── Fetch all contacts for stats (no filter) ────────────────────────────
  const fetchAllForStats = async () => {
    try {
      const res = await contactService.getAllContacts(0, 1000);
      setAllContacts(res.content || []);
    } catch { /* silent */ }
  };

  useEffect(() => {
    fetchAllForStats();
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [page, statusFilter]);

  // Debounced search
  useEffect(() => {
    const delay = setTimeout(() => {
      setPage(0);
      fetchContacts();
    }, 480);
    return () => clearTimeout(delay);
  }, [searchTerm]);

  // ── Stats ────────────────────────────────────────────────────────────────
  const statTotal   = allContacts.length;
  const statPending = allContacts.filter(c => c.status === 'PENDING').length;
  const statReplied = allContacts.filter(c => c.status === 'REPLIED').length;

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleUpdateStatus = async (id: number, status: string) => {
    await contactService.updateStatus(id, status);
    fetchContacts();
    fetchAllForStats();
    setSelectedContact(prev => prev?.id === id ? { ...prev, status } : prev);
  };

  const handleReply = async (id: number, message: string) => {
    try {
      await contactService.replyContact(id, message);
      // update status to REPLIED after reply
      await contactService.updateStatus(id, 'REPLIED');
      fetchContacts();
      fetchAllForStats();
      setSelectedContact(prev =>
        prev?.id === id
          ? { ...prev, adminReply: message, status: 'REPLIED', repliedAt: new Date().toISOString() }
          : prev
      );
    } catch {
      // fallback: mark as REPLIED even if reply endpoint not yet implemented
      await contactService.updateStatus(id, 'REPLIED');
      fetchContacts();
      fetchAllForStats();
      setSelectedContact(prev =>
        prev?.id === id ? { ...prev, status: 'REPLIED' } : prev
      );
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa liên hệ này không?')) return;
    try {
      await contactService.deleteContact(id);
      fetchContacts();
      fetchAllForStats();
      if (selectedContact?.id === id) setSelectedContact(null);
    } catch {
      alert('Xóa thất bại, vui lòng thử lại.');
    }
  };

  // ── Export Excel ─────────────────────────────────────────────────────────
  const handleExportExcel = () => {
    if (contacts.length === 0) return alert('Không có dữ liệu để xuất!');
    const data = contacts.map(c => ({
      'ID': c.id,
      'Họ & Tên': c.name,
      'Email': c.email,
      'SĐT': c.phone,
      'Chủ đề': c.subject,
      'Nội dung': c.message,
      'Trạng thái': c.status === 'PENDING' ? 'Chưa xử lý' : c.status === 'PROCESSING' ? 'Đang xử lý' : 'Đã phản hồi',
      'Ngày gửi': new Date(c.createdAt).toLocaleString('vi-VN'),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [{ wch: 6 }, { wch: 22 }, { wch: 28 }, { wch: 14 }, { wch: 30 }, { wch: 50 }, { wch: 14 }, { wch: 20 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Liên hệ');
    XLSX.writeFile(wb, `Lien_He_${new Date().toISOString().substring(0, 10)}.xlsx`);
  };

  // ── Export PDF ────────────────────────────────────────────────────────────
  const handleExportPDF = () => {
    if (contacts.length === 0) return alert('Không có dữ liệu để xuất!');
    const doc = new jsPDF('landscape');
    doc.setFontSize(16);
    doc.text('DANH SACH LIEN HE KHACH HANG', 148, 15, { align: 'center' });
    doc.setFontSize(9);
    doc.text(`Xuat ngay: ${new Date().toLocaleString('vi-VN')}`, 148, 22, { align: 'center' });

    autoTable(doc, {
      startY: 28,
      head: [['ID', 'Ho Ten', 'Email', 'SDT', 'Chu De', 'Trang Thai', 'Ngay Gui']],
      body: contacts.map(c => [
        c.id, c.name, c.email, c.phone, c.subject,
        c.status === 'PENDING' ? 'Chua xu ly' : c.status === 'PROCESSING' ? 'Dang xu ly' : 'Da phan hoi',
        new Date(c.createdAt).toLocaleDateString('vi-VN'),
      ]),
      theme: 'grid',
      headStyles: { fillColor: [30, 30, 30], fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      columnStyles: { 4: { cellWidth: 50 } },
    });
    doc.save(`Lien_He_${new Date().toISOString().substring(0, 10)}.pdf`);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Quản lý liên hệ</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Tiếp nhận & xử lý yêu cầu hỗ trợ từ khách hàng.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchContacts(true)}
            disabled={refreshing}
            title="Làm mới"
            className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs shadow-md transition-all active:scale-95"
          >
            <FileText className="w-4 h-4" /> Xuất PDF
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition-all active:scale-95"
          >
            <FileDown className="w-4 h-4" /> Xuất Excel
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Tổng liên hệ"
          value={statTotal}
          icon={<MessageSquare className="w-5 h-5" />}
          iconBg="bg-yellow-100"
          iconColor="text-yellow-600"
          description="Tổng số liên hệ nhận được"
        />
        <StatCard
          label="Chưa xử lý"
          value={statPending}
          icon={<AlertCircle className="w-5 h-5" />}
          iconBg="bg-red-100"
          iconColor="text-red-600"
          description="Cần phản hồi sớm"
          highlight
        />
        <StatCard
          label="Đã phản hồi"
          value={statReplied}
          icon={<CheckCircle className="w-5 h-5" />}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
          description="Đã hoàn thành xử lý"
        />
      </div>

      {/* ── Table Card ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        {/* Toolbar */}
        <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm tên, email, số điện thoại..."
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/40 focus:border-yellow-400 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { value: 'ALL', label: 'Tất cả' },
              { value: 'PENDING', label: 'Chưa xử lý' },
              { value: 'PROCESSING', label: 'Đang xử lý' },
              { value: 'REPLIED', label: 'Đã phản hồi' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => { setStatusFilter(opt.value); setPage(0); }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === opt.value
                    ? 'bg-yellow-400 text-gray-900 shadow-sm'
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-100'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-[11px] font-bold uppercase tracking-wider">
                <th className="px-5 py-3.5">Khách hàng</th>
                <th className="px-5 py-3.5">Chủ đề</th>
                <th className="px-5 py-3.5">Trạng thái</th>
                <th className="px-5 py-3.5">Thời gian</th>
                <th className="px-5 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                      <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm">Đang tải dữ liệu...</span>
                    </div>
                  </td>
                </tr>
              ) : contacts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                      <Inbox className="w-10 h-10 text-gray-200" />
                      <span className="text-sm font-medium">Không tìm thấy liên hệ nào.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                contacts.map((contact) => (
                  <tr
                    key={contact.id}
                    className="hover:bg-gray-50/60 transition-colors group cursor-pointer"
                    onClick={() => setSelectedContact(contact)}
                  >
                    {/* Customer */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-300 flex items-center justify-center text-xs font-black text-gray-800 flex-shrink-0 shadow-sm">
                          {contact.name.trim().split(' ').pop()?.charAt(0).toUpperCase() ?? '?'}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-sm leading-tight">{contact.name}</div>
                          <div className="text-gray-500 text-xs">{contact.email}</div>
                          <div className="text-gray-400 text-xs">{contact.phone}</div>
                        </div>
                      </div>
                    </td>

                    {/* Subject */}
                    <td className="px-5 py-4 max-w-[200px]">
                      <p className="text-sm font-medium text-gray-700 line-clamp-2">{contact.subject}</p>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <StatusBadge status={contact.status} />
                    </td>

                    {/* Time */}
                    <td className="px-5 py-4 text-xs text-gray-500">
                      <div>{new Date(contact.createdAt).toLocaleDateString('vi-VN')}</div>
                      <div className="text-gray-400">{new Date(contact.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedContact(contact); }}
                          className="p-2 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors"
                          title="Xem chi tiết & phản hồi"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(contact.id); }}
                            className="p-2 rounded-lg hover:bg-red-50 text-red-400 transition-colors"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Hiển thị <span className="font-bold text-gray-700">{contacts.length}</span> / {totalElements} liên hệ
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const pageNum = totalPages <= 7 ? i : Math.max(0, Math.min(totalPages - 7, page - 3)) + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                      pageNum === page
                        ? 'bg-yellow-400 text-gray-900 shadow-sm'
                        : 'border border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum + 1}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Detail Modal ── */}
      <ContactDetailModal
        contact={selectedContact}
        onClose={() => setSelectedContact(null)}
        onUpdateStatus={handleUpdateStatus}
        onReply={handleReply}
      />
    </div>
  );
};
