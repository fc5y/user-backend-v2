import { fetchApi } from '../fetch-utils';
import { EMAIL_SERVICE_ORIGIN, SENDER_EMAIL, PRINT_EMAIL_TO_CONSOLE } from '../common-config';
import { getUrl } from '../get-url';

export const enum EMAIL_TEMPLATE_ID {
  SIGNUP_EMAIL_TEMPLATE_ID = 10001,
  RESET_PASSWORD_EMAIL_TEMPLATE_ID = 10002,
  CHANGE_EMAIL_EMAIL_TEMPLATE_ID = 10003,
}

// #region POST /email/v1/send

export type SendEmailParams = {
  recipient_email: string;
  template_id: EMAIL_TEMPLATE_ID;
  params: Record<string, string>;
};

export async function sendEmail({ recipient_email, template_id, params }: SendEmailParams) {
  const body = {
    sender_email: SENDER_EMAIL,
    recipient_email,
    template_id,
    params,
  };

  if (PRINT_EMAIL_TO_CONSOLE) {
    console.debug(body);
    return { error: 0, error_msg: 'Printed email to console' };
  }

  const url = getUrl({
    origin: EMAIL_SERVICE_ORIGIN,
    pathname: '/email/v1/send',
  });
  const { error, error_msg, data } = await fetchApi({
    method: 'POST',
    url,
    body,
  });
  return { error, error_msg, data };
}

// #endregion
