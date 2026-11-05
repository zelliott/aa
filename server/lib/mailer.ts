export interface Mail {
  to: string;
  subject: string;
  text: string;
}

type Transport = (mail: Mail) => Promise<void>;

let transport: Transport = async (mail) => {
  if (process.env.NODE_ENV !== 'production') {
    console.info(`[mail] to=${mail.to} subject="${mail.subject}"`);
  }
};

export function setMailTransport(next: Transport): void {
  transport = next;
}

export async function sendMail(mail: Mail): Promise<void> {
  try {
    await transport(mail);
  } catch (err) {
    console.error('Failed to send mail', err);
  }
}
