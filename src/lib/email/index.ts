import { Resend } from "resend"

const FROM = "Traffely <noreply@traffely.com>"
const APP_URL = process.env.NEXTAUTH_URL ?? "https://traffely.com"

interface InviteEmailParams {
  to: string
  name: string
  workspaceName: string
  role: string
  password: string
  inviterName: string
}

const ROLE_LABELS: Record<string, string> = {
  CREATIVO: "Creativo",
  TRAFFICKER: "Trafficker",
  VIEWER: "Viewer",
}

export async function sendInviteEmail(params: InviteEmailParams) {
  const { to, name, workspaceName, role, password, inviterName } = params
  const roleLabel = ROLE_LABELS[role] ?? role
  const loginUrl = `${APP_URL}/login`

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e4e4e7;">
        <!-- Header -->
        <tr>
          <td style="background:#09090b;padding:24px 32px;">
            <p style="margin:0;font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">Traffely</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#09090b;line-height:1.3;">
              Has sido invitado a ${workspaceName}
            </p>
            <p style="margin:0 0 24px;font-size:14px;color:#71717a;line-height:1.6;">
              ${inviterName} te agregó como <strong>${roleLabel}</strong> en el workspace <strong>${workspaceName}</strong> en Traffely.
            </p>

            <!-- Credentials box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;border-radius:12px;margin-bottom:28px;">
              <tr><td style="padding:20px 24px;">
                <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.05em;">TUS CREDENCIALES DE ACCESO</p>
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
                  <tr>
                    <td style="padding:6px 0;font-size:13px;color:#71717a;width:80px;">Email</td>
                    <td style="padding:6px 0;font-size:13px;font-weight:600;color:#09090b;font-family:monospace;">${to}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;font-size:13px;color:#71717a;">Contraseña</td>
                    <td style="padding:6px 0;font-size:13px;font-weight:600;color:#09090b;font-family:monospace;">${password}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;font-size:13px;color:#71717a;">Rol</td>
                    <td style="padding:6px 0;font-size:13px;font-weight:600;color:#09090b;">${roleLabel}</td>
                  </tr>
                </table>
              </td></tr>
            </table>

            <!-- CTA -->
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#09090b;border-radius:10px;">
                  <a href="${loginUrl}" style="display:block;padding:14px 28px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">
                    Ingresar a Traffely →
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:24px 0 0;font-size:12px;color:#a1a1aa;line-height:1.6;">
              Recomendamos cambiar tu contraseña después del primer ingreso.<br>
              Si tienes dudas, contacta a ${inviterName} directamente.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px;border-top:1px solid #e4e4e7;">
            <p style="margin:0;font-size:11px;color:#a1a1aa;">
              Traffely · Gestión de campañas Meta Ads para LatAm
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY no configurada — email de invitación omitido")
    return
  }
  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: FROM,
    to,
    subject: `${inviterName} te invitó a ${workspaceName} en Traffely`,
    html,
  })
}
