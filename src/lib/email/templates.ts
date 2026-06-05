interface OrderItem {
  name: string
  quantity: number
  unit: string
}

interface EmailParams {
  recipientName: string
  title: string
  bodyText: string
  orderId: string
  branchName: string
  branchCity: string
  status: string
  items: OrderItem[]
  magicLink: string
  companyName: string
}

const STATUS_COLOR: Record<string, string> = {
  submitted: '#f97316',
  approved:  '#16a34a',
  rejected:  '#dc2626',
  packing:   '#2563eb',
  loaded:    '#2563eb',
  shipped:   '#7c3aed',
  delivered: '#16a34a',
}

const STATUS_LABEL: Record<string, string> = {
  submitted: 'Waiting Approval',
  approved:  'Approved',
  rejected:  'Rejected',
  packing:   'Being Packed',
  loaded:    'Loaded',
  shipped:   'Shipped',
  delivered: 'Delivered',
}

export function buildOrderEmail({
  recipientName,
  title,
  bodyText,
  orderId,
  branchName,
  branchCity,
  status,
  items,
  magicLink,
  companyName,
}: EmailParams): string {
  const statusColor = STATUS_COLOR[status] || '#6b7280'
  const statusLabel = STATUS_LABEL[status] || status

  const itemRows = items.map(item => `
    <tr>
      <td style="padding: 10px 16px; border-bottom: 1px solid #f3f4f6; font-size: 14px; color: #374151;">
        ${item.name}
      </td>
      <td style="padding: 10px 16px; border-bottom: 1px solid #f3f4f6; font-size: 14px; color: #374151; text-align: right; white-space: nowrap;">
        <strong>${item.quantity}</strong> ${item.unit}
      </td>
    </tr>
  `).join('')

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f0e8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f0e8; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 580px;">

          <!-- Header -->
          <tr>
            <td style="background-color: #5B2D8E; padding: 24px 32px; border-radius: 16px 16px 0 0; text-align: center;">
              <p style="margin: 0; color: #c9a84c; font-size: 11px; font-weight: 800; letter-spacing: 4px; text-transform: uppercase;">
                ${companyName}
              </p>
              <p style="margin: 6px 0 0; color: rgba(255,255,255,0.5); font-size: 11px; letter-spacing: 2px; text-transform: uppercase;">
                Orzen Flow · Order Management
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color: #ffffff; padding: 32px;">

              <!-- Greeting -->
              <p style="margin: 0 0 4px; font-size: 13px; color: #9ca3af;">Hello, ${recipientName}</p>
              <h1 style="margin: 0 0 8px; font-size: 22px; font-weight: 700; color: #111827;">${title}</h1>
              <p style="margin: 0 0 24px; font-size: 14px; color: #6b7280; line-height: 1.6;">${bodyText}</p>

              <!-- Order card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
                <!-- Order ID + Status -->
                <tr>
                  <td style="padding: 16px 16px 12px; border-bottom: 1px solid #e5e7eb;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <p style="margin: 0; font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px;">Order</p>
                          <p style="margin: 2px 0 0; font-size: 16px; font-weight: 700; color: #111827; font-family: monospace;">${orderId}</p>
                        </td>
                        <td align="right" style="vertical-align: top;">
                          <span style="display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 700; background-color: ${statusColor}20; color: ${statusColor};">
                            ${statusLabel}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Branch -->
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">
                    <p style="margin: 0; font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px;">Branch</p>
                    <p style="margin: 2px 0 0; font-size: 14px; font-weight: 600; color: #374151;">${branchName} — ${branchCity}</p>
                  </td>
                </tr>

                <!-- Items header -->
                <tr>
                  <td style="padding: 12px 16px 4px;">
                    <p style="margin: 0; font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px;">
                      Order Items (${items.length})
                    </p>
                  </td>
                </tr>

                <!-- Items table -->
                <tr>
                  <td style="padding: 0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${itemRows}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${magicLink}"
                       style="display: inline-block; background-color: #5B2D8E; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 14px 36px; border-radius: 12px; letter-spacing: 0.5px;">
                      View Order →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0 0; font-size: 11px; color: #d1d5db; text-align: center; line-height: 1.6;">
                This link logs you in automatically and is valid for 1 hour.<br/>
                If you didn't expect this email, you can safely ignore it.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f3f4f6; padding: 16px 32px; border-radius: 0 0 16px 16px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 11px; color: #9ca3af;">
                Powered by <strong style="color: #c9a84c;">Orzen Flow</strong> · ${companyName}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}
