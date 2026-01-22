function httpError(status, message, code = "ERR_HTTP") {
  return Object.assign(new Error(message), { status, code });
}

module.exports = { httpError };

