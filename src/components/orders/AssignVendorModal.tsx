'use client'

import { useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { X, User2, Tag } from 'lucide-react'
import { assignVendor } from '@/app/actions/warehouse'
import toast from 'react-hot-toast'

interface Vendor {
  id: string
  name: string
  gst_number: string | null
  template_type: string
}

interface Category {
  name: string
  items: { id: string; name: string; quantity: number }[]
}

interface Props {
  orderId: string
  companyId: string
  assignedBy: string
  vendors: Vendor[]
  categories: Category[]
  onClose: () => void
  onDone: (baseOrderNumber: string) => void
}

export default function AssignVendorModal({
  orderId, companyId, assignedBy, vendors, categories, onClose, onDone,
}: Props) {
  const [mode, setMode]         = useState<'total' | 'category'>('total')
  const [totalVendor, setTotal] = useState('')
  const [catVendors, setCat]    = useState<Record<string, string>>({})
  const [pending, startT]       = useTransition()

  function setCategoryVendor(cat: string, vid: string) {
    setCat(prev => ({ ...prev, [cat]: vid }))
  }

  function canSubmit() {
    if (mode === 'total') return !!totalVendor
    return categories.every(c => !!catVendors[c.name])
  }

  function handleSubmit() {
    if (!canSubmit()) return
    const assignments =
      mode === 'total'
        ? [{ vendorId: totalVendor }]
        : categories.map(c => ({ vendorId: catVendors[c.name], category: c.name }))

    startT(async () => {
      const result = await assignVendor({
        orderId, companyId, assignedBy,
        assignmentType: mode,
        assignments,
      })
      if ('error' in result) {
        console.error('[assignVendor]', result.error)
        toast.error(`Failed: ${result.error}`)
      } else {
        toast.success('Vendor assigned!')
        onDone(result.baseOrderNumber)
      }
    })
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Assign to Vendor</h2>
            <p className="text-xs text-gray-400 mt-0.5">Choose how to assign this order</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
          {/* Mode toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setMode('total')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                mode === 'total'
                  ? 'bg-[#570439] text-white border-[#570439]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              <User2 className="w-4 h-4" />
              Total Order
            </button>
            <button
              onClick={() => setMode('category')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                mode === 'category'
                  ? 'bg-[#570439] text-white border-[#570439]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              <Tag className="w-4 h-4" />
              By Category
            </button>
          </div>

          {/* Total mode */}
          {mode === 'total' && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Select Vendor</p>
              <div className="space-y-2">
                {vendors.map(v => (
                  <button
                    key={v.id}
                    onClick={() => setTotal(v.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                      totalVendor === v.id
                        ? 'border-[#570439] bg-[#570439]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className={`text-sm font-semibold ${totalVendor === v.id ? 'text-[#570439]' : 'text-gray-800'}`}>
                      {v.name}
                    </p>
                    {v.gst_number && (
                      <p className="text-xs text-gray-400 mt-0.5">GST: {v.gst_number}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Category mode */}
          {mode === 'category' && (
            <div className="space-y-4">
              {categories.map(cat => (
                <div key={cat.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">{cat.name}</p>
                    <span className="text-xs text-gray-400">{cat.items.length} item{cat.items.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="space-y-1.5">
                    {vendors.map(v => (
                      <button
                        key={v.id}
                        onClick={() => setCategoryVendor(cat.name, v.id)}
                        className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-sm transition-all ${
                          catVendors[cat.name] === v.id
                            ? 'border-[#570439] bg-[#570439]/5 text-[#570439] font-semibold'
                            : 'border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {v.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit() || pending}
            className="w-full py-3.5 rounded-xl bg-[#570439] text-white text-sm font-bold hover:bg-[#6d0548] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {pending
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Assigning…</>
              : 'Confirm Assignment'
            }
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
