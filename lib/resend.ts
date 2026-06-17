import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendReminderEmail({
  to,
  subject,
  body,
}: {
  to: string
  subject: string
  body: string
}) {
  const { error } = await resend.emails.send({
    from: 'CasaFlow <reminder@casaflow.app>',
    to,
    subject,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1a1a1a; margin-bottom: 16px;">CasaFlow</h2>
        <p style="color: #444; line-height: 1.6;">${body}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">Email ini dikirim otomatis oleh CasaFlow.</p>
      </div>
    `,
  })

  if (error) {
    console.error('[resend] Error:', error)
    throw new Error(error.message)
  }
}
