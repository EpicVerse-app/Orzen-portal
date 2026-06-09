import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Settings, Building2, Palette, Image as ImageIcon } from 'lucide-react'

export default async function AdminSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('users').select('role,company_id').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const { data: company } = await supabase
    .from('companies')
    .select('id,name,slug,logo_url,primary_color,sidebar_color,background_image_url')
    .eq('id', profile.company_id)
    .single()

  return (
    <div className="px-4 sm:px-6 py-6 max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-400 mt-0.5">Company configuration</p>
      </div>

      {/* Company info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Building2 className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-bold text-gray-700">Company Info</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Name</p>
            <p className="font-semibold text-gray-800">{company?.name}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Slug</p>
            <p className="font-semibold text-gray-800">{company?.slug}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Company ID</p>
            <p className="text-xs text-gray-500 font-mono truncate">{company?.id}</p>
          </div>
        </div>
      </div>

      {/* Branding */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Palette className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-bold text-gray-700">Brand Colours</h2>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl border border-gray-200 shadow-sm"
              style={{ backgroundColor: company?.primary_color || '#570439' }} />
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Primary</p>
              <p className="text-xs font-mono text-gray-700">{company?.primary_color || '#570439'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl border border-gray-200 shadow-sm"
              style={{ backgroundColor: company?.sidebar_color || '#570439' }} />
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Sidebar</p>
              <p className="text-xs font-mono text-gray-700">{company?.sidebar_color || '#570439'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Logo & Images */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <ImageIcon className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-bold text-gray-700">Logo & Background</h2>
        </div>
        {company?.logo_url ? (
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">Current Logo</p>
            <img src={company.logo_url} alt="Logo" className="h-12 object-contain rounded-lg border border-gray-100 p-1 bg-gray-50" />
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">No logo uploaded</p>
        )}
        {company?.background_image_url && (
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">Background Image</p>
            <img src={company.background_image_url} alt="Background" className="h-20 w-full object-cover rounded-xl border border-gray-100" />
          </div>
        )}
        <p className="text-xs text-gray-400 bg-gray-50 rounded-xl p-3">
          To update logo or colours, contact your Orzen Flow administrator or update directly via Supabase.
        </p>
      </div>
    </div>
  )
}
