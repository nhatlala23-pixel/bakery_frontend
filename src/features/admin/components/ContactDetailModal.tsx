import { useState, useEffect, useRef } from 'react';
import {
  X, User, Mail, Phone, Tag, Clock, MessageSquare,
  Send, CheckCircle, AlertCircle, Loader2, CalendarDays,
  ChevronRight, ShieldCheck
} from 'lucide-react';
import { type ContactResponse } from '@/services/api/contactService';

// ─── Status helpers ────────────────────────────────────────────────────────
export const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string; icon: React.ReactNode }> = {
  PENDING: {
    label: 'Chưa xử lý',
    bg: 'bg-red-50',
    text: 'text-red-600',
    dot: 'bg-red-500',
    icon: <AlertCircle className="w-3 h-3" />,
  },
  PROCESSING: {
    label: 'Đang xử lý',
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    dot: 'bg-amber-400',
    icon: <Clock className="w-3 h-3" />,
  },
  REPLIED: {
    label: 'Đã phản hồi',
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    dot: 'bg-emerald-500',
    icon: <CheckCircle className="w-3 h-3" />,
  },
};

export const StatusBadge = ({ status }: { status: string }) => {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG['PENDING'];
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

// ─── Info row helper ───────────────────────────────────────────────────────
const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-gray-200 transition-colors">
    <div className="mt-0.5 w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-yellow-500 shadow-sm flex-shrink-0">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
      <p className="text-sm font-semibold text-gray-900 mt-0.5 break-all">{value || '—'}</p>
    </div>
  </div>
);

// ─── Props ─────────────────────────────────────────────────────────────────
interface Props {
  contact: ContactResponse | null;
  onClose: () => void;
  onUpdateStatus: (id: number, status: string) => Promise<void>;
  onReply: (id: number, message: string) => Promise<void>;
}

// ─── Modal Component ───────────────────────────────────────────────────────
export const ContactDetailModal = ({ contact, onClose, onUpdateStatus, onReply }: Props) => {
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [visible, setVisible] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Animation: mount → fade-in; close → fade-out then call onClose
  useEffect(() => {
    if (contact) {
      setTimeout(() => setVisible(true), 10);
      setReplyText('');
    }
  }, [contact]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 220);
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !contact) return;
    setSendingReply(true);
    try {
      await onReply(contact.id, replyText.trim());
      setReplyText('');
    } finally {
      setSendingReply(false);
    }
  };

  const handleMarkProcessing = async () => {
    if (!contact) return;
    setUpdatingStatus(true);
    try { await onUpdateStatus(contact.id, 'PROCESSING'); }
    finally { setUpdatingStatus(false); }
  };

  const handleMarkReplied = async () => {
    if (!contact) return;
    setUpdatingStatus(true);
    try { await onUpdateStatus(contact.id, 'REPLIED'); }
    finally { setUpdatingStatus(false); }
  };

  // ESC key to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (!contact) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200 ${
        visible ? 'bg-black/40 backdrop-blur-sm' : 'bg-black/0 backdrop-blur-none'
      }`}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        className={`bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl transition-all duration-220 flex flex-col max-h-[92vh] ${
          visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'
        }`}
      >
        {/* ── Header ── */}
        <div className="relative flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900 tracking-tight">
                Chi tiết liên hệ
                <span className="ml-2 text-sm font-medium text-gray-400">#{contact.id}</span>
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <StatusBadge status={contact.status} />
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Scrollable Body ── */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Customer Info Grid */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Thông tin khách hàng
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <InfoRow icon={<User className="w-4 h-4" />} label="Họ & tên" value={contact.name} />
              <InfoRow icon={<Mail className="w-4 h-4" />} label="Email" value={contact.email} />
              <InfoRow icon={<Phone className="w-4 h-4" />} label="Số điện thoại" value={contact.phone} />
              <InfoRow
                icon={<CalendarDays className="w-4 h-4" />}
                label="Thời gian gửi"
                value={new Date(contact.createdAt).toLocaleString('vi-VN')}
              />
            </div>
          </div>

          {/* Subject + Message */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" /> Nội dung liên hệ
            </p>
            <div className="rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 bg-yellow-50 border-b border-yellow-100 flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-bold text-gray-800">{contact.subject}</span>
              </div>
              <div className="px-4 py-4 bg-gray-50">
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {contact.message}
                </p>
              </div>
            </div>
          </div>

          {/* Previous reply */}
          {contact.adminReply && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Phản hồi đã gửi
              </p>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4">
                <p className="text-sm text-emerald-800 whitespace-pre-wrap leading-relaxed">{contact.adminReply}</p>
                {contact.repliedAt && (
                  <p className="text-[11px] text-emerald-500 mt-2 font-medium">
                    Gửi lúc: {new Date(contact.repliedAt).toLocaleString('vi-VN')}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Reply Box */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5" /> Phản hồi khách hàng
            </p>
            <textarea
              ref={textareaRef}
              rows={4}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Nhập nội dung phản hồi gửi đến khách hàng..."
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 resize-none transition-all"
            />
            <p className="text-[11px] text-gray-400 mt-1.5 text-right">{replyText.length} ký tự</p>
          </div>
        </div>

        {/* ── Footer Actions ── */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/80 flex flex-wrap items-center gap-3 flex-shrink-0">
          {/* Status Actions */}
          <div className="flex items-center gap-2 flex-1 flex-wrap">
            {contact.status === 'PENDING' && (
              <button
                onClick={handleMarkProcessing}
                disabled={updatingStatus}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-amber-300 bg-amber-50 text-amber-700 text-xs font-bold hover:bg-amber-100 transition-all disabled:opacity-60"
              >
                {updatingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
                Đang xử lý
              </button>
            )}
            {contact.status !== 'REPLIED' && (
              <button
                onClick={handleMarkReplied}
                disabled={updatingStatus}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-emerald-300 bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-all disabled:opacity-60"
              >
                {updatingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                Đánh dấu đã xử lý
              </button>
            )}
          </div>

          {/* Send Reply */}
          <button
            onClick={handleSendReply}
            disabled={!replyText.trim() || sendingReply}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-sm font-black shadow-md shadow-yellow-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            {sendingReply
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Send className="w-4 h-4" />
            }
            Gửi phản hồi
          </button>
        </div>
      </div>
    </div>
  );
};
