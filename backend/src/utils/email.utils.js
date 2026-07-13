const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOTPEmail = async (toEmail, otpCode) => {
  const mailOptions = {
    from: `"CampusConnect" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Your CampusConnect Verification Code',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background:#F8FAFC;font-family:'Inter',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0"
                style="max-width:480px;background:#ffffff;border-radius:12px;
                       border:1px solid #E2E8F0;overflow:hidden;">

                <!-- Header -->
                <tr>
                  <td style="background:#1E3A8A;padding:28px 32px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:40px;height:40px;vertical-align:middle;">
                          <img src="https://campusconnect.vercel.app/logo.png"
                              alt="CC" width="40" height="40"
                              style="display:block;object-fit:contain;" />
                        </td>
                        <td style="padding-left:10px;">
                          <span style="font-size:18px;font-weight:700;color:#ffffff;">
                            Campus<span style="color:#f0a500;">Connect</span>
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:32px;">
                    <h2 style="font-size:18px;font-weight:700;color:#0F172A;
                               margin:0 0 8px 0;">
                      Verify your university email
                    </h2>
                    <p style="font-size:14px;color:#64748B;margin:0 0 24px 0;
                               line-height:1.6;">
                      Thank you for joining CampusConnect,the peer learning
                      platform for Pakistani university students. Use the code
                      below to verify your email address.
                    </p>

                    <!-- OTP Box -->
                    <div style="background:#F8FAFC;border:1px solid #E2E8F0;
                                border-radius:8px;padding:24px;text-align:center;
                                margin-bottom:24px;">
                      <p style="font-size:12px;font-weight:500;color:#64748B;
                                 margin:0 0 10px 0;text-transform:uppercase;
                                 letter-spacing:1px;">
                        Verification Code
                      </p>
                      <p style="font-size:40px;font-weight:700;color:#1E3A8A;
                                 letter-spacing:12px;margin:0;">
                        ${otpCode}
                      </p>
                    </div>

                    <p style="font-size:13px;color:#64748B;margin:0 0 8px 0;
                               line-height:1.6;">
                      This code expires in
                      <strong style="color:#0F172A;">10 minutes</strong>.
                      If you did not create a CampusConnect account, you can
                      safely ignore this email.
                    </p>

                    <!-- Security note -->
                    <div style="background:#EFF6FF;border-radius:6px;
                                padding:12px 14px;margin-top:20px;">
                      <p style="font-size:12px;color:#1E3A8A;margin:0;line-height:1.5;">
                        CampusConnect will never ask for your password or this
                        code via email, phone, or chat.
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding:20px 32px;border-top:1px solid #E2E8F0;
                              background:#F8FAFC;">
                    <p style="font-size:12px;color:#94A3B8;margin:0;
                               text-align:center;line-height:1.6;">
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
  };

  await transporter.sendMail(mailOptions);
};

const sendPasswordResetEmail = async (toEmail, otpCode) => {
  const mailOptions = {
    from: `"CampusConnect" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Reset Your CampusConnect Password',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background:#F8FAFC;font-family:'Inter',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0"
                style="max-width:480px;background:#ffffff;border-radius:12px;
                       border:1px solid #E2E8F0;overflow:hidden;">

                <!-- Header -->
                <tr>
                  <td style="background:#1E3A8A;padding:28px 32px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:40px;height:40px;vertical-align:middle;">
                          <img src="https://campusconnect.vercel.app/logo.png"
                              alt="CC" width="40" height="40"
                              style="display:block;object-fit:contain;" />
                        </td>
                        <td style="padding-left:10px;">
                          <span style="font-size:18px;font-weight:700;color:#ffffff;">
                            Campus<span style="color:#f0a500;">Connect</span>
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:32px;">
                    <h2 style="font-size:18px;font-weight:700;color:#0F172A;
                               margin:0 0 8px 0;">
                      Reset your password
                    </h2>
                    <p style="font-size:14px;color:#64748B;margin:0 0 24px 0;
                               line-height:1.6;">
                      We received a request to reset your CampusConnect password.
                      Use the code below to set a new password.
                    </p>

                    <!-- OTP Box -->
                    <div style="background:#F8FAFC;border:1px solid #E2E8F0;
                                border-radius:8px;padding:24px;text-align:center;
                                margin-bottom:24px;">
                      <p style="font-size:12px;font-weight:500;color:#64748B;
                                 margin:0 0 10px 0;text-transform:uppercase;
                                 letter-spacing:1px;">
                        Reset Code
                      </p>
                      <p style="font-size:40px;font-weight:700;color:#1E3A8A;
                                 letter-spacing:12px;margin:0;">
                        ${otpCode}
                      </p>
                    </div>

                    <p style="font-size:13px;color:#64748B;margin:0 0 8px 0;
                               line-height:1.6;">
                      This code expires in
                      <strong style="color:#0F172A;">10 minutes</strong>.
                      If you did not request a password reset, you can safely
                      ignore this email.Your account remains secure.
                    </p>

                    <!-- Security note -->
                    <div style="background:#FEF2F2;border-radius:6px;
                                padding:12px 14px;margin-top:20px;">
                      <p style="font-size:12px;color:#DC2626;margin:0;line-height:1.5;">
                        If you did not request this reset, please change your
                        password immediately to keep your account safe.
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding:20px 32px;border-top:1px solid #E2E8F0;
                              background:#F8FAFC;">
                    <p style="font-size:12px;color:#94A3B8;margin:0;
                               text-align:center;line-height:1.6;">
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
  };

  await transporter.sendMail(mailOptions);
};

const sendSellerNotificationEmail = async (toEmail, title, body) => {
  const mailOptions = {
    from: `"CampusConnect" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: title,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background:#F8FAFC;font-family:'Inter',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0"
                style="max-width:480px;background:#ffffff;border-radius:12px;
                       border:1px solid #E2E8F0;overflow:hidden;">

                <!-- Header -->
                <tr>
                  <td style="background:#1E3A8A;padding:24px 32px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:#f0a500;width:36px;height:36px;
                                   border-radius:8px;text-align:center;
                                   vertical-align:middle;padding:0 8px;">
                          <span style="color:#0F172A;font-size:14px;font-weight:800;">CC</span>
                        </td>
                        <td style="padding-left:10px;">
                          <span style="font-size:18px;font-weight:700;color:#ffffff;">
                            Campus<span style="color:#f0a500;">Connect</span>
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:28px 32px;">
                    <h2 style="font-size:18px;font-weight:700;color:#0F172A;margin:0 0 12px 0;">
                      ${title}
                    </h2>
                    <p style="font-size:14px;color:#64748B;margin:0 0 24px 0;line-height:1.6;">
                      ${body}
                    </p>

                    <!-- CTA -->
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:#1E3A8A;border-radius:6px;padding:12px 24px;">
                          <a href="${process.env.FRONTEND_URL}/resource-requests"
                             style="color:#ffffff;font-size:14px;font-weight:600;
                                    text-decoration:none;">
                            View Request
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding:20px 32px;border-top:1px solid #E2E8F0;background:#F8FAFC;">
                    <p style="font-size:12px;color:#94A3B8;margin:0;text-align:center;line-height:1.6;">
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
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendOTPEmail, sendPasswordResetEmail, sendSellerNotificationEmail };