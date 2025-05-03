export const colorfulTemplate = (content: string, subject: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      font-family: 'Nunito', 'Segoe UI', sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f0f4f8;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.08);
    }
    .header {
      background: linear-gradient(45deg, #FF9966 0%, #FF5E62 100%);
      padding: 35px 20px;
      text-align: center;
      position: relative;
    }
    .header:after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 20px;
      background: linear-gradient(45deg, #FF9966 0%, #FF5E62 100%);
      clip-path: polygon(0 0, 5% 100%, 10% 0, 15% 100%, 20% 0, 25% 100%, 30% 0, 35% 100%, 40% 0, 45% 100%, 50% 0, 55% 100%, 60% 0, 65% 100%, 70% 0, 75% 100%, 80% 0, 85% 100%, 90% 0, 95% 100%, 100% 0);
    }
    .header h1 {
      color: white;
      margin: 0;
      font-weight: 800;
      font-size: 26px;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
    }
    .content {
      padding: 35px 40px;
      color: #4a4a4a;
    }
    .footer {
      background: linear-gradient(45deg, #43cea2 0%, #185a9d 100%);
      padding: 25px;
      text-align: center;
      font-size: 14px;
      color: white;
    }
    .btn {
      display: inline-block;
      background: linear-gradient(45deg, #43cea2 0%, #185a9d 100%);
      color: white;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 50px;
      font-weight: 700;
      margin-top: 20px;
      transition: all 0.3s ease;
      box-shadow: 0 4px 10px rgba(67, 206, 162, 0.3);
    }
    .btn:hover {
      transform: translateY(-3px);
      box-shadow: 0 6px 15px rgba(67, 206, 162, 0.4);
    }
    .highlight {
      background: linear-gradient(120deg, rgba(255, 94, 98, 0.1) 0%, rgba(255, 153, 102, 0.1) 100%);
      padding: 20px;
      border-radius: 10px;
      margin: 25px 0;
      border-left: 4px solid #FF5E62;
    }
    @media only screen and (max-width: 600px) {
      .container {
        width: 100%;
        border-radius: 0;
      }
      .content {
        padding: 25px 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${subject}</h1>
    </div>
    <div class="content">
      ${content}
      <div class="highlight">
        <p>We're excited to have you join us! If you have any questions, please don't hesitate to reach out.</p>
      </div>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} MyEvent. All rights reserved.
    </div>
  </div>
</body>
</html>
`
