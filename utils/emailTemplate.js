// emailTemplate.js
module.exports = () => {
  return `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Exclusive Promotional Offer</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                color: #333;
                margin: 0;
                padding: 0;
              }
    
              .container {
                width: 100%;
                max-width: 600px;
                margin: 0 auto;
                background-color: #fff;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
              }
    
              .header {
                text-align: center;
                background-color: #2c3e50;
                color: white;
                padding: 20px 0;
                border-radius: 8px 8px 0 0;
              }
    
              .header h1 {
                margin: 0;
                font-size: 24px;
              }
    
              .content {
                padding: 20px;
                text-align: center;
              }
    
              .content h2 {
                font-size: 20px;
                color: #2980b9;
              }
    
              .content p {
                font-size: 16px;
                line-height: 1.5;
                margin: 15px 0;
              }
    
              .cta-button {
                display: inline-block;
                background-color: #2980b9;
                color: white;
                padding: 10px 20px;
                font-size: 16px;
                text-decoration: none;
                border-radius: 5px;
                margin-top: 15px;
              }
    
              .footer {
                background-color: #2c3e50;
                color: white;
                padding: 10px;
                text-align: center;
                margin-top: 30px;
                font-size: 14px;
              }
            </style>
          </head>
          <body>
    
            <div class="container">
              <div class="header">
                <h1>Exclusive Promotional Offer from Hall Dekho!</h1>
              </div>
    
              <div class="content">
                <h2>Don't Miss Out on Incredible Deals!</h2>
                <p>We’re excited to offer you an exclusive opportunity to explore amazing halls for your events. At Hall Dekho, you can enjoy competitive pricing and the best venues to make your special occasions even more memorable.</p>
                <p>Visit Hall Dekho today and take advantage of our exciting offers. Whether it's a wedding, birthday, or corporate event, we have a variety of halls to suit your needs.</p>
                <a href="https://halldekho.vercel.app" class="cta-button">Explore Now</a>
                <p>Don't wait! The deal won't last forever. Grab it now!</p>
              </div>
    
              <div class="footer">
                <p>&copy; 2025 Hall Dekho. All rights reserved.</p>
              </div>
            </div>
    
          </body>
          </html>
        `;
};
