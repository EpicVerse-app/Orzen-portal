'use client'

import { useState } from 'react'
import { UserCheck, ChevronRight } from 'lucide-react'
import AssignVendorModal from './AssignVendorModal'
import GenerateOrderSheetButton from './GenerateOrderSheetButton'
import GeneratePOButton from './GeneratePOButton'
import WarehouseShipSection from './WarehouseShipSection'

interface Vendor {
  id: string
  name: string
  gst_number: string | null
  template_type: string
  address: string | null
  bank_name: string | null
  bank_account: string | null
  bank_ifsc: string | null
  terms: string | null
}

interface Category {
  name: string
  items: { id: string; name: string; quantity: number; unit?: string }[]
}

interface Assignment {
  id: string
  assignment_type: string
  category: string | null
  status: string
  vendor: Vendor
}

interface Props {
  orderId: string
  companyId: string
  companyName: string
  assignedBy: string
  orderDate: string
  branchName: string
  branchAddress?: string
  branchId: string
  orderStatus: string
  shippedPhotoUrl?: string | null
  vendors: Vendor[]
  categories: Category[]
  initialAssignments: Assignment[]
  initialBaseOrderNumber: string | null
}

export default function WarehouseOrderActions({
  orderId, companyId, companyName, assignedBy, orderDate, branchName, branchAddress,
  branchId, orderStatus, shippedPhotoUrl,
  vendors, categories, initialAssignments, initialBaseOrderNumber,
}: Props) {
  const [assignments, setAssignments]      = useState<Assignment[]>(initialAssignments)
  const [baseOrderNumber, setBaseOrderNum] = useState(initialBaseOrderNumber)
  const [showModal, setShowModal]          = useState(false)

  const isAssigned = assignments.length > 0

  function handleAssignDone(newOrderNum: string) {
    setBaseOrderNum(newOrderNum)
    setShowModal(false)
    window.location.reload()
  }

  // Build items per assignment for order sheet generation
  function itemsForAssignment(a: Assignment) {
    if (a.assignment_type === 'total') {
      return categories.flatMap(c =>
        c.items.map(i => ({ ...i, category: c.name }))
      )
    }
    const cat = categories.find(c => c.name === a.category)
    return (cat?.items ?? []).map(i => ({ ...i, category: a.category ?? '' }))
  }

  return (
    <>
      <div className="space-y-3">
        {/* Order ID badge */}
        {baseOrderNumber && (
          <div className="px-4 py-3 bg-[#570439]/5 rounded-xl border border-[#570439]/20">
            <span className="text-xs font-bold text-[#570439] tracking-widest">{baseOrderNumber}</span>
          </div>
        )}

        {/* Assignment summary */}
        {isAssigned && (
          <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
            {assignments.map(a => (
              <div key={a.id} className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{a.vendor.name}</p>
                  {a.category && (
                    <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wide">{a.category}</p>
                  )}
                </div>
                <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide ${
                  a.status === 'assigned'              ? 'bg-orange-100 text-orange-600'  :
                  a.status === 'order_sheet_generated' ? 'bg-blue-100 text-blue-600'      :
                  a.status === 'po_generated'          ? 'bg-purple-100 text-purple-600'  :
                  a.status === 'shipped'               ? 'bg-green-100 text-green-600'    :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {a.status.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Assign button */}
        <button
          onClick={() => setShowModal(true)}
          className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl bg-[#570439] text-white text-sm font-semibold hover:bg-[#6d0548] transition-colors"
        >
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4" />
            {isAssigned ? 'Re-assign Vendor' : 'Assign to Vendor'}
          </div>
          <ChevronRight className="w-4 h-4 opacity-60" />
        </button>

        {/* Order sheet buttons — one per assignment */}
        {isAssigned && baseOrderNumber && assignments.map(a => (
          <GenerateOrderSheetButton
            key={a.id}
            vendor={a.vendor}
            items={itemsForAssignment(a)}
            orderNumber={baseOrderNumber}
            orderDate={orderDate}
            branchName={branchName}
            companyName={companyName}
            categoryLabel={a.category ?? ''}
          />
        ))}

        {/* PO buttons — one per assignment */}
        {isAssigned && baseOrderNumber && assignments.map(a => (
          <GeneratePOButton
            key={`po-${a.id}`}
            orderNumber={a.category ? `${baseOrderNumber}_${a.category}` : baseOrderNumber}
            orderDate={orderDate}
            companyName={companyName}
            branchName={branchName}
            branchAddress={branchAddress}
            vendorName={a.vendor.name}
            vendorGst={a.vendor.gst_number}
            vendorAddress={a.vendor.address}
            items={itemsForAssignment(a)}
            categoryLabel={a.category ?? ''}
          />
        ))}

        {/* Shipping section — always shown, handles its own state */}
        <WarehouseShipSection
          orderId={orderId}
          companyId={companyId}
          branchId={branchId}
          orderNumber={baseOrderNumber ?? orderId.slice(0, 8).toUpperCase()}
          initialStatus={orderStatus}
          shippedPhotoUrl={shippedPhotoUrl}
        />
      </div>

      {showModal && (
        <AssignVendorModal
          orderId={orderId}
          companyId={companyId}
          assignedBy={assignedBy}
          vendors={vendors}
          categories={categories}
          onClose={() => setShowModal(false)}
          onDone={handleAssignDone}
        />
      )}
    </>
  )
}
