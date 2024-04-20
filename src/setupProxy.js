const proxy = require('http-proxy-middleware');
module.exports = function (app) {
  app.use(proxy('/getPolls', { target: 'https://finalyearbackend.onrender.com' }));
  app.use(proxy('/changePass', { target: 'https://finalyearbackend.onrender.com' }));
  app.use(proxy('/sendFeedback', { target: 'https://finalyearbackend.onrender.com' }));
  app.use(proxy('/resetPassword', { target: 'https://finalyearbackend.onrender.com' }));
};
