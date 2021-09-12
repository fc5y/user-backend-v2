import { ApiResponse, fetchApi } from '../fetch-utils';
import { EMAIL_SERVICE_ORIGIN, SENDER_EMAIL } from '../common-config';
import { getUrl } from '../get-url';

const EMAIL_TEMPLATE_ID = {
  OTP_EMAIL_TEMPLATE_ID: 10001,
};

// #region POST /email/v1/send

export type SendOtpEmailParams = {
  recipient_email: string;
  displayed_name: string;
  otp: string;
};

export async function sendOtpEmail({ recipient_email, displayed_name, otp }: SendOtpEmailParams) {
  const url = getUrl({
    origin: EMAIL_SERVICE_ORIGIN,
    pathname: '/email/v1/send',
  });
  const { error, error_msg, data } = await fetchApi({
    method: 'POST',
    url,
    body: {
      sender_email: SENDER_EMAIL,
      recipient_email,
      template_id: EMAIL_TEMPLATE_ID.OTP_EMAIL_TEMPLATE_ID,
      params: {
        displayed_name,
        otp,
      },
    },
  });
  return { error, error_msg, data };
}

// #endregion
