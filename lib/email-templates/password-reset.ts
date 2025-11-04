export const passwordResetEmailTemplate = (name: string, resetUrl: string) => {
  return {
    subject: 'Şifrənizi sıfırlayın - icma360',
    html: `
      <!DOCTYPE html>
      <html lang="az">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Şifrənizi sıfırlayın</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f8f9fa;
            line-height: 1.6;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            padding: 40px 30px;
            text-align: center;
          }
          .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .content {
            padding: 40px 30px;
          }
          .greeting {
            font-size: 18px;
            color: #374151;
            margin-bottom: 20px;
          }
          .message {
            color: #6b7280;
            font-size: 16px;
            margin-bottom: 30px;
          }
          .reset-button {
            display: inline-block;
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            color: #ffffff;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            margin: 20px 0;
            transition: all 0.3s ease;
          }
          .reset-button:hover {
            background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
          }
          .alternative-link {
            background-color: #f3f4f6;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            word-break: break-all;
            font-family: monospace;
            font-size: 14px;
            color: #374151;
          }
          .security-notice {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .security-notice h3 {
            color: #92400e;
            margin: 0 0 10px 0;
            font-size: 16px;
          }
          .security-notice p {
            color: #92400e;
            margin: 0;
            font-size: 14px;
          }
          .footer {
            background-color: #f9fafb;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
          }
          .footer p {
            color: #6b7280;
            font-size: 14px;
            margin: 5px 0;
          }
          .footer a {
            color: #dc2626;
            text-decoration: none;
          }
          .footer a:hover {
            text-decoration: underline;
          }
          @media (max-width: 600px) {
            .container {
              margin: 0;
              border-radius: 0;
            }
            .header, .content, .footer {
              padding: 20px;
            }
            .header h1 {
              font-size: 24px;
            }
            .reset-button {
              display: block;
              width: 100%;
              box-sizing: border-box;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset</h1>
          </div>
          
          <div class="content">
            <div class="greeting">Salam ${name},</div>
            <div class="message">
              icma360 hesabınız üçün şifrə sıfırlama tələbi aldıq. 
              Bu tələbi siz etdinizsə, yeni şifrə yaratmaq üçün aşağıdakı düyməni klikləyin.
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" class="reset-button">
                Şifrəmi Sıfırla
              </a>
            </div>
            
            <div class="message">
              Yuxarıdakı düymə işləmirsə, aşağıdakı linki brauzeriziə kopyalayıb yapışdıra bilərsiniz:
            </div>            <div class="alternative-link">
              ${resetUrl}
            </div>
            
            <div class="security-notice">
              <h3>🛡️ Təhlükəsizlik Bildirişi</h3>
              <p>
                Təhlükəsizliyiniz üçün bu şifrə sıfırlama linki 1 saat ərzində etibarsız olacaq. 
                Bu şifrə sıfırlamasını siz tələb etməmisinizsə, bu e-poçtu nəzərə almayın və ya 
                narahatlıqlarınız varsa dəstək komandamızla əlaqə saxlayın.
              </p>
            </div>
            
            <div class="message">
              Təhlükəsizliyiniz üçün bu link yalnız bir dəfə istifadə oluna bilər və 1 saat sonra etibarsız olacaq.
            </div>
          </div>
          
          <div class="footer">
            <p><strong>icma360</strong></p>
            <p style="margin: 5px 0; color: #6b7280; font-size: 14px;">Gənclərin və icmaların inkişafına dəstək platforması</p>
            <p>
              Sualınız varsa, bizimlə əlaqə saxlayın: 
              <a href="mailto:support@icma360.az">support@icma360.az</a>
            </p>
            <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
              Bu avtomatik mesajdır. Zəhmət olmasa bu e-poçta cavab verməyin.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Salam ${name},

      icma360 hesabınız üçün şifrə sıfırlama tələbi aldıq.

      Şifrənizi sıfırlamaq üçün zəhmət olmasa aşağıdakı linkə daxil olun:
      ${resetUrl}
      
      Təhlükəsizliyiniz üçün bu link 1 saat ərzində etibarsız olacaq.
      
      Bu şifrə sıfırlamasını siz tələb etməmisinizsə, bu e-poçtu nəzərə almayın.
      
      Hörmətlə,
      icma360 Komandası
      
      ---
      Bu avtomatik mesajdır. Zəhmət olmasa bu e-poçta cavab verməyin.
    `
  }
}

export const passwordChangedEmailTemplate = (name: string) => {
  return {
    subject: 'Şifrə uğurla dəyişdirildi - icma360',
    html: `
      <!DOCTYPE html>
      <html lang="az">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Şifrə Dəyişdirildi</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f8f9fa;
            line-height: 1.6;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #059669 0%, #047857 100%);
            padding: 40px 30px;
            text-align: center;
          }
          .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .content {
            padding: 40px 30px;
          }
          .greeting {
            font-size: 18px;
            color: #374151;
            margin-bottom: 20px;
          }
          .message {
            color: #6b7280;
            font-size: 16px;
            margin-bottom: 20px;
          }
          .success-notice {
            background-color: #d1fae5;
            border-left: 4px solid #10b981;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .success-notice h3 {
            color: #065f46;
            margin: 0 0 10px 0;
            font-size: 16px;
          }
          .success-notice p {
            color: #065f46;
            margin: 0;
            font-size: 14px;
          }
          .security-notice {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .security-notice h3 {
            color: #92400e;
            margin: 0 0 10px 0;
            font-size: 16px;
          }
          .security-notice p {
            color: #92400e;
            margin: 0;
            font-size: 14px;
          }
          .footer {
            background-color: #f9fafb;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
          }
          .footer p {
            color: #6b7280;
            font-size: 14px;
            margin: 5px 0;
          }
          .footer a {
            color: #dc2626;
            text-decoration: none;
          }
          .footer a:hover {
            text-decoration: underline;
          }
          @media (max-width: 600px) {
            .container {
              margin: 0;
              border-radius: 0;
            }
            .header, .content, .footer {
              padding: 20px;
            }
            .header h1 {
              font-size: 24px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Şifrə Yeniləndi</h1>
          </div>
          
          <div class="content">
            <div class="greeting">
              Salam ${name},
            </div>
            
            <div class="success-notice">
              <h3>🎉 Uğurlu!</h3>
              <p>
                Şifrəniz uğurla dəyişdirildi. Hesabınız indi yeni şifrə ilə təhlükəsizdir.
              </p>
            </div>
            
            <div class="message">
              Bu e-poçt şifrənizin ${new Date().toLocaleDateString('az-AZ', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZoneName: 'short'
              })} tarixində dəyişdirildiyini təsdiqləyir.
            </div>
            
            <div class="security-notice">
              <h3>🛡️ Təhlükəsizlik Bildirişi</h3>
              <p>
                Əgər bu dəyişikliyi siz etməmisinizsə, dərhal dəstək komandamızla əlaqə saxlayın. 
                Hesabınızın təhlükəsizliyi bizim üçün vacibdir.
              </p>
            </div>
            
            <div class="message">
              İndi yeni şifrənizlə hesabınıza daxil ola bilərsiniz. 
              Hesabınızı təhlükəsiz saxladığınız üçün təşəkkür edirik!
            </div>
          </div>
          
          <div class="footer">
            <p><strong>icma360</strong></p>
            <p style="margin: 5px 0; color: #6b7280; font-size: 14px;">Gənclərin və icmaların inkişafına dəstək platforması</p>
            <p>
              Sualınız varsa, bizimlə əlaqə saxlayın: 
              <a href="mailto:support@icma360.az">support@icma360.az</a>
            </p>
            <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
              Bu avtomatik mesajdır. Zəhmət olmasa bu e-poçta cavab verməyin.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Salam ${name},
      
      Şifrəniz uğurla dəyişdirildi.
      
      Bu dəyişiklik ${new Date().toLocaleDateString('az-AZ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      })} tarixində edildi.
      
      Əgər bu dəyişikliyi siz etməmisinizsə, dərhal dəstək komandamızla əlaqə saxlayın.
      
      Hörmətlə,
      icma360 Komandası
      
      ---
      Bu avtomatik mesajdır. Zəhmət olmasa bu e-poçta cavab verməyin.
    `
  }
}