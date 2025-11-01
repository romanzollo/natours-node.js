const nodemailer = require('nodemailer');

const sendMail = async options => {
  // 1) создаем транспортер (доставщик)
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 2525,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  // Проверим соединение (полезно при отладке)
  // await transporter.verify();

  // 2) определяем основные параметры почты
  const mailOptions = {
    from: 'Roman Zlagodukhin <hello@roman.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    secure: false
  };

  // 3) отправляем почту с помощью nodemailer
  await transporter.sendMail(mailOptions);
};

module.exports = sendMail;
