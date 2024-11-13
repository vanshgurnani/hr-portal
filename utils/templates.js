module.exports.sendOtpEmailTemplate = (otp) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verification Email</title>
</head>
<body style="background-color: #ffffff; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.4; color: #333333; margin: 0; padding: 0;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; text-align: center;">
        <h2 style="background-color: #FAD02E; color: black; padding: 10px; border-radius: 5px; max-width: 200px; margin: 15px auto;">Portfolio</h2>
        <div style="font-size: 18px; font-weight: bold; margin-bottom: 20px;">Reset Password</div>
        <div style="font-size: 16px; margin-bottom: 20px;">
            <p>Dear User,</p>
            <p>Thank you for using Portfolio. To reset your password, please use the following OTP (one-time password) to verify your account:</p>
            <h2 style="font-weight: bold;">${otp}</h2>
            <p>This OTP is valid for 5 minutes. If you did not request this verification, please disregard it. Once your account is verified, you will have access to our platform and its features.</p>
        </div>
        <div style="font-size: 14px; color: #999999; margin-top: 20px;">
            If you have any questions or need assistance, please feel free to reach out to Portfolio <a href="mailto:connect@portfolioindia.org">here</a>. We are here to help!
        </div>
    </div>
</body>
</html>`;