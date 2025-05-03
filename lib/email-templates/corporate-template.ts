export const corporateTemplate = (content: string, subject: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      font-family: Arial, Helvetica, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border: 1px solid #e1e1e1;
    }
    .header {
      background-color: #003366;
      padding: 20px;
      text-align: center;
    }
    .header h1 {
      color: white;
      margin: 0;
      font-weight: bold;
      font-size: 22px;
    }
    .content {
      padding: 30px;
      color: #333;
    }
    .footer {
      background-color: #f9f9f9;
      padding: 15px;
      text-align: center;
      font-size: 12px;
      color: #666;
      border-top: 1px solid #e1e1e1;
    }
    .btn {
      display: inline-block;
      background-color: #003366;
      color: white;
      text-decoration: none;
      padding: 10px 20px;
      font-weight: bold;
      margin-top: 20px;
    }
    .disclaimer {
      font-size: 11px;
      color: #999;
      margin-top: 30px;
      padding-top: 10px;
      border-top: 1px solid #e1e1e1;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    table, th, td {
      border: 1px solid #e1e1e1;
    }
    th, td {
      padding: 10px;
      text-align: left;
    }
    th {
      background-color: #f2f2f2;
    }
    @media only screen and (max-width: 600px) {
      .container {
        width: 100%;
      }
      .content {
        padding: 20px;
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
      <div class="disclaimer">
        <p>CONFIDENTIALITY NOTICE: This email and any attachments are for the exclusive and confidential use of the intended recipient. If you are not the intended recipient, please do not read, distribute, or take action in reliance upon this message.</p>
      </div>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} MyEvent. All rights reserved.</p>
      <p>123 Business Avenue, Suite 100, Business City, BC 12345</p>
    </div>
  </div>
</body>
</html>
`
