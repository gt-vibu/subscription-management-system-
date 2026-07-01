const nodemailer = require('nodemailer');
const { sendEmail } = require('../../services/emailService');

jest.mock('nodemailer');

beforeEach(() => {
  jest.clearAllMocks();
  delete process.env.EMAIL_HOST;
  delete process.env.EMAIL_PORT;
  delete process.env.EMAIL_USER;
  delete process.env.EMAIL_PASS;
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  console.log.mockRestore();
  console.error.mockRestore();
});

describe('emailService - sendEmail', () => {
  it('should log to console in development fallback (no SMTP env vars)', async () => {
    await sendEmail({
      email: 'user@example.com',
      subject: 'Test Subject',
      message: 'Test Message'
    });

    expect(console.log).toHaveBeenCalled();
    expect(nodemailer.createTransport).not.toHaveBeenCalled();
  });

  it('should use SMTP transporter when env vars are set', async () => {
    process.env.EMAIL_HOST = 'smtp.test.com';
    process.env.EMAIL_PORT = '587';
    process.env.EMAIL_USER = 'testuser';
    process.env.EMAIL_PASS = 'testpass';

    const sendMailMock = jest.fn().mockResolvedValue({ messageId: '123' });
    nodemailer.createTransport.mockReturnValue({ sendMail: sendMailMock });

    await sendEmail({
      email: 'user@example.com',
      subject: 'Test',
      message: 'Hello',
      html: '<p>Hello</p>'
    });

    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: 'smtp.test.com',
      port: 587,
      secure: false,
      auth: { user: 'testuser', pass: 'testpass' }
    });
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@example.com',
        subject: 'Test',
        text: 'Hello',
        html: '<p>Hello</p>'
      })
    );
  });

  it('should set secure to true for port 465', async () => {
    process.env.EMAIL_HOST = 'smtp.test.com';
    process.env.EMAIL_PORT = '465';
    process.env.EMAIL_USER = 'user';
    process.env.EMAIL_PASS = 'pass';

    const sendMailMock = jest.fn().mockResolvedValue({});
    nodemailer.createTransport.mockReturnValue({ sendMail: sendMailMock });

    await sendEmail({ email: 'a@b.com', subject: 's', message: 'm' });

    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ secure: true })
    );
  });

  it('should fallback to console on SMTP failure', async () => {
    process.env.EMAIL_HOST = 'smtp.test.com';
    process.env.EMAIL_PORT = '587';
    process.env.EMAIL_USER = 'user';
    process.env.EMAIL_PASS = 'pass';

    const sendMailMock = jest.fn().mockRejectedValue(new Error('Connection refused'));
    nodemailer.createTransport.mockReturnValue({ sendMail: sendMailMock });

    await sendEmail({ email: 'a@b.com', subject: 's', message: 'm' });

    expect(console.error).toHaveBeenCalledWith('Error sending email via SMTP:', 'Connection refused');
    expect(console.log).toHaveBeenCalled();
  });
});
