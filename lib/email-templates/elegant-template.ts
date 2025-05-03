export const elegantTemplate = (content: string, subject: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      font-family: 'Georgia', Times, serif;
      line-height: 1.7;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f8f7f4;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border: 1px solid #e0d9c8;
      border-radius: 4px;
      overflow: hidden;
    }
    .header {
      background-color: #2c3e50;
      padding: 30px 20px;
      text-align: center;
      border-bottom: 3px solid #e0d9c8;
    }
    .header h1 {
      color: #f8f7f4;
      margin: 0;
      font-weight: normal;
      font-size: 28px;
      letter-spacing: 1px;
    }
    .content {
      padding: 35px 40px;
      color: #4a4a4a;
    }
    .footer {
      background-color: #f8f7f4;
      padding: 20px;
      text-align: center;
      font-size: 14px;
      color: #7d7d7d;
      border-top: 1px solid #e0d9c8;
    }
    .btn {
      display: inline-block;
      background-color: #2c3e50;
      color: white;
      text-decoration: none;
      padding: 12px 28px;
      border-radius: 2px;
      font-family: 'Georgia', Times, serif;
      margin-top: 20px;
      transition: all 0.3s ease;
    }
    .btn:hover {
      background-color: #3e5871;
    }
    .divider {
      height: 1px;
      background-color: #e0d9c8;
      margin: 25px 0;
    }
    @media only screen and (max-width: 600px) {
      .container {
        width: 100%;
        border-radius: 0;
        border-left: none;
        border-right: none;
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
      <div class="divider"></div>
      <p style="font-style: italic; text-align: center; color: #7d7d7d;">Thank you for your attention</p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} MyEvent. All rights reserved.
    </div>
  </div>
</body>
</html>
`
