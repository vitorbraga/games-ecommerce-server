export const subjectTemplates = {
    PASSWORD_RESET: 'Password reset',
    PASSWORD_RESET_SUCCESS: 'Your password has been reset'
};

export const bodyTemplates = {
    PASSWORD_RESET: '<p>Dear {name},<br>We received your request to reset your account password. By clicking the link below, '
        + 'you are presented with a form to choose a new password.</p><p>Please note that this link only works for 5 hours. If this link is '
        + 'expired, please generate another link.</p>'
        + '<p><a href={url}>Reset you password</a></p><p>King regards.</p>',
    PASSWORD_RESET_SUCCESS: '<p>Dear {name},<br>Your password has been changed. If you did not update your account, please tell us immediately. '
        + 'Submit a help request or email <a href="mailto:vitorcripto9@gmail.com">vitorcripto9@gmail.com</a>.</p>'
        + '<p>If you are having trouble accessing your account, <a href={url}>reset</a> your password</p><p>King regards.</p>'
};
