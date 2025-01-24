import nodemailer from 'nodemailer';

export const sendEmail = async (email: string, password: string) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,  // Sender's email
      pass: process.env.EMAIL_PASS,  // Sender's email password
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your Hostel Management Account Credentials',
    text: `Your account has been successfully created. Use the following credentials to log in:\n\nEmail: ${email}\nPassword: ${password}`,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};
