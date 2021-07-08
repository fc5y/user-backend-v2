# logger

We will use `logger` instead of using `console.*`

## Usage

| level | console                  | logger                  |
| ----- | ------------------------ | ----------------------- |
| info  | `console.log(message)`   | `logger.info(message)`  |
| info  | `console.info(message)`  | `logger.info(message)`  |
| warn  | `console.warn(message)`  | `logger.warn(message)`  |
| error | `console.error(message)` | `logger.error(message)` |
| debug | `console.debug(message)` | `logger.debug(message)` |

logger prints in format: `[level] message`
