import { createTransport, TransportOptions } from 'nodemailer'
import { config } from '../config'
import { log } from '../log'

const transport = createTransport(config.mail.option as TransportOptions)

export const HandleSendMail = (payload: any) => {
  const { to, subject, html } = payload
  transport.sendMail({
    from: config.mail.from,
    to,
    subject,
    html
  }, (err, info) => {
    if (err) { log(err) }
    log(info)
  })
}
