const { BrevoClient } = require('@getbrevo/brevo');

const brevo = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY,
});


const FONT_LINK = `<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@600;700;800&family=Nunito:wght@400;600;700&display=swap" rel="stylesheet">`;

const SENDER = { email: process.env.EMAIL_FROM, name: 'CampusConnect' };

const sendOTPEmail = async (toEmail, otpCode) => {
  await brevo.transactionalEmails.sendTransacEmail({
    sender: SENDER,
    to: [{ email: toEmail }],
    subject: 'Your CampusConnect Verification Code',
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>${FONT_LINK}</head>
      <body style="margin:0;padding:0;background:#FBF3E5;font-family:'Nunito',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#FBF3E5;padding:40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0"
                style="max-width:480px;background:#FFFDF8;border-radius:20px 8px 20px 8px;
                       border:1px solid #E9DCC3;overflow:hidden;">
                <tr>
                  <td style="background:#1D6F68;padding:28px 32px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:#f0a500;width:38px;height:38px;border-radius:10px;
                                   text-align:center;vertical-align:middle;">
                          <span style="font-family:Georgia,serif;font-weight:700;font-size:16px;color:#134F4A;">CC</span>
                        </td>
                        <td style="padding-left:10px;">
                          <span style="font-family:'Poppins',Georgia,serif;font-size:18px;font-weight:700;color:#ffffff;">
                            Campus<span style="color:#f0a500;">Connect</span>
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px;">
                    <h2 style="font-family:'Poppins',Georgia,serif;font-size:18px;font-weight:700;color:#134F4A;
                               margin:0 0 8px 0;">
                      Verify your university email
                    </h2>
                    <p style="font-size:14px;color:#8A8172;margin:0 0 24px 0;line-height:1.6;">
                      Thank you for joining CampusConnect, the peer learning
                      platform for Pakistani university students. Use the code
                      below to verify your email address.
                    </p>
                    <div style="background:#FBF3E5;border:1px dashed #E9DCC3;
                                border-radius:14px;padding:24px;text-align:center;margin-bottom:24px;">
                      <p style="font-family:'Poppins',Georgia,serif;font-size:11px;font-weight:600;color:#8A8172;
                                 margin:0 0 10px 0;text-transform:uppercase;letter-spacing:1.5px;">
                        Verification Code
                      </p>
                      <p style="font-family:'Poppins',Georgia,serif;font-size:40px;font-weight:700;color:#1D6F68;
                                 letter-spacing:12px;margin:0;">
                        ${otpCode}
                      </p>
                    </div>
                    <p style="font-size:13px;color:#8A8172;margin:0 0 8px 0;line-height:1.6;">
                      This code expires in <strong style="color:#3A3630;">10 minutes</strong>.
                      If you did not create a CampusConnect account, you can safely ignore this email.
                    </p>
                    <div style="background:#E7F0EA;border-radius:10px;padding:12px 14px;margin-top:20px;">
                      <p style="font-size:12px;color:#134F4A;margin:0;line-height:1.5;">
                        CampusConnect will never ask for your password or this code via email, phone, or chat.
                      </p>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 32px;border-top:1px solid #E9DCC3;background:#FBF3E5;">
                    <p style="font-size:12px;color:#8A8172;margin:0;text-align:center;line-height:1.6;">
                      CampusConnect · Learn Together, Grow Together<br/>
                      This is an automated email. Please do not reply.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  });
};

const sendPasswordResetEmail = async (toEmail, otpCode) => {
  await brevo.transactionalEmails.sendTransacEmail({
    sender: SENDER,
    to: [{ email: toEmail }],
    subject: 'Reset Your CampusConnect Password',
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>${FONT_LINK}</head>
      <body style="margin:0;padding:0;background:#FBF3E5;font-family:'Nunito',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#FBF3E5;padding:40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0"
                style="max-width:480px;background:#FFFDF8;border-radius:20px 8px 20px 8px;
                       border:1px solid #E9DCC3;overflow:hidden;">
                <tr>
                  <td style="background:#1D6F68;padding:28px 32px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:#f0a500;width:38px;height:38px;border-radius:10px;
                                   text-align:center;vertical-align:middle;">
                          <span style="font-family:Georgia,serif;font-weight:700;font-size:16px;color:#134F4A;">CC</span>
                        </td>
                        <td style="padding-left:10px;">
                          <span style="font-family:'Poppins',Georgia,serif;font-size:18px;font-weight:700;color:#ffffff;">
                            Campus<span style="color:#f0a500;">Connect</span>
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px;">
                    <h2 style="font-family:'Poppins',Georgia,serif;font-size:18px;font-weight:700;color:#134F4A;
                               margin:0 0 8px 0;">
                      Reset your password
                    </h2>
                    <p style="font-size:14px;color:#8A8172;margin:0 0 24px 0;line-height:1.6;">
                      We received a request to reset your CampusConnect password.
                      Use the code below to set a new password.
                    </p>
                    <div style="background:#FBF3E5;border:1px dashed #E9DCC3;
                                border-radius:14px;padding:24px;text-align:center;margin-bottom:24px;">
                      <p style="font-family:'Poppins',Georgia,serif;font-size:11px;font-weight:600;color:#8A8172;
                                 margin:0 0 10px 0;text-transform:uppercase;letter-spacing:1.5px;">
                        Reset Code
                      </p>
                      <p style="font-family:'Poppins',Georgia,serif;font-size:40px;font-weight:700;color:#1D6F68;
                                 letter-spacing:12px;margin:0;">
                        ${otpCode}
                      </p>
                    </div>
                    <p style="font-size:13px;color:#8A8172;margin:0 0 8px 0;line-height:1.6;">
                      This code expires in <strong style="color:#3A3630;">10 minutes</strong>.
                      If you did not request a password reset, you can safely ignore this email.
                      Your account remains secure.
                    </p>
                    <div style="background:#F5E6EA;border-radius:10px;padding:12px 14px;margin-top:20px;">
                      <p style="font-size:12px;color:#96475D;margin:0;line-height:1.5;">
                        If you did not request this reset, please change your password immediately
                        to keep your account safe.
                      </p>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 32px;border-top:1px solid #E9DCC3;background:#FBF3E5;">
                    <p style="font-size:12px;color:#8A8172;margin:0;text-align:center;line-height:1.6;">
                      CampusConnect · Learn Together, Grow Together<br/>
                      This is an automated email. Please do not reply.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  });
};

const sendSellerNotificationEmail = async (toEmail, title, body) => {
  await brevo.transactionalEmails.sendTransacEmail({
    sender: SENDER,
    to: [{ email: toEmail }],
    subject: title,
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>${FONT_LINK}</head>
      <body style="margin:0;padding:0;background:#FBF3E5;font-family:'Nunito',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#FBF3E5;padding:40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0"
                style="max-width:480px;background:#FFFDF8;border-radius:20px 8px 20px 8px;
                       border:1px solid #E9DCC3;overflow:hidden;">
                <tr>
                  <td style="background:#1D6F68;padding:24px 32px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:#f0a500;width:36px;height:36px;border-radius:9px;
                                   text-align:center;vertical-align:middle;">
                          <span style="font-family:Georgia,serif;font-weight:700;font-size:14px;color:#134F4A;">CC</span>
                        </td>
                        <td style="padding-left:10px;">
                          <span style="font-family:'Poppins',Georgia,serif;font-size:18px;font-weight:700;color:#ffffff;">
                            Campus<span style="color:#f0a500;">Connect</span>
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px 32px;">
                    <h2 style="font-family:'Poppins',Georgia,serif;font-size:18px;font-weight:700;color:#134F4A;margin:0 0 12px 0;">
                      ${title}
                    </h2>
                    <p style="font-size:14px;color:#8A8172;margin:0 0 24px 0;line-height:1.6;">
                      ${body}
                    </p>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:#E2903C;border-radius:999px;padding:12px 26px;">
                          <a href="${process.env.FRONTEND_URL}/resource-requests"
                             style="color:#ffffff;font-family:'Poppins',Georgia,serif;font-size:13.5px;font-weight:600;
                                    text-decoration:none;">
                            View Request
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 32px;border-top:1px solid #E9DCC3;background:#FBF3E5;">
                    <p style="font-size:12px;color:#8A8172;margin:0;text-align:center;line-height:1.6;">
                      CampusConnect · Learn Together, Grow Together<br/>
                      This is an automated notification. Please do not reply.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  });
};

module.exports = { sendOTPEmail, sendPasswordResetEmail, sendSellerNotificationEmail };