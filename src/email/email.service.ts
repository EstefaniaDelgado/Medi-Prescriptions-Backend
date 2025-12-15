import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { IEmailPayload } from 'src/common/interfaces/email-payload.interface';

@Injectable()
export class EmailService {
  private getTransporter(): nodemailer.Transporter {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    return transporter;
  }

  async sendMail(payload: IEmailPayload) {
    try {
      payload.from = process.env.DEFAULT_MAIL_SENDER as string;

      await this.getTransporter().sendMail(payload);
    } catch (error) {
      throw new InternalServerErrorException(
        `Error sending confirmation email: ${error.message}`,
      );
    }
  }
}
