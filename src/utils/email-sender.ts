import * as nodemailer from 'nodemailer';
import Email = require('email-templates');

const env = process.env.NODE_ENV || 'development';

export interface EmailOptions {
    destinationEmail: string;
    template: string;
    localValues: { [key: string]: string };
    attachments?: { name: string, content: string }[];
}

const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
    });
};

export const sendEmail = (emailOptions: EmailOptions) => {
    const transporter = createTransporter();

    const email = new Email({
        message: {
            from: process.env.EMAIL_USERNAME,
            attachments: emailOptions.attachments
        },
        send: true,
        transport: transporter,
        subjectPrefix: env === 'production' ? false : `[${env.toUpperCase()}] `
    });

    email
        .send({
            template: emailOptions.template,
            message: {
                to: emailOptions.destinationEmail
            },
            locals: emailOptions.localValues
        })
        .then((result) => {
            console.log('Email sent to ', emailOptions.destinationEmail);
        })
        .catch((err) => {
            console.error('Email not sent', err);
        });
};
