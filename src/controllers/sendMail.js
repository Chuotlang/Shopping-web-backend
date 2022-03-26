const nodemailer = require('nodemailer');
const {google} = require('googleapis');
const {OAuth2} = google.auth;
const OAUTHPLAYGROUND = "https://developer.google.com/oauthplayground";
const {
    SEND_MAIL,
    MAILING_CLIENT_ID,
    MAILING_CLIENT_SECRET,
    MAILING_CLIENT_REFRESH
} = process.env;

const oauth2Client = new OAuth2(
    MAILING_CLIENT_ID,
    MAILING_CLIENT_SECRET,
    MAILING_CLIENT_REFRESH,
    OAUTHPLAYGROUND
);
const sendMail = (to,url,txt)=>{
    oauth2Client.setCredentials({
        refresh_token:MAILING_CLIENT_REFRESH
    });

    const accessToken = oauth2Client.getAccessToken();

    const tmTransport = nodemailer.createTransport({
        service:"gmail",
        auth:{
            user:SEND_MAIL,
            type:"OAuth2",
            refreshToken:MAILING_CLIENT_REFRESH,
            clientId:MAILING_CLIENT_ID,
            clientSecret:MAILING_CLIENT_SECRET,
            accessToken
        }
    });

    const smOption = {
        to:to,
        from:SEND_MAIL,
        subject:"QUANG SHOP",
        html:`
        <div style="max-width: 700px; margin:auto; border: 10px solid #ddd; padding: 50px 20px; font-size: 110%;">
            <h2 style="text-align: center; text-transform: uppercase;color: teal;">Welcome to Test Shop.</h2>
            <p>Congratulations! You're almost set to start using Test Shop.
                Just click the button below to validate your email address.
            </p>
            
            <a href=${url} style="background: crimson; text-decoration: none; color: white; padding: 10px 20px; margin: 10px 0; display: inline-block;">${txt}</a>
        
            <p>If the button doesn't work for any reason, you can also click on the link below:</p>
        
            <div>${url}</div>
            </div>
        `
    };
    tmTransport.sendMail(smOption,(err,infor)=>{
        if(err) return err;
        return infor;
    })
}
module.exports = sendMail;