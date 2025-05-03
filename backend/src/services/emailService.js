const nodemailer = require('nodemailer');

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendScheduleReport(run, schedule, recipients) {
  try {
    console.log('Preparing email report for schedule:', {
      scheduleId: schedule.id,
      scheduleName: schedule.name,
      recipients
    });

    // Format email content
    const subject = `API Test Report - ${schedule.name}`;
    const html = `
      <h2>API Test Report</h2>
      <p>Schedule: ${schedule.name}</p>
      <p>Run Time: ${new Date(run.startTime).toLocaleString()}</p>
      <p>Status: ${run.status}</p>
      <p>Total Tests: ${run.totalTests}</p>
      <p>Passed: ${run.passedTests}</p>
      <p>Failed: ${run.failedTests}</p>
      <p>Duration: ${run.duration}ms</p>
      ${run.failedTests > 0 ? `
        <h3>Failed Tests:</h3>
        <ul>
          ${run.results
            .filter(r => r.status === 'failed')
            .map(r => `
              <li>
                <strong>${r.name}</strong><br>
                Error: ${r.error}<br>
                Response: ${JSON.stringify(r.response, null, 2)}
              </li>
            `)
            .join('')}
        </ul>
      ` : ''}
    `;

    console.log('Email content prepared, attempting to send to recipients:', recipients);

    // Send email to each recipient
    for (const recipient of recipients) {
      console.log('Sending email to:', recipient);
      
      const mailOptions = {
        from: process.env.SMTP_FROM,
        to: recipient,
        subject,
        html,
      };

      console.log('Mail options:', {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject
      });

      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);
    }

    return true;
  } catch (error) {
    console.error('Error sending email report:', error);
    throw error;
  }
}

module.exports = {
  sendScheduleReport,
}; 