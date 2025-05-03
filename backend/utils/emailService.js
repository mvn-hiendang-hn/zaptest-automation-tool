const nodemailer = require('nodemailer');

// Tạo transporter với cấu hình từ biến môi trường
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Hàm gửi email
const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });
    console.log('Email sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

// Hàm gửi email xác thực
const sendVerificationEmail = async (email, verificationToken) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
  
  const html = `
    <h1>Xác thực email của bạn</h1>
    <p>Vui lòng click vào link bên dưới để xác thực email của bạn:</p>
    <a href="${verificationUrl}">${verificationUrl}</a>
    <p>Link này sẽ hết hạn sau 24 giờ.</p>
  `;

  return sendEmail({
    to: email,
    subject: 'Xác thực email - API Tracker',
    html,
  });
};

// Hàm gửi email đặt lại mật khẩu
const sendPasswordResetEmail = async (email, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  
  const html = `
    <h1>Đặt lại mật khẩu</h1>
    <p>Vui lòng click vào link bên dưới để đặt lại mật khẩu của bạn:</p>
    <a href="${resetUrl}">${resetUrl}</a>
    <p>Link này sẽ hết hạn sau 1 giờ.</p>
  `;

  return sendEmail({
    to: email,
    subject: 'Đặt lại mật khẩu - API Tracker',
    html,
  });
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
}; 