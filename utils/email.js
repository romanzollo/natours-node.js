const nodemailer = require('nodemailer');
const pug = require('pug');
const { convert } = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Roman Zlagodukhin <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // Resend через SMTP
      //   return nodemailer.createTransport({
      //     host: 'smtp.resend.com',
      //     port: 465,
      //     secure: true, // true для порта 465
      //     auth: {
      //       user: 'resend', // фиксированное значение
      //       pass: process.env.RESEND_API_KEY // API-ключ
      //     }
      //   });
      // gmail smtp
      return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT) || 465,
        secure: true,
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD
        }
      });
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 2525,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  // отправка актуального шаблона с актуальными данными
  async send(template, subject) {
    // 1) рендерим HTML на основе pug шаблона
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject
    });

    // 2) определяем основные параметры почты
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: convert(html)
    };

    // 3) создаем транспортер и отправляем почту с помощью транспортера (nodemailer)
    try {
      await this.newTransport().sendMail(mailOptions);
    } catch (err) {
      // В production отдаём пользователю безопасный 500, но тут логируем первопричину.
      console.error('📧 EMAIL SEND FAILED');
      console.error({
        message: err?.message,
        name: err?.name,
        code: err?.code,
        command: err?.command,
        responseCode: err?.responseCode,
        response: err?.response
      });
      throw err;
    }
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours Family!');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for 10 min)'
    );
  }
};

// module.exports = sendMail;
