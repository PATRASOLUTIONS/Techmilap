export const minimalTemplate = (content: string, subject: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #ffffff;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      padding: 40px 0;
    }
    .header {
      padding: 0 40px 20px;
      border-bottom: 1px solid #eaeaea;
    }
    .header h1 {
      color: #000;
      margin: 0;
      font-weight: 500;
      font-size: 24px;
    }
    .content {
      padding: 30px 40px;
      color: #333;
    }
    .footer {
      padding: 20px 40px 0;
      text-align: left;
      font-size: 14px;
      color: #999;
      border-top: 1px solid #eaeaea;
    }
    .btn {
      display: inline-block;
      background-color: #000;
      color: white;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 4px;
      font-weight: 500;
      margin-top: 20px;
    }
    @media only screen and (max-width: 600px) {
      .container {
        width: 100%;
      }
      .header, .content, .footer {
        padding-left: 20px;
        padding-right: 20px;
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
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} MyEvent</p>
      <p>This email was sent to you as part of your event registration.</p>
    </div>
  </div>
</body>
</html>
`
