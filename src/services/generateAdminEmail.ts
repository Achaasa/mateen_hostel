export const generateAdminWelcomeEmail = (email: string, password: string): string => `
  <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <h2 style="color: #4CAF50;">✅ Admin Account Created</h2>
      <p>Hello,</p>
      <p>Your admin account for the Hostel Management System has been successfully created. Here are your login credentials:</p>
      <ul>
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Password:</strong> ${password}</li>
      </ul>
      <p>Please log in and change your password after your first login.</p>
      <hr />
      <p style="font-size: 12px; color: #777;">If you did not request this account, please contact the system administrator.</p>
    </div>
  </div>
`;
