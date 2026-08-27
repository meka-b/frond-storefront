import React from 'react';
import { json } from '@remix-run/node';
import { useLoaderData, useFetcher } from '@remix-run/react';
import db from '../../server/db/index.js';
import {
  Mail,
  Trash2,
  Download,
  Users
} from 'lucide-react';

export const loader = async () => {
  const subscribers = db.prepare('SELECT * FROM newsletter_subscribers ORDER BY created_at DESC').all();
  return json({ subscribers });
};

export const action = async ({ request }) => {
  const formData = await request.formData();
  const id = formData.get('id');
  if (id) {
    db.prepare('DELETE FROM newsletter_subscribers WHERE id = ?').run(id);
    return json({ success: true });
  }
  return json({ success: false });
};

export default function AdminNewsletter() {
  const { subscribers } = useLoaderData();
  const fetcher = useFetcher();

  const exportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + "Email,Status,Created At\n"
      + subscribers.map(e => `"${e.email}","${e.status}","${e.created_at}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `frond_subscribers_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1D2A1C] font-serif">E-Bülten Aboneleri (Sunday Cuttings)</h2>
          <p className="text-xs text-[#7A8377] mt-0.5">
            Storefront'taki "Sunday cuttings" e-posta bültenine kaydolan bitki severler.
          </p>
        </div>
        <button
          type="button"
          onClick={exportCSV}
          className="inline-flex items-center gap-1.5 text-xs bg-[#F4F3EE] hover:bg-[#EAE8E0] text-[#1D2A1C] px-3.5 py-2 rounded-lg border border-[#DDDCD5] font-medium transition shadow-2xs"
        >
          <Download className="w-4 h-4" />
          <span>CSV Olarak İndir</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E8E6DF] overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#FAF9F6] border-b border-[#E8E6DF] text-[#7A8377] font-mono text-[10px] uppercase">
            <tr>
              <th className="py-3 px-4">E-Posta Adresi</th>
              <th className="py-3 px-3">Durum</th>
              <th className="py-3 px-3">Kayıt Tarihi</th>
              <th className="py-3 px-3 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0EFEB]">
            {subscribers.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-[#7A8377]">
                  Henüz abone kaydı bulunmuyor.
                </td>
              </tr>
            ) : (
              subscribers.map((sub) => (
                <tr key={sub.id} className="hover:bg-[#FAF9F6]">
                  <td className="py-3 px-4 font-mono font-medium text-[#1D2A1C]">{sub.email}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                      {sub.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-[#7A8377]">
                    {new Date(sub.created_at).toLocaleString('tr-TR')}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <fetcher.Form method="post" className="inline-block">
                      <input type="hidden" name="id" value={sub.id} />
                      <button type="submit" className="p-1 text-[#888] hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </fetcher.Form>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
