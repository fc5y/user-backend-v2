import { createLogger, format, transports } from 'winston';
const { combine, printf, colorize } = format;

const myFormat = printf(({ level, message }) => {
  return `[${level}] ${message}`;
});
const logger = createLogger({
  format: combine(colorize(), myFormat),
  transports: [new transports.Console()],
});
export = logger;
