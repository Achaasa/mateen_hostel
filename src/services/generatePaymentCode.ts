export const generateCodeEmail = (name: string, code?: string): string => {
  const accessCodeSection = code
    ? `
      <p><strong>Here is your access code:</strong></p>
      <div style="font-size: 24px; font-weight: bold; color: #000; margin: 16px 0;">${code}</div>
      <p>Please keep this code safe. It will be required for hostel access and verification.</p>
    `
    : `
      <p>Your payment was successful and has been added to your account.</p>
      <p>If you have any questions about your balance or access, please contact the hostel administration.</p>
    `;

  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
      <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #4CAF50;">🎉 Payment Confirmed</h2>
        <p>Hi ${name},</p>
        ${accessCodeSection}
        <hr />
        <p style="font-size: 12px; color: #888;">If you have questions, contact the hostel administration.</p>
      </div>
    </div>
  `;
};
